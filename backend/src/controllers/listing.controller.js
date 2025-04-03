const path = require('path');
const Listing = require('../models/Listing');
const Host = require('../models/Host'); // Utilisé pour vérification propriété, garder
const Cleaner = require('../models/Cleaner'); // Utilisé pour apply, garder
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { createNotification } = require('../services/notifications'); // Utilisé pour apply/manage, garder
const geocoder = require('../utils/geocoder');
const mongoose = require('mongoose'); // Ajouter mongoose pour ObjectId

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
  const listings = await Listing.find({ host: req.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'host',
      select: 'firstName lastName avatar rating'
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
      select: 'firstName lastName avatar rating'
    })
    // Ajouter populate pour applications si le modèle Listing a ce champ
    /* .populate({
      path: 'applications.cleaner', // Assurez-vous que le chemin est correct
      populate: { path: 'user', select: 'firstName lastName rating profileImage' }
    }) */;

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
  const listingData = {
    host: req.user.id,
    title: req.body.title,
    description: req.body.description || req.body.notes || 'Pas de description fournie.',
    accommodationType: req.body.accommodationType,
    location: {
      address: req.body.address,
      city: req.body.city,
      postalCode: req.body.postalCode
      // Ajouter géocodage ici ou via hook pre-save si nécessaire
    },
    size: parseFloat(req.body.squareMeters || req.body.area),
    numberOfCleaners: parseInt(req.body.peopleNeeded, 10) || 1,
    tasks: req.body.services || [],
    equipmentAvailable: req.body.equipment || [],
    desiredDate: req.body.date,
    desiredTime: {
        start: req.body.startTime,
        end: req.body.endTime
    },
    notes: req.body.notes,
    price: req.body.price
  };

  console.log("Données préparées pour Listing.create:", listingData);

  if (!listingData.price || typeof listingData.price.totalAmount === 'undefined') {
     console.error("Tentative de création d'annonce sans données de prix valides:", listingData);
     return next(new ErrorResponse("Les données de prix sont manquantes ou invalides.", 400));
  }

  const listing = await Listing.create(listingData);

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
    if (!listing) return next(new ErrorResponse(`Annonce non trouvée avec l'id ${req.params.id}`, 404));
    if (listing.host.toString() !== req.user.id) return next(new ErrorResponse(`Non autorisé`, 403));

    const fieldsToUpdate = {};
    const allowedFields = ['title', 'description', 'accommodationType', 'size', 'numberOfCleaners', 'tasks', 'equipmentAvailable', 'desiredDate', 'notes'];
    allowedFields.forEach(field => { if (req.body[field] !== undefined) fieldsToUpdate[field] = req.body[field]; });
    if (req.body.address || req.body.city || req.body.postalCode) fieldsToUpdate.location = { ...listing.location, ...(req.body.address && { address: req.body.address }), ...(req.body.city && { city: req.body.city }), ...(req.body.postalCode && { postalCode: req.body.postalCode }) };
    if (req.body.startTime || req.body.endTime) fieldsToUpdate.desiredTime = { ...listing.desiredTime, ...(req.body.startTime && { start: req.body.startTime }), ...(req.body.endTime && { end: req.body.endTime }) };
    if (req.body.price && typeof req.body.price.totalAmount !== 'undefined') fieldsToUpdate.price = req.body.price;

    listing = await Listing.findByIdAndUpdate(req.params.id, fieldsToUpdate, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: listing });
});

/**
 * @desc    Supprimer une annonce
 * @route   DELETE /api/listings/:id
 * @access  Private (Host only)
 */
exports.deleteListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new ErrorResponse(`Annonce non trouvée avec l'id ${req.params.id}`, 404));
  if (listing.host.toString() !== req.user.id) return next(new ErrorResponse(`Non autorisé`, 403));

  await Listing.deleteOne({ _id: req.params.id });
  res.status(200).json({ success: true, data: {} });
});

/**
 * @desc    Télécharger une photo pour une annonce
 * @route   PUT /api/listings/:id/photo
 * @access  Private (Host only)
 */
exports.uploadListingPhoto = asyncHandler(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(new ErrorResponse(`Annonce non trouvée ${req.params.id}`, 404));
    if (listing.host.toString() !== req.user.id) return next(new ErrorResponse(`Non autorisé`, 403));
    if (!req.files) return next(new ErrorResponse(`Veuillez télécharger un fichier`, 400));

    const file = req.files.file;
    if (!file.mimetype.startsWith('image')) return next(new ErrorResponse(`Veuillez télécharger une image`, 400));

    const maxSize = process.env.MAX_FILE_UPLOAD ? parseInt(process.env.MAX_FILE_UPLOAD) : 10 * 1024 * 1024;
    if (file.size > maxSize) return next(new ErrorResponse(`Image trop grande`, 400));

    file.name = `photo_listing_${listing._id}${path.parse(file.name).ext}`;
    const uploadPath = process.env.FILE_UPLOAD_PATH || './public/uploads';
    const filePath = `${uploadPath}/listings/${file.name}`;

    file.mv(filePath, async err => {
        if (err) return next(new ErrorResponse(`Problème upload`, 500));
        const photoUrl = `/uploads/listings/${file.name}`;
        await Listing.findByIdAndUpdate(req.params.id, { $push: { photos: { url: photoUrl } } });
        res.status(200).json({ success: true, data: photoUrl });
    });
});

/**
 * @desc    Obtenir les annonces dans un certain rayon
 * @route   GET /api/listings/radius/:zipcode/:distance
 * @access  Public
 */
exports.getListingsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params;
    try {
        const loc = await geocoder.geocode(zipcode);
        if (!loc || loc.length === 0) return next(new ErrorResponse(`Géocodage impossible pour ${zipcode}`, 400));
        const lat = loc[0].latitude; const lng = loc[0].longitude;
        const radius = distance / 6378;
        const listings = await Listing.find({
            'location.coordinates': { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
            status: 'open'
        }).populate({ path: 'host', select: 'firstName lastName avatar rating' });
        res.status(200).json({ success: true, count: listings.length, data: listings });
    } catch (err) { return next(new ErrorResponse(`Erreur recherche rayon`, 500)); }
});

/**
 * @desc    Postuler à une annonce (pour les nettoyeurs)
 * @route   POST /api/listings/:id/apply
 * @access  Private (Cleaner only)
 */
exports.applyToListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new ErrorResponse(`Annonce non trouvée ${req.params.id}`, 404));
  // Assurer que le modèle Listing a bien un champ 'applications'
  if (!listing.applications) listing.applications = [];

  const cleaner = await Cleaner.findOne({ user: req.user.id });
  if (!cleaner) return next(new ErrorResponse(`Profil Cleaner non trouvé`, 404));
  if (listing.status !== 'open') return next(new ErrorResponse(`Annonce non disponible`, 400));

  const alreadyApplied = listing.applications.some(app => app.cleaner.toString() === cleaner._id.toString());
  if (alreadyApplied) return next(new ErrorResponse(`Déjà postulé`, 400));

  listing.applications.push({ cleaner: cleaner._id, status: 'pending', appliedAt: Date.now() });
  await listing.save();

  // Notification
  const hostUser = await User.findById(listing.host);
  const cleanerUser = await User.findById(req.user.id);
  if (hostUser && cleanerUser) {
      await createNotification({
          recipient: hostUser._id, type: 'new_application', title: 'Nouvelle candidature',
          message: `${cleanerUser.firstName} a postulé pour "${listing.title}"`,
          relatedTo: { modelType: 'Listing', modelId: listing._id }
       });
  }

  res.status(200).json({ success: true, message: 'Candidature envoyée' });
});

/**
 * @desc    Obtenir les candidatures pour une annonce (pour l'hôte)
 * @route   GET /api/listings/:id/applications
 * @access  Private (Host only)
 */
exports.getApplications = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new ErrorResponse(`Annonce non trouvée ${req.params.id}`, 404));
  if (listing.host.toString() !== req.user.id) return next(new ErrorResponse(`Non autorisé`, 403));

  // Populer les détails
  const listingWithApps = await Listing.findById(req.params.id).populate({
      path: 'applications.cleaner',
      model: 'Cleaner',
      populate: {
          path: 'user',
          model: 'User',
          select: 'firstName lastName avatar rating email'
      }
  });

  res.status(200).json({ success: true, data: listingWithApps.applications || [] });
});

// Fonction helper réutilisable pour accepter/rejeter
const manageApplicationInternal = async (req, status) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ErrorResponse(`Annonce non trouvée ${req.params.id}`, 404);
    if (listing.host.toString() !== req.user.id) throw new ErrorResponse(`Non autorisé`, 403);

    const appIndex = listing.applications.findIndex(app => app.cleaner.toString() === req.params.cleanerId);
    if (appIndex === -1) throw new ErrorResponse(`Candidature non trouvée`, 404);

    if (status === 'accepted' && listing.bookedCleaners && listing.bookedCleaners.length >= listing.numberOfCleaners) {
         throw new ErrorResponse(`L'annonce est déjà complète`, 400);
    }

    listing.applications[appIndex].status = status;

    if (!listing.bookedCleaners) listing.bookedCleaners = [];
    const cleanerIdObj = new mongoose.Types.ObjectId(req.params.cleanerId);

    if (status === 'accepted') {
        if (!listing.bookedCleaners.some(id => id.equals(cleanerIdObj))) {
            listing.bookedCleaners.push(cleanerIdObj);
        }
        if (listing.bookedCleaners.length >= listing.numberOfCleaners) {
            listing.status = 'assigned';
        }
    } else {
        listing.bookedCleaners = listing.bookedCleaners.filter(id => !id.equals(cleanerIdObj));
         if(listing.status === 'assigned' && listing.bookedCleaners.length < listing.numberOfCleaners) {
             listing.status = 'open';
         }
    }

    await listing.save();

    // Notification
    // Attention: req.params.cleanerId est l'ID Cleaner, il faut trouver l'ID User associé
    const cleanerProfile = await Cleaner.findById(req.params.cleanerId);
    if (cleanerProfile && cleanerProfile.user) {
        const cleanerUserId = cleanerProfile.user;
        await createNotification({
             recipient: cleanerUserId,
             type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
             title: `Candidature ${status === 'accepted' ? 'Acceptée' : 'Refusée'}`,
             message: `Votre candidature pour "${listing.title}" a été ${status === 'accepted' ? 'acceptée' : 'refusée'}.`,
             relatedTo: { modelType: 'Listing', modelId: listing._id }
          });
    }

    return listing;
};

/**
 * @desc    Accepter une candidature (utilise helper)
 * @route   PUT /api/listings/:id/applications/:cleanerId/accept
 * @access  Private (Host only)
 */
exports.acceptApplication = asyncHandler(async (req, res, next) => {
    const updatedListing = await manageApplicationInternal(req, 'accepted');
    const updatedApplication = updatedListing.applications.find(app => app.cleaner.toString() === req.params.cleanerId);
    res.status(200).json({ success: true, data: updatedApplication });
});

/**
 * @desc    Rejeter une candidature (utilise helper)
 * @route   PUT /api/listings/:id/applications/:cleanerId/reject
 * @access  Private (Host only)
 */
exports.rejectApplication = asyncHandler(async (req, res, next) => {
    const updatedListing = await manageApplicationInternal(req, 'rejected');
    const updatedApplication = updatedListing.applications.find(app => app.cleaner.toString() === req.params.cleanerId);
     res.status(200).json({ success: true, data: updatedApplication });
});

/**
 * @desc    Rechercher des annonces (pour les nettoyeurs)
 * @route   GET /api/listings/search
 * @access  Private (Cleaner only)
 */
exports.searchListings = asyncHandler(async (req, res, next) => {
  const cleaner = await Cleaner.findOne({ user: req.user.id }).populate('user');
  if (!cleaner) return next(new ErrorResponse(`Profil Cleaner non trouvé`, 404));

  const query = { status: 'open' };

  if (cleaner.workPreferences?.preferredAccommodationTypes?.length > 0) {
    query.accommodationType = { $in: cleaner.workPreferences.preferredAccommodationTypes };
  }

  if (cleaner.user?.location?.coordinates && cleaner.workPreferences?.workingRadius > 0) {
        const [lng, lat] = cleaner.user.location.coordinates;
        const radiusInKm = cleaner.workPreferences.workingRadius;
        const radiusInRadians = radiusInKm / 6378.1;
         query['location.coordinates'] = {
            $geoWithin: { $centerSphere: [ [lng, lat], radiusInRadians ] }
         };
  }

  const listings = await Listing.find(query)
    .populate({ path: 'host', select: 'firstName lastName avatar rating' })
    .limit(parseInt(req.query.limit, 10) || 20);

  res.status(200).json({ success: true, count: listings.length, data: listings });
});
