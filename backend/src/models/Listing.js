const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.ObjectId,
    ref: 'Host',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Le titre de l\'annonce est requis']
  },
  accommodationType: {
    type: String,
    enum: ['apartment', 'house', 'villa', 'hotel_room', 'other'],
    required: [true, 'Le type d\'hébergement est requis']
  },
  location: {
    address: {
      type: String,
      required: [true, 'L\'adresse est requise']
    },
    city: {
      type: String,
      required: [true, 'La ville est requise']
    },
    postalCode: {
      type: String,
      required: [true, 'Le code postal est requis']
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
        required: [true, 'Les coordonnées géographiques sont requises']
      }
    }
  },
  dateRequired: {
    startDate: {
      type: Date,
      required: [true, 'La date de début est requise']
    },
    endDate: {
      type: Date
    },
    startTime: {
      type: String,
      required: [true, 'L\'heure de début est requise']
    },
    endTime: {
      type: String
    }
  },
  numberOfCleaners: {
    type: Number,
    default: 1,
    min: [1, 'Au moins un nettoyeur est requis']
  },
  area: {
    type: Number,
    required: [true, 'La superficie est requise'],
    min: [1, 'La superficie doit être positive']
  },
  services: [{
    type: String,
    enum: [
      'regular_cleaning', 
      'deep_cleaning', 
      'window_cleaning', 
      'laundry',
      'dish_washing',
      'bed_making',
      'bathroom_cleaning',
      'kitchen_cleaning'
    ],
    required: [true, 'Au moins un service est requis']
  }],
  equipment: {
    vacuumCleaner: {
      type: Boolean,
      default: false
    },
    mop: {
      type: Boolean,
      default: false
    },
    cleaningProducts: {
      type: Boolean,
      default: false
    },
    other: [String]
  },
  additionalNotes: {
    type: String
  },
  price: {
    baseAmount: {
      type: Number,
      required: true
    },
    commission: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'EUR'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'booked', 'completed', 'cancelled'],
    default: 'draft'
  },
  applications: [{
    cleaner: {
      type: mongoose.Schema.ObjectId,
      ref: 'Cleaner'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookedCleaners: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Cleaner'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Méthode statique pour calculer le prix total (base + commission)
ListingSchema.statics.calculatePrice = function(area, services, hours) {
  const baseRate = 15.50; // 15,50€ de l'heure
  const commissionRate = 0.15; // 15% de commission
  
  // Calculer le prix en fonction de la superficie et services
  let baseAmount;
  
  if (hours) {
    // Si les heures sont spécifiées directement
    baseAmount = baseRate * hours;
  } else {
    // Estimation basée sur la superficie et les services
    const estimatedHours = Math.ceil(area / 50); // 1h pour 50m²
    
    // Ajustement en fonction des services
    let serviceMultiplier = 1;
    if (services.includes('deep_cleaning')) serviceMultiplier += 0.5;
    if (services.includes('window_cleaning')) serviceMultiplier += 0.3;
    
    baseAmount = baseRate * estimatedHours * serviceMultiplier;
  }
  
  // Arrondir à 2 décimales
  baseAmount = Math.round(baseAmount * 100) / 100;
  
  // Calculer la commission
  const commission = Math.round(baseAmount * commissionRate * 100) / 100;
  
  // Calculer le montant total
  const totalAmount = baseAmount + commission;
  
  return {
    baseAmount,
    commission,
    totalAmount
  };
};

module.exports = mongoose.model('Listing', ListingSchema);