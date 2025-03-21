const express = require('express');
const {
  getNotifications,
  getNotification,
  createNotification,
  markAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notification.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getNotifications)
  .post(protect, authorize('admin'), createNotification);

// This route must be defined before the /:id route to avoid treating 'unread-count' as an ID
router
  .route('/unread-count')
  .get(protect, getUnreadCount);

router
  .route('/:id')
  .get(protect, getNotification)
  .delete(protect, deleteNotification);

router
  .route('/:id/read')
  .put(protect, markAsRead);

module.exports = router;