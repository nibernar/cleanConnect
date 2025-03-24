import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { 
  apiCallWithDebugFallback, 
  apiCallWithRetry, 
  hostDebugApi 
} from '../../utils/apiDebugUtils';

// Async thunks
export const getHostStats = createAsyncThunk(
  'host/getStats',
  async (_, { rejectWithValue }) => {
    try {
      // Use apiCallWithRetry for better resilience
      const response = await apiCallWithRetry(
        () => api.getHostStats(),
        null,
        { maxRetries: 2 }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getActiveListings = createAsyncThunk(
  'host/getActiveListings',
  async (limit = 5, { rejectWithValue, dispatch }) => {
    try {      
      // Use apiCallWithDebugFallback to fall back to debug endpoint if auth fails
      const response = await apiCallWithDebugFallback(
        // Regular authenticated API call
        () => api.getHostActiveListings(limit),
        // Debug fallback API call (no auth required)
        () => hostDebugApi.getActiveListings()
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Initial state
const initialState = {
  stats: {
    monthlySpend: 0,
    completedBookings: 0,
    activeListings: 0,
    pendingApplications: 0,
    upcomingBookings: []
  },
  activeListings: [],
  loading: false,
  error: null
};

// Create slice
const hostSlice = createSlice({
  name: 'host',
  initialState,
  reducers: {
    resetHostState: () => initialState,
    clearErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get host stats
      .addCase(getHostStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHostStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getHostStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Une erreur est survenue' };
      })
      
      // Get active listings
      .addCase(getActiveListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveListings.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload) {
          state.activeListings = action.payload;
        }
        else if (!state.activeListings || !Array.isArray(state.activeListings)) {
          state.activeListings = [];
        }
        
        state.error = null;
      })
      .addCase(getActiveListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Une erreur est survenue' };
      });
  }
});

export const { resetHostState, clearErrors } = hostSlice.actions;
export default hostSlice.reducer;