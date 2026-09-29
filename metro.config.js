// metro.config.js
// Metro bundler configuration for Expo
// Note: For web builds, Expo uses webpack, not Metro
// This config is primarily for native builds

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add alias that works for both Metro and webpack (via webpack config if needed)
// Note: Web builds may need separate webpack config, but this helps with Metro cache
config.resolver = config.resolver || {};
config.resolver.alias = config.resolver.alias || {};
config.resolver.alias['expo-modules-core'] = path.resolve(__dirname, 'expo-modules-core-polyfill.js');
// @/ aponta para src/ – ver docs/ARCHITECTURE.md
config.resolver.alias['@'] = path.resolve(__dirname, 'src');

module.exports = config;

