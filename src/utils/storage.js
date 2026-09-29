// src/utils/storage.js
// Storage utility that works on both mobile (AsyncStorage) and web (localStorage)

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import logger from './logger';

// Check if we're on web
const isWeb = Platform.OS === 'web';

// Keys that should be stored securely
const SENSITIVE_KEYS = ['token', 'refresh_token', 'user_credentials', 'senha'];

const isSensitive = (key) => SENSITIVE_KEYS.includes(key);

/**
 * Get item from storage
 * @param {string} key - Storage key
 * @returns {Promise<string|null>} - Stored value or null
 */
export const getItem = async (key) => {
  try {
    if (isWeb) {
      return localStorage.getItem(key);
    }
    
    if (isSensitive(key)) {
      return await SecureStore.getItemAsync(key);
    }
    
    return await AsyncStorage.getItem(key);
  } catch (error) {
    logger.error(`Error getting item ${key}:`, error);
    return null;
  }
};

/**
 * Set item in storage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {Promise<void>}
 */
export const setItem = async (key, value) => {
  try {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }

    if (isSensitive(key)) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    await AsyncStorage.setItem(key, value);
  } catch (error) {
    logger.error(`Error setting item ${key}:`, error);
    throw error;
  }
};

/**
 * Remove item from storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export const removeItem = async (key) => {
  try {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }

    if (isSensitive(key)) {
      await SecureStore.deleteItemAsync(key);
      return;
    }

    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.error(`Error removing item ${key}:`, error);
    throw error;
  }
};

/**
 * Clear all items from storage
 * @returns {Promise<void>}
 */
export const clear = async () => {
  try {
    if (isWeb) {
      localStorage.clear();
      return;
    }
    await AsyncStorage.clear();
  } catch (error) {
    logger.error('Error clearing storage:', error);
    throw error;
  }
};

/**
 * Get all keys from storage
 * @returns {Promise<string[]>} - Array of keys
 */
export const getAllKeys = async () => {
  try {
    if (isWeb) {
      return Object.keys(localStorage);
    }
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    logger.error('Error getting all keys:', error);
    return [];
  }
};

/**
 * Safely parse JSON from storage
 * @param {string} key - Storage key
 * @returns {Promise<object|null>} - Parsed JSON or null
 */
export const getJSONItem = async (key) => {
  try {
    const value = await getItem(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (parseError) {
      logger.error(`Error parsing JSON for key ${key}:`, parseError);
      // Remove corrupted data
      await removeItem(key);
      return null;
    }
  } catch (error) {
    logger.error(`Error getting JSON item ${key}:`, error);
    return null;
  }
};

/**
 * Safely store JSON in storage
 * @param {string} key - Storage key
 * @param {object} value - Object to store
 * @returns {Promise<void>}
 */
export const setJSONItem = async (key, value) => {
  try {
    const jsonString = JSON.stringify(value);
    await setItem(key, jsonString);
  } catch (error) {
    logger.error(`Error setting JSON item ${key}:`, error);
    throw error;
  }
};

