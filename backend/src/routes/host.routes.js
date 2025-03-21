const express = require('express');
const {
  getHosts,
  getHost,
  createHost,
  updateHost,
  deleteHost,
  getHostStats,
  getActiveListings,
  getHostApplications
} = require('../controllers/host.controller');

const Host = require('../models/Host');
const ErrorResponse = require('../utils/errorResponse');
const listingRouter = require('./listing.routes');
const bookingRouter = require('./booking.routes');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const { debugAuth, debugRequest } = require('../middleware/debug');

// Re-route into other resource routers
router.use('/:hostId/listings', listingRouter);
router.use('/:hostId/bookings', bookingRouter);

// Routes pour le tableau de bord de l'hôte
router.route('/me/active-listings')
  .get(debugRequest, protect, debugAuth, authorize('host'), getActiveListings);

// Route pour récupérer toutes les candidatures sur les annonces d'un hôte
router.route('/me/applications')
  .get(debugRequest, protect, debugAuth, authorize('host'), getHostApplications);

// Route pour les statistiques de l'hôte connecté
router.route('/me/stats')
  .get(debugRequest, protect, debugAuth, authorize('host'), async (req, res, next) => {
    // Trouver l'ID du profil d'hébergeur de l'utilisateur connecté
    const host = await Host.findOne({ user: req.user.id });
    if (!host) {
      return next(new ErrorResponse(`Aucun profil d'hébergeur trouvé pour cet utilisateur`, 404));
    }
    
    // Mettre l'ID du host dans les paramètres pour réutiliser le contrôleur existant
    req.params.id = host._id;
    
    // Appeler le contrôleur getHostStats avec l'ID du host
    getHostStats(req, res, next);
  });

// Test route without authentication for debugging
router.route('/debug/active-listings')
  .get(debugRequest, (req, res) => {
    console.log('🧪 Test route for host active listings called');
    res.status(200).json({
      success: true,
      message: 'Debug route - This would return active listings',
      count: 3,
      data: [
        {
          _id: 'test-listing-1',
          title: 'Test Listing 1',
          status: 'published',
          price: 50,
          location: { address: 'Test Address 1' },
          createdAt: new Date().toISOString()
        },
        {
          _id: 'test-listing-2',
          title: 'Test Listing 2',
          status: 'published',
          price: 75,
          location: { address: 'Test Address 2' },
          createdAt: new Date().toISOString()
        },
        {
          _id: 'test-listing-3',
          title: 'Test Listing 3',
          status: 'published',
          price: 100,
          location: { address: 'Test Address 3' },
          createdAt: new Date().toISOString()
        }
      ]
    });
  });

// Debug route for applications
router.route('/debug/applications')
  .get(debugRequest, (req, res) => {
    console.log('🧪 Test route for host applications called');
    res.status(200).json({
      success: true,
      message: 'Debug route - This would return all applications for host listings',
      count: 2,
      data: [
        {
          _id: 'test-app-1',
          status: 'pending',
          message: 'I would like to clean this property',
          createdAt: new Date().toISOString(),
          listing: {
            _id: 'test-listing-1',
            title: 'Test Listing 1',
            price: 50,
            location: { address: 'Test Address 1' }
          },
          cleaner: {
            _id: 'test-cleaner-1',
            firstName: 'John',
            lastName: 'Doe',
            rating: 4.5,
            completedBookings: 12,
            location: 'Paris'
          }
        },
        {
          _id: 'test-app-2',
          status: 'pending',
          message: 'Available for this cleaning job',
          createdAt: new Date().toISOString(),
          listing: {
            _id: 'test-listing-2',
            title: 'Test Listing 2',
            price: 75,
            location: { address: 'Test Address 2' }
          },
          cleaner: {
            _id: 'test-cleaner-2',
            firstName: 'Jane',
            lastName: 'Smith',
            rating: 4.8,
            completedBookings: 24,
            location: 'Lyon'
          }
        }
      ]
    });
  });

router
  .route('/')
  .get(advancedResults(Host, 'user'), getHosts)
  .post(protect, authorize('admin'), createHost);

router
  .route('/:id')
  .get(getHost)
  .put(protect, authorize('host', 'admin'), updateHost)
  .delete(protect, authorize('host', 'admin'), deleteHost);

router
  .route('/:id/stats')
  .get(protect, authorize('host', 'admin'), getHostStats);

module.exports = router;