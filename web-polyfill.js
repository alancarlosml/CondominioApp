// web-polyfill.js
// Polyfills for Expo modules that don't work on web
// This file should be imported at the top of App.js when running on web

import { Platform } from 'react-native';

// Only run on web platform
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Fix for: Uncaught TypeError: (0 , _expoModulesCore.registerWebModule) is not a function
  // This is handled by metro.config.js alias, but keeping this as backup
  
  // Try to patch any already loaded modules
  if (typeof require !== 'undefined' && require.cache) {
    try {
      Object.keys(require.cache).forEach(key => {
        if (key.includes('expo-modules-core')) {
          const module = require.cache[key];
          if (module && module.exports) {
            if (!module.exports.registerWebModule) {
              module.exports.registerWebModule = () => true;
            }
            if (module.exports.default && !module.exports.default.registerWebModule) {
              module.exports.default.registerWebModule = () => true;
            }
          }
        }
      });
    } catch (e) {
      // Ignore
    }
  }
  
  // Global fallback
  if (!window.__EXPO_WEB_POLYFILL__) {
    window.__EXPO_WEB_POLYFILL__ = {
      registerWebModule: () => true
    };
  }
}

