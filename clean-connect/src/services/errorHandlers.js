/**
 * Specialized error handlers for different parts of the application
 * These handlers provide context-specific error handling
 */

import { getErrorMessage, logError, handleApiError } from '../utils/errorHandler';

/**
 * Error handler for listing-related API operations
 * Provides context-specific error handling for listings
 * 
 * @param {Error} error - The error object
 * @param {Function} dispatch - Redux dispatch function
 * @param {string} actionType - Redux action type for error 
 * @param {Function} callback - Optional callback to execute
 * @returns {string} User-friendly error message
 */
export const handleListingError = (error, dispatch = null, actionType = null, callback = null) => {
  // Map specific listing error codes to better messages if needed
  let errorCode = error?.code || '';
  let context = 'Listing Operation';
  
  // Set specific context based on error or operation
  if (error?.config?.url?.includes('create')) {
    context = 'Listing Creation';
    // If not already a specific code, set it for creation
    if (!errorCode) errorCode = 'listings/creation-failed';
  } else if (error?.config?.url?.includes('update')) {
    context = 'Listing Update';
    if (!errorCode) errorCode = 'listings/update-failed';
  } else if (error?.config?.url?.includes('delete')) {
    context = 'Listing Deletion';
    if (!errorCode) errorCode = 'listings/deletion-failed';
  } else if (error?.config?.url?.includes('apply')) {
    context = 'Application to Listing';
    if (!errorCode) errorCode = 'application/action-failed';
  }
  
  // Log error with the specific context
  logError(error, context, { operation: context });
  
  const errorMessage = getErrorMessage(errorCode || error);
  
  // Dispatch error action if provided
  if (dispatch && actionType) {
    dispatch({ 
      type: actionType, 
      payload: errorMessage 
    });
  }
  
  // Execute callback if provided
  if (callback && typeof callback === 'function') {
    callback(errorMessage);
  }
  
  return errorMessage;
};

/**
 * Error handler for authentication-related API operations
 */
export const handleAuthError = (error, dispatch = null, actionType = null, callback = null) => {
  // Override error code for specific auth situations
  let errorCode = error?.code || '';
  let context = 'Authentication';
  
  if (error?.response?.status === 401) {
    errorCode = 'auth/invalid-credentials';
  } else if (error?.response?.status === 403) {
    errorCode = 'auth/unauthorized';
  } else if (error?.message?.includes('email')) {
    errorCode = 'auth/email-already-in-use';
  }
  
  logError(error, context, { operation: context });
  
  const errorMessage = getErrorMessage(errorCode || error);
  
  if (dispatch && actionType) {
    dispatch({ type: actionType, payload: errorMessage });
  }
  
  if (callback && typeof callback === 'function') {
    callback(errorMessage);
  }
  
  return errorMessage;
};

/**
 * Error handler for user profile-related API operations
 */
export const handleProfileError = (error, dispatch = null, actionType = null, callback = null) => {
  const context = 'User Profile';
  logError(error, context, { operation: context });
  
  const errorMessage = getErrorMessage(error);
  
  if (dispatch && actionType) {
    dispatch({ type: actionType, payload: errorMessage });
  }
  
  if (callback && typeof callback === 'function') {
    callback(errorMessage);
  }
  
  return errorMessage;
};

export default {
  handleListingError,
  handleAuthError,
  handleProfileError
};