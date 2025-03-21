/**
 * Service centralisé pour la gestion des redirections basées sur l'authentification et le type d'utilisateur
 */
import { router } from 'expo-router';
import { getState } from '../redux/storeAccessor';
import { determineUserType } from './userTypeDetector';

// Variable de sécurité pour éviter la navigation avant initialisation complète
let isNavigationReady = false;

/**
 * Routes principales de l'application
 */
export const ROUTES = {
  LOGIN: '/(auth)/',
  REGISTER_CHOICE: '/register-choice',
  DASHBOARD: '/dashboard',
  HOST_DASHBOARD: '/host/dashboard',
  CLEANER_DASHBOARD: '/cleaner/dashboard', 
  // Tableau de bord spécifiques
  HOST_LISTINGS: '/(host)/listings',
  CLEANER_LISTINGS: '/(cleaner)/listings'
};

/**
 * Marque le système de navigation comme prêt à recevoir des commandes
 */
export function setNavigationReady(ready = true) {
  console.log(`[RoutingService] Navigation system marked as ${ready ? 'READY' : 'NOT READY'}`);
  isNavigationReady = ready;
}

/**
 * Effectue une navigation sécurisée qui ne s'exécute que si le système est prêt
 * @param {Function} navigationFn - Fonction de navigation à exécuter
 */
export function safeNavigate(navigationFn) {
  if (!isNavigationReady) {
    console.log('[RoutingService] ⚠️ Navigation tentée avant initialisation, opération mise en attente');
    // Option 1: On pourrait stocker la navigation pour l'exécuter plus tard
    // Option 2: On n'exécute pas la navigation si le système n'est pas prêt
    return false;
  }
  
  // Le système est prêt, on peut naviguer
  navigationFn();
  return true;
}

/**
 * Redirige l'utilisateur vers la page appropriée en fonction de son statut d'authentification
 * @param {boolean} isAuthenticated - Si l'utilisateur est authentifié
 * @param {Object} user - Les données de l'utilisateur (optionnel)
 */
export function redirectBasedOnAuth(isAuthenticated, user = null) {
  console.log('[RoutingService] Redirection basée sur auth:', { isAuthenticated, userID: user?.id });
  
  if (!isAuthenticated) {
    console.log('[RoutingService] Utilisateur non authentifié, redirection vers login');
    safeNavigate(() => router.replace(ROUTES.LOGIN));
    return;
  }
  
  // Si authentifié, rediriger vers le tableau de bord approprié
  redirectToDashboard(user);
}

/**
 * Redirige l'utilisateur vers le tableau de bord approprié en fonction de son type
 * @param {Object} user - Les données de l'utilisateur (optionnel)
 */
export function redirectToDashboard(user = null) {
  const state = getState();
  const userType = determineUserType(user || state?.auth?.user, state, 'routingService');
  
  console.log('[RoutingService] Redirection vers dashboard:', { userType });
  
  if (!userType) {
    console.log('[RoutingService] Type utilisateur non détecté, redirection générique');
    safeNavigate(() => router.replace(ROUTES.DASHBOARD));
    return;
  }
  
  switch (userType) {
    case 'host':
      console.log('[RoutingService] Redirection vers dashboard host');
      safeNavigate(() => router.replace(ROUTES.HOST_DASHBOARD));
      break;
    case 'cleaner':
      console.log('[RoutingService] Redirection vers dashboard cleaner');
      safeNavigate(() => router.replace(ROUTES.CLEANER_DASHBOARD));
      break;
    default:
      console.log('[RoutingService] Type utilisateur inconnu, redirection générique');
      safeNavigate(() => router.replace(ROUTES.DASHBOARD));
  }
}

/**
 * Vérifie si l'utilisateur est dans le bon groupe de routes selon son type
 * @param {string[]} segments - Les segments de route actuels
 * @param {string} userType - Le type d'utilisateur
 * @returns {boolean} - True si l'utilisateur est dans le bon groupe
 */
export function isUserInCorrectRouteGroup(segments, userType) {
  if (!segments || !userType) return false;
  
  const inHostGroup = segments[0] === '(host)';
  const inCleanerGroup = segments[0] === '(cleaner)';
  
  return (userType === 'host' && inHostGroup) || 
         (userType === 'cleaner' && inCleanerGroup);
}

/**
 * Crée un gestionnaire de navigation intelligent pour les actions utilisateur
 * @param {Function} navigate - La fonction de navigation à utiliser
 * @returns {Object} - Les fonctions de navigation adaptées
 */
export function createSmartNavigation(navigate) {
  return {
    goToListings: (userType) => {
      if (userType === 'host') {
        navigate(ROUTES.HOST_LISTINGS);
      } else if (userType === 'cleaner') {
        navigate(ROUTES.CLEANER_LISTINGS);
      }
    },
    // Ajouter d'autres fonctions de navigation intelligentes selon les besoins
  };
}