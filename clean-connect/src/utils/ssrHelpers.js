/**
 * Utilitaires pour gérer le Server-Side Rendering (SSR) dans l'application
 */

// Détecte si nous sommes dans un environnement serveur
export const isServer = typeof window === 'undefined';
export const isClient = !isServer;

/**
 * Execute une fonction uniquement côté client
 * @param {Function} fn - La fonction à exécuter
 * @param {*} defaultValue - Valeur par défaut à retourner côté serveur
 * @returns {*} Le résultat de la fonction ou la valeur par défaut
 */
export const executeOnlyOnClient = (fn, defaultValue = null) => {
  if (isServer) return defaultValue;
  return fn();
};

/**
 * Retarde l'exécution d'une fonction jusqu'à ce que le DOM soit prêt
 * Utile pour les opérations qui nécessitent l'accès au DOM
 * @param {Function} callback - La fonction à exécuter
 */
export const runWhenClientReady = (callback) => {
  if (isServer) return;
  
  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback);
    return () => window.removeEventListener('load', callback);
  }
};

/**
 * Wrapper pour les méthodes d'AsyncStorage qui peuvent échouer en SSR
 * @param {Function} asyncStorageMethod - Méthode d'AsyncStorage à exécuter
 * @param {Array} args - Arguments pour la méthode
 * @param {*} defaultValue - Valeur par défaut à retourner en SSR
 * @returns {Promise<*>} Résultat de la méthode ou valeur par défaut
 */
export const safeAsyncStorage = async (asyncStorageMethod, args = [], defaultValue = null) => {
  if (isServer) return defaultValue;
  
  try {
    return await asyncStorageMethod(...args);
  } catch (error) {
    console.warn('AsyncStorage error:', error);
    return defaultValue;
  }
};