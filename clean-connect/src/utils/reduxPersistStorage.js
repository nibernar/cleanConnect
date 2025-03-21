import AsyncStorage from '@react-native-async-storage/async-storage';
import { isClient } from './ssrHelpers';

/**
 * Custom storage adapter for Redux Persist that works in both client and server environments
 */

// Memory storage for server-side rendering (SSR)
const memoryStorage = new Map();

// Create a custom storage adapter with AsyncStorage for client and memory for server
const customStorage = {
  getItem: (key) => {
    if (isClient) {
      return AsyncStorage.getItem(key).then(data => {
        return data;
      });
    }
    return Promise.resolve(memoryStorage.get(key) || null);
  },
  setItem: (key, value) => {
    if (isClient) {
      return AsyncStorage.setItem(key, value);
    }
    memoryStorage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    if (isClient) {
      return AsyncStorage.removeItem(key);
    }
    memoryStorage.delete(key);
    return Promise.resolve();
  }
};

export default customStorage;