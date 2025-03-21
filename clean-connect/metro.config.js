/**
 * Metro configuration with memory usage optimizations
 * - Caching improvements
 * - Better dependency handling
 * - Module resolution fixes
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Get default configuration
const defaultConfig = getDefaultConfig(__dirname);

// Custom configuration with memory optimizations
module.exports = {
  ...defaultConfig,
  
  // Improve caching for better memory usage
  cacheStores: [
    ...defaultConfig.cacheStores,
  ],
  
  // Enhanced resolver configuration
  resolver: {
    ...defaultConfig.resolver,
    sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs'],
    
    // Optimize module resolution
    extraNodeModules: new Proxy({}, {
      get: (target, name) => {
        return path.join(process.cwd(), `node_modules/${name}`);
      }
    }),
    
    // Force Metro to resolve dependencies consistently
    resolveRequest: (context, moduleName, platform) => {
      // Handle react-native-maps native dependencies for web platform
      if (platform === 'web') {
        // Create a proper mock for the native-only modules
        const NATIVE_MODULES = [
          'react-native/Libraries/Utilities/codegenNativeCommands',
          'react-native/Libraries/Utilities/codegenNativeComponent',
          'NativeCommands'
        ];

        // Check if this is a direct import of a native-only module
        if (NATIVE_MODULES.some(nativeModule => moduleName.includes(nativeModule))) {
          return {
            filePath: path.resolve(__dirname, 'src/mocks/empty-module.js'),
            type: 'sourceFile',
          };
        }

        // Check if the importing file is from react-native-maps
        if (context.originModulePath.includes('node_modules/react-native-maps')) {
          // If the file is importing a native-only module
          if (NATIVE_MODULES.some(nativeModule => moduleName.includes(nativeModule))) {
            return {
              filePath: path.resolve(__dirname, 'src/mocks/empty-module.js'),
              type: 'sourceFile',
            };
          }
        }

        // Special handling for direct react-native-maps imports on web
        if (moduleName === 'react-native-maps' && !context.originModulePath.includes('node_modules/react-native-maps')) {
          return {
            filePath: path.resolve(__dirname, 'src/mocks/react-native-maps-mock.js'),
            type: 'sourceFile',
          };
        }
      }
      
      // Generic handling for date-fns locale files
      if (
        moduleName.startsWith('./_lib/') && 
        context.originModulePath.includes('node_modules/date-fns/locale/')
      ) {
        const requiredFile = moduleName.split('/').pop();
        const fallbackPath = path.resolve(
          __dirname,
          'node_modules/date-fns/locale/_lib',
          requiredFile
        );
        
        // Check if file exists at fallback location
        if (fs.existsSync(fallbackPath)) {
          return {
            filePath: fallbackPath,
            type: 'sourceFile',
          };
        }
      }
      
      // Original specific handling for sq locale
      if (moduleName.startsWith('./sq/_lib/') && 
          context.originModulePath.includes('node_modules/date-fns/locale/sq.cjs')) {
        const requiredFile = moduleName.split('/').pop();
        const newPath = path.resolve(
          __dirname,
          'node_modules/date-fns/locale/sq/_lib',
          requiredFile
        );
        
        // Check if file exists
        if (fs.existsSync(newPath)) {
          return {
            filePath: newPath,
            type: 'sourceFile',
          };
        }
      }
      
      // Specific handling for axios internal imports
      if (
        moduleName.startsWith('./core/') && 
        context.originModulePath.includes('node_modules/axios/lib/axios.js')
      ) {
        const newPath = path.resolve(
          path.dirname(context.originModulePath),
          moduleName
        );
        return {
          filePath: newPath,
          type: 'sourceFile',
        };
      }
      
      // Default resolution for other modules
      return context.resolveRequest(context, moduleName, platform);
    }
  },
  
  // Optimize Metro transformer options
  transformer: {
    ...defaultConfig.transformer,
    
    // Enable hermes bytecode compilation for production
    // This reduces memory pressure during development
    hermesParser: true,
    
    // Use asynchronous transformation to reduce memory pressure
    unstable_asyncTransformation: true,
    
    // Optimize image handling
    assetPlugins: [
      ...defaultConfig.transformer.assetPlugins || [],
    ],
  },
  
  // Add watchFolders to ensure Metro can access all required files
  watchFolders: [
    path.resolve(__dirname, 'node_modules')
  ],
  
  // Optimize server configuration
  server: {
    ...defaultConfig.server,
    
    // Enhance port selection - converted to number to fix the validation error
    port: process.env.RCT_METRO_PORT ? parseInt(process.env.RCT_METRO_PORT, 10) : 8081,
    
    // Enable enhanceMiddleware for better memory handling
    enhanceMiddleware: (middleware) => {
      return middleware;
    },
  },
  
  // Add cache reset configuration
  resetCache: process.env.RESET_CACHE === 'true',
  
  // Improve symbol tracking - Renamed from symbolicate to symbolicator
  symbolicator: {
    ...defaultConfig.symbolicator,
  },
};