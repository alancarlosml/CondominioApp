// expo-modules-core-polyfill.js
// Mock module for expo-modules-core on web
// This file replaces expo-modules-core exports when running on web

// CommonJS export (works with webpack)
const registerWebModule = function() {
  // No-op for web - modules that don't support web will silently fail
  return true;
};

// Export other common expo-modules-core functions as no-ops
const requireNativeModule = function() {
  return null;
};

// CommonJS exports
module.exports = {
  registerWebModule,
  requireNativeModule,
  default: {
    registerWebModule,
    requireNativeModule,
  },
};

// Also support ES6 exports for compatibility
if (typeof exports !== 'undefined') {
  exports.registerWebModule = registerWebModule;
  exports.requireNativeModule = requireNativeModule;
  exports.default = {
    registerWebModule,
    requireNativeModule,
  };
}

