/**
 * Validation schemas for various forms in the application
 * These schemas are used with the validateForm utility from errorHandler.js
 */

/**
 * Validation schema for listing forms
 */
export const listingSchema = {
  title: {
    required: true,
    requiredMessage: 'Le titre est requis',
    minLength: 5,
    minLengthMessage: 'Le titre doit contenir au moins 5 caractères',
    maxLength: 100,
    maxLengthMessage: 'Le titre ne peut pas dépasser 100 caractères'
  },
  accommodationType: {
    required: true,
    requiredMessage: "Le type d'hébergement est requis"
  },
  address: {
    required: true,
    requiredMessage: "L'adresse est requise",
    validate: (value) => {
      if (!value || value.length < 10) {
        return "Veuillez entrer une adresse complète";
      }
      
      // Check if address has at least a street and city/zip format
      const hasStreetAndCity = /^.+,.+$/.test(value) || 
                               /\d{5}/.test(value);
      
      if (!hasStreetAndCity) {
        return "L'adresse doit contenir rue, ville et/ou code postal";
      }
      
      return null;
    }
  },
  date: {
    required: true,
    requiredMessage: "La date est requise",
    validate: (value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        return "La date ne peut pas être dans le passé";
      }
      
      return null;
    }
  },
  startTime: {
    required: true,
    requiredMessage: "L'heure de début est requise"
  },
  endTime: {
    required: true,
    requiredMessage: "L'heure de fin est requise",
    validate: (value, data) => {
      if (!value || !data.startTime) return null;
      
      // Parse times
      const parseTime = (timeString) => {
        if (timeString instanceof Date) {
          return timeString.getHours() + (timeString.getMinutes() / 60);
        }
        
        const [hours, minutes] = timeString.split(':').map(part => parseInt(part, 10));
        return hours + (minutes / 60);
      };
      
      const startHours = parseTime(data.startTime);
      const endHours = parseTime(value);
      
      if (endHours <= startHours) {
        return "L'heure de fin doit être après l'heure de début";
      }
      
      return null;
    }
  },
  area: {
    required: true,
    requiredMessage: "La superficie est requise",
    validate: (value) => {
      const area = parseFloat(value);
      if (isNaN(area) || area <= 0) {
        return "La superficie doit être un nombre positif";
      }
      
      if (area > 1000) {
        return "La superficie ne peut pas dépasser 1000 m²";
      }
      
      return null;
    }
  },
  squareMeters: {
    validate: (value) => {
      if (value) {
        const area = parseFloat(value);
        if (isNaN(area) || area <= 0) {
          return "La superficie doit être un nombre positif";
        }
        
        if (area > 1000) {
          return "La superficie ne peut pas dépasser 1000 m²";
        }
      }
      
      return null;
    }
  },
  services: {
    required: true,
    requiredMessage: "Au moins un service est requis",
    validate: (value) => {
      // Check if at least one service is selected
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return "Veuillez sélectionner au moins un service";
        }
      } else if (typeof value === 'object') {
        const hasSelectedService = Object.values(value).some(selected => selected === true);
        if (!hasSelectedService) {
          return "Veuillez sélectionner au moins un service";
        }
      } else {
        return "Format de services invalide";
      }
      
      return null;
    }
  },
  personCount: {
    validate: (value) => {
      if (value) {
        const count = parseInt(value, 10);
        if (isNaN(count) || count <= 0) {
          return "Le nombre de personnes doit être un nombre positif";
        }
        
        if (count > 10) {
          return "Le nombre de personnes ne peut pas dépasser 10";
        }
      }
      
      return null;
    }
  }
};

/**
 * Validation schema for user registration
 */
export const registrationSchema = {
  email: {
    required: true,
    requiredMessage: "L'email est requis",
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Format d'email invalide";
      }
      return null;
    }
  },
  password: {
    required: true,
    requiredMessage: "Le mot de passe est requis",
    minLength: 6,
    minLengthMessage: "Le mot de passe doit contenir au moins 6 caractères"
  },
  firstName: {
    required: true,
    requiredMessage: "Le prénom est requis"
  },
  lastName: {
    required: true,
    requiredMessage: "Le nom est requis"
  },
  phoneNumber: {
    validate: (value) => {
      if (value) {
        const phoneRegex = /^(\+\d{1,3})?[0-9]{9,10}$/;
        if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
          return "Format de numéro de téléphone invalide";
        }
      }
      return null;
    }
  }
};

/**
 * Validation schema for applications
 */
export const applicationSchema = {
  message: {
    required: true,
    requiredMessage: "Un message est requis",
    minLength: 10,
    minLengthMessage: "Votre message doit contenir au moins 10 caractères"
  },
  price: {
    validate: (value) => {
      if (value) {
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) {
          return "Le prix proposé doit être un nombre positif";
        }
      }
      return null;
    }
  }
};

export default {
  listingSchema,
  registrationSchema,
  applicationSchema
};