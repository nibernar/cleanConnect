const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.ObjectId,
    ref: 'Listing',
    required: true
  },
  host: {
    type: mongoose.Schema.ObjectId,
    ref: 'Host',
    required: true
  },
  cleaner: {
    type: mongoose.Schema.ObjectId,
    ref: 'Cleaner',
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending', // En attente de paiement
      'confirmed', // Confirmé après paiement
      'inProgress', // En cours d'exécution
      'completed', // Tâches terminées
      'disputed', // Réclamation en cours
      'cancelled', // Annulé
      'refunded' // Remboursé
    ],
    default: 'pending'
  },
  dateScheduled: {
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: String
  },
  taskChecklist: [{
    taskName: {
      type: String,
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  payment: {
    amount: {
      type: Number,
      required: true
    },
    platformFee: {
      type: Number,
      required: true
    },
    cleanerPayout: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'EUR'
    },
    stripePaymentId: String,
    stripeTransferId: String,
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    isPayoutSent: {
      type: Boolean,
      default: false
    },
    payoutSentAt: Date
  },
  contactInfoShared: {
    type: Boolean,
    default: false
  },
  complaint: {
    isSubmitted: {
      type: Boolean,
      default: false
    },
    submittedAt: Date,
    description: String,
    evidencePhotos: [String],
    resolution: {
      type: String,
      enum: ['pending', 'refunded', 'dismissed', 'partial_refund'],
      default: 'pending'
    },
    resolvedAt: Date
  },
  cleanerArrival: {
    hasArrived: {
      type: Boolean,
      default: false
    },
    arrivedAt: Date,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    }
  },
  taskCompletionConfirmed: {
    type: Boolean,
    default: false
  },
  taskCompletionConfirmedAt: Date,
  hostReviewPeriodEndsAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexer pour les recherches géospatiales
BookingSchema.index({ 'cleanerArrival.location': '2dsphere' });

module.exports = mongoose.model('Booking', BookingSchema);