import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api as apiInstance } from '../../services/api'; 
import { 
  apiCallWithDebugFallback, 
  apiCallWithRetry, 
  hostDebugApi 
} from '../../utils/apiDebugUtils';
import { HOST_ACTION_TYPES } from '../actionTypes';

// --- Copier/Coller du Wrapper getApi --- 
const getApi = () => {
    console.log("[getApi in hostSlice] Checking apiInstance. Is it defined?", !!apiInstance);
    if (!apiInstance) {
        console.error("API instance (hostSlice) requested before module fully loaded!");
        try {
            console.log("[getApi in hostSlice] Attempting dynamic require...");
            const dynamicApi = require('../../services/api').api;
            console.log("[getApi in hostSlice] Dynamic require result:", typeof dynamicApi);
            if(dynamicApi) return dynamicApi;
            else throw new Error("Dynamic require returned undefined");
        } catch (e) {
             console.error("Dynamic API import failed in hostSlice:", e);
             throw new Error("API instance is not available in hostSlice.");
        }
    }
    return apiInstance;
};
// --- Fin Wrapper --- 

// --- Thunks Restaurés --- 
export const getHostStats = createAsyncThunk(
  'host/getStats',
  async (_, { rejectWithValue }) => {
    try {
      const currentApi = getApi();
      // Assurez-vous que getHostStats existe sur l'objet api exporté
      const response = await apiCallWithRetry(
        () => currentApi.getHostStats(),
        null,
        { maxRetries: 2 }
      );
      return response.data || response; // Adapter si la structure est différente
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getActiveListings = createAsyncThunk(
  'host/getActiveListings',
  async (limit = 5, { rejectWithValue, dispatch }) => {
    try {      
      const currentApi = getApi();
      // Assurez-vous que getHostActiveListings existe sur l'objet api exporté
      const response = await apiCallWithDebugFallback(
        () => currentApi.getHostActiveListings(limit), 
        () => hostDebugApi.getActiveListings() // Fallback debug
      );
      return response.data || (Array.isArray(response) ? response : []);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);
// --- Fin Thunks --- 

// Initial state
const initialState = { stats: { monthlySpend: 0, completedBookings: 0, activeListings: 0, pendingApplications: 0, upcomingBookings: [] }, activeListings: [], loading: false, error: null };

// Create slice
const hostSlice = createSlice({
  name: 'host',
  initialState,
  reducers: {
    resetHostState: () => initialState,
    // Utiliser la clé string pour le reducer
    [HOST_ACTION_TYPES.CLEAR_ERROR]: (state) => {
      console.log('[hostSlice] Reducer for CLEAR_ERROR called');
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getHostStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getHostStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(getHostStats.rejected, (state, action) => { state.loading = false; state.error = action.payload || { message: 'Erreur stats host' }; })
      .addCase(getActiveListings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getActiveListings.fulfilled, (state, action) => {
        state.loading = false;
        state.activeListings = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(getActiveListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Erreur listings host' };
        state.activeListings = [];
      });
  }
});

export const { resetHostState } = hostSlice.actions;

// --- Sélecteurs --- 
export const selectHostStats = (state) => state.host.stats;
export const selectHostActiveListings = (state) => state.host.activeListings;
export const selectHostLoading = (state) => state.host.loading;
export const selectHostError = (state) => state.host.error;

export default hostSlice.reducer;