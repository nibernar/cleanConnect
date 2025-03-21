const express = require('express');
const {
  getCleaners,
  getCleaner,
  createCleaner,
  updateCleaner,
  deleteCleaner,
  getCleanerStats,
  updateAvailability,
  updatePreferences,
  getCleanerBookings,
  verifyCleaner,
  getAvailableListings,
  getMyStats
} = require('../controllers/cleaner.controller');

const Cleaner = require('../models/Cleaner');
const bookingRouter = require('./booking.routes');
const reviewRouter = require('./review.routes');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const { debugAuth, debugRequest } = require('../middleware/debug');

// Re-route into other resource routers
router.use('/:cleanerId/bookings', bookingRouter);
router.use('/:cleanerId/reviews', reviewRouter);

// Routes spéciales pour le tableau de bord du professionnel connecté (avec /me/)
router.route('/me/available-listings')
  .get(debugRequest, protect, debugAuth, authorize('cleaner'), getAvailableListings);

router.route('/me/stats')
  .get(debugRequest, protect, debugAuth, authorize('cleaner', 'admin'), getMyStats);

// Test route without authentication for debugging - Available listings
router.route('/debug/available-listings')
  .get(debugRequest, (req, res) => {
    console.log('🧪 Test route for cleaner available listings called');
    res.status(200).json({
      success: true,
      message: 'Debug route - This would return available listings',
      count: 3,
      data: [
        {
          _id: 'test-listing-1',
          title: 'Test Available Listing 1',
          status: 'published',
          price: 50,
          location: { address: 'Test Address 1' },
          createdAt: new Date().toISOString()
        },
        {
          _id: 'test-listing-2',
          title: 'Test Available Listing 2',
          status: 'published',
          price: 75,
          location: { address: 'Test Address 2' },
          createdAt: new Date().toISOString()
        },
        {
          _id: 'test-listing-3',
          title: 'Test Available Listing 3',
          status: 'published',
          price: 100,
          location: { address: 'Test Address 3' },
          createdAt: new Date().toISOString()
        }
      ]
    });
  });

// Test route without authentication for debugging - Cleaner stats
router.route('/debug/stats')
  .get(debugRequest, (req, res) => {
    console.log('🧪 Test route for cleaner stats called');
    res.status(200).json({
      success: true,
      message: 'Debug route - This would return cleaner stats',
      data: {
        totalEarnings: 1250,
        completedBookings: 15,
        inProgressBookings: 2,
        upcomingBookings: 3,
        totalBookings: 20,
        satisfactionRate: '95.00%',
        averageRating: 4.8
      }
    });
  });

router
  .route('/')
  .get(advancedResults(Cleaner, 'user'), getCleaners)
  .post(protect, createCleaner);

router
  .route('/:id')
  .get(getCleaner)
  .put(protect, authorize('cleaner', 'admin'), updateCleaner)
  .delete(protect, authorize('cleaner', 'admin'), deleteCleaner);

router
  .route('/:id/stats')
  .get(protect, authorize('cleaner', 'admin'), getCleanerStats);

router
  .route('/:id/availability')
  .put(protect, authorize('cleaner', 'admin'), updateAvailability);

router
  .route('/:id/preferences')
  .put(protect, authorize('cleaner', 'admin'), updatePreferences);

router
  .route('/:id/bookings')
  .get(protect, authorize('cleaner', 'admin'), getCleanerBookings);

router
  .route('/:id/verify')
  .put(protect, authorize('admin'), verifyCleaner);

module.exports = router;