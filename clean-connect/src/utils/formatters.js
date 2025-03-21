/**
 * Utilitaires pour le formatage des valeurs dans l'application
 */
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate un montant en devise (EUR)
 * Gère à la fois les nombres simples et les objets prix complexes
 * 
 * @param {number|Object} amount - Montant ou objet prix avec propriétés (baseAmount, commission, totalAmount)
 * @param {Object} options - Options de formatage
 * @returns {string} - Montant formaté (ex: 45,00 €)
 */
export const formatCurrency = (amount, options = {}) => {
  if (amount === null || amount === undefined) {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      ...options
    }).format(0);
  }
  
  if (typeof amount === 'object') {
    // For price objects with totalAmount
    if (amount.totalAmount !== undefined) {
      return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        ...options
      }).format(amount.totalAmount);
    } 
    // If there's a baseAmount but no totalAmount
    else if (amount.baseAmount !== undefined) {
      return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        ...options
      }).format(amount.baseAmount);
    }
    // If it has another numeric property we could use
    else {
      // Try to find any numeric property
      const numericProps = Object.entries(amount)
        .filter(([_, val]) => typeof val === 'number')
        .map(([key, val]) => ({ key, val }));
      
      if (numericProps.length > 0) {
        // Use the first numeric property found
        return new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'EUR',
          ...options
        }).format(numericProps[0].val);
      }
      
      // If no numeric property is found, return 0
      return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        ...options
      }).format(0);
    }
  }
  
  // For simple number values
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    ...options
  }).format(amount);
};

/**
 * Extraire une valeur numérique d'un prix (objet ou nombre)
 * 
 * @param {number|Object} price - Prix à extraire
 * @returns {number} - Valeur numérique extraite
 */
export const extractPriceValue = (price) => {
  if (price === null || price === undefined) {
    return 0;
  }
  
  if (typeof price === 'object') {
    if (price.totalAmount !== undefined) {
      return price.totalAmount;
    } else if (price.baseAmount !== undefined) {
      return price.baseAmount;
    } else {
      const numericValues = Object.values(price).filter(val => typeof val === 'number');
      return numericValues.length > 0 ? numericValues[0] : 0;
    }
  }
  
  return typeof price === 'number' ? price : 0;
};

/**
 * Formate une durée en minutes en texte lisible
 * 
 * @param {number} minutes - Nombre de minutes
 * @returns {string} - Durée formatée (ex: "1h 30min" ou "45min")
 */
export const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return "Durée inconnue";
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}min`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}min`;
  }
};

/**
 * Extrait une date à partir d'une valeur qui peut être complexe
 * Supporte les objets avec propriétés dateRequired, startDate, etc.
 * 
 * @param {*} value - Valeur à analyser pour extraire une date
 * @returns {string|Date|null} - Date extraite ou null si impossible
 */
export const extractDateFromValue = (value) => {
  if (!value) return null;
  
  // Cas 1: La valeur est déjà une Date
  if (value instanceof Date) return value;
  
  // Cas 2: La valeur est une chaîne de caractères (ISO)
  if (typeof value === 'string') return value;
  
  // Cas 3: La valeur est un objet avec une structure connue
  if (typeof value === 'object') {
    // Priorité 1: Format API Clean Connect avec dateRequired
    if (value.dateRequired) {
      if (value.dateRequired.startDate) return value.dateRequired.startDate;
    }
    
    // Priorité 2: Propriété startDate/date directe
    if (value.startDate) return value.startDate;
    if (value.date) return value.date;
    
    // Priorité 3: Recherche de toute propriété contenant 'date'
    const dateProps = Object.entries(value)
      .filter(([key, val]) => 
        key.toLowerCase().includes('date') && 
        (typeof val === 'string' || val instanceof Date)
      );
    
    if (dateProps.length > 0) return dateProps[0][1];
  }
  
  return null;
};

/**
 * Extrait des heures de début et fin à partir d'un objet
 * Supporte les formats dateRequired, et les propriétés directes (startTime, endTime)
 * 
 * @param {*} value - Objet contenant des informations de temps
 * @returns {Object} - Objet avec startTime et endTime
 */
export const extractTimeFromValue = (value) => {
  if (!value) return { startTime: null, endTime: null };
  
  // Si c'est juste une chaîne, on considère que c'est startTime
  if (typeof value === 'string') {
    return { startTime: value, endTime: null };
  }
  
  // Si c'est un objet, on cherche les propriétés pertinentes
  if (typeof value === 'object') {
    let startTime = null;
    let endTime = null;
    
    // Cas 1: Format API Clean Connect avec dateRequired
    if (value.dateRequired) {
      startTime = value.dateRequired.startTime || null;
      endTime = value.dateRequired.endTime || null;
    }
    
    // Cas 2: Propriétés directes
    if (!startTime && value.startTime) startTime = value.startTime;
    if (!endTime && value.endTime) endTime = value.endTime;
    
    // Si on a trouvé quelque chose, on le retourne
    return { startTime, endTime };
  }
  
  return { startTime: null, endTime: null };
};

/**
 * Formate une date avec gestion des erreurs
 * Supporte les formats ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
 * Supporte également les objets complexes avec propriétés dateRequired, startDate, etc.
 * 
 * @param {string|Date|Object} dateValue - Date à formater (ISO string, objet Date, ou objet complexe)
 * @param {string} formatStr - Format de sortie (ex: 'dd MMMM yyyy')
 * @param {Object} options - Options additionnelles
 * @returns {string} - Date formatée ou message par défaut
 */
export const formatDate = (dateValue, formatStr = 'dd MMMM yyyy', options = { locale: fr }) => {
  if (!dateValue) return "Date non disponible";
  
  try {
    // Extraire la date si c'est un objet complexe
    const extractedDate = extractDateFromValue(dateValue);
    if (!extractedDate) return "Date non disponible";
    
    let dateObject;
    
    if (extractedDate instanceof Date) {
      dateObject = extractedDate;
    } else if (typeof extractedDate === 'string') {
      // Handle ISO format strings properly using parseISO from date-fns
      dateObject = parseISO(extractedDate);
    } else {
      dateObject = new Date(extractedDate);
    }
    
    // Check if date is valid
    if (isNaN(dateObject.getTime())) {
      return "Date non disponible";
    }
    
    return format(dateObject, formatStr, options);
  } catch (error) {
    return "Date non disponible";
  }
};

/**
 * Formate une date et heure avec gestion des erreurs
 * 
 * @param {string|Date|Object} dateTimeValue - Date et heure à formater
 * @param {string} formatStr - Format de sortie (ex: 'dd MMMM yyyy à HH:mm')
 * @param {Object} options - Options additionnelles
 * @returns {string} - Date et heure formatées
 */
export const formatDateTime = (dateTimeValue, formatStr = 'dd MMMM yyyy à HH:mm', options = { locale: fr }) => {
  return formatDate(dateTimeValue, formatStr, options);
};

/**
 * Formate une plage horaire (startTime - endTime)
 * Accepte soit deux paramètres distincts, soit un objet avec startTime/endTime
 * 
 * @param {string|Object} startTimeOrObject - Heure de début (format 'HH:mm') ou objet avec startTime/endTime
 * @param {string} [endTimeParam] - Heure de fin (format 'HH:mm')
 * @returns {string} - Plage horaire formatée
 */
export const formatTimeRange = (startTimeOrObject, endTimeParam) => {
  try {
    let startTime, endTime;
    
    // Si le premier paramètre est un objet, extraire les heures
    if (typeof startTimeOrObject === 'object' && startTimeOrObject !== null) {
      const extractedTimes = extractTimeFromValue(startTimeOrObject);
      startTime = extractedTimes.startTime;
      endTime = extractedTimes.endTime;
    } else {
      // Sinon, utiliser les paramètres directement
      startTime = startTimeOrObject;
      endTime = endTimeParam;
    }
    
    if (!startTime || !endTime) {
      return "Horaire non disponible";
    }
    
    // Validation plus flexible des formats d'heure (permet hh:mm ou h:mm)
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return "Format d'horaire invalide";
    }
    
    // Formater en HH:MM si nécessaire (ajouter le zéro si manquant)
    const formatTimeIfNeeded = (timeStr) => {
      const parts = timeStr.split(':');
      if (parts[0].length === 1) {
        return `0${parts[0]}:${parts[1]}`;
      }
      return timeStr;
    };
    
    const formattedStartTime = formatTimeIfNeeded(startTime);
    const formattedEndTime = formatTimeIfNeeded(endTime);
    
    return `${formattedStartTime} - ${formattedEndTime}`;
  } catch (error) {
    return "Horaire non disponible";
  }
};

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTimeRange,
  formatDuration,
  extractPriceValue,
  extractDateFromValue,
  extractTimeFromValue
};