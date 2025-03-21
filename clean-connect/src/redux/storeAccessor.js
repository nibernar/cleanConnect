/**
 * This module provides a way to access the Redux store outside of React components
 * Useful for middleware, services, and other non-React code that needs to dispatch actions
 */

let store;

/**
 * Initialize the store accessor with a store instance
 * Should be called when creating the Redux store
 * @param {Object} storeInstance - The Redux store instance
 */
export const initializeStore = (storeInstance) => {
  store = storeInstance;
};

/**
 * Get the current Redux state
 * @returns {Object} The current state
 */
export const getState = () => {
  if (!store) {
    console.warn('Store not initialized. Make sure to call initializeStore first.');
    return {};
  }
  return store.getState();
};

/**
 * Dispatch an action to the Redux store
 * @param {Object} action - The action to dispatch
 * @returns {Object} The dispatched action
 */
export const dispatch = (action) => {
  if (!store) {
    console.warn('Store not initialized. Make sure to call initializeStore first.');
    return action;
  }
  return store.dispatch(action);
};

/**
 * Subscribe to store changes
 * @param {Function} listener - The callback to be invoked on every state change
 * @returns {Function} The unsubscribe function
 */
export const subscribe = (listener) => {
  if (!store) {
    console.warn('Store not initialized. Make sure to call initializeStore first.');
    return () => {};
  }
  return store.subscribe(listener);
};