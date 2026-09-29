// babel-plugin-expo-modules-polyfill.js
// Babel plugin to replace expo-modules-core imports with our polyfill on web

module.exports = function({ types: t }) {
  return {
    name: 'expo-modules-polyfill',
    visitor: {
      ImportDeclaration(path, state) {
        // Only process if we're building for web
        if (process.env.EXPO_PUBLIC_PLATFORM !== 'web' && !state.opts.web) {
          return;
        }

        // Check if this is importing from expo-modules-core
        if (path.node.source.value === 'expo-modules-core') {
          // Replace with our polyfill
          path.node.source.value = './expo-modules-core-polyfill';
        }
      },
      CallExpression(path, state) {
        // Only process if we're building for web
        if (process.env.EXPO_PUBLIC_PLATFORM !== 'web' && !state.opts.web) {
          return;
        }

        // Check if this is require('expo-modules-core')
        if (
          path.node.callee.name === 'require' &&
          path.node.arguments.length > 0 &&
          t.isStringLiteral(path.node.arguments[0]) &&
          path.node.arguments[0].value === 'expo-modules-core'
        ) {
          path.node.arguments[0].value = './expo-modules-core-polyfill';
        }
      },
    },
  };
};

