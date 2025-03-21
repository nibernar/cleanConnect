/**
 * Utilitaires pour le débogage de l'intégration frontend/backend
 */

const DEBUG_ENABLED = true; // Activer/désactiver le débogage global

/**
 * Log transformations de données pour débogage
 * @param {string} direction - 'to-backend' ou 'to-frontend'
 * @param {Object} inputData - Données avant transformation
 * @param {Object} outputData - Données après transformation
 */
export const logTransformation = (direction, inputData, outputData) => {
  if (!DEBUG_ENABLED) return;
  
  console.group(`🔄 Transformation de données (${direction})`);
  console.log('📥 Données d\'entrée:', inputData);
  console.log('📤 Données de sortie:', outputData);
  console.groupEnd();
};

/**
 * Log requête API pour débogage
 * @param {string} method - Méthode HTTP (GET, POST, etc.)
 * @param {string} url - URL de la requête
 * @param {Object} data - Données envoyées (pour POST, PUT)
 */
export const logApiRequest = (method, url, data) => {
  if (!DEBUG_ENABLED) return;
  
  console.group(`🌐 Requête API (${method})`);
  console.log('🔗 URL:', url);
  if (data) {
    console.log('📦 Données:', data);
  }
  console.groupEnd();
};

/**
 * Log réponse API pour débogage
 * @param {string} method - Méthode HTTP (GET, POST, etc.)
 * @param {string} url - URL de la requête
 * @param {Object} response - Réponse reçue
 * @param {Object} error - Erreur éventuelle
 */
export const logApiResponse = (method, url, response, error) => {
  if (!DEBUG_ENABLED) return;
  
  if (error) {
    console.group(`❌ Erreur API (${method} ${url})`);
    console.error('⚠️ Erreur:', error);
    console.groupEnd();
    return;
  }
  
  console.group(`✅ Réponse API (${method} ${url})`);
  console.log('📦 Données:', response);
  console.groupEnd();
};

/**
 * Mesurer le temps d'exécution d'une fonction
 * @param {Function} fn - Fonction à mesurer
 * @param {string} label - Label pour identifier la mesure
 * @returns {Function} - Fonction avec mesure de performance
 */
export const measurePerformance = (fn, label) => {
  return async (...args) => {
    if (!DEBUG_ENABLED) return fn(...args);
    
    console.time(`⏱️ ${label}`);
    try {
      const result = await fn(...args);
      console.timeEnd(`⏱️ ${label}`);
      return result;
    } catch (error) {
      console.timeEnd(`⏱️ ${label}`);
      throw error;
    }
  };
};

/**
 * Utilitaire pour inspecter l'état Redux pour débogage
 * @param {Object} state - État Redux
 * @param {string} path - Chemin dans l'état Redux (ex: 'listings.myListings')
 */
export const inspectReduxState = (state, path) => {
  if (!DEBUG_ENABLED) return;
  
  const parts = path.split('.');
  let value = state;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      console.log(`❓ Chemin invalide: ${path}`);
      return;
    }
  }
  
  console.group(`🔍 Inspection Redux: ${path}`);
  console.log(value);
  console.groupEnd();
};

export default {
  logTransformation,
  logApiRequest,
  logApiResponse,
  measurePerformance,
  inspectReduxState
};