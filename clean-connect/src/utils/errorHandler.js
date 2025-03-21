/**
 * Centralized error handling utility for the application
 * Provides consistent error handling across components and services
 */

// Map of error codes to user-friendly messages
const ERROR_MESSAGES = {
  // Authentication errors
  'auth/invalid-credentials': 'Email ou mot de passe incorrect',
  'auth/user-not-found': 'Aucun utilisateur trouvé avec ces identifiants',
  'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
  'auth/weak-password': 'Le mot de passe est trop faible',
  'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action',
  'auth/unauthorized': 'Vous n\'êtes pas autorisé à effectuer cette action',
  
  // Network errors
  'network/no-connection': 'Pas de connexion internet',
  'network/timeout': 'Délai d\'attente dépassé, veuillez réessayer',
  'network/server-error': 'Erreur serveur, veuillez réessayer plus tard',
  
  // Listing errors
  'listings/not-found': 'Annonce introuvable',
  'listings/creation-failed': 'Échec de création de l\'annonce',
  'listings/update-failed': 'Échec de mise à jour de l\'annonce',
  'listings/deletion-failed': 'Échec de suppression de l\'annonce',
  'listings/invalid-data': 'Données d\'annonce invalides',
  
  // Application errors
  'application/already-applied': 'Vous avez déjà postulé à cette annonce',
  'application/not-available': 'Cette annonce n\'est plus disponible',
  'application/action-failed': 'L\'action sur la candidature a échoué',
  
  // Generic errors
  'unknown': 'Une erreur inconnue est survenue',
  'validation': 'Veuillez vérifier les champs du formulaire',
  'permission-denied': 'Vous n\'avez pas les permissions nécessaires',
  'not-found': 'Ressource introuvable',
  'server-error': 'Erreur serveur, veuillez réessayer ultérieurement',
};

/**
 * Get a user-friendly error message from an error object or code
 * @param {Error|string} error - Error object or error code
 * @param {string} defaultMessage - Fallback message if no match is found
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = 'Une erreur est survenue') => {
  // If it's a string, assume it's an error code
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || defaultMessage;
  }
  
  // If it's an error object with a code
  if (error && error.code) {
    return ERROR_MESSAGES[error.code] || error.message || defaultMessage;
  }
  
  // If it's a response error with a message
  if (error && error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  
  // If it's a standard Error object
  if (error && error.message) {
    return error.message;
  }
  
  // Fallback
  return defaultMessage;
};

/**
 * Log an error to the console and, if in production, to an error reporting service
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @param {Object} additionalData - Any additional data to include
 */
export const logError = (error, context = '', additionalData = {}) => {
  // Always log to console
  console.error(`[${context}] Error:`, error, additionalData);
  
  // In production, we would log to an error reporting service like Sentry
  if (!__DEV__) {
    // Example: Sentry.captureException(error, { extra: { context, ...additionalData } });
    // Implement actual error reporting here when ready
  }
};

/**
 * Handle API errors consistently
 * @param {Error} error - The error from the API call
 * @param {Function} dispatch - Redux dispatch function if available
 * @param {string} actionType - Redux action type for error if applicable
 * @param {Function} callback - Optional callback to execute
 * @returns {string} User-friendly error message
 */
export const handleApiError = (error, dispatch = null, actionType = null, callback = null) => {
  const errorMessage = getErrorMessage(error);
  
  // Log the error
  logError(error, 'API Call', { errorMessage });
  
  // Dispatch error action if provided
  if (dispatch && actionType) {
    dispatch({ 
      type: actionType, 
      payload: errorMessage 
    });
  }
  
  // Execute callback if provided
  if (callback && typeof callback === 'function') {
    callback(errorMessage);
  }
  
  return errorMessage;
};

/**
 * Validate form data against a schema
 * @param {Object} data - Form data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Object with isValid flag and errors object
 */
export const validateForm = (data, schema) => {
  const errors = {};
  let isValid = true;
  
  // Simple validation based on schema
  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    
    // Required validation
    if (rules.required && (!data[field] || 
        (typeof data[field] === 'string' && !data[field].trim()))) {
      errors[field] = rules.requiredMessage || 'Ce champ est requis';
      isValid = false;
    }
    
    // Min length validation
    if (data[field] && rules.minLength && data[field].length < rules.minLength) {
      errors[field] = rules.minLengthMessage || 
        `Ce champ doit contenir au moins ${rules.minLength} caractères`;
      isValid = false;
    }
    
    // Max length validation
    if (data[field] && rules.maxLength && data[field].length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || 
        `Ce champ ne peut pas dépasser ${rules.maxLength} caractères`;
      isValid = false;
    }
    
    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(data[field], data);
      if (customError) {
        errors[field] = customError;
        isValid = false;
      }
    }
  });
  
  return { isValid, errors };
};

export default {
  getErrorMessage,
  logError,
  handleApiError,
  validateForm
};