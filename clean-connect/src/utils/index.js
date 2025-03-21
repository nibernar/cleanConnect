/**
 * Point d'entrée pour les utilitaires
 * Initialise également les outils de développement en mode DEV
 */

// Exporter tous les utilitaires
export * from './dataAdapters';
export * from './priceCalculator';
export * from './debugUtils';
export * from './integrationChecker';
export * from './debug';
export * from './formatters'; // Nouvelles fonctions de formatage

// Initialiser les outils de débogage
import './debug';

// Exporter les couleurs et constantes communes
export { default as colors } from './colors';
export { default as apiConfig } from './apiConfig';

/**
 * Fonction d'initialisation globale des utilitaires
 * À appeler au démarrage de l'application si nécessaire
 */
export const initializeUtils = () => {
  // En mode développement, configurer des outils supplémentaires
  if (__DEV__) {
    // Afficher un message de bienvenue dans la console pour les développeurs
    console.log(
      '%c🔍 Clean Connect DEV Mode Enabled 🔍',
      'background: #1E90FF; color: white; font-size: 14px; font-weight: bold; padding: 5px 10px; border-radius: 5px;'
    );
    
    // Initialiser les outils de diagnostics (chargés via debug.js)
    console.log('📊 Diagnostic tools available via global.debugTools');
    console.log('👉 Try: global.debugTools.runDiagnostic()');
  }
};

export default {
  initializeUtils
};