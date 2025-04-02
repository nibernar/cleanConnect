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
const { createBookingNotifications, createNotification } = require('../services/notifications'); // Ajout de createNotification si utilisé ailleurs

// @desc    Get all bookings (Admin or filtered)
// @route   GET /api/v1/bookings
// @access  Private (Admin or based on query)
exports.getBookings = asyncHandler(async (req, res, next) => {
  if (res.advancedResults) {
      return res.status(200).json(res.advancedResults);
  } else {
      console.warn('getBookings controller called without res.advancedResults');
      // Fallback simple si nécessaire
      let query = {};
      if (req.user.role !== 'admin') {
          if (req.user.role === 'host') {
            const host = await Host.findOne({ user: req.user.id });
            if (host) query.host = host._id;
            else return res.status(200).json({ success: true, count: 0, data: [] });
          } else if (req.user.role === 'cleaner') {
            const cleaner = await Cleaner.findOne({ user: req.user.id });
            if (cleaner) query.cleaner = cleaner._id;
            else return res.status(200).json({ success: true, count: 0, data: [] });
          } else {
              return next(new ErrorResponse('Accès non autorisé', 403));
          }
      }
      const bookings = await Booking.find(query);
      return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  }
});

// @desc    Get bookings for the logged-in user
// @route   GET /api/v1/bookings/mine
// @access  Private
exports.getMyBookings = asyncHandler(async (req, res, next) => {
  let query = {};
  if (req.user.role === 'host') {
    const host = await Host.findOne({ user: req.user.id });
    if (!host) return res.status(200).json({ success: true, count: 0, data: [] });
    query.host = host._id;
  } else if (req.user.role === 'cleaner') {
    const cleaner = await Cleaner.findOne({ user: req.user.id });
    if (!cleaner) return res.status(200).json({ success: true, count: 0, data: [] });
    query.cleaner = cleaner._id;
  } else {
    return next(new ErrorResponse('Route non applicable pour ce rôle utilisateur', 403));
  }

  const bookings = await Booking.find(query)
    .populate({ path: 'listing', select: 'title accommodationType location area' })
    .populate({ path: 'host', select: 'user', populate: { path: 'user', select: 'firstName lastName' } })
    .populate({ path: 'cleaner', select: 'user', populate: { path: 'user', select: 'firstName lastName rating' } })
    .sort({ 'dateScheduled.date': -1, 'dateScheduled.startTime': -1 });

  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

// @desc    Get single booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id)
      .populate('listing') // Populate complet par défaut
      .populate({ path: 'host', select: 'user stripeCustomerId', populate: { path: 'user', select: 'firstName lastName phone email' } })
      .populate({ path: 'cleaner', select: 'user workPreferences bankAccount', populate: { path: 'user', select: 'firstName lastName phone email rating' } });
  
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée avec l\'ID ${req.params.id}`, 404));
  
    let isHost = false, isCleaner = false;
    if(req.user.role === 'host') {
        const hostProfile = await Host.findOne({ user: req.user.id });
        isHost = hostProfile && booking.host._id.equals(hostProfile._id);
    } else if (req.user.role === 'cleaner') {
        const cleanerProfile = await Cleaner.findOne({ user: req.user.id });
        isCleaner = cleanerProfile && booking.cleaner._id.equals(cleanerProfile._id);
    }
    const isAdmin = req.user.role === 'admin';
  
    if (!isHost && !isCleaner && !isAdmin) return next(new ErrorResponse('Vous n\'êtes pas autorisé à voir cette réservation', 403));
  
    let bookingData = booking.toObject();
    if (!bookingData.contactInfoShared && isCleaner) {
      if(bookingData.host?.user) { bookingData.host.user.phone = undefined; bookingData.host.user.email = undefined; }
      if(bookingData.listing?.location) { bookingData.listing.location.address = undefined; }
    }
  
    res.status(200).json({ success: true, data: bookingData });
  });

// @desc    Create a booking
// @route   POST /api/v1/bookings
// @access  Private (Host only)
exports.createBooking = asyncHandler(async (req, res, next) => {
    const { listingId, cleanerId } = req.body;
    if (req.user.role !== 'host') return next(new ErrorResponse('Seuls les hébergeurs peuvent créer des réservations', 403));
    const host = await Host.findOne({ user: req.user.id });
    if (!host) return next(new ErrorResponse('Profil d\'hébergeur non trouvé', 404));
    const listing = await Listing.findById(listingId);
    if (!listing) return next(new ErrorResponse(`Annonce non trouvée avec l\'ID ${listingId}`, 404));
    if (!listing.host.equals(host._id)) return next(new ErrorResponse('Vous n\'êtes pas autorisé à réserver cette annonce', 403));
    if (listing.status !== 'published') return next(new ErrorResponse('Cette annonce n\'est pas disponible pour une nouvelle réservation', 400));
    const application = listing.applications.find(app => app.cleaner.equals(cleanerId) && app.status === 'accepted');
    if (!application) return next(new ErrorResponse('Ce professionnel n\'a pas été accepté pour cette annonce', 400));
    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) return next(new ErrorResponse(`Profil Professionnel non trouvé avec l\'ID ${cleanerId}`, 404));

    const taskChecklist = listing.services.map(service => ({ taskName: service, isCompleted: false }));
    const { commission: platformFee, baseAmount: cleanerPayout, totalAmount } = listing.price || {};
    if (typeof totalAmount !== 'number' || typeof platformFee !== 'number' || typeof cleanerPayout !== 'number') {
        console.error('Pricing error on listing:', listingId, listing.price);
        return next(new ErrorResponse("Erreur de calcul du prix sur l'annonce.", 500)); 
    }

    const booking = await Booking.create({
      listing: listing._id, host: host._id, cleaner: cleaner._id, status: 'pending',
      dateScheduled: { date: listing.dateRequired?.startDate, startTime: listing.dateRequired?.startTime, endTime: listing.dateRequired?.endTime },
      taskChecklist, payment: { amount: totalAmount, platformFee, cleanerPayout, currency: 'EUR', isPaid: false }
    });
    
    let paymentIntentResult = {};
    if (host.stripeCustomerId) {
        try {
            paymentIntentResult = await createPaymentIntent(booking, host.stripeCustomerId);
            booking.payment.stripePaymentId = paymentIntentResult.paymentIntentId;
            await booking.save();
        } catch (paymentError) {
            console.error('Stripe PaymentIntent creation failed:', paymentError);
             return next(new ErrorResponse('Erreur lors de la création de l\'intention de paiement', 500));
        }
    } else {
        console.warn(`Host ${host._id} does not have a stripeCustomerId. Cannot create PaymentIntent.`);
    }
    
    listing.status = 'booked'; await listing.save();
    cleaner.activeBookings.push(booking._id);
    if (booking.dateScheduled?.date) {
        const bookingDateStr = new Date(booking.dateScheduled.date).toISOString().split('T')[0];
        const scheduleIndex = cleaner.schedule.findIndex(s => s.date && new Date(s.date).toISOString().split('T')[0] === bookingDateStr);
        if (scheduleIndex >= 0) { cleaner.schedule[scheduleIndex].bookings.push(booking._id); }
        else { cleaner.schedule.push({ date: booking.dateScheduled.date, bookings: [booking._id] }); }
    }
    await cleaner.save();
  
    res.status(201).json({ success: true, data: { booking, clientSecret: paymentIntentResult.clientSecret } });
  });

// @desc    Update booking (e.g., notes)
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = asyncHandler(async (req, res, next) => {
    let booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée avec l\'ID ${req.params.id}`, 404));
    
    let hostProfile, cleanerProfile, isHost = false, isCleaner = false;
    if(req.user.role === 'host') { hostProfile = await Host.findOne({ user: req.user.id }); isHost = hostProfile && booking.host.equals(hostProfile._id); }
    else if (req.user.role === 'cleaner') { cleanerProfile = await Cleaner.findOne({ user: req.user.id }); isCleaner = cleanerProfile && booking.cleaner.equals(cleanerProfile._id); }
    const isAdmin = req.user.role === 'admin';
  
    if (!isHost && !isCleaner && !isAdmin) return next(new ErrorResponse('Vous n\'êtes pas autorisé à mettre à jour cette réservation', 403));
  
    const allowedUpdates = {};
    if (req.body.note !== undefined) allowedUpdates.note = req.body.note;
    if (req.body.cleanerNote !== undefined) allowedUpdates.cleanerNote = req.body.cleanerNote;
    
    if (Object.keys(allowedUpdates).length === 0) return next(new ErrorResponse('Aucun champ valide à mettre à jour fourni', 400));
  
    booking = await Booking.findByIdAndUpdate(req.params.id, allowedUpdates, { new: true, runValidators: true }).populate('listing host cleaner');
    res.status(200).json({ success: true, data: booking });
  });

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private (Admin only)
exports.deleteBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée avec l\'ID ${req.params.id}`, 404));
    if (req.user.role !== 'admin') return next(new ErrorResponse('Vous n\'êtes pas autorisé à supprimer cette réservation', 403));
    if (booking.payment?.isPaid) { /* return next(new ErrorResponse('La réservation est payée...', 400)); */ }
    if (booking.cleaner) { await Cleaner.findByIdAndUpdate(booking.cleaner, { $pull: { activeBookings: booking._id } }); /* Gérer schedule... */ }
    if (booking.listing) { await Listing.findByIdAndUpdate(booking.listing, { status: 'published' }); }
    await Invoice.deleteMany({ booking: booking._id });
    await booking.deleteOne();
    res.status(200).json({ success: true, data: {} });
  });

// @desc    Confirm payment capture
// @route   POST /api/v1/bookings/:id/confirm-payment
// @access  Private (Host/Admin)
exports.confirmPayment = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée`, 404));
    if (booking.status === 'confirmed' && booking.payment.isPaid) return res.status(200).json({ success: true, message: 'Paiement déjà confirmé', data: booking });
    if (booking.status !== 'pending') return next(new ErrorResponse("La réservation n'est pas en attente de paiement.", 400));
    const host = await Host.findOne({ user: req.user.id });
    if (req.user.role !== 'admin' && (!host || !host._id.equals(booking.host))) return next(new ErrorResponse('Non autorisé à confirmer ce paiement', 403));
    
    // Assume payment intent was successful, update status
    booking.status = 'confirmed';
    booking.payment.isPaid = true;
    booking.payment.paidAt = Date.now();
    await booking.save();
  
    try { /* Create Invoices */ } catch (invoiceError) { console.error("Invoice creation error: ", invoiceError); }
    await createBookingNotifications(booking, 'booking_confirmed');
    res.status(200).json({ success: true, data: booking });
  });

// @desc    Confirm cleaner arrival
// @route   POST /api/v1/bookings/:id/arrival
// @access  Private (Cleaner only)
exports.confirmArrival = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée`, 404));
    const cleaner = await Cleaner.findOne({ user: req.user.id });
    if (!cleaner || !cleaner._id.equals(booking.cleaner)) return next(new ErrorResponse('Non autorisé', 403));
    if (booking.status !== 'confirmed') return next(new ErrorResponse("La réservation n'est pas confirmée", 400));

    booking.status = 'inProgress';
    booking.cleanerArrival = { hasArrived: true, arrivedAt: Date.now(), ...(req.body.coordinates && { location: { type: 'Point', coordinates: req.body.coordinates }}) };
    await booking.save();
    await createBookingNotifications(booking, 'cleaner_arrived');
    res.status(200).json({ success: true, data: booking });
});

// @desc    Update booking tasks status
// @route   PUT /api/v1/bookings/:id/tasks
// @access  Private (Cleaner only)
exports.updateTasks = asyncHandler(async (req, res, next) => {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) return next(new ErrorResponse('Format des tâches invalide', 400));
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée`, 404));
    const cleaner = await Cleaner.findOne({ user: req.user.id });
    if (!cleaner || !cleaner._id.equals(booking.cleaner)) return next(new ErrorResponse('Non autorisé', 403));
    // Correction de la syntaxe
    if (booking.status !== 'inProgress') return next(new ErrorResponse("La réservation n'est pas en cours", 400));
    
    let allTasksNowCompleted = true;
    booking.taskChecklist.forEach(taskItem => {
      const updatedTask = tasks.find(t => t.id === taskItem._id.toString());
      if (updatedTask !== undefined) { taskItem.isCompleted = updatedTask.isCompleted; taskItem.completedAt = updatedTask.isCompleted ? Date.now() : null; }
      if (!taskItem.isCompleted) { allTasksNowCompleted = false; }
    });
    
    if (allTasksNowCompleted && booking.status !== 'completed') {
        booking.status = 'completed';
        booking.taskCompletionConfirmed = true;
        booking.taskCompletionConfirmedAt = Date.now();
        booking.hostReviewPeriodEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await Cleaner.findByIdAndUpdate(cleaner._id, { $inc: { completedJobs: 1 } });
        await createBookingNotifications(booking, 'task_completed');
    }
    await booking.save();
    res.status(200).json({ success: true, data: booking });
  });

// @desc    Mark a booking as completed (Can be triggered by Host/Cleaner/Admin after tasks are done or time passed)
// @route   PUT /api/v1/bookings/:id/complete
// @access  Private (Cleaner, Host, Admin)
exports.completeBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée avec l\'ID ${req.params.id}`, 404));
    
    // Peut être complété si en cours OU si les tâches sont finies mais statut pas encore màj
    if (booking.status !== 'inProgress' && !booking.taskChecklist.every(t => t.isCompleted)) {
        return next(new ErrorResponse("La réservation n'est pas prête à être marquée comme complétée", 400));
    }

    // Vérification autorisation
    let hostProfile, cleanerProfile, isHost = false, isCleaner = false;
    if(req.user.role === 'host') { hostProfile = await Host.findOne({ user: req.user.id }); isHost = hostProfile && booking.host.equals(hostProfile._id); }
    else if (req.user.role === 'cleaner') { cleanerProfile = await Cleaner.findOne({ user: req.user.id }); isCleaner = cleanerProfile && booking.cleaner.equals(cleanerProfile._id); }
    const isAdmin = req.user.role === 'admin';
    if (!isHost && !isCleaner && !isAdmin) return next(new ErrorResponse('Vous n\'êtes pas autorisé', 403));

    // Si ce n'est pas déjà fait (par updateTasks)
    if (booking.status !== 'completed') {
        // Marquer toutes les tâches comme complétées si c'est un cleaner qui appelle
        if (isCleaner) {
            booking.taskChecklist.forEach(task => { task.isCompleted = true; task.completedAt = task.completedAt || Date.now(); });
        }
        
        booking.status = 'completed';
        booking.taskCompletionConfirmed = true;
        booking.taskCompletionConfirmedAt = Date.now();
        booking.completedBy = req.user.role;
        booking.hostReviewPeriodEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await booking.save();
        
        // Incrémenter compteur cleaner SEULEMENT si c'est lui qui complète et que ce n'était pas déjà fait
        if (isCleaner && !booking.taskChecklist.every(t => t.completedAt)) { // Heuristique pour savoir si updateTasks l'a déjà fait
             await Cleaner.findByIdAndUpdate(cleanerProfile._id, { $inc: { completedJobs: 1 } });
        }
        
        await createBookingNotifications(booking, 'booking_completed');
    }

    res.status(200).json({ success: true, data: booking });
});

// @desc    Submit a complaint about a booking
// @route   POST /api/v1/bookings/:id/complaint
// @access  Private (Host only)
exports.submitComplaint = asyncHandler(async (req, res, next) => {
    const { description, evidencePhotos } = req.body;
    if (!description) return next(new ErrorResponse('Description requise', 400));
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée`, 404));
    const host = await Host.findOne({ user: req.user.id });
    if (!host || !host._id.equals(booking.host)) return next(new ErrorResponse('Non autorisé', 403));
    if (booking.status !== 'completed') return next(new ErrorResponse('Réclamation possible seulement sur mission terminée', 400));
    if (booking.hostReviewPeriodEndsAt && new Date(booking.hostReviewPeriodEndsAt) < new Date()) return next(new ErrorResponse('Période de réclamation terminée', 400));
    if (booking.complaint?.isSubmitted) return next(new ErrorResponse('Réclamation déjà soumise', 400));
  
    booking.status = 'disputed';
    booking.complaint = { isSubmitted: true, submittedAt: Date.now(), description, evidencePhotos: evidencePhotos || [], resolution: 'pending' };
    await booking.save();
    
    const cleaner = await Cleaner.findById(booking.cleaner).populate('user');
    if(cleaner?.user) { await createNotification({ recipient: cleaner.user._id, type: 'complaint_submitted', title: 'Réclamation reçue', message: `Réclamation reçue pour mission du ${new Date(booking.dateScheduled.date).toLocaleDateString()}.`, relatedTo: { modelType: 'Booking', modelId: booking._id } }); }
  
    res.status(200).json({ success: true, data: booking });
  });

// @desc    Release payment to cleaner
// @route   POST /api/v1/bookings/:id/release-payment
// @access  Private (Admin only)
exports.releasePayment = asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'admin') return next(new ErrorResponse('Accès non autorisé', 403));
    const booking = await Booking.findById(req.params.id).populate('cleaner');
    if (!booking || !booking.cleaner) return next(new ErrorResponse(`Réservation/Cleaner non trouvé`, 404));

    const isCompleted = booking.status === 'completed';
    const reviewPeriodEnded = booking.hostReviewPeriodEndsAt && new Date(booking.hostReviewPeriodEndsAt) <= new Date();
    const isPaidByHost = booking.payment?.isPaid;
    const isNotDisputed = booking.status !== 'disputed';
    const payoutNotSent = !booking.payment?.isPayoutSent;

    if (!isCompleted || !reviewPeriodEnded || !isPaidByHost || !isNotDisputed || !payoutNotSent) {
        console.log({isCompleted, reviewPeriodEnded, isPaidByHost, isNotDisputed, payoutNotSent});
        return next(new ErrorResponse('Conditions non remplies pour libérer le paiement', 400));
    }
    
    const cleaner = await Cleaner.findById(booking.cleaner._id);
    if (!cleaner?.bankAccount?.stripeAccountId) return next(new ErrorResponse('Compte Stripe du cleaner non configuré', 400));
    
    try {
        const transferResult = await transferToCleanerAccount(booking, cleaner.bankAccount.stripeAccountId);
        booking.payment.isPayoutSent = true; booking.payment.payoutSentAt = Date.now(); booking.payment.stripeTransferId = transferResult.transferId;
        await booking.save();
        await Cleaner.findByIdAndUpdate(cleaner._id, { $inc: { 'earnings.total': booking.payment.cleanerPayout }, $push: { 'earnings.history': { amount: booking.payment.cleanerPayout, date: Date.now(), booking: booking._id, status: 'paid' } } });
        await Invoice.findOneAndUpdate({ booking: booking._id, type: 'cleaner_invoice' }, { status: 'paid', 'paymentDetails.paidAt': Date.now(), 'paymentDetails.transactionId': transferResult.transferId });
        await createNotification({ recipient: cleaner.user, type: 'payment_released', title: 'Paiement reçu', message: `Paiement de ${booking.payment.cleanerPayout}€ envoyé.`, relatedTo: { modelType: 'Booking', modelId: booking._id } });
        res.status(200).json({ success: true, data: { booking, transferResult } });
    } catch (transferError) {
        console.error("Stripe transfer error: ", transferError);
        return next(new ErrorResponse('Échec du transfert vers le compte du professionnel', 500));
    }
});

// @desc    Share contact info with cleaner
// @route   POST /api/v1/bookings/:id/share-contact
// @access  Private (Host only)
exports.shareContactInfo = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée`, 404));
    const host = await Host.findOne({ user: req.user.id });
    if (!host || !host._id.equals(booking.host)) return next(new ErrorResponse('Non autorisé', 403));
    if (!['confirmed', 'inProgress'].includes(booking.status)) return next(new ErrorResponse('Partage possible seulement si réservation confirmée/en cours', 400));
    if (booking.contactInfoShared) return res.status(200).json({ success: true, message: 'Contact déjà partagé', data: booking });

    booking.contactInfoShared = true;
    await booking.save();
    await createBookingNotifications(booking, 'contact_info_shared');
    res.status(200).json({ success: true, data: booking });
});

// @desc    Cancel a booking
// @route   POST /api/v1/bookings/:id/cancel
// @access  Private (Host or Cleaner)
exports.cancelBooking = asyncHandler(async (req, res, next) => {
    const { reason } = req.body;
    if (!reason) return next(new ErrorResponse("Raison d'annulation requise", 400));
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse("Réservation non trouvée", 404));

    let isHost = false, isCleaner = false, hostProfile, cleanerProfile;
    if (req.user.role === 'host') { hostProfile = await Host.findOne({ user: req.user.id }); isHost = hostProfile && hostProfile._id.equals(booking.host); }
    else if (req.user.role === 'cleaner') { cleanerProfile = await Cleaner.findOne({ user: req.user.id }); isCleaner = cleanerProfile && cleanerProfile._id.equals(booking.cleaner); }
    const isAdmin = req.user.role === 'admin';
    if (!isHost && !isCleaner && !isAdmin) return next(new ErrorResponse('Non autorisé à annuler', 403));
    if (!['pending', 'confirmed'].includes(booking.status)) return next(new ErrorResponse('Annulation impossible pour ce statut', 400));
    
    let refundResult = null;
    if (booking.payment?.isPaid && booking.payment.stripePaymentId) {
        try {
            const { createRefund } = require('../services/payment');
            refundResult = await createRefund(booking.payment.stripePaymentId, null, 'requested_by_customer');
            booking.payment.refundId = refundResult.refundId;
        } catch (refundError) {
            console.error("Stripe refund failed: ", refundError);
            return next(new ErrorResponse('Échec du remboursement', 500));
        }
    }
    
    booking.status = 'cancelled';
    booking.cancellation = { cancelledBy: req.user.role, cancelledAt: Date.now(), reason };
    await booking.save();
    await Listing.findByIdAndUpdate(booking.listing, { status: 'published' });
    if (booking.cleaner) { await Cleaner.findByIdAndUpdate(booking.cleaner, { $pull: { activeBookings: booking._id } }); /* Gérer schedule... */ }
    await createBookingNotifications(booking, 'booking_cancelled', { additionalMessage: `Raison: ${reason}` });
    res.status(200).json({ success: true, data: { booking, refundResult } });
});

// @desc    Accept booking proposal (by cleaner)
// @route   PUT /api/v1/bookings/:id/accept
// @access  Private (Cleaner only)
exports.acceptBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée`, 404));
    const cleaner = await Cleaner.findOne({ user: req.user.id });
    if (!cleaner || !cleaner._id.equals(booking.cleaner)) return next(new ErrorResponse('Non autorisé', 403));
    if (booking.status !== 'pending') return next(new ErrorResponse('Réservation non en attente', 400));
    
    booking.cleanerConfirmation = { isConfirmed: true, confirmedAt: Date.now() };
    await booking.save();
    await createBookingNotifications(booking, 'booking_accepted_by_cleaner');
    res.status(200).json({ success: true, data: booking });
});

// @desc    Reject booking proposal (by cleaner)
// @route   PUT /api/v1/bookings/:id/reject
// @access  Private (Cleaner only)
exports.rejectBooking = asyncHandler(async (req, res, next) => {
    const { reason } = req.body;
    if (!reason) return next(new ErrorResponse('Raison requise', 400));
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée`, 404));
    const cleaner = await Cleaner.findOne({ user: req.user.id });
    if (!cleaner || !cleaner._id.equals(booking.cleaner)) return next(new ErrorResponse('Non autorisé', 403));
    if (booking.status !== 'pending') return next(new ErrorResponse('Réservation non en attente', 400));
    
    booking.status = 'rejected';
    booking.cleanerConfirmation = { isConfirmed: false, rejectedAt: Date.now(), rejectionReason: reason };
    await booking.save();
    await Cleaner.findByIdAndUpdate(cleaner._id, { $pull: { activeBookings: booking._id } }); /* Gérer schedule... */
    await Listing.findByIdAndUpdate(booking.listing, { status: 'published' });
    await createBookingNotifications(booking, 'booking_rejected_by_cleaner', { additionalMessage: `Raison: ${reason}` });
    res.status(200).json({ success: true, data: booking });
});

// @desc    Get pending bookings for a cleaner
// @route   GET /api/v1/bookings/cleaner/pending
// @access  Private (Cleaner only)
exports.getPendingCleanerBookings = asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'cleaner') return next(new ErrorResponse('Accès non autorisé', 403));
    const cleaner = await Cleaner.findOne({ user: req.user.id });
    if (!cleaner) return next(new ErrorResponse('Profil Cleaner non trouvé', 404));
  
    const query = { cleaner: cleaner._id, status: 'pending', 'cleanerConfirmation.isConfirmed': { $ne: true }, 'cleanerConfirmation.rejectedAt': { $exists: false } };
    const bookings = await Booking.find(query)
      .populate({ path: 'listing', select: 'title location dateRequired price' })
      .populate({ path: 'host', select: 'user', populate: { path: 'user', select: 'firstName lastName rating' } })
      .sort({ 'dateScheduled.date': 1 });
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  });

// @desc    Rate a completed booking
// @route   POST /api/v1/bookings/:id/rate
// @access  Private (Host or Cleaner)
exports.rateBooking = asyncHandler(async (req, res, next) => {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return next(new ErrorResponse('Note entre 1 et 5 requise', 400));
    const booking = await Booking.findById(req.params.id).populate('host').populate('cleaner');
    if (!booking) return next(new ErrorResponse(`Réservation non trouvée`, 404));
    if (booking.status !== 'completed') return next(new ErrorResponse('Notation possible seulement si mission terminée', 400));
    
    let isHost = false, isCleaner = false, hostProfile, cleanerProfile, userToRateId, userToRateRole;
    if (req.user.role === 'host') { hostProfile = await Host.findOne({ user: req.user.id }); isHost = hostProfile && booking.host._id.equals(hostProfile._id); if(isHost) userToRateId = booking.cleaner.user; userToRateRole = 'cleaner'; }
    else if (req.user.role === 'cleaner') { cleanerProfile = await Cleaner.findOne({ user: req.user.id }); isCleaner = cleanerProfile && booking.cleaner._id.equals(cleanerProfile._id); if(isCleaner) userToRateId = booking.host.user; userToRateRole = 'host'; }
    if (!isHost && !isCleaner) return next(new ErrorResponse('Non autorisé à noter', 403));
    
    if (isHost) { if (booking.hostRating?.rating) return next(new ErrorResponse('Déjà noté', 400)); booking.hostRating = { rating, comment: comment || '', createdAt: Date.now() }; }
    else { if (booking.cleanerRating?.rating) return next(new ErrorResponse('Déjà noté', 400)); booking.cleanerRating = { rating, comment: comment || '', createdAt: Date.now() }; }
    
    if(userToRateId) {
        const matchQuery = {}; matchQuery[userToRateRole === 'cleaner' ? 'cleaner' : 'host'] = booking[userToRateRole]._id;
        const ratingField = userToRateRole === 'cleaner' ? 'hostRating.rating' : 'cleanerRating.rating'; matchQuery[ratingField] = { $exists: true };
        const ratings = await Booking.find(matchQuery).select(ratingField);
        const currentRatingSum = ratings.reduce((sum, b) => { const r = userToRateRole === 'cleaner' ? b.hostRating?.rating : b.cleanerRating?.rating; return sum + (r || 0); }, 0);
        const newAverage = (currentRatingSum + rating) / (ratings.length + 1);
        await User.findByIdAndUpdate(userToRateId, { rating: Number(newAverage.toFixed(1)) });
    }
    
    await booking.save();
    if(userToRateId) { await createNotification({ recipient: userToRateId, type: 'new_rating', title: 'Nouvelle note reçue', message: `Note de ${rating}/5 reçue`, relatedTo: { modelType: 'Booking', modelId: booking._id } }); }

    res.status(200).json({ success: true, data: booking });
});

// Assurez-vous que toutes les fonctions exportées sont bien utilisées dans les routes.