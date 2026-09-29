/**
 * Cliente HTTP da API – interceptors para token, logout e erros.
 * @see docs/ARCHITECTURE.md
 */
import axios from 'axios';
import Constants from 'expo-constants';
import * as Storage from '../utils/storage';
import logger from '../utils/logger';

// Configuração da API com suporte a variáveis de ambiente
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
                     process.env.EXPO_PUBLIC_API_URL || 
                     'https://face.onestartup.com.br/morador';
const API_TIMEOUT = parseInt(
  Constants.expoConfig?.extra?.apiTimeout || 
  process.env.EXPO_PUBLIC_API_TIMEOUT || 
  '10000',
  10
);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

let logoutCallback = null;
let cachedToken = null;

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

export const setAuthToken = (token) => {
  cachedToken = token || null;
  if (cachedToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${cachedToken}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const clearAuthHeader = () => {
  cachedToken = null;
  delete api.defaults.headers.common['Authorization'];
};

api.interceptors.request.use(
  async (config) => {
    try {
      // Use cached token for performance; refresh from storage if empty
      if (!cachedToken) {
        cachedToken = await Storage.getItem('token');
      }

      if (cachedToken) {
        // Sempre envia Authorization se houver token (inclui session_ legado até backend retornar JWT real)
        config.headers.Authorization = `Bearer ${cachedToken}`;
      } else {
        delete config.headers.Authorization;
      }
    } catch (error) {
      logger.error('Error getting token from storage:', error);
      delete config.headers.Authorization;
    }
    // Se for FormData, remove Content-Type para o RN/XHR definir boundary multipart automaticamente
    // Detecção robusta: instanceof falha em alguns bundles do RN, checa _parts e toString também
    const data = config.data;
    const isFormData =
      (typeof FormData !== 'undefined' && data instanceof FormData) ||
      (data && typeof data.append === 'function' && Array.isArray(data._parts)) ||
      Object.prototype.toString.call(data) === '[object FormData]';
    if (isFormData) {
      // axios 1.x usa AxiosHeaders (com .delete/.has), mas também pode ser plain object
      if (config.headers && typeof config.headers.delete === 'function') {
        // AxiosHeaders é case-insensitive
        try { config.headers.delete('Content-Type'); } catch {}
        try { config.headers.delete('content-type'); } catch {}
        try { config.headers.delete('Content-type'); } catch {}
      }
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
        delete config.headers['Content-type'];
        // chave normalizada pelo axios
        delete config.headers['Content-Type'];
      }
      if (config.headers?.common) {
        delete config.headers.common['Content-Type'];
        delete config.headers.common['content-type'];
      }
      // Garante que nenhum default comum re-injete o header
      if (api.defaults.headers?.common?.['Content-Type']) {
        // não apaga o default global, só evita que seja copiado para este request já normalizado
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await Storage.removeItem('token');
        await Storage.removeItem('refresh_token');
        await Storage.removeItem('user');
        await Storage.removeItem('unidades');
        delete api.defaults.headers.common['Authorization'];
        if (logoutCallback) {
          logoutCallback();
        }
        logger.info('Token expirado ou inválido. Usuário deslogado automaticamente.');
      } catch (storageError) {
        logger.error('Error clearing auth data:', storageError);
      }

      return Promise.reject({
        ...error,
        message: 'Sessão expirada. Por favor, faça login novamente.',
        isUnauthorized: true,
      });
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Erro ao processar requisição';

    return Promise.reject({
      ...error,
      message: errorMessage,
      status: error.response?.status,
    });
  }
);

export default api;
