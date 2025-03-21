const mongoose = require('mongoose');

const CleanerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  businessDetails: {
    siret: {
      type: String,
      // Changed to optional for initial registration
      required: false
    },
    companyName: String,
    isAutoEntrepreneur: {
      type: Boolean,
      default: true
    }
  },
  bankAccount: {
    iban: {
      type: String,
      // Changed to optional for initial registration
      required: false
    },
    bic: String,
    accountHolder: String,
    // Stockage d'une référence sécurisée pour Stripe
    stripeAccountId: String
  },
  workPreferences: {
    workingRadius: {
      type: Number,
      default: 20 // En kilomètres
    },
    availabilityPeriod: {
      startDate: Date,
      endDate: Date
    },
    availableDays: {
      monday: Boolean,
      tuesday: Boolean,
      wednesday: Boolean,
      thursday: Boolean,
      friday: Boolean,
      saturday: Boolean,
      sunday: Boolean
    },
    preferredAccommodationTypes: [{
      type: String,
      enum: ['apartment', 'house', 'villa', 'hotel_room', 'other']
    }]
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  activeBookings: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking'
    }
  ],
  schedule: [
    {
      date: Date,
      bookings: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'Booking'
        }
      ]
    }
  ],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    history: [
      {
        amount: Number,
        date: Date,
        booking: {
          type: mongoose.Schema.ObjectId,
          ref: 'Booking'
        },
        status: {
          type: String,
          enum: ['pending', 'paid', 'cancelled'],
          default: 'pending'
        }
      }
    ]
  }
});

module.exports = mongoose.model('Cleaner', CleanerSchema);