/**
 * Utilitaires de débogage et de gestion des erreurs API
 */

// Nombre maximum de tentatives pour les appels API
const MAX_RETRIES = 2;
// Délai entre les tentatives (augmentation exponentielle)
const RETRY_DELAY_MS = 1000;

/**
 * Journalise une requête API pour le débogage
 * @param {string} method - La méthode HTTP
 * @param {string} url - L'URL de la requête 
 * @param {Object} data - Les données de la requête (optionnel)
 */
export function logApiRequest(method, url, data) {
  console.log(`📤 API Request: ${method.toUpperCase()} ${url}`);
  if (data) {
    console.log('📦 Request Data:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  }
}

/**
 * Journalise une réponse API pour le débogage
 * @param {number} status - Le code de statut HTTP
 * @param {string} method - La méthode HTTP
 * @param {string} url - L'URL de la requête
 * @param {Object} data - Les données de réponse (optionnel)
 */
export function logApiResponse(status, method, url, data) {
  if (status >= 200 && status < 300) {
    console.log(`✅ API Response Success: ${status} ${method.toUpperCase()} ${url}`);
  } else {
    console.error(`❌ API Response Error: ${status} ${method.toUpperCase()} ${url}`, data);
  }
}

/**
 * Obtient l'URL de base de l'API à partir d'Expo Constants ou d'une valeur par défaut
 * @returns {string} L'URL de base de l'API
 */
export function getApiBaseUrl() {
  try {
    // Utiliser une valeur par défaut si l'importation échoue
    return 'http://localhost:5001/api/v1';
  } catch (error) {
    console.warn('Failed to get API URL from config, using default');
    return 'http://localhost:5001/api/v1';
  }
}

/**
 * Vérifie si un token d'authentification est configuré dans les en-têtes
 * @param {Object} headers - Les en-têtes HTTP
 * @returns {boolean} True si un token est configuré
 */
export function checkAuthToken(headers) {
  return Boolean(
    headers && 
    (headers.Authorization || headers.authorization)
  );
}

/**
 * Fonction utilitaire pour appeler une API avec valeur de fallback en cas d'erreur
 * Utile pour éviter les erreurs fatales sur les écrans où certaines données sont optionnelles
 * 
 * @param {Function} apiCall - La fonction d'appel API à exécuter
 * @param {Object} options - Options de configuration
 * @param {string} options.endpointType - Type d'endpoint pour le logging
 * @param {string} options.userType - Type d'utilisateur pour le contexte
 * @param {any} options.fallback - Valeur de fallback en cas d'erreur
 * @returns {Promise<any>} La réponse API ou la valeur de fallback
 */
export async function apiCallWithDebugFallback(apiCall, options = {}) {
  const { endpointType, userType, fallback = null } = options;
  
  try {
    // Journaliser le contexte de l'appel
    console.log(`🔍 API ${endpointType || 'call'} for ${userType || 'user'}`);
    
    // Appeler l'API avec système de retry
    return await apiCallWithRetry(apiCall);
  } catch (error) {
    console.error(`❌ API Error: ${endpointType || 'call'} failed`, error);
    console.log(`⚠️ Using fallback data for ${endpointType}`);
    
    // Retourner la valeur de fallback
    return fallback;
  }
}

/**
 * Fonction utilitaire pour réessayer automatiquement un appel API en cas d'erreur
 * 
 * @param {Function} apiCall - La fonction d'appel API à exécuter
 * @param {Object} options - Options de configuration
 * @param {number} options.maxRetries - Nombre maximum de tentatives
 * @param {number} options.delayMs - Délai entre les tentatives
 * @returns {Promise<any>} La réponse API
 */
export async function apiCallWithRetry(apiCall, options = {}) {
  const { maxRetries = MAX_RETRIES, delayMs = RETRY_DELAY_MS } = options;
  
  let lastError;
  
  // Essayer jusqu'à maxRetries fois
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Si c'est une réessai, journaliser
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}`);
      }
      
      // Effectuer l'appel
      const response = await apiCall();
      return response;
    } catch (error) {
      lastError = error;
      
      // Extraire le code de statut HTTP
      const status = error.response?.status;
      
      console.error(`❌ API Error: API Call failed on attempt ${attempt}`, error);
      
      // Ne pas réessayer pour les erreurs 4xx (sauf 429 - too many requests)
      if (status >= 400 && status < 500 && status !== 429) {
        console.log(`⛔ Not retrying due to client error (${status})`);
        break;
      }
      
      // Attendre avant de réessayer (sauf sur la dernière tentative)
      if (attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(2, attempt);
        console.log(`⏱️ Waiting ${waitTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // Si toutes les tentatives ont échoué
  console.error(`❌ All ${maxRetries} retry attempts failed`);
  throw lastError;
}