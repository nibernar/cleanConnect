const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Booking = require('../models/Booking');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// @desc    Get all messages in a conversation
// @route   GET /api/v1/conversations/:conversationId/messages
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.conversationId);

  if (!conversation) {
    return next(
      new ErrorResponse(`Conversation not found with id of ${req.params.conversationId}`, 404)
    );
  }

  // Check if user is part of the conversation
  if (
    conversation.participants.toString().indexOf(req.user.id) === -1
  ) {
    return next(
      new ErrorResponse(`User not authorized to access this conversation`, 401)
    );
  }

  const messages = await Message.find({ conversation: req.params.conversationId })
    .sort({ createdAt: 1 })
    .populate({
      path: 'sender',
      select: 'name role'
    });

  // Mark all messages as read for the current user
  await Message.updateMany(
    { 
      conversation: req.params.conversationId,
      sender: { $ne: req.user.id },
      read: false
    },
    { read: true }
  );

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Get a single message
// @route   GET /api/v1/messages/:id
// @access  Private
exports.getMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id).populate({
    path: 'sender',
    select: 'name role'
  });

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  const conversation = await Conversation.findById(message.conversation);

  // Check if user is part of the conversation
  if (
    conversation.participants.toString().indexOf(req.user.id) === -1
  ) {
    return next(
      new ErrorResponse(`User not authorized to access this message`, 401)
    );
  }

  // Mark as read if the current user is not the sender
  if (message.sender.toString() !== req.user.id && !message.read) {
    message.read = true;
    await message.save();
  }

  res.status(200).json({
    success: true,
    data: message
  });
});

// @desc    Create new message
// @route   POST /api/v1/conversations/:conversationId/messages
// @access  Private
exports.createMessage = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.conversationId);

  if (!conversation) {
    return next(
      new ErrorResponse(`Conversation not found with id of ${req.params.conversationId}`, 404)
    );
  }

  // Check if user is part of the conversation
  if (
    conversation.participants.toString().indexOf(req.user.id) === -1
  ) {
    return next(
      new ErrorResponse(`User not authorized to send message to this conversation`, 401)
    );
  }

  // Add required fields to req.body
  req.body.conversation = req.params.conversationId;
  req.body.sender = req.user.id;
  
  // Find receiver (the other participant)
  const receiverId = conversation.participants.find(
    participant => participant.toString() !== req.user.id
  );
  req.body.receiver = receiverId;
  
  const message = await Message.create(req.body);
  
  // Update conversation's lastMessage
  conversation.lastMessage = {
    content: req.body.content,
    sender: req.user.id,
    timestamp: Date.now()
  };
  conversation.updatedAt = Date.now();
  await conversation.save();

  // Populate sender information
  const populatedMessage = await Message.findById(message._id).populate({
    path: 'sender',
    select: 'name role'
  });

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// @desc    Delete message
// @route   DELETE /api/v1/messages/:id
// @access  Private
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is the sender of the message
  if (message.sender.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to delete this message`, 401)
    );
  }

  await message.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Create or get a conversation between users
// @route   POST /api/v1/conversations
// @access  Private
exports.createConversation = asyncHandler(async (req, res, next) => {
  const { recipientId, userId } = req.body;
  
  // Support for both parameter names
  const targetUserId = recipientId || userId;

  if (!targetUserId) {
    return next(new ErrorResponse('Please provide a recipient ID (userId or recipientId)', 400));
  }

  // Check if recipient exists
  const recipient = await User.findById(targetUserId);
  if (!recipient) {
    return next(new ErrorResponse(`User not found with id of ${targetUserId}`, 404));
  }

  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, targetUserId] }
  }).populate({
    path: 'participants',
    select: 'name role'
  });

  // If conversation doesn't exist, create it
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, targetUserId]
    });
    
    // Populate participants info
    conversation = await Conversation.findById(conversation._id).populate({
      path: 'participants',
      select: 'name role'
    });
  }

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Get all conversations for a user
// @route   GET /api/v1/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const conversations = await Conversation.find({
    participants: req.user.id
  })
    .populate({
      path: 'participants',
      select: 'name role'
    })
    .populate({
      path: 'lastMessage',
      select: 'content createdAt read'
    })
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

// @desc    Mark all messages in a conversation as read
// @route   PATCH /api/v1/messages/conversations/:conversationId/read
// @access  Private
exports.markConversationAsRead = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.conversationId);

  if (!conversation) {
    return next(
      new ErrorResponse(`Conversation not found with id of ${req.params.conversationId}`, 404)
    );
  }

  // Check if user is part of the conversation
  if (conversation.participants.toString().indexOf(req.user.id) === -1) {
    return next(
      new ErrorResponse(`User not authorized to access this conversation`, 401)
    );
  }

  // Mark all messages as read for the current user
  await Message.updateMany(
    { 
      conversation: req.params.conversationId,
      sender: { $ne: req.user.id },
      isRead: false
    },
    { 
      isRead: true,
      readAt: new Date()
    }
  );

  res.status(200).json({
    success: true,
    message: 'All messages marked as read'
  });
});

// @desc    Get unread messages count
// @route   GET /api/v1/messages/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Message.countDocuments({
    receiver: req.user.id,
    isRead: false
  });

  res.status(200).json({
    success: true,
    data: { count }
  });
});

// @desc    Get conversation with booking participant
// @route   GET /api/v1/messages/booking/:bookingId
// @access  Private
exports.getBookingConversation = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.bookingId}`, 404)
    );
  }

  // Ensure user is either host or cleaner for this booking
  if (
    booking.host.toString() !== req.user.id && 
    booking.cleaner.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(`User not authorized to access this booking's conversation`, 401)
    );
  }

  let otherParticipantId;
  if (req.user.role === 'host' || booking.host.toString() === req.user.id) {
    otherParticipantId = booking.cleaner;
  } else {
    otherParticipantId = booking.host;
  }

  // Find existing conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, otherParticipantId] },
    relatedBooking: booking._id
  }).populate({
    path: 'participants',
    select: 'name role'
  });

  // If conversation doesn't exist, create it
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, otherParticipantId],
      relatedBooking: booking._id,
      relatedListing: booking.listing
    });
    
    // Populate participants info
    conversation = await Conversation.findById(conversation._id).populate({
      path: 'participants',
      select: 'name role'
    });
  }

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Send message with attachment
// @route   POST /api/v1/messages/conversations/:conversationId/attachment
// @access  Private
exports.sendMessageWithAttachment = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.conversationId);

  if (!conversation) {
    return next(
      new ErrorResponse(`Conversation not found with id of ${req.params.conversationId}`, 404)
    );
  }

  // Check if user is part of the conversation
  if (conversation.participants.toString().indexOf(req.user.id) === -1) {
    return next(
      new ErrorResponse(`User not authorized to send message to this conversation`, 401)
    );
  }

  // Find receiver (the other participant)
  const receiverId = conversation.participants.find(
    participant => participant.toString() !== req.user.id
  );

  // Handle file upload if it exists
  let attachment = null;
  if (req.files && req.files.attachment) {
    const file = req.files.attachment;
    
    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 1000000) {
      return next(
        new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD} bytes`, 400)
      );
    }

    // Create unique filename
    file.name = `attachment_${req.user.id}_${Date.now()}${path.parse(file.name).ext}`;

    // Move file to upload path
    const uploadPath = `${process.env.FILE_UPLOAD_PATH}/messages`;
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    file.mv(`${uploadPath}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse(`Problem with file upload`, 500));
      }
    });

    attachment = {
      url: `/uploads/messages/${file.name}`,
      mimetype: file.mimetype
    };
  }

  // Create message
  const messageData = {
    conversation: req.params.conversationId,
    sender: req.user.id,
    receiver: receiverId,
    content: req.body.text || req.body.content || '',
    attachments: attachment ? [attachment] : []
  };

  const message = await Message.create(messageData);
  
  // Update conversation's lastMessage
  conversation.lastMessage = {
    content: messageData.content,
    sender: req.user.id,
    timestamp: Date.now()
  };
  conversation.updatedAt = Date.now();
  await conversation.save();

  // Populate sender information
  const populatedMessage = await Message.findById(message._id).populate({
    path: 'sender',
    select: 'name role'
  });

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});