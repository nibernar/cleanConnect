const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Veuillez ajouter un titre'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'Veuillez ajouter une description']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Veuillez ajouter une adresse']
    },
    city: {
      type: String,
      required: [true, 'Veuillez ajouter une ville']
    },
    postalCode: {
      type: String,
      required: [true, 'Veuillez ajouter un code postal']
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
        // Rendre les coordonnées non obligatoires si l'adresse suffit ?
        // Ou s'assurer qu'elles sont toujours fournies/géocodées
        // required: [true, 'Coordonnées manquantes pour la localisation']
      }
    }
  },
  // *** CORRECTION: Renommer et ajuster l'enum ***
  accommodationType: {
    type: String,
    required: [true, 'Veuillez ajouter un type de propriété'],
    enum: ['apartment', 'house', 'studio', 'loft', 'villa', 'hotel_room', 'other'] // Utiliser les valeurs techniques
  },
  size: { // Superficie en m²
    type: Number,
    required: [true, 'Veuillez ajouter la superficie']
  },
  numberOfCleaners: { // Correspond à 'peopleNeeded' du frontend ?
    type: Number,
    default: 1,
    required: [true, 'Veuillez indiquer le nombre de nettoyeurs requis'] // Ajouter required si nécessaire
  },
  tasks: { // Doit correspondre aux 'services' du frontend
    type: [String], // Devrait stocker les 'value' des services (ex: 'dusting', 'floor_cleaning')
    required: true
  },
  equipmentAvailable: { // Doit correspondre à 'equipment' du frontend
    type: [String] // Devrait stocker les 'value' des équipements (ex: 'vacuum', 'mop')
  },
  desiredDate: { // Doit correspondre à 'date' du frontend
    type: Date,
    required: [true, 'Veuillez ajouter une date souhaitée']
  },
  // *** MODIFICATION: Stocker startTime et endTime ***
  desiredTime: {
    start: {
      type: String, // ex: "09:00"
      required: [true, 'Veuillez ajouter une heure de début']
    },
    end: {
       type: String, // ex: "11:00"
       required: [true, 'Veuillez ajouter une heure de fin']
    }
  },
  estimatedDuration: { // Gardé pour info, mais calculé dynamiquement ou via hook pre-save
    type: Number, // en heures
    // required: [true, 'Veuillez ajouter une durée estimée'] // Plus forcément requis si calculé
  },
  notes: {
    type: String
  },
  // Le prix est envoyé par le frontend, on le stocke tel quel
  price: {
    baseAmount: { type: Number, required: [true, 'Montant de base manquant'] },
    commission: { type: Number, required: [true, 'Commission manquante'] },
    totalAmount: { type: Number, required: [true, 'Montant total manquant'] }
  },
  commissionRate: {
    type: Number,
    default: 0.15 // 15%
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'completed', 'cancelled'],
    default: 'open'
  },
  photos: [
    {
      url: String,
      description: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true // Ajouter timestamps peut être utile
});

// Hook pre-save pour synchroniser/calculer des champs dérivés
ListingSchema.pre('save', function(next) {
    // Synchro frontend -> backend fields
    if (this.isModified('area') && !this.isModified('size')) {
      this.size = this.area; // Assumer que area du form = size du modèle
    }
    if (this.isModified('peopleNeeded') && !this.isModified('numberOfCleaners')) {
      this.numberOfCleaners = parseInt(this.peopleNeeded, 10) || 1;
    }
    // Assurer la présence de desiredTime.start/end basé sur startTime/endTime
     if (this.isModified('startTime') && !this.isModified('desiredTime.start')) {
       this.set('desiredTime.start', this.startTime);
     }
     if (this.isModified('endTime') && !this.isModified('desiredTime.end')) {
       this.set('desiredTime.end', this.endTime);
     }

    // Calculer la durée si les heures sont présentes/modifiées
    if (this.desiredTime && this.desiredTime.start && this.desiredTime.end && (this.isModified('desiredTime.start') || this.isModified('desiredTime.end'))) {
        const startStr = this.desiredTime.start;
        const endStr = this.desiredTime.end;
        const parseTime = (timeString) => {
            try {
              const [hours, minutes] = timeString.split(':').map(part => parseInt(part, 10));
              if(isNaN(hours) || isNaN(minutes)) return NaN;
              return hours + (minutes / 60);
            } catch(e) { return NaN; }
        };
        const startHours = parseTime(startStr);
        const endHours = parseTime(endStr);

        if (!isNaN(startHours) && !isNaN(endHours) && endHours > startHours) {
            this.estimatedDuration = Math.round((endHours - startHours) * 100) / 100; // Arrondi à 2 décimales
        } else {
            this.estimatedDuration = undefined; // ou 0 ou null si invalide
            console.warn("Impossible de calculer la durée estimée à partir des heures fournies:", startStr, endStr);
        }
    }

    // Validation/Fallback Prix (Optionnel - si on ne fait pas 100% confiance au frontend)
    if (!this.price || typeof this.price.totalAmount === 'undefined') {
        console.warn('Prix manquant dans les données reçues, tentative de calcul backend...');
        // Tenter de recalculer SEULEMENT si la durée est valide
        if (this.estimatedDuration && this.estimatedDuration > 0) {
             const fallbackPrice = calculateBackendPrice(this); // Utiliser la fonction helper
             this.price = fallbackPrice;
             console.log('Prix calculé côté backend (fallback):', fallbackPrice);
        } else {
            console.error("Impossible de calculer le prix fallback car la durée est invalide ou manquante.");
            // Important: Renvoyer une erreur si le prix est requis et ne peut être calculé
             return next(new Error("Prix manquant et impossible à calculer côté backend."));
        }
    }

    next();
});

// Fonction helper pour le calcul de prix backend (garder synchro avec frontend!)
function calculateBackendPrice(listingDoc) {
    const baseRate = 15.50;
    let duration = listingDoc.estimatedDuration || 0;
    let baseAmount = 0;

    if (duration > 0) {
        baseAmount = baseRate * duration;

        // Logique superficie (exemple)
        const squareMeters = parseFloat(listingDoc.size || 0);
        if (squareMeters > 100) {
            const additionalSqMeters = squareMeters - 100;
            const additionalFactor = Math.floor(additionalSqMeters / 50) * 0.2;
            baseAmount += baseAmount * additionalFactor;
        }

        // Logique services (exemple)
        const premiumServices = ['window_cleaning', 'bed_making', 'kitchen_cleaning'];
        const serviceValues = listingDoc.tasks || [];
        const premiumServiceCount = serviceValues.filter(service => premiumServices.includes(service)).length;
        baseAmount += baseAmount * (premiumServiceCount * 0.1);

        baseAmount = Math.round(baseAmount * 100) / 100;
    }

    const commission = Math.round(baseAmount * 0.15 * 100) / 100;
    const totalAmount = Math.round((baseAmount + commission) * 100) / 100;

    return { baseAmount, commission, totalAmount };
}

module.exports = mongoose.model('Listing', ListingSchema);
