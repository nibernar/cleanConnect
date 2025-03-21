const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  reviewType: {
    type: String,
    enum: ['host_to_cleaner', 'cleaner_to_host'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'La note est requise']
  },
  comment: {
    type: String,
    maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères']
  },
  aspects: {
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1, 
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Empêcher l'utilisateur de soumettre plus d'une revue par réservation
ReviewSchema.index({ booking: 1, reviewer: 1 }, { unique: true });

// Mettre à jour la note moyenne de l'utilisateur évalué après une nouvelle revue
ReviewSchema.statics.calculateAverageRating = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: { reviewedUser: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$reviewedUser',
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('User').findByIdAndUpdate(userId, {
      rating: Math.round(stats[0].averageRating * 10) / 10
    });
  } else {
    await mongoose.model('User').findByIdAndUpdate(userId, {
      rating: 0
    });
  }
};

ReviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.reviewedUser);
});

ReviewSchema.pre(/^findOneAnd/, async function(next) {
  this.review = await this.findOne();
  next();
});

ReviewSchema.post(/^findOneAnd/, async function() {
  if (this.review) {
    await this.review.constructor.calculateAverageRating(this.review.reviewedUser);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);