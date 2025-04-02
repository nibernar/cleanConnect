import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_ACTION_TYPES } from '../redux/actionTypes'; 
import Constants from 'expo-constants';
import { serializeResponse, extractData } from '../utils/api/responseSerializer'; 

const getBaseUrl = () => {
  const API_PORT = '5001';
  const API_VERSION = 'v1';
  if (Platform.OS === 'android') {
    if (/emulator|simulator/i.test(Constants.deviceName || '')) {
      console.log('Detected Android emulator, using 10.0.2.2');
      return `http://10.0.2.2:${API_PORT}/api/${API_VERSION}`;
    } else {
      console.log('Detected physical Android device, using IP address');
      return process.env.EXPO_PUBLIC_API_URL;
    }
  } else if (Platform.OS === 'ios') {
    if (/simulator/i.test(Constants.deviceName || '')) {
      console.log('Detected iOS simulator, using localhost');
      return `http://localhost:${API_PORT}/api/${API_VERSION}`;
    } else {
      console.log('Detected physical iOS device, using IP address');
      return process.env.EXPO_PUBLIC_API_URL || `http://192.168.1.100:${API_PORT}/api/${API_VERSION}`; 
    }
  } else {
    console.log('Using default API URL configuration (localhost)');
    return `http://localhost:${API_PORT}/api/${API_VERSION}`;
  }
};

const apiInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

console.log('🌐 API Base URL:', apiInstance.defaults.baseURL);

apiInstance.interceptors.request.use(request => {
  console.log('[API Interceptor] Request:', request.method.toUpperCase(), request.url);
  return request;
});

export const setupInterceptors = (store) => {
  apiInstance.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API Interceptor] Token applied:', config.method.toUpperCase(), config.url);
      } else {
        console.log('[API Interceptor] No token:', config.method.toUpperCase(), config.url);
      }
      return config;
    },
    (error) => {
      console.error('[API Interceptor] Request error:', error);
      return Promise.reject(error);
    }
  );

  apiInstance.interceptors.response.use(
    (response) => {
      console.log('[API Interceptor] Response OK:', response.status, response.config.method.toUpperCase(), response.config.url);
      return response; 
    },
    async (error) => {
      if (!error.response) {
        console.error('[API Interceptor] Network Error:', error.message, '- URL:', error.config?.url);
      } else {
        console.error('[API Interceptor] Response Error:', error.response.status, error.config?.method?.toUpperCase(), error.config?.url, 'Data:', error.response.data);
      }
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        console.warn('[API Interceptor] Unauthorized (401).');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            console.log('[API Interceptor] Refreshing token...');
            const refreshResponse = await axios.post(`${apiInstance.defaults.baseURL}/auth/refresh-token`, { refreshToken });
            const { token, refreshToken: newRefreshToken } = refreshResponse.data;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
            apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            console.log('[API Interceptor] Token refreshed. Retrying...');
            return apiInstance(originalRequest);
          } catch (refreshError) {
            console.error('[API Interceptor] Refresh failed. Logout.', refreshError.response?.data || refreshError.message);
            await AsyncStorage.multiRemove(['token', 'refreshToken']);
            delete apiInstance.defaults.headers.common['Authorization'];
            if (store?.dispatch) store.dispatch({ type: AUTH_ACTION_TYPES.LOGOUT + '/fulfilled' });
            return Promise.reject(refreshError);
          }
        } else {
          console.warn('[API Interceptor] No refresh token. Logout.');
          await AsyncStorage.removeItem('token');
          delete apiInstance.defaults.headers.common['Authorization'];
          if (store?.dispatch) store.dispatch({ type: AUTH_ACTION_TYPES.LOGOUT + '/fulfilled' });
        }
      }
      return Promise.reject(error);
    }
  );
};

// --- Définir les fonctions de service ici --- 
const get = async (url, params) => {
    const response = await apiInstance.get(url, { params });
    return response.data;
};
const post = async (url, data) => {
    const response = await apiInstance.post(url, data);
    return response.data;
};
const put = async (url, data) => {
    const response = await apiInstance.put(url, data);
    return response.data;
};
const patch = async (url, data) => {
    const response = await apiInstance.patch(url, data);
    return response.data;
};
const del = async (url) => {
    const response = await apiInstance.delete(url);
    return response.data;
};
const upload = async (url, formData) => {
    const response = await apiInstance.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
};

// Fonctions spécifiques (peuvent aussi être dans leurs propres fichiers service)
const getHostStats = async () => { return await get('/hosts/me/stats'); };
const getHostActiveListings = async (limit = 5) => { return await get(`/hosts/me/active-listings?limit=${limit}`); };
const getHostApplications = async () => { return await get('/hosts/me/applications'); };
const getCleanerStats = async () => { return await get('/cleaners/me/stats'); };
const getCleanerAvailableListings = async (limit = 5) => { return await get(`/cleaners/me/available-listings?limit=${limit}`); };

// --- Correction: Exporter l'objet comme export nommé --- 
export const api = {
  get,
  post,
  put,
  patch,
  delete: del,
  upload,
  getHostStats,
  getHostActiveListings,
  getHostApplications,
  getCleanerStats,
  getCleanerAvailableListings,
  setAuthToken: (token) => {
    if (token) {
      apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('[API Service] Auth token set globally');
    } else {
      delete apiInstance.defaults.headers.common['Authorization'];
      console.log('[API Service] Auth token cleared globally');
    }
  }
};

// Ne plus utiliser export default
// export default api;
