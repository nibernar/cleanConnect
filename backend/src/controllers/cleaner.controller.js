const Cleaner = require('../models/Cleaner');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { validateSiret } = require('../services/siretVerification');
const { createOrGetConnectedAccount, createAccountLink } = require('../services/payment');

/**
 * @desc    Obtenir tous les professionnels de ménage
 * @route   GET /api/cleaners
 * @access  Private/Admin
 */
exports.getCleaners = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Obtenir un professionnel de ménage par ID
 * @route   GET /api/cleaners/:id
 * @access  Private
 */
exports.getCleaner = asyncHandler(async (req, res, next) => {
  const cleaner = await Cleaner.findById(req.params.id).populate({
    path: 'user',
    select: 'firstName lastName email phone location rating'
  });

  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel de ménage non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier l'autorisation (admin, le professionnel lui-même, ou un hébergeur qui a une réservation avec lui)
  const isOwner = req.user && req.user.id === cleaner.user._id.toString();
  const isAdmin = req.user && req.user.role === 'admin';
  
  // Pour un accès limité, on pourrait vérifier si l'hébergeur a une réservation avec ce professionnel
  // Cela nécessiterait une requête supplémentaire à la base de données

  if (!isOwner && !isAdmin) {
    // Renvoyer une version limitée des informations pour les autres utilisateurs
    const limitedCleaner = {
      _id: cleaner._id,
      user: {
        firstName: cleaner.user.firstName,
        lastName: cleaner.user.lastName,
        rating: cleaner.user.rating
      },
      workPreferences: cleaner.workPreferences,
      completedJobs: cleaner.completedJobs,
      verificationStatus: cleaner.verificationStatus
    };

    return res.status(200).json({
      success: true,
      data: limitedCleaner
    });
  }

  res.status(200).json({
    success: true,
    data: cleaner
  });
});

/**
 * @desc    Créer un profil professionnel de ménage pour un utilisateur existant
 * @route   POST /api/cleaners
 * @access  Private
 */
exports.createCleaner = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est déjà un professionnel de ménage
  const existingCleaner = await Cleaner.findOne({ user: req.user.id });
  if (existingCleaner) {
    return next(new ErrorResponse(`L'utilisateur avec l'id ${req.user.id} est déjà un professionnel de ménage`, 400));
  }

  // Ajouter l'ID de l'utilisateur au corps de la requête
  req.body.user = req.user.id;

  // Valider le SIRET si fourni
  if (req.body.businessDetails && req.body.businessDetails.siret) {
    const isValidSiret = await validateSiret(req.body.businessDetails.siret);
    if (!isValidSiret) {
      return next(new ErrorResponse('Numéro SIRET invalide', 400));
    }
  } else {
    return next(new ErrorResponse('Un numéro SIRET est requis pour les professionnels de ménage', 400));
  }

  // Créer le profil professionnel
  const cleaner = await Cleaner.create(req.body);

  // Mettre à jour le rôle de l'utilisateur si nécessaire
  if (req.user.role !== 'cleaner') {
    await User.findByIdAndUpdate(req.user.id, { role: 'cleaner' });
  }

  res.status(201).json({
    success: true,
    data: cleaner
  });
});

/**
 * @desc    Mettre à jour un profil professionnel de ménage
 * @route   PUT /api/cleaners/:id
 * @access  Private
 */
exports.updateCleaner = asyncHandler(async (req, res, next) => {
  let cleaner = await Cleaner.findById(req.params.id);

  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel de ménage non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété
  if (cleaner.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à mettre à jour ce profil de professionnel`, 403));
  }

  // Vérifier le SIRET si modifié
  if (req.body.businessDetails && req.body.businessDetails.siret && 
      (!cleaner.businessDetails || cleaner.businessDetails.siret !== req.body.businessDetails.siret)) {
    const isValidSiret = await validateSiret(req.body.businessDetails.siret);
    if (!isValidSiret) {
      return next(new ErrorResponse('Numéro SIRET invalide', 400));
    }
  }

  // Mettre à jour le profil
  cleaner = await Cleaner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: cleaner
  });
});

/**
 * @desc    Supprimer un profil professionnel de ménage
 * @route   DELETE /api/cleaners/:id
 * @access  Private
 */
exports.deleteCleaner = asyncHandler(async (req, res, next) => {
  const cleaner = await Cleaner.findById(req.params.id);

  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel de ménage non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété
  if (cleaner.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à supprimer ce profil de professionnel`, 403));
  }

  // Supprimer le profil
  await cleaner.remove();

  // Potentiellement mettre à jour le rôle de l'utilisateur
  await User.findByIdAndUpdate(cleaner.user, { role: 'user' });

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Configurer les informations bancaires d'un professionnel
 * @route   POST /api/cleaners/:id/bank-account
 * @access  Private
 */
exports.setupBankAccount = asyncHandler(async (req, res, next) => {
  const cleaner = await Cleaner.findById(req.params.id);

  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel de ménage non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété
  if (cleaner.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à modifier les informations bancaires de ce professionnel`, 403));
  }

  // Récupérer l'utilisateur associé
  const user = await User.findById(cleaner.user);

  // Créer ou récupérer un compte connecté Stripe
  const accountId = await createOrGetConnectedAccount(cleaner, user);

  // Mettre à jour les informations bancaires
  cleaner.bankAccount = {
    ...req.body,
    stripeAccountId: accountId
  };

  await cleaner.save();

  // Créer un lien d'onboarding si nécessaire
  let onboardingUrl = null;
  if (req.body.setupStripeAccount) {
    const refreshUrl = `${req.protocol}://${req.get('host')}/api/cleaners/${cleaner._id}/stripe-refresh`;
    const returnUrl = `${req.protocol}://${req.get('host')}/api/cleaners/${cleaner._id}/stripe-return`;
    
    onboardingUrl = await createAccountLink(accountId, refreshUrl, returnUrl);
  }

  res.status(200).json({
    success: true,
    data: {
      bankAccount: cleaner.bankAccount,
      onboardingUrl
    }
  });
});

/**
 * @desc    Obtenir mes statistiques (route spéciale pour le cleaner authentifié)
 * @route   GET /api/cleaners/me/stats
 * @access  Private (Cleaner only)
 */
exports.getMyStats = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'cleaner') {
    return next(new ErrorResponse(`L'utilisateur n'est pas un professionnel de ménage`, 403));
  }

  // Trouver le profil du professionnel pour l'utilisateur connecté
  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner) {
    return next(new ErrorResponse(`Aucun profil de professionnel trouvé pour cet utilisateur`, 404));
  }

  // Compter les réservations terminées
  const completedBookings = await Booking.countDocuments({
    cleaner: cleaner._id,
    status: 'completed'
  });

  // Compter les réservations en cours
  const inProgressBookings = await Booking.countDocuments({
    cleaner: cleaner._id,
    status: 'inProgress'
  });

  // Compter les réservations à venir
  const upcomingBookings = await Booking.countDocuments({
    cleaner: cleaner._id,
    status: 'confirmed'
  });

  // Calculer le taux de satisfaction (ratio de bonnes notes)
  const allRatedBookings = await Booking.find({
    cleaner: cleaner._id,
    'hostRating.rating': { $exists: true }
  }).select('hostRating.rating');

  const totalRatings = allRatedBookings.length;
  const goodRatings = allRatedBookings.filter(booking => booking.hostRating.rating >= 4).length;
  const satisfactionRate = totalRatings > 0 ? (goodRatings / totalRatings) * 100 : 0;

  // Obtenir le montant total des revenus
  const totalEarnings = cleaner.earnings ? cleaner.earnings.total : 0;

  // Statistiques générales
  const stats = {
    completedBookings,
    inProgressBookings,
    upcomingBookings,
    totalBookings: completedBookings + inProgressBookings + upcomingBookings,
    totalEarnings,
    satisfactionRate: satisfactionRate.toFixed(2) + '%',
    averageRating: cleaner.user ? (await User.findById(cleaner.user)).rating : 0
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Obtenir les statistiques d'un professionnel de ménage
 * @route   GET /api/cleaners/:id/stats
 * @access  Private
 */
exports.getCleanerStats = asyncHandler(async (req, res, next) => {
  const cleaner = await Cleaner.findById(req.params.id);

  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel de ménage non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier l'autorisation
  if (cleaner.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à voir les statistiques de ce professionnel`, 403));
  }

  // Compter les réservations terminées
  const completedBookings = await Booking.countDocuments({
    cleaner: cleaner._id,
    status: 'completed'
  });

  // Compter les réservations en cours
  const inProgressBookings = await Booking.countDocuments({
    cleaner: cleaner._id,
    status: 'inProgress'
  });

  // Compter les réservations à venir
  const upcomingBookings = await Booking.countDocuments({
    cleaner: cleaner._id,
    status: 'confirmed'
  });

  // Calculer le taux de satisfaction (ratio de bonnes notes)
  const allRatedBookings = await Booking.find({
    cleaner: cleaner._id,
    'hostRating.rating': { $exists: true }
  }).select('hostRating.rating');

  const totalRatings = allRatedBookings.length;
  const goodRatings = allRatedBookings.filter(booking => booking.hostRating.rating >= 4).length;
  const satisfactionRate = totalRatings > 0 ? (goodRatings / totalRatings) * 100 : 0;

  // Obtenir le montant total des revenus
  const totalEarnings = cleaner.earnings ? cleaner.earnings.total : 0;

  // Statistiques générales
  const stats = {
    completedBookings,
    inProgressBookings,
    upcomingBookings,
    totalBookings: completedBookings + inProgressBookings + upcomingBookings,
    totalEarnings,
    satisfactionRate: satisfactionRate.toFixed(2) + '%',
    averageRating: cleaner.user ? (await User.findById(cleaner.user)).rating : 0
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Mettre à jour les disponibilités d'un professionnel
 * @route   PUT /api/cleaners/:id/availability
 * @access  Private
 */
exports.updateAvailability = asyncHandler(async (req, res, next) => {
  const cleaner = await Cleaner.findById(req.params.id);

  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel de ménage non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété
  if (cleaner.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à modifier les disponibilités de ce professionnel`, 403));
  }

  // Valider le format du calendrier de disponibilités
  if (!req.body.availability || !Array.isArray(req.body.availability)) {
    return next(new ErrorResponse('Le format des disponibilités est invalide', 400));
  }

  // Mettre à jour les disponibilités
  cleaner.availability = req.body.availability;
  await cleaner.save();

  res.status(200).json({
    success: true,
    data: cleaner.availability
  });
});

/**
 * @desc    Mettre à jour les préférences de travail d'un professionnel
 * @route   PUT /api/cleaners/:id/preferences
 * @access  Private
 */
exports.updatePreferences = asyncHandler(async (req, res, next) => {
  const cleaner = await Cleaner.findById(req.params.id);

  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel de ménage non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété
  if (cleaner.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à modifier les préférences de ce professionnel`, 403));
  }

  // Mettre à jour les préférences de travail
  cleaner.workPreferences = {
    ...cleaner.workPreferences,
    ...req.body
  };

  await cleaner.save();

  res.status(200).json({
    success: true,
    data: cleaner.workPreferences
  });
});

/**
 * @desc    Obtenir les réservations actives d'un professionnel
 * @route   GET /api/cleaners/:id/bookings
 * @access  Private
 */
exports.getCleanerBookings = asyncHandler(async (req, res, next) => {
  const cleaner = await Cleaner.findById(req.params.id);

  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel de ménage non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier l'autorisation
  if (cleaner.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à voir les réservations de ce professionnel`, 403));
  }

  const bookings = await cleaner.populate({
    path: 'activeBookings',
    select: 'listing host status dateScheduled payment taskChecklist',
    populate: {
      path: 'listing',
      select: 'title accommodationType location area'
    }
  });

  res.status(200).json({
    success: true,
    count: bookings.activeBookings.length,
    data: bookings.activeBookings
  });
});

/**
 * @desc    Vérifier l'identité d'un professionnel (processus administratif)
 * @route   PUT /api/cleaners/:id/verify
 * @access  Private/Admin
 */
exports.verifyCleaner = asyncHandler(async (req, res, next) => {
  // Cette route est réservée aux administrateurs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur n'a pas les droits pour effectuer cette action`, 403));
  }

  const cleaner = await Cleaner.findById(req.params.id);

  if (!cleaner) {
    return next(new ErrorResponse(`Professionnel de ménage non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Mettre à jour le statut de vérification
  cleaner.verificationStatus = req.body.status || 'verified';
  await cleaner.save();

  // Si la vérification est approuvée, mettre à jour le statut de l'utilisateur également
  if (cleaner.verificationStatus === 'verified') {
    await User.findByIdAndUpdate(cleaner.user, { isVerified: true });
  } else if (cleaner.verificationStatus === 'rejected') {
    await User.findByIdAndUpdate(cleaner.user, { isVerified: false });
  }

  res.status(200).json({
    success: true,
    data: cleaner
  });
});

/**
 * @desc    Obtenir les annonces disponibles pour un professionnel (pour le tableau de bord)
 * @route   GET /api/cleaners/me/available-listings
 * @access  Private (Cleaner only)
 */
exports.getAvailableListings = asyncHandler(async (req, res, next) => {
  console.log('🔍 Cleaner getAvailableListings called, user:', req.user?.id);
  
  if (req.user.role !== 'cleaner') {
    return next(new ErrorResponse(`L'utilisateur n'est pas un professionnel de ménage`, 403));
  }

  // Trouver le profil du professionnel pour l'utilisateur connecté
  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner) {
    return next(new ErrorResponse(`Aucun profil de professionnel trouvé pour cet utilisateur`, 404));
  }

  console.log(`👤 Cleaner trouvé: ${cleaner._id}`);

  // Récupérer les préférences de travail du professionnel
  const { workPreferences } = cleaner;

  // Construire la requête en fonction des préférences
  let query = {
    status: 'published',
    // Ne pas afficher les annonces auxquelles le professionnel a déjà postulé
    'applications.cleaner': { $ne: cleaner._id }
  };

  // Filtrer par type d'hébergement si spécifié dans les préférences
  if (workPreferences && workPreferences.preferredAccommodationTypes && workPreferences.preferredAccommodationTypes.length > 0) {
    query.accommodationType = { $in: workPreferences.preferredAccommodationTypes };
  }

  console.log(`🔍 Recherche des annonces disponibles avec les critères:`, JSON.stringify(query));

  // Limite du nombre d'annonces à renvoyer pour le tableau de bord
  let limit = parseInt(req.query.limit) || 5; // Limite par défaut: 5

  // Récupérer les annonces disponibles en fonction de la requête
  const availableListings = await Listing.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'host',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName rating'
      }
    })
    .select('title accommodationType location dateRequired area price status createdAt');

  console.log(`✅ Annonces disponibles trouvées: ${availableListings.length}`);

  res.status(200).json({
    success: true,
    count: availableListings.length,
    data: availableListings
  });
});