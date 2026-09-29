// src/hooks/useApi.js
import { useCallback, useState } from 'react';
import api from '@/services/api';
import { getErrorMessage, isRetryableError } from '../utils/errorHandler';

/**
 * Custom hook for API calls with loading and error states
 * @param {Object} options - Hook options
 * @param {Function} options.onError - Callback for errors
 * @param {boolean} options.throwOnError - Whether to throw errors (default: false)
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export const useApi = (options = {}) => {
  const { onError, throwOnError = false } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute API call
   * @param {Function} apiCall - Function that returns a promise (API call)
   * @param {Object} callOptions - Options for this specific call
   * @returns {Promise} - Promise with the response data
   */
  const execute = useCallback(async (apiCall, callOptions = {}) => {
    const { onSuccess, resetError = true } = callOptions;

    try {
      setLoading(true);
      if (resetError) {
        setError(null);
      }

      const response = await apiCall();
      const responseData = response.data;

      setData(responseData);
      setError(null);

      if (onSuccess) {
        onSuccess(responseData);
      }

      return responseData;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      const errorObj = {
        message: errorMessage,
        original: err,
        retryable: isRetryableError(err),
      };

      setError(errorObj);
      setData(null);

      if (onError) {
        onError(errorObj);
      }

      if (throwOnError) {
        throw err;
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [onError, throwOnError]);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * Convenience hook for GET requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Hook options
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useGet = (endpoint, options = {}) => {
  const { params, ...hookOptions } = options;
  const api = useApi(hookOptions);

  const fetchData = useCallback(async () => {
    return api.execute(() => {
      const config = params ? { params } : {};
      return api.get(endpoint, config);
    });
  }, [endpoint, params]);

  return {
    ...api,
    refetch: fetchData,
  };
};

/**
 * Convenience hook for POST requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Hook options
 * @returns {Object} - { data, loading, error, mutate }
 */
export const usePost = (endpoint, options = {}) => {
  const api = useApi(options);

  const mutate = useCallback(async (data) => {
    return api.execute(() => api.post(endpoint, data));
  }, [endpoint]);

  return {
    ...api,
    mutate,
  };
};

