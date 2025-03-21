import { isPlain } from '@reduxjs/toolkit';
import { serializeResponse } from '../../utils/api/responseSerializer';

/**
 * Redux middleware that automatically serializes API responses in fulfilled actions
 * This prevents non-serializable values from breaking Redux
 */
export const createSerializeMiddleware = () => {
  return store => next => action => {
    // Only process fulfilled actions from API calls
    if (action.type?.endsWith('/fulfilled') && action.payload && typeof action.payload === 'object') {
      // Check if the payload looks like an API response with potential non-serializable fields
      if (
        action.payload.headers || 
        action.payload.config || 
        action.payload.request ||
        action.payload.xhr
      ) {
        // Create a serialized copy of the payload
        const serializedPayload = serializeResponse(action.payload);
        
        // Create a new action with the serialized payload
        const newAction = {
          ...action,
          payload: serializedPayload
        };
        
        // Log that we've serialized this action
        console.log(`Serialized non-serializable payload in action: ${action.type}`);
        
        // Dispatch the new action instead
        return next(newAction);
      }
    }
    
    // For all other actions, proceed normally
    return next(action);
  };
};

/**
 * Recursively checks if an object is serializable
 * Used for debugging purposes
 */
export const isSerializable = (value) => {
  if (
    typeof value === 'undefined' ||
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return true;
  }

  if (!isPlain(value)) {
    return false;
  }

  // Check each property recursively
  return Object.keys(value).every(key => isSerializable(value[key]));
};

export default createSerializeMiddleware;