const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Notification = require('../models/Notification');

// @desc    Get all notifications for a user
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  // Find notifications for the current user
  const notifications = await Notification.find({ 
    recipient: req.user.id 
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

// @desc    Get single notification
// @route   GET /api/v1/notifications/:id
// @access  Private
exports.getNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user owns notification
  if (notification.recipient.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User not authorized to access this notification`, 401)
    );
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Get count of unread notifications for a user
// @route   GET /api/v1/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  // Find count of unread notifications for the current user
  const count = await Notification.countDocuments({ 
    recipient: req.user.id,
    isRead: false
  });

  res.status(200).json({
    success: true,
    count: count
  });
});

// @desc    Create new notification
// @route   POST /api/v1/notifications
// @access  Private (Admin)
exports.createNotification = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.recipient = req.body.recipient || req.user.id;

  const notification = await Notification.create(req.body);

  res.status(201).json({
    success: true,
    data: notification
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  let notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user owns notification
  if (notification.recipient.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User not authorized to update this notification`, 401)
    );
  }

  notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { 
      isRead: true,
      readAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user owns notification
  if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to delete this notification`, 401)
    );
  }

  await notification.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});