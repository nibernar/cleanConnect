const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { createNotification } = require('../services/notifications');

/**
 * @desc    Obtenir toutes les évaluations
 * @route   GET /api/reviews
 * @access  Private/Admin
 */
exports.getReviews = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Obtenir une évaluation par ID
 * @route   GET /api/reviews/:id
 * @access  Private
 */
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate({
      path: 'reviewer',
      select: 'firstName lastName avatar rating'
    })
    .populate({
      path: 'reviewedUser',
      select: 'firstName lastName avatar rating'
    })
    .populate({
      path: 'booking',
      select: 'listing dateScheduled status',
      populate: {
        path: 'listing',
        select: 'title accommodationType'
      }
    });

  if (!review) {
    return next(new ErrorResponse(`Évaluation non trouvée avec l'id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

/**
 * @desc    Créer une évaluation
 * @route   POST /api/reviews
 * @access  Private
 */
exports.addReview = asyncHandler(async (req, res, next) => {
  const { bookingId, rating, comment, aspects } = req.body;

  // Vérifier que le booking existe
  const booking = await Booking.findById(bookingId)
    .populate({
      path: 'host',
      select: 'user'
    })
    .populate({
      path: 'cleaner',
      select: 'user'
    });

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'id ${bookingId}`, 404));
  }

  // Vérifier que la réservation est terminée
  if (booking.status !== 'completed') {
    return next(new ErrorResponse('Vous ne pouvez évaluer que des réservations terminées', 400));
  }

  // Déterminer le type d'évaluation et les utilisateurs concernés
  let reviewType;
  let reviewedUserId;

  // Si l'utilisateur est l'hébergeur, il évalue le professionnel
  if (req.user.role === 'host' && booking.host.user.toString() === req.user.id) {
    reviewType = 'host_to_cleaner';
    reviewedUserId = booking.cleaner.user;
  }
  // Si l'utilisateur est le professionnel, il évalue l'hébergeur
  else if (req.user.role === 'cleaner' && booking.cleaner.user.toString() === req.user.id) {
    reviewType = 'cleaner_to_host';
    reviewedUserId = booking.host.user;
  } else {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à créer cette évaluation', 403));
  }

  // Vérifier qu'une évaluation n'existe pas déjà pour cette réservation par cet utilisateur
  const existingReview = await Review.findOne({
    booking: bookingId,
    reviewer: req.user.id
  });

  if (existingReview) {
    return next(new ErrorResponse('Vous avez déjà évalué cette réservation', 400));
  }

  // Créer l'évaluation
  const review = await Review.create({
    booking: bookingId,
    reviewer: req.user.id,
    reviewedUser: reviewedUserId,
    reviewType,
    rating,
    comment,
    aspects: aspects || {}
  });

  // Envoyer une notification à l'utilisateur évalué
  await createNotification({
    recipient: reviewedUserId,
    type: 'review_received',
    title: 'Nouvelle évaluation reçue',
    message: `Vous avez reçu une évaluation de ${rating} étoiles.`,
    relatedTo: {
      modelType: 'Review',
      modelId: review._id
    },
    actionRequired: false
  });

  res.status(201).json({
    success: true,
    data: review
  });
});

/**
 * @desc    Mettre à jour une évaluation
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Évaluation non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est l'auteur de l'évaluation
  if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à modifier cette évaluation', 403));
  }

  // Vérifier que l'évaluation a moins de 7 jours
  const reviewDate = new Date(review.createdAt);
  const now = new Date();
  const daysSinceCreation = Math.floor((now - reviewDate) / (1000 * 60 * 60 * 24));

  if (daysSinceCreation > 7 && req.user.role !== 'admin') {
    return next(new ErrorResponse('Vous ne pouvez plus modifier cette évaluation après 7 jours', 400));
  }

  // Mise à jour
  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: review
  });
});

/**
 * @desc    Supprimer une évaluation
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Évaluation non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est l'auteur de l'évaluation ou un admin
  if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à supprimer cette évaluation', 403));
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Signaler une évaluation inappropriée
 * @route   POST /api/reviews/:id/report
 * @access  Private
 */
exports.reportReview = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new ErrorResponse('Veuillez fournir une raison pour le signalement', 400));
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Évaluation non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est l'utilisateur évalué
  if (review.reviewedUser.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à signaler cette évaluation', 403));
  }

  // Mettre à jour l'évaluation
  review.isReported = true;
  review.reportReason = reason;
  await review.save();

  // Notification pour l'administrateur
  const adminUsers = await User.find({ role: 'admin' });
  for (const admin of adminUsers) {
    await createNotification({
      recipient: admin._id,
      type: 'system_notification',
      title: 'Évaluation signalée',
      message: `Une évaluation a été signalée pour motif: ${reason}`,
      relatedTo: {
        modelType: 'Review',
        modelId: review._id
      },
      actionRequired: true,
      actionType: 'view'
    });
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

/**
 * @desc    Obtenir les évaluations d'un utilisateur
 * @route   GET /api/users/:userId/reviews
 * @access  Public
 */
exports.getUserReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ reviewedUser: req.params.userId })
    .populate({
      path: 'reviewer',
      select: 'firstName lastName avatar rating'
    })
    .populate({
      path: 'booking',
      select: 'dateScheduled'
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});