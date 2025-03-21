/**
 * Utilities to transform data between frontend and backend formats
 */
import { logTransformation } from './debugUtils';

/**
 * Transform frontend listing data to backend format
 * @param {Object} frontendListing - Listing data from the frontend
 * @returns {Object} Formatted data for the backend
 */
export const transformListingToBackend = (frontendListing) => {
  // Extract city and postal code from address if possible
  let city = 'Non spécifiée';
  let postalCode = '00000';
  
  // Simple regex to extract postal code from address
  const postalCodeMatch = frontendListing.address && frontendListing.address.match(/\b\d{5}\b/);
  if (postalCodeMatch) {
    postalCode = postalCodeMatch[0];
  }
  
  // Handle dates properly
  const startDate = frontendListing.date instanceof Date 
    ? frontendListing.date 
    : new Date(frontendListing.date || Date.now());
  
  // Format times from Date objects if needed
  const formatTime = (timeVal) => {
    if (!timeVal) return '00:00';
    if (timeVal instanceof Date) {
      return `${String(timeVal.getHours()).padStart(2, '0')}:${String(timeVal.getMinutes()).padStart(2, '0')}`;
    }
    return timeVal;
  };
  
  // Transform services format
  let services = [];
  if (frontendListing.services) {
    if (Array.isArray(frontendListing.services)) {
      services = frontendListing.services;
    } else {
      // If it's an object with boolean values (from form)
      services = Object.entries(frontendListing.services)
        .filter(([_, value]) => value === true)
        .map(([key]) => mapServiceToBackend(key));
    }
  }
  
  // Transform equipment format
  let equipment = [];
  if (frontendListing.equipment) {
    if (Array.isArray(frontendListing.equipment)) {
      equipment = frontendListing.equipment;
    } else {
      // If it's an object with boolean values (from form)
      equipment = Object.entries(frontendListing.equipment)
        .filter(([_, value]) => value === true)
        .map(([key]) => mapEquipmentToBackend(key));
    }
  }
  
  // CORRECTION: Inclure les données de prix si elles existent
  // Ce changement résout le problème d'envoi du prix total au backend
  let priceData = {};
  if (frontendListing.price) {
    if (typeof frontendListing.price === 'object') {
      priceData = {
        basePrice: frontendListing.price.baseAmount,
        commission: frontendListing.price.commission,
        totalPrice: frontendListing.price.totalAmount
      };
    } else {
      // Si le prix est juste un nombre, on présume que c'est le prix total
      priceData = {
        totalPrice: frontendListing.price
      };
    }
  }
  
  const result = {
    title: frontendListing.title || 'Annonce de ménage',
    accommodationType: mapAccommodationTypeToBackend(frontendListing.accommodationType),
    address: frontendListing.address,
    city: city,
    postalCode: postalCode,
    coordinates: frontendListing.coordinates || [0, 0],
    date: startDate,
    startTime: formatTime(frontendListing.startTime),
    endTime: formatTime(frontendListing.endTime),
    personCount: parseInt(frontendListing.peopleNeeded || frontendListing.personCount || 1, 10),
    squareMeters: parseFloat(frontendListing.area || frontendListing.squareMeters || 0),
    services: services,
    equipment: equipment,
    notes: frontendListing.notes || frontendListing.additionalNotes || '',
    // CORRECTION: Ajouter les données de prix calculées
    ...priceData
  };
  
  // Log the transformation for debugging
  logTransformation('to-backend', frontendListing, result);
  
  return result;
};

/**
 * Transform backend listing data to frontend format
 * @param {Object} backendListing - Listing data from the backend
 * @returns {Object} Formatted data for the frontend
 */
export const transformListingToFrontend = (backendListing) => {
  // If it's a complete success response, extract data
  const listing = backendListing.data || backendListing;
  
  // Format the date as ISO string instead of Date object for Redux serialization
  let date = new Date();
  if (listing.dateRequired?.startDate) {
    date = new Date(listing.dateRequired.startDate);
  } else if (listing.date) {
    date = new Date(listing.date);
  }
  // Convert Date to ISO string for Redux serialization
  const dateISOString = date.toISOString();
  
  // Calculate price to display
  let price = listing.price?.totalAmount || listing.price || 0;
  if (typeof price === 'object' && price.totalAmount) {
    price = price.totalAmount;
  }
  
  // Format address from location object
  let address = '';
  if (listing.location?.address) {
    address = listing.location.address;
    if (listing.location.postalCode && !address.includes(listing.location.postalCode)) {
      address += `, ${listing.location.postalCode}`;
    }
    if (listing.location.city && !address.includes(listing.location.city)) {
      address += ` ${listing.location.city}`;
    }
  } else if (listing.address) {
    address = listing.address;
  }
  
  // Format services
  let services = listing.services || [];
  
  // Format equipment
  let equipment = [];
  if (listing.equipment) {
    if (Array.isArray(listing.equipment)) {
      equipment = listing.equipment;
    } else {
      // Convert from object format to array
      if (listing.equipment.vacuumCleaner) equipment.push('vacuum');
      if (listing.equipment.mop) equipment.push('mop');
      if (listing.equipment.cleaningProducts) equipment.push('products');
      if (listing.equipment.other && Array.isArray(listing.equipment.other)) {
        equipment = [...equipment, ...listing.equipment.other];
      }
    }
  }
  
  // Get applicants count
  const applicantsCount = listing.applications ? listing.applications.length : 0;
  
  const result = {
    id: listing._id || listing.id,
    title: listing.title || 'Annonce de ménage',
    accommodationType: mapAccommodationTypeToFrontend(listing.accommodationType),
    address: address,
    // Store date as ISO string instead of Date object
    date: dateISOString,
    startTime: listing.dateRequired?.startTime || listing.startTime || '09:00',
    endTime: listing.dateRequired?.endTime || listing.endTime || '12:00',
    personCount: listing.numberOfCleaners || listing.personCount || 1,
    area: listing.area || listing.squareMeters || 0,
    squareMeters: listing.area || listing.squareMeters || 0,
    services: services,
    equipment: equipment,
    notes: listing.additionalNotes || listing.notes || '',
    price: price,
    status: listing.status || 'published',
    applicantsCount: applicantsCount,
    applications: listing.applications || [],
    bookedCleaners: listing.bookedCleaners || [],
    // Store createdAt as ISO string instead of Date object
    createdAt: listing.createdAt ? new Date(listing.createdAt).toISOString() : new Date().toISOString(),
  };
  
  // Log the transformation for debugging
  logTransformation('to-frontend', listing, result);
  
  return result;
};

// Helper functions for mapping values
function mapAccommodationTypeToBackend(type) {
  const mapping = {
    'Appartement': 'apartment',
    'Maison': 'house',
    'Studio': 'apartment',
    'Loft': 'apartment',
    'Villa': 'villa',
    "Chambre d'hôtel": 'hotel_room'
  };
  
  return mapping[type] || 'other';
}

function mapAccommodationTypeToFrontend(type) {
  const mapping = {
    'apartment': 'Appartement',
    'house': 'Maison',
    'villa': 'Villa',
    'hotel_room': "Chambre d'hôtel",
    'other': 'Autre'
  };
  
  return mapping[type] || 'Autre';
}

function mapServiceToBackend(service) {
  const mapping = {
    'Dépoussiérage': 'regular_cleaning',
    'Nettoyage des sols': 'regular_cleaning',
    'Nettoyage salle de bain': 'bathroom_cleaning',
    'Nettoyage cuisine': 'kitchen_cleaning',
    'Changement des draps': 'bed_making',
    'Nettoyage des vitres': 'window_cleaning'
  };
  
  return mapping[service] || 'regular_cleaning';
}

function mapEquipmentToBackend(equipment) {
  const mapping = {
    'Aspirateur': 'vacuum',
    'Serpillière': 'mop',
    'Produits ménagers': 'products',
    'Lave-vaisselle': 'dishwasher',
    'Lave-linge': 'washer'
  };
  
  return mapping[equipment] || equipment;
}