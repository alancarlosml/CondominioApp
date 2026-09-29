/**
 * @deprecated Use src/utils/storage.js diretamente (já usa SecureStore para keys sensíveis)
 * Mantido apenas para compatibilidade legada.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Storage from './storage';
import logger from './logger';

const SECURE_KEYS = ['token', 'refresh_token'];

/**
 * Armazena item de forma segura se for sensível
 */
export const secureSetItem = async (key, value) => {
  try {
    if (SECURE_KEYS.includes(key)) {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
      } else {
        // Fallback para web (localStorage)
        await Storage.setItem(key, value);
      }
    } else {
      await Storage.setItem(key, value);
    }
  } catch (error) {
    logger.error(`Error setting secure item ${key}:`, error);
    throw error;
  }
};

export const secureGetItem = async (key) => {
  try {
    if (SECURE_KEYS.includes(key)) {
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(key);
      } else {
        return await Storage.getItem(key);
      }
    } else {
      return await Storage.getItem(key);
    }
  } catch (error) {
    logger.error(`Error getting secure item ${key}:`, error);
    return null;
  }
};

export const secureRemoveItem = async (key) => {
  try {
    if (SECURE_KEYS.includes(key)) {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      } else {
        await Storage.removeItem(key);
      }
    } else {
      await Storage.removeItem(key);
    }
  } catch (error) {
    logger.error(`Error removing secure item ${key}:`, error);
    throw error;
  }
};

export const secureClear = async () => {
  try {
    for (const key of SECURE_KEYS) {
      await secureRemoveItem(key);
    }
  } catch (error) {
    logger.error('Error clearing secure storage:', error);
    throw error;
  }
};
