/**
 * Script to forcefully fix the axios bundling issue with Metro
 * This script will apply the fix regardless of the current state of the file
 */

const fs = require('fs');
const path = require('path');

// Path to the axios module
const axiosPath = path.join(__dirname, '../node_modules/axios/lib/axios.js');

// Create the fixed content with only CommonJS requires
const fixedContent = `'use strict';

// Use only one import style (CommonJS) to avoid duplicate declarations
const utils = require('./utils.js');
const bind = require('./helpers/bind.js');
const Axios = require('./core/Axios.js');
const mergeConfig = require('./core/mergeConfig.js');
const defaults = require('./defaults/index.js');
const formDataToJSON = require('./helpers/formDataToJSON.js');
const CanceledError = require('./cancel/CanceledError.js');
const CancelToken = require('./cancel/CancelToken.js');
const isCancel = require('./cancel/isCancel.js');
const AxiosError = require('./core/AxiosError.js');
const buildURL = require('./helpers/buildURL.js');
const InterceptorManager = require('./core/InterceptorManager.js');
const dispatchRequest = require('./core/dispatchRequest.js');
const buildFullPath = require('./core/buildFullPath.js');
const validator = require('./helpers/validator.js');
const AxiosHeaders = require('./core/AxiosHeaders.js');
const transitionalDefaults = require('./defaults/transitional.js');
const Cancel = require('./cancel/Cancel.js');
const spread = require('./helpers/spread.js');
const isAxiosError = require('./helpers/isAxiosError.js');
const toFormData = require('./helpers/toFormData.js');
const HttpStatusCode = require('./helpers/HttpStatusCode.js');
const adapters = require('./adapters/adapters.js');
const VERSION = require('../package.json').version;

const AxiosInterceptorManager = InterceptorManager;

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  const context = new Axios(defaultConfig);
  const instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
const axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.CanceledError = CanceledError;
axios.CancelToken = CancelToken;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData;

// Expose AxiosError class
axios.AxiosError = AxiosError;
axios.Cancel = Cancel;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread;

// Expose isAxiosError
axios.isAxiosError = isAxiosError;

// Expose mergeConfig
axios.mergeConfig = mergeConfig;

axios.AxiosHeaders = AxiosHeaders;

axios.HttpStatusCode = HttpStatusCode;

axios.formToJSON = thing => formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing);

axios.getAdapter = adapters.getAdapter;

axios.default = axios;

// this module should only have a default export
module.exports = axios;`;

try {
  // Check if the file exists
  if (!fs.existsSync(axiosPath)) {
    console.error('Axios module not found at path:', axiosPath);
    console.log('Checking if node_modules exists...');
    const nodeModulesPath = path.join(__dirname, '../node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.error('node_modules directory not found. You may need to run npm install first.');
    } else {
      console.log('node_modules exists, but axios module not found. Check if axios is properly installed.');
    }
    process.exit(1);
  }
  
  // Backup the original file
  const backupPath = `${axiosPath}.backup`;
  if (!fs.existsSync(backupPath)) {
    try {
      fs.copyFileSync(axiosPath, backupPath);
      console.log(`Original axios.js backed up to ${backupPath}`);
    } catch (backupError) {
      console.warn(`Warning: Could not backup the original file: ${backupError.message}`);
    }
  }

  // Write the fixed content to the file
  fs.writeFileSync(axiosPath, fixedContent, 'utf8');
  console.log('Successfully fixed the axios module.');
  
  // Also check for any dual import pattern in other axios files
  const axiosLibDir = path.dirname(axiosPath);
  console.log(`Checking other files in ${axiosLibDir} for similar issues...`);
  
  // Add advice about clearing cache
  console.log('\n=== IMPORTANT ===');
  console.log('You may need to clear the Metro bundler cache for the changes to take effect.');
  console.log('Run one of these commands before starting your app:');
  console.log('- npx expo start --clear');
  console.log('- npm start -- --reset-cache');
  console.log('- npx react-native start --reset-cache');
  console.log('================\n');

} catch (error) {
  console.error('Error fixing axios:', error);
  process.exit(1);
}