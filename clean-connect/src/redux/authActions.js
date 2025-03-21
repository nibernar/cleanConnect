import { createAsyncThunk } from '@reduxjs/toolkit';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storageUtils';
import authService from '../services/authService';
import { apiService } from '../services/apiService';
import { router } from 'expo-router';
import { syncUserWithAuth } from './slices/userSlice';
import { determineUserType } from '../utils/userTypeDetector';
import { redirectBasedOnAuth } from '../utils/routingService';

// Définition des types d'actions pour être utilisés à la fois dans authSlice et authActions
export const AUTH_ACTION_TYPES = {
  LOGIN: 'auth/login',
  REGISTER_HOST: 'auth/registerHost',
  REGISTER_CLEANER: 'auth/registerCleaner',
  LOGOUT: 'auth/logout',
  RESTORE_SESSION: 'auth/restoreSession',
  VERIFY_EMAIL: 'auth/verifyEmail',
  REQUEST_PASSWORD_RESET: 'auth/requestPasswordReset',
  RESET_PASSWORD: 'auth/resetPassword',
};

// Actions asynchrones
export const login = createAsyncThunk(
  AUTH_ACTION_TYPES.LOGIN,
  async ({ email, password }, { rejectWithValue, dispatch, getState }) => {
    try {
      console.log('[AuthAction] Tentative de connexion avec email:', email);
      const response = await authService.login(email, password);
      console.log('[AuthAction] Connexion réussie, réponse:', response);
      
      // Stocker le token dans AsyncStorage
      await setStorageItem('token', response.token);
      
      // Configurer explicitement le token d'authentification
      apiService.setAuthToken(response.token);
      
      // S'assurer que le userType est défini
      let userData = response.user || {};
      
      // Utiliser la fonction centralisée pour déterminer le type d'utilisateur
      if (!userData.userType) {
        console.log('[AuthAction] userType non défini, tentative de déduction...');
        
        // Vérifier s'il existe d'autres indicateurs pour déterminer le type
        const state = getState();
        const detectedType = determineUserType(userData, state, 'authActions.login');
        
        if (detectedType) {
          userData.userType = detectedType;
          console.log(`[AuthAction] Type utilisateur déduit: ${detectedType}`);
        }
      }
      
      // Synchroniser les données utilisateur avec userSlice
      dispatch(syncUserWithAuth(userData));
      
      // Redirection intelligente basée sur le type utilisateur
      redirectBasedOnAuth(true, userData);
      
      return { ...response, user: userData };
    } catch (error) {
      console.error('[AuthAction] Login error:', error);
      return rejectWithValue(
        error.message || 'Échec de connexion. Vérifiez vos identifiants.'
      );
    }
  }
);

export const registerHost = createAsyncThunk(
  AUTH_ACTION_TYPES.REGISTER_HOST,
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      console.log('[AuthAction] RegisterHost action appelée avec:', userData);
      const response = await authService.registerHost(userData);
      console.log('[AuthAction] RegisterHost réponse:', response);
      
      await setStorageItem('token', response.token);
      
      // Configurer explicitement le token d'authentification
      apiService.setAuthToken(response.token);
      
      // S'assurer que le userType est défini
      const userDataWithType = {
        ...response.user,
        userType: 'host' // Forcer le type pour les nouveaux hosts
      };
      
      // Synchroniser les données utilisateur avec userSlice
      dispatch(syncUserWithAuth(userDataWithType));
      
      // Redirection intelligente vers le dashboard host
      router.replace('/host/dashboard');
      
      return { ...response, user: userDataWithType };
    } catch (error) {
      console.error('[AuthAction] RegisterHost error:', error);
      return rejectWithValue(
        error.message || 'Échec d\'inscription. Veuillez réessayer.'
      );
    }
  }
);

export const registerCleaner = createAsyncThunk(
  AUTH_ACTION_TYPES.REGISTER_CLEANER,
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      console.log('[AuthAction] RegisterCleaner action appelée avec:', userData);
      const response = await authService.registerCleaner(userData);
      console.log('[AuthAction] RegisterCleaner réponse:', response);
      
      await setStorageItem('token', response.token);
      
      // Configurer explicitement le token d'authentification
      apiService.setAuthToken(response.token);
      
      // S'assurer que le userType est défini
      const userDataWithType = {
        ...response.user,
        userType: 'cleaner' // Forcer le type pour les nouveaux cleaners
      };
      
      // Synchroniser les données utilisateur avec userSlice
      dispatch(syncUserWithAuth(userDataWithType));
      
      // Redirection intelligente vers le dashboard cleaner
      router.replace('/cleaner/dashboard');
      
      return { ...response, user: userDataWithType };
    } catch (error) {
      console.error('[AuthAction] RegisterCleaner error:', error);
      return rejectWithValue(
        error.message || 'Échec d\'inscription. Veuillez réessayer.'
      );
    }
  }
);

export const logout = createAsyncThunk(
  AUTH_ACTION_TYPES.LOGOUT,
  async (_, { rejectWithValue, dispatch }) => {
    try {
      console.log('[AuthAction] Déconnexion...');
      
      // Supprimer les tokens de storage
      await removeStorageItem('token');
      await removeStorageItem('refreshToken');
      
      // Nettoyer le token dans les headers
      apiService.setAuthToken(null);
      
      // Réinitialiser également les données utilisateur dans userSlice
      dispatch(syncUserWithAuth(null));
      
      // Redirection après déconnexion
      router.replace('/(auth)/');
      
      return null;
    } catch (error) {
      console.error('[AuthAction] Logout error:', error);
      return rejectWithValue('Échec de déconnexion');
    }
  }
);

export const restoreSession = createAsyncThunk(
  AUTH_ACTION_TYPES.RESTORE_SESSION,
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      console.log('[AuthAction] Tentative de restauration de session...');
      const token = await getStorageItem('token');
      
      if (!token) {
        console.log('[AuthAction] Pas de token trouvé lors de la restauration de session');
        return rejectWithValue('No token found');
      }
      
      console.log('[AuthAction] Token trouvé, configuration du token dans les headers...');
      
      // Configuration explicite du token pour les requêtes suivantes
      apiService.setAuthToken(token);
      
      console.log('[AuthAction] Récupération des données utilisateur...');
      const userResponse = await authService.getCurrentUser();
      
      if (!userResponse || !userResponse.success) {
        console.error('[AuthAction] Réponse d\'API invalide:', userResponse);
        throw new Error('Réponse d\'API invalide');
      }
      
      // Extraire les données correctement de la réponse de l'API
      let userData = userResponse.data || {};
      console.log('[AuthAction] Données utilisateur récupérées avec succès:', userData);
      
      // Vérifier si userType est défini, sinon le déduire avec la fonction centralisée
      if (!userData.userType) {
        console.log('[AuthAction] userType non défini, tentative de déduction...');
        
        // Récupérer l'état actuel
        const state = getState();
        const detectedType = determineUserType(userData, state, 'authActions.restoreSession');
        
        if (detectedType) {
          userData.userType = detectedType;
          console.log(`[AuthAction] Type utilisateur déduit: ${detectedType}`);
        } else {
          console.log('[AuthAction] Impossible de déduire le type utilisateur');
        }
      }
      
      // Synchroniser les données utilisateur avec userSlice
      dispatch(syncUserWithAuth(userData));
      
      return { token, user: userData };
    } catch (error) {
      console.error('[AuthAction] Erreur lors de la restauration de session:', error);
      
      // En cas d'erreur, nettoyer les tokens et forcer la déconnexion
      await removeStorageItem('token');
      await removeStorageItem('refreshToken');
      apiService.setAuthToken(null);
      
      return rejectWithValue(
        error.message || 'Session invalide ou expirée'
      );
    }
  }
);

export const verifyEmail = createAsyncThunk(
  AUTH_ACTION_TYPES.VERIFY_EMAIL,
  async (verificationToken, { rejectWithValue }) => {
    try {
      console.log('[AuthAction] Vérification email avec token:', verificationToken);
      const response = await authService.verifyEmail(verificationToken);
      console.log('[AuthAction] Résultat vérification email:', response);
      return response;
    } catch (error) {
      console.error('[AuthAction] Erreur vérification email:', error);
      return rejectWithValue(
        error.message || 'Échec de vérification d\'email'
      );
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  AUTH_ACTION_TYPES.REQUEST_PASSWORD_RESET,
  async (email, { rejectWithValue }) => {
    try {
      console.log('[AuthAction] Demande de réinitialisation pour:', email);
      const response = await authService.requestPasswordReset(email);
      console.log('[AuthAction] Demande envoyée avec succès');
      return response;
    } catch (error) {
      console.error('[AuthAction] Erreur demande réinitialisation:', error);
      return rejectWithValue(
        error.message || 'Échec de demande de réinitialisation'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  AUTH_ACTION_TYPES.RESET_PASSWORD,
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      console.log('[AuthAction] Réinitialisation mot de passe avec token');
      const response = await authService.resetPassword(token, newPassword);
      console.log('[AuthAction] Mot de passe réinitialisé avec succès');
      return response;
    } catch (error) {
      console.error('[AuthAction] Erreur réinitialisation mot de passe:', error);
      return rejectWithValue(
        error.message || 'Échec de réinitialisation de mot de passe'
      );
    }
  }
);