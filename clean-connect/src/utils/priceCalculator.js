/**
 * Utilitaire de calcul des prix pour les annonces
 * Assure la cohérence entre le frontend et le backend
 */

/**
 * Calcule le prix d'une annonce en fonction de ses caractéristiques
 * @param {Object} listingData - Données de l'annonce
 * @returns {Object} - Prix calculé avec montant de base, commission et total
 */
export const calculateListingPrice = (listingData) => {
  // Base calculation
  const baseRate = 15.50; // 15,50€ par heure
  
  // Calculate duration in hours
  const startTime = listingData.startTime || '09:00';
  const endTime = listingData.endTime || '12:00';
  
  // Parse times
  const parseTime = (timeString) => {
    if (timeString instanceof Date) {
      return timeString.getHours() + (timeString.getMinutes() / 60);
    }
    
    const [hours, minutes] = timeString.split(':').map(part => parseInt(part, 10));
    return hours + (minutes / 60);
  };
  
  const startHours = parseTime(startTime);
  const endHours = parseTime(endTime);
  
  let duration = endHours - startHours;
  if (duration <= 0) duration = 2; // Default to 2 hours
  
  // Base price based on hours
  let baseAmount = baseRate * duration;
  
  // Add price based on square meters
  const squareMeters = parseFloat(listingData.squareMeters || listingData.area || 0);
  
  // Add 20% for every 50m² above 100m²
  if (squareMeters > 100) {
    const additionalSqMeters = squareMeters - 100;
    const additionalFactor = Math.floor(additionalSqMeters / 50) * 0.2;
    baseAmount += baseAmount * additionalFactor;
  }
  
  // Add price based on services
  // Each premium service adds 10% to the base price
  let services = [];
  if (Array.isArray(listingData.services)) {
    services = listingData.services;
  } else if (typeof listingData.services === 'object') {
    services = Object.entries(listingData.services)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  }
  
  const premiumServices = [
    'window_cleaning', 
    'laundry', 
    'bed_making', 
    'kitchen_cleaning',
    'Nettoyage des vitres',
    'Changement des draps',
    'Nettoyage cuisine'
  ];
  
  const premiumServiceCount = services.filter(service => 
    premiumServices.includes(service)
  ).length;
  
  baseAmount += baseAmount * (premiumServiceCount * 0.1);
  
  // Round to 2 decimal places
  baseAmount = Math.round(baseAmount * 100) / 100;
  
  // Calculate commission (15%)
  const commission = Math.round(baseAmount * 0.15 * 100) / 100;
  
  // Calculate total price
  const totalAmount = Math.round((baseAmount + commission) * 100) / 100;
  
  return {
    baseAmount,
    commission,
    totalAmount
  };
};

/**
 * Formater un prix en euros
 * @param {number} amount - Montant à formater
 * @returns {string} - Prix formaté (ex: 45,00 €)
 */
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount);
};

export default {
  calculateListingPrice,
  formatPrice
};