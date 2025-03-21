import { apiService } from './apiService';

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
    return await apiService.get('/notifications', params);
  },

  /**
   * Mark a notification as read
   * @param {string} id Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (id) => {
    return await apiService.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Operation result
   */
  markAllAsRead: async () => {
    return await apiService.patch('/notifications/read-all');
  },

  /**
   * Get unread notification count
   * @returns {Promise<Object>} Count of unread notifications
   */
  getUnreadCount: async () => {
    return await apiService.get('/notifications/unread-count');
  },

  /**
   * Delete a notification
   * @param {string} id Notification ID
   * @returns {Promise<Object>} Operation result
   */
  deleteNotification: async (id) => {
    return await apiService.delete(`/notifications/${id}`);
  },

  /**
   * Update push notification token
   * @param {string} token Expo push notification token
   * @returns {Promise<Object>} Operation result
   */
  updatePushToken: async (token) => {
    return await apiService.post('/notifications/push-token', { token });
  },

  /**
   * Update notification preferences
   * @param {Object} preferences Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  updatePreferences: async (preferences) => {
    return await apiService.put('/notifications/preferences', preferences);
  },

  /**
   * Get notification preferences
   * @returns {Promise<Object>} Current notification preferences
   */
  getPreferences: async () => {
    return await apiService.get('/notifications/preferences');
  }
};

export default notificationService;