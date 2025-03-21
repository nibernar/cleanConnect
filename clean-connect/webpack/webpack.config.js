const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  // Create the default Expo webpack config
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add platform-specific aliases for web platform
  config.resolve.alias = {
    ...config.resolve.alias,
    // Map react-native-maps to our mock implementation for web
    'react-native-maps': path.resolve(__dirname, '../src/mocks/react-native-maps-mock.js'),
    // Map any native-only modules to empty implementations
    'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, '../src/mocks/empty-module.js'),
  };

  // Add fallbacks for node modules that might be used in RN packages
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    net: false,
    tls: false,
  };

  return config;
};