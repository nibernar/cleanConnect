import { apiService } from './apiService';

/**
 * Service for booking related API calls
 */
const bookingService = {
  /**
   * Get all bookings with filtering and pagination
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated bookings
   */
  getBookings: async (params = {}) => {
    return await apiService.get('/bookings', params);
  },

  /**
   * Get a single booking by ID
   * @param {string} id Booking ID
   * @returns {Promise<Object>} Booking data
   */
  getBooking: async (id) => {
    return await apiService.get(`/bookings/${id}`);
  },

  /**
   * Create a new booking (as a host)
   * @param {Object} bookingData Booking data including listingId and applicationId
   * @returns {Promise<Object>} Created booking with payment intent
   */
  createBooking: async (bookingData) => {
    return await apiService.post('/bookings', bookingData);
  },

  /**
   * Get bookings for the currently logged in user (host or cleaner)
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated user bookings
   */
  getMyBookings: async (params = {}) => {
    return await apiService.get('/bookings/me', params);
  },

  /**
   * Confirm a booking payment (as a host)
   * @param {string} bookingId Booking ID
   * @param {Object} paymentData Payment confirmation data
   * @returns {Promise<Object>} Updated booking
   */
  confirmBookingPayment: async (bookingId, paymentData) => {
    return await apiService.post(`/bookings/${bookingId}/confirm-payment`, paymentData);
  },

  /**
   * Start a booking (as a cleaner)
   * @param {string} bookingId Booking ID
   * @returns {Promise<Object>} Updated booking
   */
  startBooking: async (bookingId) => {
    return await apiService.post(`/bookings/${bookingId}/start`);
  },

  /**
   * Complete a booking (as a cleaner)
   * @param {string} bookingId Booking ID
   * @param {Object} completionData Completed tasks and optional notes
   * @returns {Promise<Object>} Updated booking
   */
  completeBooking: async (bookingId, completionData) => {
    return await apiService.post(`/bookings/${bookingId}/complete`, completionData);
  },

  /**
   * Cancel a booking
   * @param {string} bookingId Booking ID
   * @param {Object} cancellationData Reason and optional evidence
   * @returns {Promise<Object>} Updated booking
   */
  cancelBooking: async (bookingId, cancellationData) => {
    return await apiService.post(`/bookings/${bookingId}/cancel`, cancellationData);
  },

  /**
   * File a claim for a booking (as a host)
   * @param {string} bookingId Booking ID
   * @param {Object} claimData Claim details and evidence
   * @returns {Promise<Object>} Created claim
   */
  fileClaim: async (bookingId, claimData) => {
    const formData = new FormData();
    
    // Add claim text data
    formData.append('reason', claimData.reason);
    formData.append('description', claimData.description);
    
    // Add evidence photos if any
    if (claimData.photos && claimData.photos.length > 0) {
      claimData.photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `claim_photo_${index}.jpg`
        });
      });
    }
    
    return await apiService.upload(`/bookings/${bookingId}/claim`, formData);
  },

  /**
   * Get cleaner's schedule (bookings organized by day)
   * @param {Object} params Query parameters including date range
   * @returns {Promise<Object>} Schedule data
   */
  getSchedule: async (params = {}) => {
    return await apiService.get('/bookings/schedule', params);
  },

  /**
   * Submit tasks checklist for a booking
   * @param {string} bookingId Booking ID
   * @param {Object} tasksData Completed tasks data
   * @returns {Promise<Object>} Updated booking
   */
  submitTasksChecklist: async (bookingId, tasksData) => {
    return await apiService.post(`/bookings/${bookingId}/tasks`, tasksData);
  },

  /**
   * Get a cleaner's availability for a given period
   * @param {string} cleanerId Cleaner ID
   * @param {Object} params Query parameters including date range
   * @returns {Promise<Object>} Availability data
   */
  getCleanerAvailability: async (cleanerId, params = {}) => {
    return await apiService.get(`/bookings/cleaner/${cleanerId}/availability`, params);
  }
};

export default bookingService;