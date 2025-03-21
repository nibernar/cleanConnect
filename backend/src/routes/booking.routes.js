const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  getPendingCleanerBookings,
  acceptBooking,
  rejectBooking,
  completeBooking,
  rateBooking
} = require('../controllers/booking.controller');

const Booking = require('../models/Booking');
const invoiceRouter = require('./invoice.routes');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

// Re-route to other resource routers
router.use('/:bookingId/invoices', invoiceRouter);

router
  .route('/')
  .get(
    protect,
    advancedResults(Booking, [
      { path: 'host', select: 'name' },
      { path: 'cleaner', select: 'name' },
      { path: 'listing', select: 'title location price' }
    ]),
    getBookings
  )
  .post(protect, authorize('host', 'admin'), createBooking);

router
  .route('/:id')
  .get(protect, getBooking)
  .put(protect, updateBooking)
  .delete(protect, deleteBooking);

router
  .route('/cleaner/pending')
  .get(protect, authorize('cleaner'), getPendingCleanerBookings);

router
  .route('/:id/accept')
  .put(protect, authorize('cleaner'), acceptBooking);

router
  .route('/:id/reject')
  .put(protect, authorize('cleaner'), rejectBooking);

router
  .route('/:id/complete')
  .put(protect, authorize('cleaner', 'host', 'admin'), completeBooking);

router
  .route('/:id/rate')
  .post(protect, rateBooking);

module.exports = router;