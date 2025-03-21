const express = require('express');
const {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getListingsInRadius,
  uploadListingPhoto,
  getMyListings,
  applyToListing,
  manageApplication,
  searchListings,
  getApplications,
  acceptApplication,
  rejectApplication
} = require('../controllers/listing.controller');

const Listing = require('../models/Listing');
const bookingRouter = require('./booking.routes');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

// Re-route into other resource routers
router.use('/:listingId/bookings', bookingRouter);

// Routes principales de listings
router
  .route('/')
  .get(advancedResults(Listing, {
    path: 'host',
    select: 'name description'
  }), getListings)
  .post(protect, authorize('host', 'admin'), createListing);

// Routes pour les listings d'un hébergeur
router
  .route('/me')
  .get(protect, authorize('host', 'admin'), getMyListings);

// Routes pour rechercher des listings (pour les nettoyeurs)
router
  .route('/matches')
  .get(protect, authorize('cleaner'), searchListings);

router
  .route('/radius/:zipcode/:distance')
  .get(getListingsInRadius);

// Routes pour un listing spécifique
router
  .route('/:id')
  .get(getListing)
  .put(protect, authorize('host', 'admin'), updateListing)
  .delete(protect, authorize('host', 'admin'), deleteListing);

// Route pour télécharger une photo
router
  .route('/:id/photo')
  .put(protect, authorize('host', 'admin'), uploadListingPhoto);

// Routes pour les candidatures
router
  .route('/:id/apply')
  .post(protect, authorize('cleaner'), applyToListing);

router
  .route('/:id/applications')
  .get(protect, authorize('host', 'admin'), getApplications);

router
  .route('/:id/applications/:cleanerId/accept')
  .put(protect, authorize('host', 'admin'), (req, res, next) => {
    req.body.status = 'accepted';
    manageApplication(req, res, next);
  });

router
  .route('/:id/applications/:cleanerId/reject')
  .put(protect, authorize('host', 'admin'), (req, res, next) => {
    req.body.status = 'rejected';
    manageApplication(req, res, next);
  });

module.exports = router;