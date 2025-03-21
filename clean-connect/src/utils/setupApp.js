/**
 * Configuration initiale de l'application
 * Ce fichier centralise toutes les initialisations nécessaires pour que l'application
 * fonctionne correctement en environnement client et serveur
 */
import { Platform } from 'react-native';
import { store } from '../redux/store';
import { initializeReduxPersist } from './reduxInitializer';
import { isClient } from './ssrHelpers';

/**
 * Configure l'application pour le SSR
 * Cette fonction initialise toutes les dépendances qui doivent être
 * configurées différemment entre client et serveur
 */
export const setupApp = () => {
  // Éviter les initialisations côté serveur pour les API spécifiques au navigateur
  if (isClient) {
    // Initialiser Redux Persist seulement côté client
    // Cette fonction récupèrera l'instance persistor déjà créée dans store.js
    initializeReduxPersist(store);
    
    // Autres initialisations spécifiques au client peuvent être ajoutées ici
  }
  
  // Configuration des polyfills si nécessaire
  configurePolyfills();
  
  return true;
};

/**
 * Configure les polyfills nécessaires pour l'application
 */
const configurePolyfills = () => {
  // Polyfill pour window s'il est accédé en SSR
  if (!isClient && typeof global !== 'undefined') {
    // Simuler window côté serveur pour éviter les erreurs
    global.window = {};
    
    // Simuler le localStorage en mémoire pour SSR
    global.localStorage = {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null
    };
    
    // Autres polyfills nécessaires...
  }
};

/**
 * Détermine si nous sommes en environnement de développement et de débogage
 */
export const isDevEnvironment = __DEV__;
export const isDebugMode = 
  isDevEnvironment && 
  (Platform.OS === 'web' 
    ? process.env.NODE_ENV !== 'production' 
    : true);

// Exécuter la configuration au chargement du module
setupApp();