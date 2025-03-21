const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');

// @desc    Get all invoices for a user
// @route   GET /api/v1/invoices
// @access  Private
exports.getInvoices = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // If user is not admin, only show their own invoices
  if (req.user.role !== 'admin') {
    if (req.user.role === 'host') {
      query = Invoice.find({ host: req.user.id });
    } else if (req.user.role === 'cleaner') {
      query = Invoice.find({ cleaner: req.user.id });
    }
  } else {
    query = Invoice.find();
  }

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];
  
  // Loop over and remove fields
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  
  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Finding resource
  query = query.find(JSON.parse(queryStr));
  
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Invoice.countDocuments();
  
  query = query.skip(startIndex).limit(limit);
  
  // Populate
  query = query.populate([
    {
      path: 'booking',
      select: 'startDate endDate status'
    },
    {
      path: 'host',
      select: 'name email'
    },
    {
      path: 'cleaner',
      select: 'name email'
    }
  ]);
  
  // Executing query
  const invoices = await query;
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: invoices.length,
    pagination,
    data: invoices
  });
});

// @desc    Get single invoice
// @route   GET /api/v1/invoices/:id
// @access  Private
exports.getInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id).populate([
    {
      path: 'booking',
      select: 'startDate endDate status'
    },
    {
      path: 'host',
      select: 'name email'
    },
    {
      path: 'cleaner',
      select: 'name email'
    }
  ]);

  if (!invoice) {
    return next(
      new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is invoice owner or admin
  if (
    invoice.host.toString() !== req.user.id &&
    invoice.cleaner.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(`User not authorized to access this invoice`, 401)
    );
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
});

// @desc    Create new invoice
// @route   POST /api/v1/bookings/:bookingId/invoices
// @access  Private (Admin)
exports.createInvoice = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.bookingId}`, 404)
    );
  }

  // Check if invoice for this booking already exists
  const existingInvoice = await Invoice.findOne({ booking: req.params.bookingId });
  
  if (existingInvoice) {
    return next(
      new ErrorResponse(`Invoice already exists for this booking`, 400)
    );
  }

  // Create invoice
  const invoice = await Invoice.create({
    amount: booking.price,
    status: 'pending',
    booking: req.params.bookingId,
    host: booking.host,
    cleaner: booking.cleaner,
    serviceType: booking.serviceType,
    description: `Invoice for booking #${booking._id}`,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
  });

  res.status(201).json({
    success: true,
    data: invoice
  });
});

// @desc    Update invoice status
// @route   PUT /api/v1/invoices/:id
// @access  Private (Admin)
exports.updateInvoice = asyncHandler(async (req, res, next) => {
  // Only allow status to be updated
  const { status } = req.body;

  if (!status) {
    return next(new ErrorResponse(`Please provide status field`, 400));
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to update invoice status`, 401)
    );
  }

  let invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(
      new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404)
    );
  }

  invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: invoice
  });
});

// @desc    Delete invoice
// @route   DELETE /api/v1/invoices/:id
// @access  Private (Admin)
exports.deleteInvoice = asyncHandler(async (req, res, next) => {
  // Only admin can delete invoices
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to delete invoices`, 401)
    );
  }

  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(
      new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404)
    );
  }

  await invoice.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Generate monthly invoice report
// @route   GET /api/v1/invoices/report
// @access  Private (Admin)
exports.getInvoiceReport = asyncHandler(async (req, res, next) => {
  // Only admin can access reports
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to access invoice reports`, 401)
    );
  }

  const { month, year } = req.query;
  
  if (!month || !year) {
    return next(
      new ErrorResponse(`Please provide month and year parameters`, 400)
    );
  }

  // Calculate date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Aggregate invoices for the month
  const report = await Invoice.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);

  // Calculate totals
  let totalInvoices = 0;
  let totalAmount = 0;
  
  report.forEach(item => {
    totalInvoices += item.count;
    totalAmount += item.totalAmount;
  });

  res.status(200).json({
    success: true,
    data: {
      month,
      year,
      report,
      summary: {
        totalInvoices,
        totalAmount
      }
    }
  });
});