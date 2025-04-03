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
  // manageApplication, // Plus exporté directement si on utilise accept/reject
  searchListings,
  getApplications,
  acceptApplication, // Utiliser la fonction spécifique
  rejectApplication  // Utiliser la fonction spécifique
} = require('../controllers/listing.controller'); // S'assurer que toutes ces fonctions sont exportées

const Listing = require('../models/Listing');
const bookingRouter = require('./booking.routes'); // Assurez-vous que ce fichier existe et exporte un routeur

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

// Re-route vers les réservations associées à une annonce
router.use('/:listingId/bookings', bookingRouter);

// --- Routes Principales ---
router
  .route('/')
  .get(advancedResults(Listing, { path: 'host', select: 'firstName lastName avatar rating' }), getListings) // Utiliser le populate corrigé
  .post(protect, authorize('host', 'admin'), createListing);

// --- Routes Spécifiques à l'Utilisateur Connecté ---
router
  .route('/me') // Annonces de l'hôte connecté
  .get(protect, authorize('host', 'admin'), getMyListings);

router
  .route('/matches') // Recherche pour le cleaner connecté
  .get(protect, authorize('cleaner'), searchListings);

// --- Routes Publiques ou Basées sur Paramètres ---
router
  .route('/radius/:zipcode/:distance') // Recherche par rayon
  .get(getListingsInRadius);

// --- Routes pour une Annonce Spécifique par ID ---
router
  .route('/:id')
  .get(protect, getListing) // Mettre protect si on ne veut pas que ce soit public
  .put(protect, authorize('host', 'admin'), updateListing)
  .delete(protect, authorize('host', 'admin'), deleteListing);

router
  .route('/:id/photo') // Upload photo pour une annonce
  .put(protect, authorize('host', 'admin'), uploadListingPhoto);

// --- Routes de Candidature (Cleaner) ---
router
  .route('/:id/apply')
  .post(protect, authorize('cleaner'), applyToListing);

// --- Routes de Gestion des Candidatures (Host) ---
router
  .route('/:id/applications') // Voir les candidatures d'une annonce
  .get(protect, authorize('host', 'admin'), getApplications);

router
  .route('/:id/applications/:cleanerId/accept') // Accepter une candidature
  .put(protect, authorize('host', 'admin'), acceptApplication); // Utilise le contrôleur dédié

router
  .route('/:id/applications/:cleanerId/reject') // Rejeter une candidature
  .put(protect, authorize('host', 'admin'), rejectApplication); // Utilise le contrôleur dédié


module.exports = router;
