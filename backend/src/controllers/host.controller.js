const Host = require('../models/Host');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { validateSiret } = require('../services/siretVerification');
const { createOrGetCustomer } = require('../services/payment');

/**
 * @desc    Obtenir tous les hébergeurs
 * @route   GET /api/hosts
 * @access  Private/Admin
 */
exports.getHosts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Obtenir un hébergeur par ID
 * @route   GET /api/hosts/:id
 * @access  Private
 */
exports.getHost = asyncHandler(async (req, res, next) => {
  const host = await Host.findById(req.params.id).populate({
    path: 'user',
    select: 'firstName lastName email phone location rating'
  });

  if (!host) {
    return next(new ErrorResponse(`Hébergeur non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à voir cet hébergeur
  if (req.user && req.user.role !== 'admin' && host.user._id.toString() !== req.user.id) {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à accéder à ce profil d'hébergeur`, 403));
  }

  res.status(200).json({
    success: true,
    data: host
  });
});

/**
 * @desc    Créer un profil d'hébergeur pour un utilisateur existant
 * @route   POST /api/hosts
 * @access  Private
 */
exports.createHost = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est déjà un hébergeur
  const existingHost = await Host.findOne({ user: req.user.id });
  if (existingHost) {
    return next(new ErrorResponse(`L'utilisateur avec l'id ${req.user.id} est déjà un hébergeur`, 400));
  }

  // Ajouter l'ID de l'utilisateur au corps de la requête
  req.body.user = req.user.id;

  // Valider le SIRET si fourni
  if (req.body.businessDetails && req.body.businessDetails.siret) {
    const isValidSiret = await validateSiret(req.body.businessDetails.siret);
    if (!isValidSiret) {
      return next(new ErrorResponse('Numéro SIRET invalide', 400));
    }
  }

  // Créer le profil hébergeur
  const host = await Host.create(req.body);

  // Mettre à jour le rôle de l'utilisateur si nécessaire
  if (req.user.role !== 'host') {
    await User.findByIdAndUpdate(req.user.id, { role: 'host' });
  }

  res.status(201).json({
    success: true,
    data: host
  });
});

/**
 * @desc    Mettre à jour un profil hébergeur
 * @route   PUT /api/hosts/:id
 * @access  Private
 */
exports.updateHost = asyncHandler(async (req, res, next) => {
  let host = await Host.findById(req.params.id);

  if (!host) {
    return next(new ErrorResponse(`Hébergeur non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété
  if (host.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à mettre à jour ce profil d'hébergeur`, 403));
  }

  // Vérifier le SIRET si modifié
  if (req.body.businessDetails && req.body.businessDetails.siret && 
      (!host.businessDetails || host.businessDetails.siret !== req.body.businessDetails.siret)) {
    const isValidSiret = await validateSiret(req.body.businessDetails.siret);
    if (!isValidSiret) {
      return next(new ErrorResponse('Numéro SIRET invalide', 400));
    }
  }

  // Mettre à jour le profil
  host = await Host.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: host
  });
});

/**
 * @desc    Supprimer un profil hébergeur
 * @route   DELETE /api/hosts/:id
 * @access  Private
 */
exports.deleteHost = asyncHandler(async (req, res, next) => {
  const host = await Host.findById(req.params.id);

  if (!host) {
    return next(new ErrorResponse(`Hébergeur non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété
  if (host.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à supprimer ce profil d'hébergeur`, 403));
  }

  // Supprimer le profil
  await host.remove();

  // Potentiellement mettre à jour le rôle de l'utilisateur
  await User.findByIdAndUpdate(host.user, { role: 'user' });

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Obtenir les statistiques d'un hébergeur
 * @route   GET /api/hosts/:id/stats
 * @access  Private (Host, Admin)
 */
exports.getHostStats = asyncHandler(async (req, res, next) => {
  const host = await Host.findById(req.params.id);

  if (!host) {
    return next(new ErrorResponse(`Hébergeur non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier l'autorisation
  if (host.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à voir les statistiques de cet hébergeur`, 403));
  }

  // Compter les réservations terminées
  const completedBookings = await Booking.countDocuments({
    host: host._id,
    status: 'completed'
  });

  // Compter les réservations en cours
  const inProgressBookings = await Booking.countDocuments({
    host: host._id,
    status: 'inProgress'
  });

  // Compter les réservations à venir
  const upcomingBookingsCount = await Booking.countDocuments({
    host: host._id,
    status: 'confirmed'
  });

  // Récupérer les réservations à venir (objets complets)
  const upcomingBookings = await Booking.find({
    host: host._id,
    status: 'confirmed'
  })
  .populate({
    path: 'listing',
    select: 'title accommodationType location'
  })
  .populate({
    path: 'cleaner',
    select: 'name'
  })
  .sort({ scheduledFor: 1 })
  .limit(5);

  // Compter les annonces publiées
  const publishedListings = await Listing.countDocuments({
    host: host._id,
    status: 'published'
  });

  // Calculer le nombre de candidatures en attente sur toutes les annonces de l'hébergeur
  const pendingApplications = await Listing.aggregate([
    { $match: { host: host._id } },
    { $project: { 
        pendingApplicationsCount: { 
          $size: { 
            $filter: { 
              input: "$applications", 
              as: "application", 
              cond: { $eq: ["$$application.status", "pending"] } 
            } 
          } 
        } 
      }
    },
    { $group: { _id: null, total: { $sum: "$pendingApplicationsCount" } } }
  ]);
  
  const pendingApplicationsCount = pendingApplications.length > 0 ? pendingApplications[0].total : 0;

  // Compter le total des annonces
  const totalListings = await Listing.countDocuments({
    host: host._id
  });

  // Calculer le taux de satisfaction (ratio de bonnes notes)
  const allRatedBookings = await Booking.find({
    host: host._id,
    'cleanerRating.rating': { $exists: true }
  }).select('cleanerRating.rating');

  const totalRatings = allRatedBookings.length;
  const goodRatings = allRatedBookings.filter(booking => booking.cleanerRating.rating >= 4).length;
  const satisfactionRate = totalRatings > 0 ? (goodRatings / totalRatings) * 100 : 0;

  // Obtenir le montant total dépensé
  const totalSpent = await Booking.aggregate([
    { $match: { host: host._id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$payment.amount' } } }
  ]);

  // Obtenir le montant dépensé ce mois-ci
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlySpent = await Booking.aggregate([
    { 
      $match: { 
        host: host._id, 
        status: 'completed',
        completedAt: { $gte: firstDayOfMonth }
      } 
    },
    { $group: { _id: null, total: { $sum: '$payment.amount' } } }
  ]);

  const totalAmount = totalSpent.length > 0 ? totalSpent[0].total : 0;
  const monthlyAmount = monthlySpent.length > 0 ? monthlySpent[0].total : 0;

  // Statistiques générales
  const stats = {
    completedBookings,
    inProgressBookings,
    upcomingBookingsCount,
    upcomingBookings, // Ajout des objets de réservation
    totalBookings: completedBookings + inProgressBookings + upcomingBookingsCount,
    publishedListings,
    activeListings: publishedListings, // Alias pour la compatibilité frontend
    totalListings,
    pendingApplications: pendingApplicationsCount,
    totalSpent: totalAmount,
    monthlySpend: monthlyAmount,
    satisfactionRate: satisfactionRate.toFixed(2) + '%',
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Configurer ou mettre à jour les informations de paiement d'un hébergeur
 * @route   POST /api/hosts/:id/payment-methods
 * @access  Private
 */
exports.setupPaymentMethod = asyncHandler(async (req, res, next) => {
  const host = await Host.findById(req.params.id);

  if (!host) {
    return next(new ErrorResponse(`Hébergeur non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété
  if (host.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à modifier les informations de paiement de cet hébergeur`, 403));
  }

  // Récupérer l'utilisateur associé
  const user = await User.findById(host.user);

  // Créer ou récupérer un customer Stripe
  const customerId = await createOrGetCustomer(host, user);

  // Mettre à jour le profil avec le customer ID si nécessaire
  if (!host.stripeCustomerId || host.stripeCustomerId !== customerId) {
    host.stripeCustomerId = customerId;
    await host.save();
  }

  // Ajouter la méthode de paiement
  if (req.body.paymentMethod) {
    // Si la méthode est définie comme par défaut, marquer les autres comme non par défaut
    if (req.body.paymentMethod.isDefault) {
      host.paymentMethods.forEach(method => {
        method.isDefault = false;
      });
    }

    host.paymentMethods.push(req.body.paymentMethod);
    await host.save();
  }

  res.status(200).json({
    success: true,
    data: {
      customerId,
      paymentMethods: host.paymentMethods
    }
  });
});

/**
 * @desc    Obtenir les annonces d'un hébergeur
 * @route   GET /api/hosts/:id/listings
 * @access  Private
 */
exports.getHostListings = asyncHandler(async (req, res, next) => {
  const host = await Host.findById(req.params.id);

  if (!host) {
    return next(new ErrorResponse(`Hébergeur non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier l'autorisation si ce n'est pas l'hébergeur lui-même ou un admin
  if (host.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à voir les annonces de cet hébergeur`, 403));
  }

  const listings = await host.populate({
    path: 'properties',
    select: 'title accommodationType location dateRequired area price status'
  });

  res.status(200).json({
    success: true,
    count: listings.properties.length,
    data: listings.properties
  });
});

/**
 * @desc    Vérifier l'identité d'un hébergeur (processus administratif)
 * @route   PUT /api/hosts/:id/verify
 * @access  Private/Admin
 */
exports.verifyHost = asyncHandler(async (req, res, next) => {
  // Cette route est réservée aux administrateurs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur n'a pas les droits pour effectuer cette action`, 403));
  }

  const host = await Host.findById(req.params.id);

  if (!host) {
    return next(new ErrorResponse(`Hébergeur non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Mettre à jour le statut de vérification
  host.verificationStatus = req.body.status || 'verified';
  await host.save();

  // Si la vérification est approuvée, mettre à jour le statut de l'utilisateur également
  if (host.verificationStatus === 'verified') {
    await User.findByIdAndUpdate(host.user, { isVerified: true });
  } else if (host.verificationStatus === 'rejected') {
    await User.findByIdAndUpdate(host.user, { isVerified: false });
  }

  res.status(200).json({
    success: true,
    data: host
  });
});

/**
 * @desc    Obtenir les annonces actives d'un hébergeur (pour le tableau de bord)
 * @route   GET /api/hosts/me/active-listings
 * @access  Private (Host only)
 */
exports.getActiveListings = asyncHandler(async (req, res, next) => {
  console.log('🔍 Host getActiveListings called, user:', req.user?.id);
  
  if (req.user.role !== 'host') {
    return next(new ErrorResponse(`L'utilisateur n'est pas un hébergeur`, 403));
  }

  // Trouver le profil d'hébergeur de l'utilisateur
  const host = await Host.findOne({ user: req.user.id });
  if (!host) {
    return next(new ErrorResponse(`Aucun profil d'hébergeur trouvé pour cet utilisateur`, 404));
  }

  console.log(`📋 Recherche des annonces actives pour le host: ${host._id}`);

  // Récupérer les annonces actives (publiées) avec une limite de 5
  let limit = parseInt(req.query.limit) || 5; // Limite par défaut: 5
  
  const activeListings = await Listing.find({ 
    host: host._id, 
    status: 'published' 
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('title accommodationType location dateRequired area price status createdAt');

  console.log(`✅ Annonces actives trouvées: ${activeListings.length}`);

  res.status(200).json({
    success: true,
    count: activeListings.length,
    data: activeListings
  });
});

/**
 * @desc    Obtenir toutes les candidatures pour les annonces d'un hébergeur
 * @route   GET /api/hosts/me/applications
 * @access  Private (Host only)
 */
exports.getHostApplications = asyncHandler(async (req, res, next) => {
  console.log('🔍 getHostApplications called, user:', req.user?.id);
  
  if (req.user.role !== 'host') {
    return next(new ErrorResponse(`L'utilisateur n'est pas un hébergeur`, 403));
  }

  // Trouver le profil d'hébergeur de l'utilisateur
  const host = await Host.findOne({ user: req.user.id });
  if (!host) {
    return next(new ErrorResponse(`Aucun profil d'hébergeur trouvé pour cet utilisateur`, 404));
  }

  console.log(`📋 Recherche des candidatures pour le host: ${host._id}`);

  // Trouver toutes les annonces de cet hébergeur
  const listings = await Listing.find({ host: host._id })
    .populate({
      path: 'applications.cleaner',
      select: 'firstName lastName profileImage rating completedBookings createdAt location'
    });

  // Format the applications as a flattened array with listing information
  const applications = [];
  
  listings.forEach(listing => {
    if (listing.applications && listing.applications.length > 0) {
      listing.applications.forEach(app => {
        // Create properly formatted application object
        applications.push({
          _id: app._id || `${listing._id}-${app.cleaner._id}-${Date.now()}`,
          status: app.status,
          message: app.message || "",
          appliedAt: app.appliedAt,
          createdAt: app.appliedAt, // For compatibility
          listing: {
            _id: listing._id,
            title: listing.title,
            price: listing.price,
            location: listing.location
          },
          cleaner: app.cleaner
        });
      });
    }
  });

  console.log(`✅ Candidatures trouvées: ${applications.length}`);

  // Sort by most recent applications first
  applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
});