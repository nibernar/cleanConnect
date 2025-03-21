/**
 * @deprecated This file is deprecated and maintained only for backward compatibility.
 * Please use api.js instead for all new code.
 */

import api from './api';
import { setupInterceptors } from './api';
import { serializeResponse, extractData } from '../../../clean-connect/src/utils/api/responseSerializer';

// Log a warning to encourage migration
console.warn(
  'apiService.js is deprecated and will be removed in a future version. ' +
  'Please use api.js instead.'
);

// Export the API service with full backward compatibility
// The api implementation already includes serialization, so we just export it directly
export const apiService = api;

// Export the setupInterceptors function for backward compatibility
export const setupApiInterceptors = setupInterceptors;

// Export all the API methods for backward compatibility
export default api;