import { apiService } from './apiService';

/**
 * Service for listing related API calls
 */
const listingService = {
  /**
   * Get all listings with filtering and pagination
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated listings
   */
  getListings: async (params = {}) => {
    return await apiService.get('/listings', params);
  },

  /**
   * Get a single listing by ID
   * @param {string} id Listing ID
   * @returns {Promise<Object>} Listing data
   */
  getListing: async (id) => {
    return await apiService.get(`/listings/${id}`);
  },

  /**
   * Create a new listing
   * @param {Object} listingData Listing data
   * @returns {Promise<Object>} Created listing
   */
  createListing: async (listingData) => {
    return await apiService.post('/listings', listingData);
  },

  /**
   * Update a listing
   * @param {string} id Listing ID
   * @param {Object} listingData Updated listing data
   * @returns {Promise<Object>} Updated listing
   */
  updateListing: async (id, listingData) => {
    return await apiService.put(`/listings/${id}`, listingData);
  },

  /**
   * Delete a listing
   * @param {string} id Listing ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteListing: async (id) => {
    return await apiService.delete(`/listings/${id}`);
  },

  /**
   * Get listings for the currently logged in host
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated host listings
   */
  getMyListings: async (params = {}) => {
    return await apiService.get('/listings/me', params);
  },

  /**
   * Apply for a listing as a cleaner
   * @param {string} listingId Listing ID
   * @returns {Promise<Object>} Application result
   */
  applyForListing: async (listingId) => {
    return await apiService.post(`/listings/${listingId}/apply`);
  },

  /**
   * Get matching listings for a cleaner based on preferences
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated matching listings
   */
  getMatchingListings: async (params = {}) => {
    return await apiService.get('/listings/matches', params);
  },

  /**
   * Calculate the price for a listing
   * @param {Object} listingData Listing data for price calculation
   * @returns {Promise<Object>} Price calculation result
   */
  calculatePrice: async (listingData) => {
    return await apiService.post('/listings/calculate-price', listingData);
  },

  /**
   * Upload images for a listing
   * @param {string} listingId Listing ID
   * @param {FormData} formData Form data with images
   * @returns {Promise<Object>} Upload result
   */
  uploadImages: async (listingId, formData) => {
    return await apiService.upload(`/listings/${listingId}/images`, formData);
  },

  /**
   * Get applications for a specific listing
   * @param {string} listingId Listing ID
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated applications
   */
  getApplications: async (listingId, params = {}) => {
    return await apiService.get(`/listings/${listingId}/applications`, params);
  }
};

export default listingService;