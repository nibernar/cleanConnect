const express = require('express');
const {
  getCleaners,
  getCleaner,
  createCleaner,
  updateCleaner, // Pour /:id
  updateMyCleanerProfile, // Pour /me
  deleteCleaner,
  getCleanerStats,
  updateAvailability,
  updatePreferences,
  getCleanerBookings,
  verifyCleaner, // Contrôleur pour la vérification
  getAvailableListings,
  getMyStats
} = require('../controllers/cleaner.controller');

const Cleaner = require('../models/Cleaner');
const bookingRouter = require('./booking.routes');
const reviewRouter = require('./review.routes');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const { debugAuth, debugRequest } = require('../middleware/debug');

// Re-route into other resource routers
router.use('/:cleanerId/bookings', bookingRouter);
router.use('/:cleanerId/reviews', reviewRouter);

// --- Routes Spécifiques pour le Cleaner Connecté (/me) --- 

// Note: protect est appliqué globalement plus bas si on le souhaite
router.route('/me/available-listings')
  .get(debugRequest, protect, debugAuth, authorize('cleaner'), getAvailableListings);
router.route('/me/stats')
  .get(debugRequest, protect, debugAuth, authorize('cleaner'), getMyStats);
router.route('/me')
    .put(debugRequest, protect, debugAuth, authorize('cleaner'), updateMyCleanerProfile);

// --- Routes Générales --- 

router
  .route('/')
   // Seul l'admin peut lister tous les cleaners
  .get(protect, authorize('admin'), advancedResults(Cleaner, 'user'), getCleaners) 
  .post(protect, createCleaner); // Création de profil cleaner par l'utilisateur lui-même

// --- Routes par ID --- 

// Appliquer protect globalement ici pour éviter répétition?
// router.use(protect);

// Attention à l'ordre : /:id/action AVANT /:id seul
router
  .route('/:id/stats')
  .get(protect, authorize('admin', 'cleaner'), getCleanerStats); // Admin ou le cleaner concerné

router
  .route('/:id/availability')
  .put(protect, authorize('admin', 'cleaner'), updateAvailability);

router
  .route('/:id/preferences')
  .put(protect, authorize('admin', 'cleaner'), updatePreferences);

router
  .route('/:id/bookings')
  .get(protect, authorize('admin', 'cleaner'), getCleanerBookings);

// Remettre authorize('admin') pour la sécurité
router
  .route('/:id/verify')
  .put(protect, authorize('admin'), verifyCleaner); 

// Mettre la route /:id générique APRES les routes spécifiques /:id/action
router
  .route('/:id')
   // GET accessible par tous (le contrôleur filtre les données)
  .get(protect, getCleaner)
   // PUT/DELETE réservé à l'admin ou au cleaner concerné
  .put(protect, authorize('admin', 'cleaner'), updateCleaner) 
  .delete(protect, authorize('admin', 'cleaner'), deleteCleaner);

// --- Routes de Debug --- 
router.route('/debug/available-listings').get(debugRequest, (req, res) => { /* ... */ });
router.route('/debug/stats').get(debugRequest, (req, res) => { /* ... */ });

module.exports = router;
