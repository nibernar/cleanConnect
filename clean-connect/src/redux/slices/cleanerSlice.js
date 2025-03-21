import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
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
      // Use apiCallWithDebugFallback for better resilience, with proper debug fallback
      const response = await apiCallWithDebugFallback(
        // Regular authenticated API call - Ensure using the cleaner endpoint
        () => api.getCleanerStats(),
        // Debug fallback API call (no auth required)
        () => cleanerDebugApi.getStats()
      );
      console.log('📊 Cleaner stats received:', response);
      
      // If we got a response from the debug endpoint, log a warning
      if (response.message && response.message.includes('Debug route')) {
        console.warn('⚠️ Using debug data for cleaner stats');
      }
      
      return response.data;
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
      
      // Use apiCallWithDebugFallback to fall back to debug endpoint if auth fails
      const response = await apiCallWithDebugFallback(
        // Regular authenticated API call - Ensure using the cleaner endpoint
        () => api.getCleanerAvailableListings(limit),
        // Debug fallback API call (no auth required)
        () => cleanerDebugApi.getAvailableListings()
      );
      
      console.log('📋 Cleaner available listings received:', response);
      
      // If we got a response from the debug endpoint, log a warning
      if (response.message && response.message.includes('Debug route')) {
        console.warn('⚠️ Using debug data for available listings');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting cleaner available listings:', error);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Initial state
const initialState = {
  stats: {
    totalEarnings: 0,
    completedBookings: 0,
    inProgressBookings: 0,
    upcomingBookings: 0,
    averageRating: 0,
    satisfactionRate: '0%'
  },
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
    setDebugMode: (state, action) => {
      state.debugMode = action.payload;
    },
    clearErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get cleaner stats
      .addCase(getCleanerStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCleanerStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getCleanerStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Une erreur est survenue' };
      })
      
      // Get available listings
      .addCase(getAvailableListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAvailableListings.fulfilled, (state, action) => {
        state.loading = false;
        state.availableListings = action.payload;
        console.log('🔄 Updated availableListings in Redux state:', action.payload);
      })
      .addCase(getAvailableListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Une erreur est survenue' };
      });
  }
});

export const { resetCleanerState, setDebugMode, clearErrors } = cleanerSlice.actions;
export default cleanerSlice.reducer;