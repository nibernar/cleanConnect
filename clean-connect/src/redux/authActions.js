import { createAsyncThunk } from '@reduxjs/toolkit';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storageUtils';
import authService from '../services/authService';
import { api } from '../services/api'; 
// import { router } from 'expo-router'; // La redirection est gérée par le layout
// Correction: Retirer l'import de syncUserWithAuth
// import { syncUserWithAuth } from './slices/userSlice';
import { determineUserType } from '../utils/userTypeDetector';
import { AUTH_ACTION_TYPES } from './actionTypes'; 

export const login = createAsyncThunk(
  AUTH_ACTION_TYPES.LOGIN,
  async ({ email, password }, { rejectWithValue, getState }) => { // Retiré dispatch des params
    try {
      console.log('[AuthAction] Tentative de connexion avec email:', email);
      const response = await authService.login(email, password);
      console.log('[AuthAction] Connexion réussie, réponse:', response);
      
      await setStorageItem('token', response.token);
      api.setAuthToken(response.token);
      
      // Préparer les données user pour le state auth (le middleware s'occupera de userSlice)
      let userData = response.user || {};
      if (!userData.userType) {
        console.log('[AuthAction] userType non défini, tentative de déduction...');
        const state = getState(); // Obtenir l'état *avant* la mise à jour auth
        const detectedType = determineUserType(userData, state, 'authActions.login');
        if (detectedType) userData.userType = detectedType;
        if(userData.userType) console.log(`[AuthAction] Type utilisateur déduit: ${userData.userType}`);
      }
      
      // Correction: Ne PAS dispatcher syncUserWithAuth ici
      // dispatch(syncUserWithAuth(userData)); 
      
      // Retourner les données pour mettre à jour authSlice
      return { token: response.token, user: userData }; 
    } catch (error) {
      console.error('[AuthAction] Login error:', error);
      const message = error.response?.data?.error || error.message || 'Échec de connexion. Vérifiez vos identifiants.';
      return rejectWithValue(message);
    }
  }
);

export const registerHost = createAsyncThunk(
  AUTH_ACTION_TYPES.REGISTER_HOST,
  async (userData, { rejectWithValue }) => { // Retiré dispatch
    try {
      console.log('[AuthAction] RegisterHost action...');
      const response = await authService.registerHost(userData);
      await setStorageItem('token', response.token);
      api.setAuthToken(response.token);
      const userDataWithType = { ...response.user, userType: 'host' };
      // Correction: Ne PAS dispatcher syncUserWithAuth ici
      // dispatch(syncUserWithAuth(userDataWithType));
      return { token: response.token, user: userDataWithType };
    } catch (error) {
      // ... gestion erreur ...
       const message = error.response?.data?.error || error.message || 'Échec d\'inscription.';
       return rejectWithValue(message);
    }
  }
);

export const registerCleaner = createAsyncThunk(
  AUTH_ACTION_TYPES.REGISTER_CLEANER,
  async (userData, { rejectWithValue }) => { // Retiré dispatch
    try {
      console.log('[AuthAction] RegisterCleaner action...');
      const response = await authService.registerCleaner(userData);
      await setStorageItem('token', response.token);
      api.setAuthToken(response.token);
      const userDataWithType = { ...response.user, userType: 'cleaner' };
       // Correction: Ne PAS dispatcher syncUserWithAuth ici
      // dispatch(syncUserWithAuth(userDataWithType));
      return { token: response.token, user: userDataWithType };
    } catch (error) {
       // ... gestion erreur ...
       const message = error.response?.data?.error || error.message || 'Échec d\'inscription.';
       return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk(
  AUTH_ACTION_TYPES.LOGOUT,
  async (_, { rejectWithValue }) => { // Retiré dispatch
    try {
      console.log('[AuthAction] Déconnexion...');
      await removeStorageItem('token');
      await removeStorageItem('refreshToken');
      api.setAuthToken(null);
      // Correction: Ne PAS dispatcher syncUserWithAuth ici (géré par extraReducer)
      // dispatch(syncUserWithAuth(null)); 
      return null;
    } catch (error) {
      // ... gestion erreur ...
      return rejectWithValue('Échec de déconnexion');
    }
  }
);

export const restoreSession = createAsyncThunk(
  AUTH_ACTION_TYPES.RESTORE_SESSION,
  async (_, { rejectWithValue, getState }) => { // Retiré dispatch
    try {
      console.log('[AuthAction] Tentative de restauration...');
      const token = await getStorageItem('token');
      if (!token) return rejectWithValue('No token found');
      api.setAuthToken(token);
      const userResponse = await authService.getCurrentUser(); 
      if (!userResponse || !userResponse.success) throw new Error('API response invalid');
      let userData = userResponse.data || {};
      if (!userData.userType) {
          const state = getState();
          const detectedType = determineUserType(userData, state, 'authActions.restoreSession');
          if (detectedType) userData.userType = detectedType;
      }
      // Correction: Ne PAS dispatcher syncUserWithAuth ici
      // dispatch(syncUserWithAuth(userData)); 
      return { token, user: userData };
    } catch (error) {
      // ... gestion erreur ...
      await removeStorageItem('token');
      await removeStorageItem('refreshToken');
      api.setAuthToken(null);
      return rejectWithValue(error.message || 'Session invalide');
    }
  }
);

export const verifyEmail = createAsyncThunk(AUTH_ACTION_TYPES.VERIFY_EMAIL, async (t, { rejectWithValue }) => { try { return await authService.verifyEmail(t); } catch (e) { return rejectWithValue(e.message); } });
export const requestPasswordReset = createAsyncThunk(AUTH_ACTION_TYPES.REQUEST_PASSWORD_RESET, async (e, { rejectWithValue }) => { try { return await authService.requestPasswordReset(e); } catch (e) { return rejectWithValue(e.message); } });
export const resetPassword = createAsyncThunk(AUTH_ACTION_TYPES.RESET_PASSWORD, async ({ t, p }, { rejectWithValue }) => { try { return await authService.resetPassword(t, p); } catch (e) { return rejectWithValue(e.message); } });
