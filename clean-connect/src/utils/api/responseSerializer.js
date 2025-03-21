/**
 * Utility to extract only serializable data from API responses
 * Prevents non-serializable values from being passed to Redux
 */

/**
 * Extracts only serializable data from an Axios response
 * @param {Object} response - The Axios response object
 * @returns {Object} - Object containing only serializable data
 */
export const serializeResponse = (response) => {
  // If not a valid response, return as is
  if (!response || typeof response !== 'object') {
    return response;
  }

  // Only extract the data we need, avoiding non-serializable parts
  // like headers (which contain non-serializable Header objects) and request objects
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText
  };
};

/**
 * Helper to extract only the data property from a serialized response
 * This is useful for most API calls where we only care about the response data
 * @param {Object} response - The serialized response
 * @returns {any} - The data property from the response
 */
export const extractData = (response) => {
  return response?.data;
};