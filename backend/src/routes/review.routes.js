const express = require('express');
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview
} = require('../controllers/review.controller');

const Review = require('../models/Review');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

router
  .route('/')
  .get(
    advancedResults(Review, {
      path: 'user',
      select: 'name role'
    }),
    getReviews
  )
  .post(protect, authorize('host', 'cleaner'), addReview);

router
  .route('/:id')
  .get(getReview)
  .put(protect, authorize('host', 'cleaner'), updateReview)
  .delete(protect, authorize('host', 'cleaner', 'admin'), deleteReview);

module.exports = router;