const express = require('express');
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceReport
} = require('../controllers/invoice.controller');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getInvoices)
  .post(protect, authorize('admin'), createInvoice);

router
  .route('/:id')
  .get(protect, getInvoice)
  .put(protect, authorize('admin'), updateInvoice)
  .delete(protect, authorize('admin'), deleteInvoice);

router
  .route('/report')
  .get(protect, authorize('admin'), getInvoiceReport);

module.exports = router;