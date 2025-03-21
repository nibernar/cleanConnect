const mongoose = require('mongoose');

const HostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String
  },
  isCompany: {
    type: Boolean,
    default: false
  },
  businessDetails: {
    siret: {
      type: String
    },
    vatNumber: {
      type: String
    },
    businessAddress: {
      type: String
    }
  },
  properties: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Listing'
    }
  ],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  paymentMethods: [
    {
      type: {
        type: String,
        enum: ['card', 'bank_transfer'],
        required: true
      },
      details: {
        last4: String,
        expiryDate: String,
        brand: String
      },
      isDefault: {
        type: Boolean,
        default: false
      }
    }
  ],
  preferences: {
    notificationSettings: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  }
});

module.exports = mongoose.model('Host', HostSchema);