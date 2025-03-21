import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_ACTION_TYPES } from '../../../clean-connect/src/redux/authActions';
import Constants from 'expo-constants';
import { serializeResponse, extractData } from '../../../clean-connect/src/utils/api/responseSerializer';

// Configuration de l'URL de base pour l'API
const getBaseUrl = () => {
  // Configuration de fallback en fonction de la plateforme
  const API_PORT = '5001';
  const API_VERSION = 'v1';
  
  // Priorité 1: Sur Android en développement
  if (Platform.OS === 'android') {
    // Pour les émulateurs Android, utiliser 10.0.2.2 (pointant vers localhost de la machine hôte)
    if (/emulator|simulator/i.test(Constants.deviceName || '')) {
      console.log('Detected Android emulator, using 10.0.2.2');
      return `http://10.0.2.2:${API_PORT}/api/${API_VERSION}`;
    } 
    // Pour les appareils physiques Android, utiliser l'adresse IP du réseau local
    else {
      console.log('Detected physical Android device, using IP address');
      return process.env.EXPO_PUBLIC_API_URL;
    }
  }
  // Sur iOS en simulateur ou appareil physique
  else if (Platform.OS === 'ios') {
    // Sur simulateur iOS, localhost fonctionne
    if (/simulator/i.test(Constants.deviceName || '')) {
      console.log('Detected iOS simulator, using localhost');
      return `http://localhost:${API_PORT}/api/${API_VERSION}`;
    } 
    // Sur appareil physique iOS, utiliser l'adresse IP du réseau local
    else {
      console.log('Detected physical iOS device, using IP address');
      return `http://192.168.9.194:${API_PORT}/api/${API_VERSION}`;
    }
  }
  // Web ou autres plateformes
  else {
    console.log('Using default API URL configuration');
    return `http://localhost:${API_PORT}/api/${API_VERSION}`;
  }

  //  Utiliser la variable d'environnement EXPO_PUBLIC_API_URL
  // Cette approche garantit que l'adresse IP configurée dans .env sera utilisée
  if (process.env.EXPO_LOCAL_API) {
    console.log(`Using API URL from env variable: ${process.env.EXPO_LOCAL_API}`);
    return process.env.EXPO_LOCAL_API;
  }
  
  // Priorité 2: Utiliser la configuration Expo si disponible
  const envApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (envApiUrl) {
    console.log(`Using API URL from Expo config: ${envApiUrl}`);
    return envApiUrl;
  }
};

// Création de l'instance axios avec la configuration par défaut
const api = axios.create({
  // baseURL: 'http://localhost:5001/api/v1',
  baseURL: getBaseUrl(),
  timeout: 15000, // 15 secondes de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Afficher l'URL de base utilisée pour faciliter le débogage
console.log('🌐 API Base URL:', api.defaults.baseURL);

// Ajouter la journalisation des requêtes pour le débogage
api.interceptors.request.use(request => {
  console.log('API Request:', request.method.toUpperCase(), request.url);
  console.log('API Request Headers:', request.headers);
  return request;
});

/**
 * Configuration des intercepteurs axios pour l'authentification et la gestion des erreurs
 * @param {Object} store Store Redux
 */
export const setupInterceptors = (store) => {
  // Intercepteur de requête
  api.interceptors.request.use(
    async (config) => {
      // Récupérer le token depuis AsyncStorage
      const token = await AsyncStorage.getItem('token');
      
      // Si le token existe, l'ajouter aux en-têtes
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token applied to request:', config.method.toUpperCase(), config.url);
      } else {
        console.log('No auth token available for request:', config.method.toUpperCase(), config.url);
      }
      
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse
  api.interceptors.response.use(
    (response) => {
      console.log('API Response Success:', response.status, response.config.method.toUpperCase(), response.config.url);
      return response; // Retourner la réponse complète pour compatibilité
    },
    async (error) => {
      // Amélioré pour mieux afficher les erreurs réseau
      if (!error.response) {
        console.error('API Network Error - No server response. Check network connectivity and server status.');
        console.error('Request was to:', error.config?.method?.toUpperCase(), error.config?.url);
        console.error('Base URL:', api.defaults.baseURL);
        console.error('Error details:', error.message);
        
        // Informations de débogage supplémentaires
        if (error.request) {
          console.error('Request was made but no response received');
        } else {
          console.error('Error setting up the request:', error.message);
        }
      } else {
        console.error('API Response Error:', 
          error.response.status, 
          error.config?.method?.toUpperCase(), 
          error.config?.url,
          error.response.data
        );
      }
      
      const originalRequest = error.config;
      
      // Gestion de l'expiration de session (401 Unauthorized)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Vérifier si nous avons un refresh token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          try {
            // Tenter de rafraîchir le token
            const response = await axios.post(
              `${api.defaults.baseURL}/auth/refresh-token`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );
            
            // Si succès, sauvegarder les nouveaux tokens
            const { token, refreshToken: newRefreshToken } = response.data;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
            
            // Mettre à jour l'en-tête Authorization et réessayer la requête originale
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          } catch (refreshError) {
            // Si le rafraîchissement échoue, déconnecter l'utilisateur
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('refreshToken');
            
            if (store && store.dispatch) {
              store.dispatch({ type: AUTH_ACTION_TYPES.LOGOUT });
            }
            
            return Promise.reject(refreshError);
          }
        } else {
          // Pas de refresh token, déconnecter l'utilisateur
          await AsyncStorage.removeItem('token');
          
          if (store && store.dispatch) {
            store.dispatch({ type: AUTH_ACTION_TYPES.LOGOUT });
          }
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Services Host
const getHostStats = async () => {
  const response = await api.get('/hosts/me/stats');
  return extractData(serializeResponse(response));
};

const getHostActiveListings = async (limit = 5) => {
  const response = await api.get(`/hosts/me/active-listings?limit=${limit}`);
  return extractData(serializeResponse(response));
};

// Nouvelle fonction pour récupérer toutes les candidatures pour l'hôte courant
const getHostApplications = async () => {
  const response = await api.get('/hosts/me/applications');
  return extractData(serializeResponse(response));
};

// Services Cleaner
const getCleanerStats = async () => {
  const response = await api.get('/cleaners/me/stats');
  return extractData(serializeResponse(response));
};

const getCleanerAvailableListings = async (limit = 5) => {
  const response = await api.get(`/cleaners/me/available-listings?limit=${limit}`);
  return extractData(serializeResponse(response));
};

// Méthode upload pour les téléchargements de fichiers avec form data
const upload = async (url, formData) => {
  const response = await api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return extractData(serializeResponse(response));
};

// Méthodes HTTP générales avec sérialisation des réponses
const get = async (url, params) => {
  const response = await api.get(url, { params });
  return extractData(serializeResponse(response));
};

const post = async (url, data) => {
  const response = await api.post(url, data);
  return extractData(serializeResponse(response));
};

const put = async (url, data) => {
  const response = await api.put(url, data);
  return extractData(serializeResponse(response));
};

const patch = async (url, data) => {
  const response = await api.patch(url, data);
  return extractData(serializeResponse(response));
};

const del = async (url) => {
  const response = await api.delete(url);
  return extractData(serializeResponse(response));
};

// Exporter l'interface API
export default {
  // Méthodes HTTP générales
  get,
  post,
  put,
  patch,
  delete: del,
  upload,
  
  // Endpoints spécifiques Host
  getHostStats,
  getHostActiveListings,
  getHostApplications,
  
  // Endpoints spécifiques Cleaner
  getCleanerStats,
  getCleanerAvailableListings,
  
  // Fonction utilitaire pour définir manuellement le token d'authentification
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Auth token set globally');
    } else {
      delete api.defaults.headers.common['Authorization'];
      console.log('Auth token cleared globally');
    }
  }
};