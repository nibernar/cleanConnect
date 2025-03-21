const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const Host = require('../models/Host');
const Cleaner = require('../models/Cleaner');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { 
  createPaymentIntent, 
  capturePayment, 
  transferToCleanerAccount 
} = require('../services/payment');
const { createBookingNotifications } = require('../services/notifications');

/**
 * @desc    Créer une réservation
 * @route   POST /api/bookings
 * @access  Private (Host only)
 */
exports.createBooking = asyncHandler(async (req, res, next) => {
  const { listingId, cleanerId } = req.body;

  // Vérifier que l'utilisateur est un hébergeur
  if (req.user.role !== 'host') {
    return next(new ErrorResponse('Seuls les hébergeurs peuvent créer des réservations', 403));
  }

  // Trouver le profil d'hébergeur de l'utilisateur
  const host = await Host.findOne({ user: req.user.id });
  if (!host) {
    return next(new ErrorResponse('Profil d\'hébergeur non trouvé', 404));
  }

  // Trouver l'annonce correspondante
  const listing = await Listing.findById(listingId);
  if (!listing) {
    return next(new ErrorResponse(`Annonce non trouvée avec l'ID ${listingId}`, 404));
  }

  // Vérifier que l'hébergeur est bien le propriétaire de l'annonce
  if (listing.host.toString() !== host._id.toString()) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à réserver cette annonce', 403));
  }

  // Vérifier que l'annonce a le status 'published'
  if (listing.status !== 'published' && listing.status !== 'booked') {
    return next(new ErrorResponse('Cette annonce n\'est pas disponible pour réservation', 400));
  }

  // Vérifier que le professionnel est bien candidat sur cette annonce et accepté
  const application = listing.applications.find(
    app => app.cleaner.toString() === cleanerId && app.status === 'accepted'
  );

  if (!application) {
    return next(new ErrorResponse('Ce professionnel n\'a pas été accepté pour cette annonce', 400));
  }

  // Trouver le profil du professionnel
  const cleaner = await Cleaner.findById(cleanerId);
  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel non trouvé avec l'ID ${cleanerId}`, 404));
  }

  // Créer la liste des tâches à partir des services de l'annonce
  const taskChecklist = listing.services.map(service => ({
    taskName: service,
    isCompleted: false
  }));

  // Calcul des montants de paiement
  const platformFee = listing.price.commission;
  const cleanerPayout = listing.price.baseAmount;
  const totalAmount = listing.price.totalAmount;

  // Créer la réservation
  const booking = await Booking.create({
    listing: listing._id,
    host: host._id,
    cleaner: cleaner._id,
    status: 'pending',
    dateScheduled: {
      date: listing.dateRequired.startDate,
      startTime: listing.dateRequired.startTime,
      endTime: listing.dateRequired.endTime
    },
    taskChecklist,
    payment: {
      amount: totalAmount,
      platformFee,
      cleanerPayout,
      currency: 'EUR',
      isPaid: false
    }
  });

  // Créer une intention de paiement
  const paymentIntent = await createPaymentIntent(booking, host.stripeCustomerId);

  // Mettre à jour la réservation avec l'ID de l'intention de paiement
  booking.payment.stripePaymentId = paymentIntent.paymentIntentId;
  await booking.save();

  // Mettre à jour le status de l'annonce si nécessaire
  if (listing.status === 'published') {
    listing.status = 'booked';
    await listing.save();
  }

  // Ajouter la réservation au planning du professionnel
  cleaner.activeBookings.push(booking._id);
  
  // Ajouter au planning quotidien
  const bookingDate = new Date(booking.dateScheduled.date).toISOString().split('T')[0];
  const scheduleIndex = cleaner.schedule.findIndex(
    s => new Date(s.date).toISOString().split('T')[0] === bookingDate
  );

  if (scheduleIndex >= 0) {
    cleaner.schedule[scheduleIndex].bookings.push(booking._id);
  } else {
    cleaner.schedule.push({
      date: booking.dateScheduled.date,
      bookings: [booking._id]
    });
  }

  await cleaner.save();

  res.status(201).json({
    success: true,
    data: {
      booking,
      clientSecret: paymentIntent.clientSecret
    }
  });
});

/**
 * @desc    Mettre à jour une réservation
 * @route   PUT /api/bookings/:id
 * @access  Private
 */
exports.updateBooking = asyncHandler(async (req, res, next) => {
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est autorisé à mettre à jour cette réservation
  const isHost = req.user.role === 'host' && booking.host.toString() === (await Host.findOne({ user: req.user.id }))._id.toString();
  const isCleaner = req.user.role === 'cleaner' && booking.cleaner.toString() === (await Cleaner.findOne({ user: req.user.id }))._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isHost && !isCleaner && !isAdmin) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à mettre à jour cette réservation', 403));
  }

  // Limiter les champs qui peuvent être mis à jour selon le rôle
  const allowedUpdates = {};
  
  if (isHost || isAdmin) {
    // Champs que l'hébergeur ou l'admin peut mettre à jour
    ['note'].forEach(field => {
      if (req.body[field] !== undefined) {
        allowedUpdates[field] = req.body[field];
      }
    });
  }

  if (isCleaner || isAdmin) {
    // Champs que le cleaner ou l'admin peut mettre à jour
    ['cleanerNote'].forEach(field => {
      if (req.body[field] !== undefined) {
        allowedUpdates[field] = req.body[field];
      }
    });
  }

  // Si aucun champ valide à mettre à jour, retourner une erreur
  if (Object.keys(allowedUpdates).length === 0) {
    return next(new ErrorResponse('Aucun champ valide à mettre à jour', 400));
  }

  // Effectuer la mise à jour
  booking = await Booking.findByIdAndUpdate(
    req.params.id,
    allowedUpdates,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Supprimer une réservation
 * @route   DELETE /api/bookings/:id
 * @access  Private (Admin only)
 */
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est autorisé à supprimer cette réservation
  // Cette opération est réservée aux administrateurs pour des raisons de sécurité
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à supprimer cette réservation', 403));
  }

  // Si nous avons un paiement associé et qu'il est payé, vérifier qu'il a été remboursé
  if (booking.payment && booking.payment.isPaid && !booking.payment.refundId) {
    return next(new ErrorResponse('Cette réservation a été payée et doit être remboursée avant d\'être supprimée', 400));
  }

  // Mettre à jour le statut de l'annonce si nécessaire
  if (booking.listing) {
    const listing = await Listing.findById(booking.listing);
    if (listing && listing.status === 'booked') {
      listing.status = 'published';
      await listing.save();
    }
  }

  // Retirer la réservation du planning du professionnel si c'est un cleaner
  if (booking.cleaner) {
    const cleaner = await Cleaner.findById(booking.cleaner);
    if (cleaner) {
      cleaner.activeBookings = cleaner.activeBookings.filter(
        bookingId => bookingId.toString() !== booking._id.toString()
      );
      
      // Retirer du planning quotidien
      cleaner.schedule.forEach(day => {
        day.bookings = day.bookings.filter(
          bookingId => bookingId.toString() !== booking._id.toString()
        );
      });
      
      // Nettoyer les jours sans réservations
      cleaner.schedule = cleaner.schedule.filter(day => day.bookings.length > 0);
      
      await cleaner.save();
    }
  }

  // Supprimer les factures associées
  await Invoice.deleteMany({ booking: booking._id });

  // Supprimer la réservation
  await booking.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Confirmer le paiement d'une réservation
 * @route   POST /api/bookings/:id/confirm-payment
 * @access  Private (Host only)
 */
exports.confirmPayment = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est l'hébergeur de cette réservation
  const host = await Host.findOne({ user: req.user.id });
  if (!host || host._id.toString() !== booking.host.toString()) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à confirmer cette réservation', 403));
  }

  // Vérifier que la réservation est en attente de paiement
  if (booking.status !== 'pending') {
    return next(new ErrorResponse('Cette réservation n\'est pas en attente de paiement', 400));
  }

  // Vérifier que l'ID de l'intention de paiement existe
  if (!booking.payment.stripePaymentId) {
    return next(new ErrorResponse('Aucune intention de paiement trouvée pour cette réservation', 400));
  }

  // Capturer le paiement
  const paymentResult = await capturePayment(booking.payment.stripePaymentId);

  if (!paymentResult.success) {
    return next(new ErrorResponse('Échec de la capture du paiement', 500));
  }

  // Mettre à jour la réservation
  booking.status = 'confirmed';
  booking.payment.isPaid = true;
  booking.payment.paidAt = Date.now();
  await booking.save();

  // Créer des factures
  const hostUser = await User.findById(req.user.id);
  const cleaner = await Cleaner.findById(booking.cleaner).populate('user');

  // Facture pour l'hébergeur
  await Invoice.create({
    type: 'host_invoice',
    booking: booking._id,
    issuedTo: {
      user: hostUser._id,
      name: `${hostUser.firstName} ${hostUser.lastName}`,
      address: hostUser.location ? {
        street: hostUser.location.address,
        city: hostUser.location.city,
        postalCode: hostUser.location.postalCode
      } : {},
      email: hostUser.email
    },
    issuedBy: {
      name: 'CleanConnect',
      address: {
        street: '123 Clean Street',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      },
      email: 'billing@cleanconnect.com',
      siret: '12345678901234',
      vatNumber: 'FR12345678901'
    },
    items: [
      {
        description: `Service de ménage - Réservation #${booking._id}`,
        quantity: 1,
        unitPrice: booking.payment.amount,
        totalPrice: booking.payment.amount
      }
    ],
    subtotal: booking.payment.amount,
    taxRate: 20,
    taxAmount: booking.payment.amount * 0.2,
    totalAmount: booking.payment.amount * 1.2,
    status: 'paid',
    paymentDetails: {
      method: 'card',
      transactionId: booking.payment.stripePaymentId,
      paidAt: booking.payment.paidAt
    },
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
  });

  // Facture pour le professionnel (sera mise à jour lors du paiement)
  await Invoice.create({
    type: 'cleaner_invoice',
    booking: booking._id,
    issuedTo: {
      user: cleaner.user._id,
      name: cleaner.businessDetails.companyName || `${cleaner.user.firstName} ${cleaner.user.lastName}`,
      address: cleaner.user.location ? {
        street: cleaner.user.location.address,
        city: cleaner.user.location.city,
        postalCode: cleaner.user.location.postalCode
      } : {},
      email: cleaner.user.email,
      siret: cleaner.businessDetails.siret
    },
    issuedBy: {
      name: 'CleanConnect',
      address: {
        street: '123 Clean Street',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      },
      email: 'billing@cleanconnect.com',
      siret: '12345678901234',
      vatNumber: 'FR12345678901'
    },
    items: [
      {
        description: `Commission sur réservation #${booking._id}`,
        quantity: 1,
        unitPrice: booking.payment.platformFee,
        totalPrice: booking.payment.platformFee
      }
    ],
    subtotal: booking.payment.platformFee,
    taxRate: 20,
    taxAmount: booking.payment.platformFee * 0.2,
    totalAmount: booking.payment.platformFee * 1.2,
    status: 'issued',
    paymentDetails: {
      method: 'platform_credit',
      paidAt: null
    },
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
  });

  // Envoyer des notifications aux deux parties
  await createBookingNotifications(booking, 'booking_confirmed');

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Signaler l'arrivée du professionnel sur le lieu de mission
 * @route   POST /api/bookings/:id/arrival
 * @access  Private (Cleaner only)
 */
exports.confirmArrival = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est le professionnel assigné à cette réservation
  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner || cleaner._id.toString() !== booking.cleaner.toString()) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à confirmer l\'arrivée pour cette réservation', 403));
  }

  // Vérifier que la réservation est bien confirmée
  if (booking.status !== 'confirmed') {
    return next(new ErrorResponse('Cette réservation n\'est pas dans un état permettant de confirmer l\'arrivée', 400));
  }

  // Mettre à jour la réservation
  booking.status = 'inProgress';
  booking.cleanerArrival = {
    hasArrived: true,
    arrivedAt: Date.now()
  };

  // Si des coordonnées géographiques sont fournies, les enregistrer
  if (req.body.coordinates) {
    booking.cleanerArrival.location = {
      type: 'Point',
      coordinates: req.body.coordinates
    };
  }

  await booking.save();

  // Envoyer une notification à l'hébergeur
  await createBookingNotifications(booking, 'cleaner_arrived');

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Mettre à jour le statut des tâches à accomplir
 * @route   PUT /api/bookings/:id/tasks
 * @access  Private (Cleaner only)
 */
exports.updateTasks = asyncHandler(async (req, res, next) => {
  const { tasks } = req.body;
  
  if (!tasks || !Array.isArray(tasks)) {
    return next(new ErrorResponse('Le format des tâches est invalide', 400));
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est le professionnel assigné à cette réservation
  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner || cleaner._id.toString() !== booking.cleaner.toString()) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à mettre à jour les tâches pour cette réservation', 403));
  }

  // Vérifier que la réservation est bien en cours
  if (booking.status !== 'inProgress') {
    return next(new ErrorResponse('Cette réservation n\'est pas en cours', 400));
  }

  // Mettre à jour chaque tâche
  tasks.forEach(task => {
    const taskIndex = booking.taskChecklist.findIndex(t => t._id.toString() === task.id);
    if (taskIndex !== -1) {
      booking.taskChecklist[taskIndex].isCompleted = task.isCompleted;
      if (task.isCompleted) {
        booking.taskChecklist[taskIndex].completedAt = Date.now();
      } else {
        booking.taskChecklist[taskIndex].completedAt = null;
      }
    }
  });

  // Vérifier si toutes les tâches sont terminées
  const allTasksCompleted = booking.taskChecklist.every(task => task.isCompleted);
  
  // Si toutes les tâches sont terminées, marquer la mission comme complétée
  if (allTasksCompleted) {
    booking.status = 'completed';
    booking.taskCompletionConfirmed = true;
    booking.taskCompletionConfirmedAt = Date.now();
    
    // Définir la fin de la période de réclamation (7 jours)
    booking.hostReviewPeriodEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Incrémenter le compteur de missions complétées du professionnel
    cleaner.completedJobs += 1;
    await cleaner.save();
    
    // Envoyer une notification à l'hébergeur
    await createBookingNotifications(booking, 'task_completed');
  }

  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Soumettre une réclamation sur une mission
 * @route   POST /api/bookings/:id/complaint
 * @access  Private (Host only)
 */
exports.submitComplaint = asyncHandler(async (req, res, next) => {
  const { description, evidencePhotos } = req.body;
  
  if (!description) {
    return next(new ErrorResponse('Une description de la réclamation est requise', 400));
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est l'hébergeur de cette réservation
  const host = await Host.findOne({ user: req.user.id });
  if (!host || host._id.toString() !== booking.host.toString()) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à soumettre une réclamation pour cette réservation', 403));
  }

  // Vérifier que la réservation est terminée
  if (booking.status !== 'completed') {
    return next(new ErrorResponse('Vous ne pouvez soumettre une réclamation que pour une mission terminée', 400));
  }

  // Vérifier que nous sommes dans la période de réclamation
  if (booking.hostReviewPeriodEndsAt && new Date(booking.hostReviewPeriodEndsAt) < new Date()) {
    return next(new ErrorResponse('La période de réclamation est terminée pour cette réservation', 400));
  }

  // Vérifier qu'aucune réclamation n'a déjà été soumise
  if (booking.complaint && booking.complaint.isSubmitted) {
    return next(new ErrorResponse('Une réclamation a déjà été soumise pour cette réservation', 400));
  }

  // Créer la réclamation
  booking.status = 'disputed';
  booking.complaint = {
    isSubmitted: true,
    submittedAt: Date.now(),
    description,
    evidencePhotos: evidencePhotos || [],
    resolution: 'pending'
  };

  await booking.save();

  // Notifier le professionnel
  const cleaner = await Cleaner.findById(booking.cleaner);
  const cleanerUser = await User.findById(cleaner.user);
  
  await createNotification({
    recipient: cleanerUser._id,
    type: 'complaint_submitted',
    title: 'Réclamation reçue',
    message: `Une réclamation a été soumise pour votre mission du ${new Date(booking.dateScheduled.date).toLocaleDateString()}`,
    relatedTo: {
      modelType: 'Booking',
      modelId: booking._id
    },
    actionRequired: true,
    actionType: 'respond'
  });

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Libérer le paiement au professionnel (après période de réclamation)
 * @route   POST /api/bookings/:id/release-payment
 * @access  Private (Admin only)
 */
exports.releasePayment = asyncHandler(async (req, res, next) => {
  // Cette route est réservée aux administrateurs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès non autorisé', 403));
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que la réservation est complétée et que la période de réclamation est terminée
  if (booking.status !== 'completed' || 
      (booking.hostReviewPeriodEndsAt && new Date(booking.hostReviewPeriodEndsAt) > new Date())) {
    return next(new ErrorResponse('Le paiement ne peut pas encore être libéré pour cette réservation', 400));
  }

  // Vérifier que le paiement n'a pas déjà été envoyé
  if (booking.payment.isPayoutSent) {
    return next(new ErrorResponse('Le paiement a déjà été libéré pour cette réservation', 400));
  }

  const cleaner = await Cleaner.findById(booking.cleaner);
  if (!cleaner.bankAccount || !cleaner.bankAccount.stripeAccountId) {
    return next(new ErrorResponse('Les informations bancaires du professionnel sont manquantes', 400));
  }

  // Transférer l'argent au professionnel
  const transferResult = await transferToCleanerAccount(booking, cleaner.bankAccount.stripeAccountId);

  if (!transferResult.success) {
    return next(new ErrorResponse('Échec du transfert vers le compte du professionnel', 500));
  }

  // Mettre à jour la réservation
  booking.payment.isPayoutSent = true;
  booking.payment.payoutSentAt = Date.now();
  booking.payment.stripeTransferId = transferResult.transferId;
  await booking.save();

  // Mettre à jour les gains du professionnel
  cleaner.earnings.total += booking.payment.cleanerPayout;
  cleaner.earnings.history.push({
    amount: booking.payment.cleanerPayout,
    date: Date.now(),
    booking: booking._id,
    status: 'paid'
  });
  await cleaner.save();

  // Mettre à jour le statut de la facture du professionnel
  await Invoice.findOneAndUpdate(
    { booking: booking._id, type: 'cleaner_invoice' },
    { 
      status: 'paid',
      'paymentDetails.paidAt': Date.now(),
      'paymentDetails.transactionId': transferResult.transferId
    }
  );

  // Envoyer une notification au professionnel
  const cleanerUser = await User.findById(cleaner.user);
  
  await createNotification({
    recipient: cleanerUser._id,
    type: 'payment_released',
    title: 'Paiement reçu',
    message: `Votre paiement de ${booking.payment.cleanerPayout}€ pour la mission du ${new Date(booking.dateScheduled.date).toLocaleDateString()} a été envoyé sur votre compte bancaire.`,
    relatedTo: {
      modelType: 'Booking',
      modelId: booking._id
    },
    actionRequired: false
  });

  res.status(200).json({
    success: true,
    data: {
      booking,
      transferResult
    }
  });
});

/**
 * @desc    Obtenir une réservation par ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
exports.getBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: 'listing',
      select: 'title accommodationType location area services equipment dateRequired'
    })
    .populate({
      path: 'host',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName phone email'
      }
    })
    .populate({
      path: 'cleaner',
      select: 'user workPreferences',
      populate: {
        path: 'user',
        select: 'firstName lastName phone email rating'
      }
    });

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est autorisé à voir cette réservation
  const isHost = req.user.role === 'host' && booking.host.user._id.toString() === req.user.id;
  const isCleaner = req.user.role === 'cleaner' && booking.cleaner.user._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isHost && !isCleaner && !isAdmin) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à voir cette réservation', 403));
  }

  // Si la réservation n'est pas encore confirmée, masquer certaines informations sensibles
  if (!booking.contactInfoShared && isCleaner) {
    booking.host.user.phone = null;
    booking.host.user.email = null;
    booking.listing.location.address = null;
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Obtenir toutes les réservations de l'utilisateur connecté
 * @route   GET /api/bookings
 * @access  Private
 */
exports.getBookings = asyncHandler(async (req, res, next) => {
  let query = {};

  // Filtrer par utilisateur connecté (host ou cleaner)
  if (req.user.role === 'host') {
    const host = await Host.findOne({ user: req.user.id });
    if (host) {
      query.host = host._id;
    }
  } else if (req.user.role === 'cleaner') {
    const cleaner = await Cleaner.findOne({ user: req.user.id });
    if (cleaner) {
      query.cleaner = cleaner._id;
    }
  } else if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès non autorisé', 403));
  }

  // Filtrer par statut si spécifié
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filtrer par date si spécifiée
  if (req.query.date) {
    const date = new Date(req.query.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    query['dateScheduled.date'] = {
      $gte: date,
      $lt: nextDay
    };
  }

  const bookings = await Booking.find(query)
    .populate({
      path: 'listing',
      select: 'title accommodationType location area'
    })
    .populate({
      path: 'host',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .populate({
      path: 'cleaner',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName rating'
      }
    })
    .sort({ 'dateScheduled.date': -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

/**
 * @desc    Partager les informations de contact avec le professionnel
 * @route   POST /api/bookings/:id/share-contact
 * @access  Private (Host only)
 */
exports.shareContactInfo = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est l'hébergeur de cette réservation
  const host = await Host.findOne({ user: req.user.id });
  if (!host || host._id.toString() !== booking.host.toString()) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à partager les informations de contact pour cette réservation', 403));
  }

  // Vérifier que la réservation est confirmée et le paiement effectué
  if (booking.status !== 'confirmed' && booking.status !== 'inProgress') {
    return next(new ErrorResponse('Les informations de contact ne peuvent être partagées que pour des réservations confirmées', 400));
  }

  // Vérifier que les informations n'ont pas déjà été partagées
  if (booking.contactInfoShared) {
    return next(new ErrorResponse('Les informations de contact ont déjà été partagées', 400));
  }

  // Partager les informations
  booking.contactInfoShared = true;
  await booking.save();

  // Envoyer une notification au professionnel
  await createBookingNotifications(booking, 'contact_info_shared');

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Annuler une réservation
 * @route   POST /api/bookings/:id/cancel
 * @access  Private
 */
exports.cancelBooking = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason) {
    return next(new ErrorResponse('Une raison d\'annulation est requise', 400));
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est autorisé à annuler cette réservation
  const isHost = req.user.role === 'host' && booking.host.toString() === (await Host.findOne({ user: req.user.id }))._id.toString();
  const isCleaner = req.user.role === 'cleaner' && booking.cleaner.toString() === (await Cleaner.findOne({ user: req.user.id }))._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isHost && !isCleaner && !isAdmin) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à annuler cette réservation', 403));
  }

  // Vérifier que la réservation peut être annulée (statut pending ou confirmed)
  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    return next(new ErrorResponse('Cette réservation ne peut plus être annulée', 400));
  }

  // Si la réservation est payée, créer un remboursement
  let refundResult = null;
  if (booking.payment.isPaid && booking.payment.stripePaymentId) {
    const { createRefund } = require('../services/payment');
    refundResult = await createRefund(booking.payment.stripePaymentId, null, 'requested_by_customer');
    
    if (!refundResult.success) {
      return next(new ErrorResponse('Échec du remboursement', 500));
    }
  }

  // Mettre à jour la réservation
  booking.status = 'cancelled';
  booking.cancellation = {
    cancelledBy: req.user.role,
    cancelledAt: Date.now(),
    reason
  };

  if (refundResult) {
    booking.payment.refundId = refundResult.refundId;
  }

  await booking.save();

  // Mettre à jour le statut de l'annonce si nécessaire
  const listing = await Listing.findById(booking.listing);
  if (listing && listing.status === 'booked') {
    listing.status = 'published';
    await listing.save();
  }

  // Retirer la réservation du planning du professionnel si c'est un cleaner
  if (booking.cleaner) {
    const cleaner = await Cleaner.findById(booking.cleaner);
    if (cleaner) {
      cleaner.activeBookings = cleaner.activeBookings.filter(
        bookingId => bookingId.toString() !== booking._id.toString()
      );
      
      // Retirer du planning quotidien
      cleaner.schedule.forEach(day => {
        day.bookings = day.bookings.filter(
          bookingId => bookingId.toString() !== booking._id.toString()
        );
      });
      
      // Nettoyer les jours sans réservations
      cleaner.schedule = cleaner.schedule.filter(day => day.bookings.length > 0);
      
      await cleaner.save();
    }
  }

  // Envoyer des notifications aux deux parties
  await createBookingNotifications(booking, 'booking_cancelled', {
    additionalMessage: `Raison: ${reason}`
  });

  res.status(200).json({
    success: true,
    data: {
      booking,
      refundResult
    }
  });
});

/**
 * @desc    Accepter une réservation par un cleaner
 * @route   PUT /api/bookings/:id/accept
 * @access  Private (Cleaner only)
 */
exports.acceptBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est le professionnel assigné à cette réservation
  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner || cleaner._id.toString() !== booking.cleaner.toString()) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à accepter cette réservation', 403));
  }

  // Vérifier que la réservation est bien en attente
  if (booking.status !== 'pending') {
    return next(new ErrorResponse('Cette réservation n\'est pas en attente d\'acceptation', 400));
  }

  // Mettre à jour le statut de la réservation
  booking.cleanerConfirmation = {
    isConfirmed: true,
    confirmedAt: Date.now()
  };

  await booking.save();

  // Envoyer une notification à l'hébergeur
  await createBookingNotifications(booking, 'booking_accepted_by_cleaner');

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Rejeter une réservation par un cleaner
 * @route   PUT /api/bookings/:id/reject
 * @access  Private (Cleaner only)
 */
exports.rejectBooking = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason) {
    return next(new ErrorResponse('Une raison de refus est requise', 400));
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est le professionnel assigné à cette réservation
  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner || cleaner._id.toString() !== booking.cleaner.toString()) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à rejeter cette réservation', 403));
  }

  // Vérifier que la réservation est bien en attente
  if (booking.status !== 'pending') {
    return next(new ErrorResponse('Cette réservation n\'est pas en attente d\'acceptation', 400));
  }

  // Mettre à jour le statut de la réservation
  booking.status = 'rejected';
  booking.cleanerConfirmation = {
    isConfirmed: false,
    rejectedAt: Date.now(),
    rejectionReason: reason
  };

  await booking.save();

  // Retirer la réservation du planning du professionnel
  cleaner.activeBookings = cleaner.activeBookings.filter(
    bookingId => bookingId.toString() !== booking._id.toString()
  );
  
  // Retirer du planning quotidien
  cleaner.schedule.forEach(day => {
    day.bookings = day.bookings.filter(
      bookingId => bookingId.toString() !== booking._id.toString()
    );
  });
  
  // Nettoyer les jours sans réservations
  cleaner.schedule = cleaner.schedule.filter(day => day.bookings.length > 0);
  
  await cleaner.save();

  // Mettre à jour le statut de l'annonce si nécessaire
  const listing = await Listing.findById(booking.listing);
  if (listing && listing.status === 'booked') {
    listing.status = 'published';
    await listing.save();
  }

  // Envoyer une notification à l'hébergeur
  await createBookingNotifications(booking, 'booking_rejected_by_cleaner', {
    additionalMessage: `Raison: ${reason}`
  });

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Obtenir les réservations en attente pour un cleaner
 * @route   GET /api/bookings/cleaner/pending
 * @access  Private (Cleaner only)
 */
exports.getPendingCleanerBookings = asyncHandler(async (req, res, next) => {
  // Vérifier que l'utilisateur est un cleaner
  if (req.user.role !== 'cleaner') {
    return next(new ErrorResponse('Accès non autorisé', 403));
  }

  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner) {
    return next(new ErrorResponse('Profil de professionnel non trouvé', 404));
  }

  const bookings = await Booking.find({
    cleaner: cleaner._id,
    status: 'pending',
    'cleanerConfirmation.isConfirmed': { $ne: true }
  })
    .populate({
      path: 'listing',
      select: 'title accommodationType location area services equipment dateRequired'
    })
    .populate({
      path: 'host',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName rating'
      }
    })
    .sort({ 'dateScheduled.date': 1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

/**
 * @desc    Marquer une réservation comme complétée
 * @route   PUT /api/bookings/:id/complete
 * @access  Private (Cleaner, Host, Admin)
 */
exports.completeBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que la réservation est bien en cours
  if (booking.status !== 'inProgress') {
    return next(new ErrorResponse('Cette réservation n\'est pas en cours', 400));
  }

  // Vérifier que l'utilisateur est autorisé à compléter cette réservation
  const isHost = req.user.role === 'host' && booking.host.toString() === (await Host.findOne({ user: req.user.id }))._id.toString();
  const isCleaner = req.user.role === 'cleaner' && booking.cleaner.toString() === (await Cleaner.findOne({ user: req.user.id }))._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isHost && !isCleaner && !isAdmin) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à compléter cette réservation', 403));
  }

  // Si c'est un cleaner qui complète, marquer toutes les tâches comme complétées
  if (isCleaner) {
    booking.taskChecklist.forEach(task => {
      task.isCompleted = true;
      task.completedAt = Date.now();
    });
  }

  // Mettre à jour le statut
  booking.status = 'completed';
  booking.taskCompletionConfirmed = true;
  booking.taskCompletionConfirmedAt = Date.now();
  booking.completedBy = req.user.role;
  
  // Définir la fin de la période de réclamation (7 jours)
  booking.hostReviewPeriodEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await booking.save();

  // Si c'est un cleaner qui complète, incrémenter son compteur de missions
  if (isCleaner) {
    const cleaner = await Cleaner.findById(booking.cleaner);
    cleaner.completedJobs += 1;
    await cleaner.save();
  }

  // Envoyer des notifications
  await createBookingNotifications(booking, 'booking_completed');

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * @desc    Noter une réservation
 * @route   POST /api/bookings/:id/rate
 * @access  Private
 */
exports.rateBooking = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return next(new ErrorResponse('Une note entre 1 et 5 est requise', 400));
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Réservation non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifier que la réservation est terminée
  if (booking.status !== 'completed') {
    return next(new ErrorResponse('Vous ne pouvez noter que des réservations terminées', 400));
  }

  // Déterminer qui note qui
  let isHost = false;
  let isCleaner = false;

  if (req.user.role === 'host') {
    const host = await Host.findOne({ user: req.user.id });
    isHost = host && host._id.toString() === booking.host.toString();
  } else if (req.user.role === 'cleaner') {
    const cleaner = await Cleaner.findOne({ user: req.user.id });
    isCleaner = cleaner && cleaner._id.toString() === booking.cleaner.toString();
  }

  if (!isHost && !isCleaner) {
    return next(new ErrorResponse('Vous n\'êtes pas autorisé à noter cette réservation', 403));
  }

  // Ajouter la note appropriée
  if (isHost) {
    // L'hébergeur note le professionnel
    if (booking.hostRating) {
      return next(new ErrorResponse('Vous avez déjà noté cette réservation', 400));
    }
    
    booking.hostRating = {
      rating,
      comment: comment || '',
      createdAt: Date.now()
    };

    // Mettre à jour la note moyenne du professionnel
    const cleaner = await Cleaner.findById(booking.cleaner);
    const user = await User.findById(cleaner.user);
    
    const ratings = await Booking.find({
      cleaner: cleaner._id,
      'hostRating.rating': { $exists: true }
    }).select('hostRating.rating');
    
    const totalRatings = ratings.length + 1; // +1 pour inclure la nouvelle note
    const ratingSum = ratings.reduce((sum, b) => sum + b.hostRating.rating, rating);
    const averageRating = ratingSum / totalRatings;
    
    user.rating = Number(averageRating.toFixed(1));
    await user.save();
    
    // Envoyer une notification au professionnel
    await createNotification({
      recipient: user._id,
      type: 'new_rating',
      title: 'Nouvelle note reçue',
      message: `Vous avez reçu une note de ${rating}/5 pour votre mission du ${new Date(booking.dateScheduled.date).toLocaleDateString()}`,
      relatedTo: {
        modelType: 'Booking',
        modelId: booking._id
      }
    });
    
  } else if (isCleaner) {
    // Le professionnel note l'hébergeur
    if (booking.cleanerRating) {
      return next(new ErrorResponse('Vous avez déjà noté cette réservation', 400));
    }
    
    booking.cleanerRating = {
      rating,
      comment: comment || '',
      createdAt: Date.now()
    };

    // Mettre à jour la note moyenne de l'hébergeur
    const host = await Host.findById(booking.host);
    const user = await User.findById(host.user);
    
    const ratings = await Booking.find({
      host: host._id,
      'cleanerRating.rating': { $exists: true }
    }).select('cleanerRating.rating');
    
    const totalRatings = ratings.length + 1; // +1 pour inclure la nouvelle note
    const ratingSum = ratings.reduce((sum, b) => sum + b.cleanerRating.rating, rating);
    const averageRating = ratingSum / totalRatings;
    
    user.rating = Number(averageRating.toFixed(1));
    await user.save();
    
    // Envoyer une notification à l'hébergeur
    await createNotification({
      recipient: user._id,
      type: 'new_rating',
      title: 'Nouvelle note reçue',
      message: `Vous avez reçu une note de ${rating}/5 pour votre réservation du ${new Date(booking.dateScheduled.date).toLocaleDateString()}`,
      relatedTo: {
        modelType: 'Booking',
        modelId: booking._id
      }
    });
  }

  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});