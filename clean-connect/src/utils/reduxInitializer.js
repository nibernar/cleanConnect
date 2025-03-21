/**
 * Provides environment detection utilities and Redux Persist initialization for Redux setup
 */
import { persistStore } from 'redux-persist';
import { isClient, isServer } from './ssrHelpers';

// Determine if we're in a development environment
export const isDev = process.env.NODE_ENV === 'development';

// Store the persistor instance to avoid creating multiple instances
let persistorInstance = null;

/**
 * Initializes Redux Persist for the given store
 * This function should only be called in client environments
 * If persistor was already created in store.js, it will use that instance
 * @param {Object} store - The Redux store to be persisted
 * @returns {Object} The persistor object
 */
export const initializeReduxPersist = (store) => {
  if (isServer) {
    console.warn('Attempted to initialize Redux Persist in a non-client environment');
    return null;
  }
  
  // If a persistor was already imported from store.js, use that one
  try {
    const storeModule = require('../redux/store');
    if (storeModule.persistor) {
      persistorInstance = storeModule.persistor;
      return persistorInstance;
    }
  } catch (error) {
    // If there's an error importing, we'll create a new persistor below
    console.warn('Could not import persistor from store, creating a new one');
  }
  
  // Create a new persistor if needed
  if (!persistorInstance) {
    persistorInstance = persistStore(store);
  }
  
  return persistorInstance;
};

// Re-export isClient/isServer for convenience
export { isClient, isServer };

// Utility to safely execute code only in client environments
export const runIfClient = (callback) => {
  if (isClient) {
    return callback();
  }
  return null;
};

// Utility for safe logging that respects environment
export const safeLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

// Utility for safe error logging that respects environment
export const safeError = (...args) => {
  if (isDev) {
    console.error(...args);
  }
};