import { apiService } from './apiService';

/**
 * Service for review related API calls
 */
const reviewService = {
  /**
   * Get reviews for a user
   * @param {string} userId User ID
   * @param {Object} params Query parameters for pagination
   * @returns {Promise<Object>} Paginated reviews
   */
  getUserReviews: async (userId, params = {}) => {
    return await apiService.get(`/reviews/user/${userId}`, params);
  },

  /**
   * Get reviews for a cleaner
   * @param {string} cleanerId Cleaner ID
   * @param {Object} params Query parameters for pagination
   * @returns {Promise<Object>} Paginated reviews
   */
  getCleanerReviews: async (cleanerId, params = {}) => {
    return await apiService.get(`/reviews/cleaner/${cleanerId}`, params);
  },

  /**
   * Get reviews for a host
   * @param {string} hostId Host ID
   * @param {Object} params Query parameters for pagination
   * @returns {Promise<Object>} Paginated reviews
   */
  getHostReviews: async (hostId, params = {}) => {
    return await apiService.get(`/reviews/host/${hostId}`, params);
  },

  /**
   * Create a review for a booking
   * @param {string} bookingId Booking ID
   * @param {Object} reviewData Review data
   * @returns {Promise<Object>} Created review
   */
  createReview: async (bookingId, reviewData) => {
    return await apiService.post(`/reviews/booking/${bookingId}`, reviewData);
  },

  /**
   * Get review for a specific booking
   * @param {string} bookingId Booking ID
   * @returns {Promise<Object>} Review data
   */
  getBookingReview: async (bookingId) => {
    return await apiService.get(`/reviews/booking/${bookingId}`);
  },

  /**
   * Update a review
   * @param {string} reviewId Review ID
   * @param {Object} reviewData Updated review data
   * @returns {Promise<Object>} Updated review
   */
  updateReview: async (reviewId, reviewData) => {
    return await apiService.put(`/reviews/${reviewId}`, reviewData);
  },

  /**
   * Delete a review
   * @param {string} reviewId Review ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteReview: async (reviewId) => {
    return await apiService.delete(`/reviews/${reviewId}`);
  },

  /**
   * Get reviews written by the current user
   * @param {Object} params Query parameters for pagination
   * @returns {Promise<Object>} Paginated reviews
   */
  getMyReviews: async (params = {}) => {
    return await apiService.get('/reviews/me', params);
  },

  /**
   * Get pending reviews (bookings that can be reviewed)
   * @returns {Promise<Object>} List of bookings that can be reviewed
   */
  getPendingReviews: async () => {
    return await apiService.get('/reviews/pending');
  },

  /**
   * Report a review
   * @param {string} reviewId Review ID
   * @param {Object} reportData Report data with reason
   * @returns {Promise<Object>} Report result
   */
  reportReview: async (reviewId, reportData) => {
    return await apiService.post(`/reviews/${reviewId}/report`, reportData);
  }
};

export default reviewService;