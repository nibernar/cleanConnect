// Correction: Importer directement depuis api.js
import api from './api';

/**
 * Service for booking related API calls
 */
const bookingService = {
  getBookings: async (params = {}) => {
    // Correction: Utiliser api.get
    return await api.get('/bookings', params);
  },
  getBooking: async (id) => {
    // Correction: Utiliser api.get
    return await api.get(`/bookings/${id}`);
  },
  createBooking: async (bookingData) => {
    // Correction: Utiliser api.post
    return await api.post('/bookings', bookingData);
  },
  getMyBookings: async (params = {}) => {
    // Correction: Utiliser api.get
    return await api.get('/bookings/mine', params);
  },
  confirmBookingPayment: async (bookingId, paymentData) => {
    // Correction: Utiliser api.post
    return await api.post(`/bookings/${bookingId}/confirm-payment`, paymentData);
  },
  startBooking: async (bookingId) => {
    // Correction: Utiliser api.post
    return await api.post(`/bookings/${bookingId}/arrival`); 
  },
  completeBooking: async (bookingId, completionData) => {
     // Correction: Utiliser api.put
    return await api.put(`/bookings/${bookingId}/complete`, completionData);
  },
  cancelBooking: async (bookingId, cancellationData) => {
    // Correction: Utiliser api.post
    return await api.post(`/bookings/${bookingId}/cancel`, cancellationData);
  },
  fileClaim: async (bookingId, claimData) => {
    const formData = new FormData();
    formData.append('reason', claimData.reason);
    formData.append('description', claimData.description);
    if (claimData.photos && claimData.photos.length > 0) {
      claimData.photos.forEach((photo, index) => {
        formData.append('photos', { uri: photo.uri, type: 'image/jpeg', name: `claim_photo_${index}.jpg` });
      });
    }
    // Correction: Utiliser api.upload
    return await api.upload(`/bookings/${bookingId}/complaint`, formData);
  },
  getSchedule: async (params = {}) => {
    // Correction: Utiliser api.get
    return await api.get('/bookings/schedule', params);
  },
  submitTasksChecklist: async (bookingId, tasksData) => {
     // Correction: Utiliser api.put
    return await api.put(`/bookings/${bookingId}/tasks`, tasksData);
  },
  getCleanerAvailability: async (cleanerId, params = {}) => {
    // Correction: Utiliser api.get
    return await api.get(`/bookings/cleaner/${cleanerId}/availability`, params);
  }
};

export default bookingService;
