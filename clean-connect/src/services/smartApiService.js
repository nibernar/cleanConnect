/**
 * Service API intelligent qui sélectionne automatiquement le bon endpoint 
 * en fonction du type d'utilisateur
 */
import { determineUserType, getTypeSpecificEndpoints } from '../utils/userTypeDetector';
import api from './api';
import { getState } from '../redux/storeAccessor';
import { apiCallWithDebugFallback } from '../utils/apiDebugUtils';

/**
 * Obtient le type d'utilisateur actuel
 */
const getCurrentUserType = () => {
  const state = getState();
  const { user } = state.auth;
  return determineUserType(user, state, 'smartApiService');
};

/**
 * Récupère les statistiques adaptées au type d'utilisateur
 */
export const getStats = async () => {
  const userType = getCurrentUserType();
  const endpoints = getTypeSpecificEndpoints(userType);
  
  console.log(`[SmartAPI] Getting stats for ${userType} using endpoint: ${endpoints.stats}`);

  // Utiliser un wrapper sécurisé pour l'appel API avec fallback
  return apiCallWithDebugFallback(() => api.get(endpoints.stats), {
    endpointType: 'stats',
    userType,
    fallback: { success: true, data: { bookings: 0, earnings: 0, listings: 0 } }
  });
};

/**
 * Récupère les annonces adaptées au type d'utilisateur
 * @param {number} limit - Limite du nombre d'annonces à récupérer
 */
export const getListings = async (limit = 5) => {
  const userType = getCurrentUserType();
  const endpoints = getTypeSpecificEndpoints(userType);
  
  console.log(`[SmartAPI] Getting listings for ${userType} using endpoint: ${endpoints.listings}`);
  
  // Utiliser un wrapper sécurisé pour l'appel API avec fallback
  return apiCallWithDebugFallback(() => api.get(`${endpoints.listings}?limit=${limit}`), {
    endpointType: 'listings',
    userType,
    fallback: { success: true, data: [] }
  });
};

/**
 * Récupère les candidatures adaptées au type d'utilisateur
 */
export const getApplications = async () => {
  const userType = getCurrentUserType();
  const endpoints = getTypeSpecificEndpoints(userType);
  
  console.log(`[SmartAPI] Getting applications for ${userType} using endpoint: ${endpoints.applications}`);
  
  // Utiliser un wrapper sécurisé pour l'appel API avec fallback
  return apiCallWithDebugFallback(() => api.get(endpoints.applications), {
    endpointType: 'applications',
    userType,
    fallback: { success: true, data: [] }
  });
};

/**
 * Récupère le nombre de notifications non lues
 */
export const getUnreadNotificationCount = async () => {
  console.log('[SmartAPI] Getting unread notification count');
  
  // Cette route est commune à tous les types d'utilisateurs
  return apiCallWithDebugFallback(() => api.get('/notifications/unread-count'), {
    endpointType: 'notifications',
    fallback: { success: true, data: 0 }
  });
};

/**
 * Obtient les données de l'utilisateur sécurisément
 */
export const getUserProfile = async () => {
  console.log('[SmartAPI] Getting user profile');
  
  // Cette route est commune à tous les types d'utilisateurs
  return apiCallWithDebugFallback(() => api.get('/users/profile'), {
    endpointType: 'profile',
    fallback: null
  });
};

export default {
  getStats,
  getListings,
  getApplications,
  getUnreadNotificationCount,
  getUserProfile
};