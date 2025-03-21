import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';

// Async thunks
export const getListingApplications = createAsyncThunk(
  'applications/getListingApplications',
  async (listingId, { rejectWithValue }) => {
    try {
      let response;
      if (listingId) {
        // If a listing ID is provided, get applications for that specific listing
        response = await apiService.get(`/listings/${listingId}/applications`);
      } else {
        // If no listing ID, get all applications for the host across all listings
        response = await apiService.getHostApplications();
      }
      
      // Guarantee the response is always an array
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching applications:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération des candidatures'
      );
    }
  }
);

export const getApplicationById = createAsyncThunk(
  'applications/getApplicationById',
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await apiService.get(`/applications/${applicationId}`);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération des détails de candidature'
      );
    }
  }
);

export const acceptApplication = createAsyncThunk(
  'applications/acceptApplication',
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await apiService.post(`/applications/${applicationId}/accept`);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec d\'acceptation de la candidature'
      );
    }
  }
);

export const rejectApplication = createAsyncThunk(
  'applications/rejectApplication',
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await apiService.post(`/applications/${applicationId}/reject`);
      return { applicationId, ...response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de rejet de la candidature'
      );
    }
  }
);

export const withdrawApplication = createAsyncThunk(
  'applications/withdrawApplication',
  async (applicationId, { rejectWithValue }) => {
    try {
      await apiService.delete(`/applications/${applicationId}`);
      return applicationId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de retrait de la candidature'
      );
    }
  }
);

// Initial state
const initialState = {
  applications: [],
  currentApplication: null,
  loading: false,
  loadingApplications: false,
  error: null
};

// Slice
const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearApplicationsError: (state) => {
      state.error = null;
    },
    clearCurrentApplication: (state) => {
      state.currentApplication = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get listing applications
      .addCase(getListingApplications.pending, (state) => {
        state.loadingApplications = true;
        state.error = null;
      })
      .addCase(getListingApplications.fulfilled, (state, action) => {
        state.loadingApplications = false;
        // Ensure applications are always stored as an array
        state.applications = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getListingApplications.rejected, (state, action) => {
        state.loadingApplications = false;
        state.error = action.payload;
        // In case of error, ensure applications remains an empty array
        state.applications = [];
      })
      
      // Get application by ID
      .addCase(getApplicationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApplicationById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentApplication = action.payload;
      })
      .addCase(getApplicationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Accept application
      .addCase(acceptApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptApplication.fulfilled, (state, action) => {
        state.loading = false;
        // Update application in list
        const index = state.applications.findIndex(
          app => app._id === action.payload._id
        );
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
        // Update current application if it's the same
        if (state.currentApplication && state.currentApplication._id === action.payload._id) {
          state.currentApplication = action.payload;
        }
      })
      .addCase(acceptApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Reject application
      .addCase(rejectApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectApplication.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure applications is an array before filtering
        if (Array.isArray(state.applications)) {
          // Remove application from list
          state.applications = state.applications.filter(
            app => app._id !== action.payload.applicationId
          );
        }
        // Clear current application if it's the same
        if (state.currentApplication && state.currentApplication._id === action.payload.applicationId) {
          state.currentApplication = null;
        }
      })
      .addCase(rejectApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Withdraw application
      .addCase(withdrawApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure applications is an array before filtering
        if (Array.isArray(state.applications)) {
          // Remove application from list
          state.applications = state.applications.filter(
            app => app._id !== action.payload
          );
        }
        // Clear current application if it's the same
        if (state.currentApplication && state.currentApplication._id === action.payload) {
          state.currentApplication = null;
        }
      })
      .addCase(withdrawApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearApplicationsError, clearCurrentApplication } = applicationsSlice.actions;

export default applicationsSlice.reducer;