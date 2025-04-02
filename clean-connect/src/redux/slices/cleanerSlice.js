import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api'; 
import { 
  apiCallWithDebugFallback, 
  apiCallWithRetry, 
  cleanerDebugApi 
} from '../../utils/apiDebugUtils';

// Async thunks
export const getCleanerStats = createAsyncThunk(
  'cleaner/getStats',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🚀 Getting cleaner stats...');
      const response = await apiCallWithDebugFallback(
        () => api.getCleanerStats(), 
        () => cleanerDebugApi.getStats()
      );
      console.log('📊 Cleaner stats received:', response);
      if (response.message && response.message.includes('Debug route')) {
        console.warn('⚠️ Using debug data for cleaner stats');
      }
      return response.data || response; 
    } catch (error) {
      console.error('❌ Error getting cleaner stats:', error);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getAvailableListings = createAsyncThunk(
  'cleaner/getAvailableListings',
  async (limit = 5, { rejectWithValue, dispatch }) => {
    try {
      console.log(`🚀 Getting cleaner available listings with limit ${limit}...`);
      const response = await apiCallWithDebugFallback(
        () => api.getCleanerAvailableListings(limit),
        () => cleanerDebugApi.getAvailableListings()
      );
      console.log('📋 Cleaner available listings received:', response);
      if (response.message && response.message.includes('Debug route')) {
        console.warn('⚠️ Using debug data for available listings');
      }
      return response.data || response; 
    } catch (error) {
      console.error('❌ Error getting cleaner available listings:', error);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Initial state
const initialState = {
  stats: { totalEarnings: 0, completedBookings: 0, inProgressBookings: 0, upcomingBookings: 0, averageRating: 0, satisfactionRate: '0%' },
  availableListings: [],
  loading: false,
  error: null,
  debugMode: false
};

// Create slice
const cleanerSlice = createSlice({
  name: 'cleaner',
  initialState,
  reducers: {
    resetCleanerState: () => initialState,
    setDebugMode: (state, action) => { state.debugMode = action.payload; },
    clearCleanerSliceErrors: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      // Get cleaner stats
      .addCase(getCleanerStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCleanerStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(getCleanerStats.rejected, (state, action) => { state.loading = false; state.error = action.payload || { message: 'Une erreur est survenue' }; })
      // Get available listings
      .addCase(getAvailableListings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getAvailableListings.fulfilled, (state, action) => {
        state.loading = false;
        state.availableListings = Array.isArray(action.payload) ? action.payload : [];
        console.log('🔄 Updated availableListings in Redux state:', state.availableListings);
      })
      .addCase(getAvailableListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Une erreur est survenue' };
        state.availableListings = [];
      });
  }
});

export const { resetCleanerState, setDebugMode, clearCleanerSliceErrors } = cleanerSlice.actions; 

// --- AJOUT DES SÉLECTEURS --- 
export const selectCleanerStats = (state) => state.cleaner.stats;
export const selectCleanerAvailableListings = (state) => state.cleaner.availableListings;
export const selectCleanerLoading = (state) => state.cleaner.loading;
export const selectCleanerError = (state) => state.cleaner.error;
export const selectCleanerDebugMode = (state) => state.cleaner.debugMode;
// --- FIN AJOUT SÉLECTEURS --- 

export default cleanerSlice.reducer;