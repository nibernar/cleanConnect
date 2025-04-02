// Correction: Importer 'api' depuis './api'
import api from './api'; 

/**
 * Service for notification related API calls
 */
const notificationService = {
  /**
   * Get all notifications with pagination
   * @param {Object} params Query parameters for pagination
   * @returns {Promise<Object>} Paginated notifications
   */
  getNotifications: async (params = {}) => {
    // Correction: Utiliser api.get
    return await api.get('/notifications', params);
  },

  /**
   * Mark a notification as read
   * @param {string} id Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (id) => {
    // Correction: Utiliser api.patch
    return await api.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Operation result
   */
  markAllAsRead: async () => {
    // Correction: Utiliser api.patch
    return await api.patch('/notifications/read-all');
  },

  /**
   * Get unread notification count
   * @returns {Promise<Object>} Count of unread notifications
   */
  getUnreadCount: async () => {
    // Correction: Utiliser api.get
    return await api.get('/notifications/unread-count');
  },

  /**
   * Delete a notification
   * @param {string} id Notification ID
   * @returns {Promise<Object>} Operation result
   */
  deleteNotification: async (id) => {
    // Correction: Utiliser api.delete (importé comme api.del)
    return await api.delete(`/notifications/${id}`);
  },

  /**
   * Update push notification token
   * @param {string} token Expo push notification token
   * @returns {Promise<Object>} Operation result
   */
  updatePushToken: async (token) => {
    // Correction: Utiliser api.post
    return await api.post('/notifications/push-token', { token });
  },

  /**
   * Update notification preferences
   * @param {Object} preferences Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  updatePreferences: async (preferences) => {
    // Correction: Utiliser api.put
    return await api.put('/notifications/preferences', preferences);
  },

  /**
   * Get notification preferences
   * @returns {Promise<Object>} Current notification preferences
   */
  getPreferences: async () => {
    // Correction: Utiliser api.get
    return await api.get('/notifications/preferences');
  }
};

export default notificationService;
