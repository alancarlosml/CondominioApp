// src/contexts/CondominioContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '@/services/api';
import * as Storage from '@/utils/storage';
import logger from '@/utils/logger';

// ============================================================
// MODO DESENVOLVIMENTO - MOCK TEMPORÁRIO PARA TESTES
// ============================================================
// PRODUÇÃO: Modo mock desativado
const USE_MOCK_DATA = false;

const CondominioContext = createContext();

export const useCondominio = () => {
  const context = useContext(CondominioContext);
  if (!context) {
    throw new Error('useCondominio must be used within a CondominioProvider');
  }
  return context;
};

export const CondominioProvider = ({ children }) => {
  const { user, isAuthenticated, unidades } = useAuth();
  const [condominios, setCondominios] = useState([]);
  const [selectedCondominio, setSelectedCondominio] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load condominios when user is authenticated or when unidades change
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCondominios();
    } else {
      // Clear when user logs out
      setCondominios([]);
      setSelectedCondominio(null);
    }
  }, [isAuthenticated, user, unidades]);

  // Load selected condominio from storage on mount
  useEffect(() => {
    loadSelectedCondominioFromStorage();
  }, []);

  // Save selected condominio to storage when it changes
  useEffect(() => {
    if (selectedCondominio) {
      Storage.setItem('selectedCondominio', JSON.stringify(selectedCondominio));
      // Também salva como selectedUnidade para compatibilidade
      if (selectedCondominio.id_tbl_cond_usuario) {
        Storage.setItem('selectedUnidade', JSON.stringify(selectedCondominio));
      }
    }
  }, [selectedCondominio]);

  /**
   * Load condominios list from API or from login data
   */
  const loadCondominios = async () => {
    try {
      setLoading(true);
      
      // ============================================================
      // PRIMEIRO: TENTA USAR DADOS DO LOGIN (UNIDADES)
      // ============================================================
      if (unidades && unidades.length > 0) {
        // Converte unidades para formato de condomínios
        // Usa os campos corretos do modelo de resposta da API
        const condominiosFromUnidades = unidades.map((unidade) => ({
          id: unidade.id_tbl_condominio,
          id_tbl_condominio: unidade.id_tbl_condominio,
          id_tbl_cond_usuario: unidade.id_tbl_cond_usuario,
          nome: unidade.nome_condominio, // Campo correto do modelo de resposta
          cnpj: unidade.cnpj,
          unidade_usuario: unidade.unidade_usuario,
          id_condominio: unidade.id_condominio,
          id_condomino: unidade.id_condomino,
          // Adiciona informações da unidade para exibição
          bloco: unidade.bloco,
          apartamento: unidade.apartamento,
          id_tbl_unidade: unidade.id_tbl_unidade,
        }));
        
        logger.debug('Condomínios mapeados das unidades');

        setCondominios(condominiosFromUnidades);
        
        // Seleciona o primeiro condomínio se nenhum estiver selecionado
        if (!selectedCondominio && condominiosFromUnidades.length > 0) {
          const saved = await Storage.getItem('selectedUnidade');
          if (saved) {
            try {
              const savedUnidade = JSON.parse(saved);
              logger.debug('Unidade salva encontrada');
              const found = condominiosFromUnidades.find(
                c => c.id_tbl_cond_usuario === savedUnidade.id_tbl_cond_usuario
              );
              const toSelect = found || condominiosFromUnidades[0];
              logger.debug('Condomínio selecionado');
              setSelectedCondominio(toSelect);
            } catch (e) {
              logger.warn('Erro ao parsear unidade salva:', e);
              const toSelect = condominiosFromUnidades[0];
              logger.debug('Condomínio selecionado (fallback)');
              setSelectedCondominio(toSelect);
            }
          } else {
            const toSelect = condominiosFromUnidades[0];
            logger.debug('Condomínio selecionado (primeiro)');
            setSelectedCondominio(toSelect);
          }
        }

        logger.info('Condomínios carregados das unidades do login');
        setLoading(false);
        return;
      }
      
      // ============================================================
      // MODO MOCK - DADOS TEMPORÁRIOS PARA TESTES
      // ============================================================
      if (USE_MOCK_DATA) {
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Mock condominios - baseado na estrutura do banco de dados
        const mockCondominios = [
          {
            id: 1,
            id_tbl_condominio: 1,
            nome: 'Cond Julia Campos',
            cnpj: '31.568.038/0001-99',
            cidade: 'São Luís',
            uf: 'MA',
            sindico: 'Diogo',
            foto: null,
          },
          // Adicione mais condomínios mock se quiser testar seleção múltipla
          // {
          //   id: 2,
          //   id_tbl_condominio: 2,
          //   nome: 'Condomínio Exemplo 2',
          //   cidade: 'São Luís',
          //   uf: 'MA',
          // },
        ];

        setCondominios(mockCondominios);
        
        // Seleciona o primeiro condomínio se nenhum estiver selecionado
        if (!selectedCondominio && mockCondominios.length > 0) {
          const saved = await Storage.getItem('selectedCondominio');
          if (saved) {
            try {
              const savedCondominio = JSON.parse(saved);
              const found = mockCondominios.find(c => c.id === savedCondominio.id);
              setSelectedCondominio(found || mockCondominios[0]);
            } catch (e) {
              setSelectedCondominio(mockCondominios[0]);
            }
          } else {
            setSelectedCondominio(mockCondominios[0]);
          }
        }

        logger.info('Condomínios MOCK carregados - Modo de desenvolvimento');
        return;
      }

      // ============================================================
      // CÓDIGO REAL - DESCOMENTAR QUANDO TIVER OS ENDPOINTS
      // ============================================================
      
      // Try to get condominios from API
      // const response = await api.get('/user/condominios');
      
      // if (response.data && Array.isArray(response.data)) {
      //   setCondominios(response.data);
        
      //   // If no condominio is selected and we have condominios, select the first one
      //   if (!selectedCondominio && response.data.length > 0) {
      //     // Try to load saved selection first
      //     const saved = await Storage.getItem('selectedCondominio');
      //     if (saved) {
      //       const savedCondominio = JSON.parse(saved);
      //       // Verify if saved condominio is still in the list
      //       const found = response.data.find(c => c.id === savedCondominio.id);
      //       if (found) {
      //         setSelectedCondominio(found);
      //       } else {
      //         setSelectedCondominio(response.data[0]);
      //       }
      //     } else {
      //       setSelectedCondominio(response.data[0]);
      //     }
      //   }
      // } else {
      //   // Fallback: if user has a single condominio in their profile
      //   // This is for backward compatibility
      //   console.warn('API did not return condominios array, using fallback');
      // }
    } catch (error) {
      logger.error('Error loading condominios:', error);
      // On error, try to use fallback from user data if available
      // This allows app to work even if endpoint is not ready
      if (user?.id_tbl_condominio) {
        const fallbackCondominio = {
          id: user.id_tbl_condominio,
          nome: user.condominio_nome || 'Condomínio',
        };
        setCondominios([fallbackCondominio]);
        setSelectedCondominio(fallbackCondominio);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load selected condominio from AsyncStorage
   */
  const loadSelectedCondominioFromStorage = async () => {
    try {
      const saved = await Storage.getItem('selectedCondominio');
      if (saved) {
        const savedCondominio = JSON.parse(saved);
        logger.debug('Condomínio carregado do storage');
        setSelectedCondominio(savedCondominio);
      }
    } catch (error) {
      logger.error('Error loading selected condominio from storage:', error);
    }
  };

  /**
   * Select a condominio
   * @param {Object} condominio - Condominio object to select
   */
  const selectCondominio = (condominio) => {
    if (!condominio) {
      logger.error('Cannot select null condominio');
      return;
    }
    logger.debug('Selecionando condomínio');
    setSelectedCondominio(condominio);
  };

  /**
   * Check if user has multiple condominios
   */
  const hasMultipleCondominios = condominios.length > 1;

  /**
   * Get condominio ID for API calls
   */
  const getCondominioId = () => {
    return selectedCondominio?.id || selectedCondominio?.id_tbl_condominio;
  };

  const value = {
    condominios,
    selectedCondominio,
    loading,
    selectCondominio,
    loadCondominios,
    hasMultipleCondominios,
    getCondominioId,
  };

  return (
    <CondominioContext.Provider value={value}>
      {children}
    </CondominioContext.Provider>
  );
};

