import { createContext, useContext, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import api, { clearAuthHeader, setAuthToken, setLogoutCallback } from '@/services/api';
import * as Storage from '@/utils/storage';
import logger from '@/utils/logger';
import { validateCPF } from '@/utils/validators';

const LOGIN_URL =
  Constants.expoConfig?.extra?.apiUrl?.replace(/\/morador\/?$/, '/api/login2.php') ||
  'https://face.onestartup.com.br/api/login2.php';

// ============================================================
// MODO DESENVOLVIMENTO - LOGIN TEMPORÁRIO PARA TESTES
// ============================================================
// Altere para false quando tiver os endpoints prontos
const USE_MOCK_LOGIN = false;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unidades, setUnidades] = useState([]);

  useEffect(() => {
    checkAuthState();
    
    // Register logout callback for API interceptor
    setLogoutCallback(() => {
      setUser(null);
      setUnidades([]);
      setIsAuthenticated(false);
    });
    
    // Cleanup
    return () => {
      setLogoutCallback(null);
    };
  }, []);

  const checkAuthState = async () => {
    try {
      // Carrega dados em paralelo para melhor performance
      const [token, userData, unidadesData] = await Promise.all([
        Storage.getItem('token'),
        Storage.getJSONItem('user'),
        Storage.getJSONItem('unidades')
      ]);

      if (token && userData) {
        logger.info('Usuário carregado do storage');
        setAuthToken(token);
        setUser(userData);
        setIsAuthenticated(true);
        
        if (unidadesData && Array.isArray(unidadesData)) {
          setUnidades(unidadesData);
        }
      }
    } catch (error) {
      logger.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (cpf, senha) => {
    try {
      setLoading(true);

      if (USE_MOCK_LOGIN) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!cpf || !senha) {
          return { success: false, error: 'Por favor, preencha todos os campos' };
        }
        const mockUser = {
          id_tbl_usuario: '1',
          nome: 'Usuário Teste',
          cpf,
          email: 'teste@exemplo.com',
          tipo_usuario: 'admin',
          foto_usuario: null,
        };
        const mockToken = `mock_jwt_token_${Date.now()}`;
        await Storage.setItem('token', mockToken);
        setAuthToken(mockToken);
        await Storage.setJSONItem('user', mockUser);
        setUser(mockUser);
        setIsAuthenticated(true);
        logger.info('Login MOCK bem-sucedido - Modo de desenvolvimento');
        return { success: true, user: mockUser };
      }

      if (!cpf || !senha) {
        return { success: false, error: 'Por favor, preencha todos os campos' };
      }

      const cpfValidation = validateCPF(cpf);
      if (!cpfValidation.valid) {
        return { success: false, error: cpfValidation.error || 'CPF inválido' };
      }

      const cpfLimpo = cpf.replace(/\D/g, '');
      logger.info('Tentando fazer login');

      const loginData = { cpf: cpfLimpo, senha };

      // Usa cliente centralizado; tenta JSON e fallback para form-urlencoded se necessário
      let response;
      try {
        response = await api.post(LOGIN_URL, loginData, {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          timeout: 15000,
        });
        if (!response.data || response.data.status !== 'success') {
          throw new Error(response.data?.mensagem || response.data?.message || 'Erro na resposta do servidor');
        }
      } catch (jsonError) {
        logger.warn('JSON falhou, tentando form-urlencoded', jsonError?.message);
        const params = new URLSearchParams();
        params.append('cpf', cpfLimpo);
        params.append('senha', senha);
        try {
          response = await api.post(LOGIN_URL, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000,
          });
          if (!response.data || response.data.status !== 'success') {
            throw new Error(response.data?.mensagem || response.data?.message || 'Erro na resposta do servidor');
          }
        } catch (formError) {
          throw jsonError?.response ? jsonError : formError;
        }
      }

      logger.debug('Resposta de login recebida');

      // Valida resposta
      if (!response.data) {
        return { success: false, error: 'Resposta inválida do servidor' };
      }

      // Verifica se login foi bem-sucedido
      if (response.data.status !== 'success' || !response.data.dados || !Array.isArray(response.data.dados)) {
        const errorMsg = response.data.mensagem || response.data.message || response.data.error || 'Credenciais inválidas';
        return { success: false, error: errorMsg };
      }

      // O novo endpoint retorna um array de unidades/condomínios
      const unidadesData = response.data.dados;
      
      if (unidadesData.length === 0) {
        return { success: false, error: 'Nenhuma unidade encontrada para este usuário' };
      }

      // Extrai dados do usuário do primeiro item (todos têm os mesmos dados do condômino)
      const primeiroItem = unidadesData[0];
      
      const userData = {
        id_tbl_condomino: primeiroItem.id_tbl_condomino,
        nome: primeiroItem.nome_condomino || primeiroItem.nome || '', // Campo correto do modelo de resposta
        cpf: primeiroItem.cpf,
        email: primeiroItem.email,
        telefone: primeiroItem.telefone,
        foto: primeiroItem.foto,
      };
      
      logger.debug('Dados do usuário extraídos com sucesso');

      // Uma sessão só é válida quando o backend fornece um token verificável.
      // Cookies não são uma forma confiável de autenticação no React Native.
      let token = response.data.access_token || response.data.token || null;
      
      // Tenta pegar token dos headers
      const authHeader = response.headers['authorization'] || response.headers['Authorization'];
      if (!token && authHeader) {
        token = authHeader.replace('Bearer ', '').trim();
      }

      if (!token) {
        logger.warn('Login recusado: backend não retornou token de acesso.');
        return {
          success: false,
          error: 'O servidor não retornou uma sessão segura. Atualize o endpoint de login para enviar access_token.',
        };
      }

      await Storage.setItem('token', token);
      setAuthToken(token);
      await Storage.setJSONItem('user', userData);
      await Storage.setJSONItem('unidades', unidadesData);

      // Atualiza estado
      setUser(userData);
      setUnidades(unidadesData);
      setIsAuthenticated(true);

      logger.info('Login bem-sucedido');
      logger.debug(`${unidadesData.length} unidade(s) encontrada(s)`);
      
      if (__DEV__) {
        unidadesData.forEach((unidade, index) => {
          logger.debug(`  ${index + 1}. ${unidade.nome_condominio} - Bloco ${unidade.bloco || 'N/A'}, Apt ${unidade.apartamento || unidade.unidade_usuario || 'N/A'}`);
        });
      }
      
      return { success: true, user: userData, unidades: unidadesData, hasMultipleUnidades: unidadesData.length > 1 };

    } catch (error) {
      logger.error('Login error:', error);
      logger.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        request: error.request ? 'Request made but no response' : null,
      });
      
      // Handle different error types
      if (error.isUnauthorized) {
        return { success: false, error: 'Credenciais inválidas' };
      }
      
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        const errorMessage = errorData?.mensagem || 
                            errorData?.message || 
                            errorData?.error ||
                            error.message ||
                            'Erro ao fazer login';
        
        // Log detalhado do erro do servidor
        logger.error('Erro do servidor:', {
          status: error.response.status,
          message: errorMessage,
        });
        
        return { success: false, error: errorMessage };
      }
      
      if (error.request) {
        // Request was made but no response received
        logger.error('Sem resposta do servidor. Pode ser problema de rede ou proxy.');
        return { success: false, error: 'Sem conexão com o servidor. Verifique sua internet ou configurações de proxy.' };
      }
      
      // Other errors
      return { success: false, error: error.message || 'Erro ao fazer login' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    logger.info('Iniciando processo de logout...');
    
    try {
      // Set loading to true to prevent navigation issues
      setLoading(true);
      
      // Clear authorization header first to prevent sending token in logout request
      logger.debug('Limpando header de autorização...');
      clearAuthHeader();

      // Optionally call logout endpoint on backend (with timeout to prevent hanging)
      try {
        logger.debug('Tentando chamar endpoint de logout no backend...');
        await Promise.race([
          api.post('/auth/logout'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
        ]);
        logger.info('Endpoint de logout chamado com sucesso');
      } catch (apiError) {
        // Continue with local logout even if API call fails
        if (apiError.message === 'Timeout') {
          logger.warn('Timeout ao chamar endpoint de logout, continuando com logout local');
        } else {
          logger.warn('Erro ao chamar endpoint de logout, continuando com logout local');
        }
      }

      // Clear all stored auth data
      logger.debug('Limpando dados armazenados...');
      await Promise.all([
        Storage.removeItem('token'),
        Storage.removeItem('refresh_token'),
        Storage.removeItem('user'),
        Storage.removeItem('unidades'),
        Storage.removeItem('selectedCondominio'),
        Storage.removeItem('selectedUnidade'),
      ]);

      // Verify storage is cleared
      const remainingToken = await Storage.getItem('token');
      const remainingUser = await Storage.getItem('user');
      if (remainingToken || remainingUser) {
        logger.warn('Aviso: Alguns dados ainda estão no storage após limpeza');
        // Force clear again
        await Storage.removeItem('token');
        await Storage.removeItem('user');
      }

      // Clear authorization header again to ensure it's removed
      clearAuthHeader();

      // Update state - IMPORTANT: Update state synchronously to trigger navigation
      logger.debug('Atualizando estado...');
      setUser(null);
      setUnidades([]);
      setIsAuthenticated(false);
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set loading to false after state update to trigger navigation
      setLoading(false);

      logger.info('Logout realizado com sucesso');
      return { success: true };
    } catch (error) {
      logger.error('Erro durante logout:', error);
      logger.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
      });
      
      // Even if there's an error, try to clear everything
      try {
        logger.debug('Tentando limpar dados mesmo com erro...');
        clearAuthHeader();
        await Promise.all([
          Storage.removeItem('token'),
          Storage.removeItem('refresh_token'),
          Storage.removeItem('user'),
          Storage.removeItem('unidades'),
          Storage.removeItem('selectedCondominio'),
          Storage.removeItem('selectedUnidade'),
        ]);
        setUser(null);
        setUnidades([]);
        setIsAuthenticated(false);
        // Small delay to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        setLoading(false);
        logger.info('Limpeza de emergência concluída');
      } catch (cleanupError) {
        logger.error('Erro durante limpeza de emergência:', cleanupError);
        // Force state update even if storage cleanup fails
        setUser(null);
        setUnidades([]);
        setIsAuthenticated(false);
        setLoading(false);
      }
      return { success: false, error: 'Erro ao fazer logout' };
    }
  };

  const updateUserProfile = async (updatedData) => {
    try {
      if (!user) return { success: false, error: 'Usuário não autenticado' };
      const updatedUser = { ...user, ...updatedData };
      await Storage.setJSONItem('user', updatedUser);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      logger.error('Update profile error:', error);
      return { success: false, error: 'Erro ao atualizar perfil' };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    unidades,
    login,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
