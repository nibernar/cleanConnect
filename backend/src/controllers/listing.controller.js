const path = require('path');
const Listing = require('../models/Listing');
const Host = require('../models/Host');
const Cleaner = require('../models/Cleaner');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { createNotification } = require('../services/notifications');
const geocoder = require('../utils/geocoder');

/**
 * @desc    Obtenir toutes les annonces
 * @route   GET /api/listings
 * @access  Private
 */
exports.getListings = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Obtenir toutes les annonces d'un hébergeur (moi)
 * @route   GET /api/listings/me
 * @access  Private (Host only)
 */
exports.getMyListings = asyncHandler(async (req, res, next) => {
  // Vérifier que l'utilisateur est un hébergeur
  if (req.user.role !== 'host') {
    return next(new ErrorResponse(`L'utilisateur n'est pas un hébergeur`, 403));
  }

  // Trouver le profil d'hébergeur de l'utilisateur
  const host = await Host.findOne({ user: req.user.id });
  if (!host) {
    return next(new ErrorResponse(`Aucun profil d'hébergeur trouvé pour cet utilisateur`, 404));
  }

  const listings = await Listing.find({ host: host._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'host',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName rating'
      }
    });

  res.status(200).json({
    success: true,
    count: listings.length,
    data: listings
  });
});

/**
 * @desc    Obtenir une annonce par ID
 * @route   GET /api/listings/:id
 * @access  Private
 */
exports.getListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id)
    .populate({
      path: 'host',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName rating'
      }
    })
    .populate({
      path: 'applications.cleaner',
      select: 'user workPreferences completedJobs verificationStatus',
      populate: {
        path: 'user',
        select: 'firstName lastName rating'
      }
    });

  if (!listing) {
    return next(new ErrorResponse(`Annonce non trouvée avec l'id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: listing
  });
});

/**
 * @desc    Créer une nouvelle annonce
 * @route   POST /api/listings
 * @access  Private (Host only)
 */
exports.createListing = asyncHandler(async (req, res, next) => {
  // Vérifier que l'utilisateur est un hébergeur
  if (req.user.role !== 'host') {
    return next(new ErrorResponse(`L'utilisateur n'est pas un hébergeur`, 403));
  }

  // Trouver le profil d'hébergeur de l'utilisateur
  const host = await Host.findOne({ user: req.user.id });
  if (!host) {
    return next(new ErrorResponse(`Aucun profil d'hébergeur trouvé pour cet utilisateur`, 404));
  }

  // Transformer les données du frontend au format backend
  const listingData = {
    host: host._id,
    title: req.body.title,
    accommodationType: req.body.accommodationType,
    location: {
      address: req.body.address,
      city: req.body.city || 'Non spécifiée', // On gère le cas où la ville n'est pas fournie
      postalCode: req.body.postalCode || '00000', // On gère le cas où le code postal n'est pas fourni
      coordinates: {
        type: 'Point',
        coordinates: req.body.coordinates || [0, 0] // Par défaut si non fourni
      }
    },
    dateRequired: {
      startDate: req.body.date || new Date(),
      endDate: req.body.endDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime
    },
    numberOfCleaners: req.body.personCount || 1,
    area: parseFloat(req.body.squareMeters) || 0,
    services: req.body.services || [],
    equipment: {
      vacuumCleaner: req.body.equipment?.includes('vacuum') || false,
      mop: req.body.equipment?.includes('mop') || false,
      cleaningProducts: req.body.equipment?.includes('products') || false,
      other: req.body.equipment?.filter(item => !['vacuum', 'mop', 'products'].includes(item)) || []
    },
    additionalNotes: req.body.notes,
    status: 'published' // Par défaut on publie directement
  };

  // CORRECTION: Utiliser le prix fourni par le frontend si disponible, sinon le calculer
  if (req.body.basePrice && req.body.totalPrice) {
    // Utiliser les prix fournis par le frontend
    listingData.price = {
      baseAmount: parseFloat(req.body.basePrice),
      commission: parseFloat(req.body.commission || (req.body.totalPrice - req.body.basePrice)),
      totalAmount: parseFloat(req.body.totalPrice),
      currency: 'EUR'
    };
    
    console.log('Utilisation du prix fourni par le frontend:', listingData.price);
  } else {
    // Fallback: calculer le prix côté backend
    const price = Listing.calculatePrice(listingData.area, listingData.services);
    listingData.price = price;
    console.log('Prix calculé côté backend (fallback):', price);
  }

  // Créer l'annonce
  const listing = await Listing.create(listingData);

  // Ajouter l'annonce à la liste des propriétés de l'hébergeur
  host.properties = host.properties || [];
  host.properties.push(listing._id);
  await host.save();

  res.status(201).json({
    success: true,
    data: listing
  });
});

/**
 * @desc    Mettre à jour une annonce
 * @route   PUT /api/listings/:id
 * @access  Private (Host only)
 */
exports.updateListing = asyncHandler(async (req, res, next) => {
  let listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(new ErrorResponse(`Annonce non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété (via le host)
  const host = await Host.findOne({ user: req.user.id });
  
  if (!host || listing.host.toString() !== host._id.toString()) {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à mettre à jour cette annonce`, 403));
  }

  // Transformation des données si nécessaire
  const listingData = { ...req.body };
  
  // Si on met à jour l'adresse ou les coordonnées
  if (req.body.address || req.body.city || req.body.postalCode || req.body.coordinates) {
    listingData.location = {
      ...(listing.location || {}),
      ...(req.body.address && { address: req.body.address }),
      ...(req.body.city && { city: req.body.city }),
      ...(req.body.postalCode && { postalCode: req.body.postalCode }),
      ...(req.body.coordinates && { 
        coordinates: {
          type: 'Point',
          coordinates: req.body.coordinates
        }
      })
    };
  }

  // Si on met à jour la date ou l'heure
  if (req.body.date || req.body.endDate || req.body.startTime || req.body.endTime) {
    listingData.dateRequired = {
      ...(listing.dateRequired || {}),
      ...(req.body.date && { startDate: req.body.date }),
      ...(req.body.endDate && { endDate: req.body.endDate }),
      ...(req.body.startTime && { startTime: req.body.startTime }),
      ...(req.body.endTime && { endTime: req.body.endTime })
    };
  }

  // Si on met à jour l'équipement
  if (req.body.equipment) {
    listingData.equipment = {
      vacuumCleaner: req.body.equipment.includes('vacuum'),
      mop: req.body.equipment.includes('mop'),
      cleaningProducts: req.body.equipment.includes('products'),
      other: req.body.equipment.filter(item => !['vacuum', 'mop', 'products'].includes(item))
    };
  }

  // CORRECTION: Utiliser le prix fourni par le frontend si disponible, sinon recalculer
  if (req.body.basePrice && req.body.totalPrice) {
    // Utiliser les prix fournis par le frontend
    listingData.price = {
      baseAmount: parseFloat(req.body.basePrice),
      commission: parseFloat(req.body.commission || (req.body.totalPrice - req.body.basePrice)),
      totalAmount: parseFloat(req.body.totalPrice),
      currency: 'EUR'
    };
    
    console.log('Mise à jour: utilisation du prix fourni par le frontend:', listingData.price);
  } else if (req.body.squareMeters || req.body.services) {
    // Fallback: recalculer le prix si des paramètres pertinents ont changé
    const area = req.body.squareMeters ? parseFloat(req.body.squareMeters) : listing.area;
    const services = req.body.services || listing.services;
    
    const price = Listing.calculatePrice(area, services);
    listingData.price = price;
    console.log('Mise à jour: prix recalculé côté backend (fallback):', price);
  }

  // Mettre à jour l'annonce
  listing = await Listing.findByIdAndUpdate(req.params.id, listingData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: listing
  });
});

/**
 * @desc    Supprimer une annonce
 * @route   DELETE /api/listings/:id
 * @access  Private (Host only)
 */
exports.deleteListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(new ErrorResponse(`Annonce non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété (via le host)
  const host = await Host.findOne({ user: req.user.id });
  
  if (!host || listing.host.toString() !== host._id.toString()) {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à supprimer cette annonce`, 403));
  }

  // Vérifier si l'annonce peut être supprimée (pas déjà réservée)
  if (listing.status === 'booked' || listing.status === 'completed') {
    return next(new ErrorResponse(`Impossible de supprimer une annonce déjà réservée ou complétée`, 400));
  }

  // CORRECTION: Utiliser findByIdAndDelete au lieu de listing.remove()
  // await listing.remove(); // Cette ligne provoque l'erreur
  await Listing.findByIdAndDelete(req.params.id);

  // Retirer l'annonce de la liste des propriétés de l'hébergeur
  host.properties = host.properties.filter(
    (prop) => prop.toString() !== req.params.id
  );
  await host.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Télécharger une photo pour une annonce
 * @route   PUT /api/listings/:id/photo
 * @access  Private (Host only)
 */
exports.uploadListingPhoto = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(new ErrorResponse(`Annonce non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété (via le host)
  const host = await Host.findOne({ user: req.user.id });
  
  if (!host || listing.host.toString() !== host._id.toString()) {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à modifier cette annonce`, 403));
  }

  // Vérifier si un fichier a été uploadé
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorResponse(`Veuillez télécharger un fichier`, 400));
  }

  const file = req.files.file;

  // Vérifier que le fichier est une image
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Veuillez télécharger une image`, 400));
  }

  // Vérifier la taille du fichier
  if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 10000000) { // Default to 10MB if not set
    return next(new ErrorResponse(`Veuillez télécharger une image de moins de ${process.env.MAX_FILE_UPLOAD || 10} Mo`, 400));
  }

  // Créer un nom de fichier personnalisé
  file.name = `photo_listing_${listing._id}${path.parse(file.name).ext}`;

  // Déplacer le fichier
  file.mv(`${process.env.FILE_UPLOAD_PATH}/listings/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problème lors du téléchargement du fichier`, 500));
    }

    // Mettre à jour la photo de l'annonce
    await Listing.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

/**
 * @desc    Obtenir les annonces dans un certain rayon depuis un code postal
 * @route   GET /api/listings/radius/:zipcode/:distance
 * @access  Public
 */
exports.getListingsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Obtenir les coordonnées lat/lng à partir du code postal
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calculer le rayon en utilisant la distance en km divisée par le rayon de la Terre
  // La Terre a un rayon de 6378 km
  const radius = distance / 6378;

  // Rechercher les annonces dans le rayon spécifié
  const listings = await Listing.find({
    location: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    },
    status: 'published'
  })
  .populate({
    path: 'host',
    select: 'user',
    populate: {
      path: 'user',
      select: 'firstName lastName rating'
    }
  });

  res.status(200).json({
    success: true,
    count: listings.length,
    data: listings
  });
});

/**
 * @desc    Postuler à une annonce (pour les professionnels de ménage)
 * @route   POST /api/listings/:id/apply
 * @access  Private (Cleaner only)
 */
exports.applyToListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(new ErrorResponse(`Annonce non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier que l'utilisateur est un professionnel de ménage
  if (req.user.role !== 'cleaner') {
    return next(new ErrorResponse(`Seuls les professionnels de ménage peuvent postuler à une annonce`, 403));
  }

  // Trouver le profil de professionnel de l'utilisateur
  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner) {
    return next(new ErrorResponse(`Aucun profil de professionnel trouvé pour cet utilisateur`, 404));
  }

  // Vérifier que l'annonce est disponible
  if (listing.status !== 'published') {
    return next(new ErrorResponse(`Cette annonce n'est plus disponible`, 400));
  }

  // Vérifier que le professionnel n'a pas déjà postulé
  const alreadyApplied = listing.applications.some(
    (app) => app.cleaner.toString() === cleaner._id.toString()
  );

  if (alreadyApplied) {
    return next(new ErrorResponse(`Vous avez déjà postulé à cette annonce`, 400));
  }

  // Ajouter la candidature
  listing.applications.push({
    cleaner: cleaner._id,
    status: 'pending',
    appliedAt: Date.now()
  });

  await listing.save();

  // Envoyer une notification à l'hébergeur
  const host = await Host.findById(listing.host).populate('user');
  
  if (host && host.user) {
    const hostUser = await User.findById(host.user);
    const cleanerUser = await User.findById(cleaner.user);
    
    await createNotification({
      recipient: hostUser._id,
      type: 'new_application',
      title: 'Nouvelle candidature pour votre annonce',
      message: `${cleanerUser.firstName} ${cleanerUser.lastName} a postulé pour votre annonce de ménage`,
      relatedTo: {
        modelType: 'Listing',
        modelId: listing._id
      },
      actionRequired: true,
      actionType: 'approve'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      message: 'Candidature envoyée avec succès',
      listing: {
        _id: listing._id,
        title: listing.title,
        status: listing.status
      }
    }
  });
});

/**
 * @desc    Obtenir les candidatures pour une annonce
 * @route   GET /api/listings/:id/applications
 * @access  Private (Host only)
 */
exports.getApplications = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(new ErrorResponse(`Annonce non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété (via le host)
  const host = await Host.findOne({ user: req.user.id });
  
  if (!host || listing.host.toString() !== host._id.toString()) {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à consulter les candidatures de cette annonce`, 403));
  }

  // Récupérer les candidatures avec plus de détails
  const listingWithApplications = await Listing.findById(req.params.id)
    .populate({
      path: 'applications.cleaner',
      select: 'user workPreferences completedJobs verificationStatus',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber rating profileImage'
      }
    });

  res.status(200).json({
    success: true,
    count: listingWithApplications.applications.length,
    data: listingWithApplications.applications
  });
});

/**
 * @desc    Accepter une candidature
 * @route   PUT /api/listings/:id/applications/:cleanerId/accept
 * @access  Private (Host only)
 */
exports.acceptApplication = asyncHandler(async (req, res, next) => {
  req.body.status = 'accepted';
  manageApplication(req, res, next);
});

/**
 * @desc    Rejeter une candidature
 * @route   PUT /api/listings/:id/applications/:cleanerId/reject
 * @access  Private (Host only)
 */
exports.rejectApplication = asyncHandler(async (req, res, next) => {
  req.body.status = 'rejected';
  manageApplication(req, res, next);
});

/**
 * @desc    Gérer les candidatures (accepter/refuser)
 * @route   None (Utilisé par acceptApplication et rejectApplication)
 * @access  Private (Host only)
 */
exports.manageApplication = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['accepted', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Statut de candidature invalide', 400));
  }

  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(new ErrorResponse(`Annonce non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier la propriété
  const host = await Host.findOne({ user: req.user.id });
  
  if (!host || listing.host.toString() !== host._id.toString()) {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à gérer les candidatures de cette annonce`, 403));
  }

  // Trouver la candidature
  const applicationIndex = listing.applications.findIndex(
    (app) => app.cleaner.toString() === req.params.cleanerId
  );

  if (applicationIndex === -1) {
    return next(new ErrorResponse(`Candidature non trouvée`, 404));
  }

  // Mettre à jour le statut de la candidature
  listing.applications[applicationIndex].status = status;

  // Si la candidature est acceptée, ajouter le professionnel à la liste
  if (status === 'accepted') {
    listing.bookedCleaners.push(req.params.cleanerId);
    
    // Si toutes les places sont prises, mettre l'annonce en statut booked
    if (listing.bookedCleaners.length >= listing.numberOfCleaners) {
      listing.status = 'booked';
    }
  }

  await listing.save();

  // Envoyer une notification au professionnel
  const cleaner = await Cleaner.findById(req.params.cleanerId).populate('user');
  
  if (cleaner && cleaner.user) {
    const notificationType = status === 'accepted' ? 'application_accepted' : 'application_rejected';
    const notificationTitle = status === 'accepted' ? 'Candidature acceptée' : 'Candidature refusée';
    const notificationMessage = status === 'accepted' 
      ? `Votre candidature pour l'annonce "${listing.title}" a été acceptée!` 
      : `Votre candidature pour l'annonce "${listing.title}" a été refusée.`;
    
    await createNotification({
      recipient: cleaner.user,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      relatedTo: {
        modelType: 'Listing',
        modelId: listing._id
      },
      actionRequired: status === 'accepted',
      actionType: status === 'accepted' ? 'view' : null
    });
  }

  res.status(200).json({
    success: true,
    data: {
      message: `Candidature ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès`,
      listing: {
        _id: listing._id,
        title: listing.title,
        status: listing.status,
        applications: listing.applications,
        bookedCleaners: listing.bookedCleaners
      }
    }
  });
});

/**
 * @desc    Rechercher des annonces (pour les professionnels de ménage)
 * @route   GET /api/listings/search
 * @access  Private (Cleaner only)
 */
exports.searchListings = asyncHandler(async (req, res, next) => {
  // Vérifier que l'utilisateur est un professionnel de ménage
  if (req.user.role !== 'cleaner') {
    return next(new ErrorResponse(`Cette fonctionnalité est réservée aux professionnels de ménage`, 403));
  }

  // Récupérer les préférences du professionnel
  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner) {
    return next(new ErrorResponse(`Aucun profil de professionnel trouvé pour cet utilisateur`, 404));
  }

  // Construire la requête en fonction des préférences et filtres
  const query = {
    status: 'published',
    // Plus de filtres à ajouter selon les préférences du professionnel et les paramètres de recherche
  };

  // Filtrer par type d'hébergement si spécifié dans les préférences
  if (cleaner.workPreferences && cleaner.workPreferences.preferredAccommodationTypes && cleaner.workPreferences.preferredAccommodationTypes.length > 0) {
    query.accommodationType = { $in: cleaner.workPreferences.preferredAccommodationTypes };
  }

  // Filtrer par date si spécifié dans les préférences
  if (cleaner.workPreferences && cleaner.workPreferences.availabilityPeriod) {
    if (cleaner.workPreferences.availabilityPeriod.startDate) {
      query['dateRequired.startDate'] = { $gte: cleaner.workPreferences.availabilityPeriod.startDate };
    }
    if (cleaner.workPreferences.availabilityPeriod.endDate) {
      query['dateRequired.startDate'] = { 
        ...query['dateRequired.startDate'] || {},
        $lte: cleaner.workPreferences.availabilityPeriod.endDate 
      };
    }
  }

  // Filtrer par localisation si spécifié dans les préférences et si les coordonnées sont disponibles
  if (cleaner.user && cleaner.user.location && cleaner.user.location.coordinates && cleaner.workPreferences && cleaner.workPreferences.workingRadius) {
    const coordinates = cleaner.user.location.coordinates;
    const radius = cleaner.workPreferences.workingRadius / 6371; // Conversion en radians (6371 = rayon de la terre en km)
    
    query['location.coordinates'] = {
      $geoWithin: {
        $centerSphere: [coordinates, radius]
      }
    };
  }

  // Exécuter la recherche
  const listings = await Listing.find(query)
    .populate({
      path: 'host',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName rating'
      }
    })
    .select('title accommodationType location dateRequired area price status');

  res.status(200).json({
    success: true,
    count: listings.length,
    data: listings
  });
});