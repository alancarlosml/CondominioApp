// src/utils/errorHandler.js

/**
 * Centralized error handling utility
 * Provides user-friendly error messages from API errors
 */

/**
 * Get user-friendly error message from error object
 * @param {Error|Object} error - Error object from API or other source
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Detecta CORS no web (backend sem Access-Control-Allow-Origin)
  const msg = error?.message || '';
  const isCors = msg.includes('CORS') || msg.includes('blocked by CORS') || msg.includes('ERR_FAILED');
  if (isCors) {
    return 'Recurso indisponível na versão web (CORS). Use o app no celular via Expo Go.';
  }

  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || msg === 'Network Error' || error.code === 'ERR_NETWORK') {
    // No web, ERR_NETWORK geralmente é CORS
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      return 'Sem conexão ou bloqueado por CORS no web. Teste no celular (Expo Go).';
    }
    return 'Sem conexão com a internet. Verifique sua conexão e tente novamente.';
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || msg?.includes('timeout') || msg?.includes('timed out')) {
    return 'A requisição demorou muito. Tente novamente.';
  }

  // Handle unauthorized errors
  if (error.isUnauthorized || error.response?.status === 401) {
    return 'Sessão expirada. Por favor, faça login novamente.';
  }

  // Handle forbidden errors
  if (error.response?.status === 403) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  // Handle not found errors
  if (error.response?.status === 404) {
    return error.response?.data?.mensagem || 'Recurso não encontrado.';
  }

  // Handle conflict errors (ex: CPF já cadastrado - moradores.php retorna 409)
  if (error.response?.status === 409) {
    return error.response?.data?.mensagem || 'Registro já cadastrado.';
  }

  // Handle bad request with server message (ex: foto obrigatória, campos inválidos)
  if (error.response?.status === 400) {
    return error.response?.data?.mensagem || 'Dados inválidos. Verifique os campos e tente novamente.';
  }

  // Handle server errors (5xx)
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return 'Erro no servidor. Tente novamente mais tarde.';
  }

  // Handle validation errors (422)
  if (error.response?.status === 422) {
    const validationErrors = error.response?.data?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstError = Object.values(validationErrors)[0];
      if (Array.isArray(firstError)) {
        return firstError[0];
      }
      return firstError;
    }
    return error.response?.data?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
  }

  // Handle API response with error message (backend usa "mensagem" em PT)
  if (error.response?.data) {
    const apiMessage = error.response.data.mensagem ||
                      error.response.data.message ||
                      error.response.data.error ||
                      error.response.data.msg;
    if (apiMessage) {
      return apiMessage;
    }
  }

  // Handle error object with message
  if (error.message && typeof error.message === 'string') {
    // Don't expose technical error messages to users
    const technicalErrors = ['Request failed', 'Failed to fetch', 'Network request failed'];
    if (technicalErrors.some(te => error.message.includes(te))) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    
    // Return message if it's user-friendly
    if (error.message.length < 100) {
      return error.message;
    }
  }

  // Default error message
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

/**
 * Get error details for debugging
 * @param {Error|Object} error - Error object
 * @returns {Object} - Error details object
 */
export const getErrorDetails = (error) => {
  return {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    code: error.code,
    isUnauthorized: error.isUnauthorized || error.response?.status === 401,
    isNetworkError: error.code === 'NETWORK_ERROR' || error.message === 'Network Error',
    isTimeout: error.code === 'ECONNABORTED',
  };
};

/**
 * Check if error is a network error
 * @param {Error|Object} error - Error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return error.code === 'NETWORK_ERROR' || 
         error.message === 'Network Error' ||
         !error.response; // No response usually means network error
};

/**
 * Check if error is retryable (should retry the request)
 * @param {Error|Object} error - Error object
 * @returns {boolean}
 */
export const isRetryableError = (error) => {
  // Network errors and timeouts are retryable
  if (isNetworkError(error) || error.code === 'ECONNABORTED') {
    return true;
  }

  // Server errors (5xx) are retryable
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  return false;
};

/**
 * Handle error and show appropriate user message
 * Can be used with Alert or custom toast/snackbar
 * @param {Error|Object} error - Error object
 * @param {Function} showAlert - Function to show alert/toast (e.g., Alert.alert)
 * @param {Object} options - Additional options
 */
export const handleError = (error, showAlert = null, options = {}) => {
  const message = getErrorMessage(error);
  const details = getErrorDetails(error);

  // Log error for debugging
  if (__DEV__) {
    console.error('Error handled:', details);
  }

  // Show alert if provided
  if (showAlert && typeof showAlert === 'function') {
    const title = options.title || 'Erro';
    showAlert(title, message);
  }

  return {
    message,
    details,
    retryable: isRetryableError(error),
  };
};

