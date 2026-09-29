// babel.config.js
// Babel configuration for Expo

module.exports = function(api) {
  api.cache(true);
  
  const isWeb = process.env.EXPO_PUBLIC_PLATFORM === 'web';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // @/ → src/ – ver docs/ARCHITECTURE.md
      ['module-resolver', { root: ['.'], alias: { '@': './src' } }],
      // Add expo-modules polyfill plugin for web
      ...(isWeb ? [
        ['./babel-plugin-expo-modules-polyfill.js', { web: true }]
      ] : []),
    ],
  };
};

