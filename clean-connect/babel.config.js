module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Handle platform-specific modules and date-fns CJS modules
      ['module-resolver', {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs', '.web.js', '.web.jsx', '.web.ts', '.web.tsx'],
        alias: {
          // Platform-specific module aliases
          'react-native-maps': './src/components/map',
          'react-native/Libraries/Utilities/codegenNativeCommands': './src/mocks/empty-module.js',
        }
      }],
      // Add support for reanimated if used in the project
      'react-native-reanimated/plugin',
    ],
  };
};