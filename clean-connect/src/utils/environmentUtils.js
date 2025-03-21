/**
 * Utility functions for safely determining the current environment
 * This avoids direct references to __DEV__ which can cause issues in some contexts
 */

// Safely determine if we're in development mode
export const isDevelopment = () => {
  // First check Node environment variable
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Then check Expo environment variable
  if (process.env.EXPO_PUBLIC_ENV === 'development') {
    return true;
  }
  
  // Fallback to check for __DEV__ if available in runtime context
  try {
    // Using Function constructor to avoid direct reference that would
    // cause syntax errors during static analysis/compilation
    return new Function('return typeof __DEV__ !== "undefined" && __DEV__')();
  } catch (e) {
    // If __DEV__ is not available or causes errors
    return false;
  }
};

// For backward compatibility with existing code
export const isDevEnvironment = isDevelopment();