const express = require('express');
const {
  getMessages,
  getMessage,
  createMessage,
  deleteMessage,
  createConversation,
  getConversations,
  markConversationAsRead,
  getUnreadCount,
  getBookingConversation,
  sendMessageWithAttachment
} = require('../controllers/message.controller');

const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/auth');

// IMPORTANT: L'ordre des routes est crucial!
// Les routes spécifiques doivent être définies AVANT les routes génériques avec des paramètres variables

// Routes compatibles avec le frontend
// ----------------------------------
// Récupération de toutes les conversations
router
  .route('/messages/conversations')
  .get(protect, getConversations)
  .post(protect, createConversation);

// Récupération d'une conversation spécifique
router
  .route('/messages/conversations/:conversationId')
  .get(protect, getMessages)
  .post(protect, createMessage);

// Marquer comme lu
router
  .route('/messages/conversations/:conversationId/read')
  .patch(protect, markConversationAsRead);

// Envoyer un message avec une pièce jointe
router
  .route('/messages/conversations/:conversationId/attachment')
  .post(protect, sendMessageWithAttachment);

// Obtenir le nombre de messages non lus
router
  .route('/messages/unread-count')
  .get(protect, getUnreadCount);

// Obtenir la conversation liée à une réservation
router
  .route('/messages/booking/:bookingId')
  .get(protect, getBookingConversation);

// Routes originales (laissées pour compatibilité)
// ----------------
// Conversation routes
router
  .route('/conversations')
  .get(protect, getConversations)
  .post(protect, createConversation);

// Message routes for specific conversation
router
  .route('/conversations/:conversationId/messages')
  .get(protect, getMessages)
  .post(protect, createMessage);

// IMPORTANT: Cette route doit être définie en DERNIER car elle a un paramètre générique
// qui pourrait capturer d'autres routes
// Single message routes
router
  .route('/messages/:id')
  .get(protect, getMessage)
  .delete(protect, deleteMessage);

module.exports = router;