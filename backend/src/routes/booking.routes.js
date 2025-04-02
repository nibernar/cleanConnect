// Log au tout début pour vérifier le chargement du module
console.log('[DEBUG] Loading: backend/src/routes/booking.routes.js');

const express = require('express');
const {
  getBookings, getMyBookings, getBooking, createBooking, updateBooking,
  deleteBooking, getPendingCleanerBookings, acceptBooking, rejectBooking,
  completeBooking, confirmPayment, confirmArrival, updateTasks,
  submitComplaint, releasePayment, shareContactInfo, cancelBooking, rateBooking
} = require('../controllers/booking.controller');

const invoiceRouter = require('./invoice.routes');
const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Booking = require('../models/Booking');

// --- Middleware d'authentification --- 
router.use(protect);

// --- Middleware de Debug - LOG ROUTER PARAMS ---
router.use((req, res, next) => {
  // Log simplifié
  console.log(`\n[DEBUG] booking.routes.js - Request Path: ${req.path}, Params: ${JSON.stringify(req.params)}\n`);
  next();
});

// --- Routes Spécifiques (Définies AVANT /:id) ---

// GET /api/v1/bookings/mine
router.get('/mine', (req, res, next) => {
    // Log simplifié
    console.log("\n[DEBUG] ROUTE HANDLER ENTERED: /mine\n");
    next();
  }, getMyBookings);

// GET /api/v1/bookings/cleaner/pending
router.get('/cleaner/pending', authorize('cleaner'), getPendingCleanerBookings);

// --- Routes Générales (/) ---

// GET /api/v1/bookings (avec filtres/pagination)
router.get('/', advancedResults(Booking, [
    { path: 'host', select: 'user', populate: { path: 'user', select: 'firstName lastName'} },
    { path: 'cleaner', select: 'user', populate: { path: 'user', select: 'firstName lastName'} },
    { path: 'listing', select: 'title location price' }
  ]), getBookings);

// POST /api/v1/bookings
router.post('/', authorize('host'), createBooking);

// --- Routes /:id/action (Définies AVANT /:id seul) ---
router.put('/:id/accept', authorize('cleaner'), acceptBooking);
router.put('/:id/reject', authorize('cleaner'), rejectBooking);
router.post('/:id/cancel', cancelBooking);
router.post('/:id/confirm-payment', authorize('host', 'admin'), confirmPayment);
router.post('/:id/arrival', authorize('cleaner'), confirmArrival);
router.put('/:id/tasks', authorize('cleaner'), updateTasks);
router.put('/:id/complete', authorize('cleaner', 'host', 'admin'), completeBooking);
router.post('/:id/complaint', authorize('host'), submitComplaint);
router.post('/:id/release-payment', authorize('admin'), releasePayment);
router.post('/:id/share-contact', authorize('host'), shareContactInfo);
router.post('/:id/rate', rateBooking);

// --- Route Générique /:id (Définie APRÈS les routes /:id/action) ---

// GET /api/v1/bookings/:id
router.get('/:id', (req, res, next) => {
    // Log simplifié
    console.log(`\n[DEBUG] ROUTE HANDLER ENTERED: /:id (Value: ${req.params.id})\n`);
    next();
  }, getBooking);

// PUT /api/v1/bookings/:id
router.put('/:id', updateBooking);

// DELETE /api/v1/bookings/:id
router.delete('/:id', authorize('admin'), deleteBooking);

// --- Re-routage vers les factures (Défini à la fin) ---
router.use('/:bookingId/invoices', invoiceRouter);

module.exports = router;
