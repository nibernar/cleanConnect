// Correction: Importer 'api' depuis './api'
import api from './api'; 

/**
 * Service for messaging related API calls
 */
const messageService = {
  /**
   * Get all conversations
   * @param {Object} params Query parameters for pagination
   * @returns {Promise<Object>} Paginated conversations
   */
  getConversations: async (params = {}) => {
    // Correction: Utiliser api.get
    return await api.get('/messages/conversations', params);
  },

  /**
   * Get a single conversation by ID
   * @param {string} id Conversation ID
   * @param {Object} params Query parameters for pagination
   * @returns {Promise<Object>} Conversation with messages
   */
  getConversation: async (id, params = {}) => {
    // Correction: Utiliser api.get
    return await api.get(`/messages/conversations/${id}`, params);
  },

  /**
   * Get or create conversation with another user
   * @param {string} userId Other user ID
   * @returns {Promise<Object>} Conversation data
   */
  getOrCreateConversation: async (userId) => {
    // Correction: Utiliser api.post
    return await api.post('/messages/conversations', { userId });
  },

  /**
   * Send a message in a conversation
   * @param {string} conversationId Conversation ID
   * @param {Object} messageData Message data
   * @returns {Promise<Object>} Created message
   */
  sendMessage: async (conversationId, messageData) => {
    // Correction: Utiliser api.post
    return await api.post(`/messages/conversations/${conversationId}`, messageData);
  },

  /**
   * Mark conversation as read
   * @param {string} conversationId Conversation ID
   * @returns {Promise<Object>} Updated conversation
   */
  markConversationAsRead: async (conversationId) => {
    // Correction: Utiliser api.patch
    return await api.patch(`/messages/conversations/${conversationId}/read`);
  },

  /**
   * Get unread messages count
   * @returns {Promise<Object>} Count of unread messages
   */
  getUnreadCount: async () => {
     // Correction: Utiliser api.get
    return await api.get('/messages/unread-count');
  },

  /**
   * Get conversation with booking participant
   * @param {string} bookingId Booking ID
   * @returns {Promise<Object>} Conversation data
   */
  getBookingConversation: async (bookingId) => {
    // Correction: Utiliser api.get
    return await api.get(`/messages/booking/${bookingId}`);
  },

  /**
   * Send a message with attachment
   * @param {string} conversationId Conversation ID
   * @param {string} text Message text
   * @param {string} imageUri Image URI to attach
   * @returns {Promise<Object>} Created message
   */
  sendMessageWithAttachment: async (conversationId, text, imageUri) => {
    const formData = new FormData();
    formData.append('text', text);
    
    if (imageUri) {
      formData.append('attachment', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'attachment.jpg'
      });
    }
    // Correction: Utiliser api.upload
    return await api.upload(`/messages/conversations/${conversationId}/attachment`, formData);
  }
};

export default messageService;
