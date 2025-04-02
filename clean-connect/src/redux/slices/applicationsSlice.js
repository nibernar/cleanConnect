import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Correction: Utiliser l'import nommé { api }
import { api } from '../../services/api'; 

// Async thunks
export const getListingApplications = createAsyncThunk(
  'applications/getListingApplications',
  async (listingId, { rejectWithValue }) => {
    try {
      let response;
      if (listingId) {
        response = await api.get(`/listings/${listingId}/applications`);
      } else {
        if (typeof api.getHostApplications === 'function') {
            response = await api.getHostApplications(); 
        } else {
            console.warn('api.getHostApplications not found, fetching all applications via generic route?');
            response = await api.get('/applications/mine');
        }
      }
      const applicationsArray = response?.data ? response.data : Array.isArray(response) ? response : [];
      return applicationsArray;
    } catch (error) {
      console.error('Error fetching applications:', error);
      return rejectWithValue(error.response?.data?.message || 'Échec de récupération des candidatures');
    }
  }
);

export const getApplicationById = createAsyncThunk(
  'applications/getApplicationById',
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/applications/${applicationId}`);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Échec de récupération des détails de candidature');
    }
  }
);

export const acceptApplication = createAsyncThunk(
  'applications/acceptApplication',
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/applications/${applicationId}/accept`);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Échec d\'acceptation de la candidature');
    }
  }
);

export const rejectApplication = createAsyncThunk(
  'applications/rejectApplication',
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/applications/${applicationId}/reject`);
      return { applicationId, ...(response.data || response) };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Échec de rejet de la candidature');
    }
  }
);

export const withdrawApplication = createAsyncThunk(
  'applications/withdrawApplication',
  async (applicationId, { rejectWithValue }) => {
    try {
      await api.delete(`/applications/${applicationId}`);
      return applicationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Échec de retrait de la candidature');
    }
  }
);

// Initial state
const initialState = { applications: [], currentApplication: null, loading: false, loadingApplications: false, error: null };

// Slice
const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: { /* ... reducers ... */ },
  extraReducers: (builder) => {
    builder
      .addCase(getListingApplications.pending, (state) => { state.loadingApplications = true; state.error = null; })
      .addCase(getListingApplications.fulfilled, (state, action) => { state.loadingApplications = false; state.applications = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(getListingApplications.rejected, (state, action) => { state.loadingApplications = false; state.error = action.payload; state.applications = []; })
      .addCase(getApplicationById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getApplicationById.fulfilled, (state, action) => { state.loading = false; state.currentApplication = action.payload; })
      .addCase(getApplicationById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(acceptApplication.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(acceptApplication.fulfilled, (state, action) => { state.loading = false; const updatedApp = action.payload; const index = state.applications.findIndex(app => app._id === updatedApp?._id); if (index !== -1 && updatedApp) { state.applications[index] = updatedApp; } if (state.currentApplication?._id === updatedApp?._id) { state.currentApplication = updatedApp; } })
      .addCase(acceptApplication.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(rejectApplication.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(rejectApplication.fulfilled, (state, action) => { state.loading = false; const { applicationId } = action.payload; if (Array.isArray(state.applications)) { state.applications = state.applications.filter(app => app._id !== applicationId); } if (state.currentApplication?._id === applicationId) { state.currentApplication = null; } })
      .addCase(rejectApplication.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(withdrawApplication.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(withdrawApplication.fulfilled, (state, action) => { state.loading = false; const applicationId = action.payload; if (Array.isArray(state.applications)) { state.applications = state.applications.filter(app => app._id !== applicationId); } if (state.currentApplication?._id === applicationId) { state.currentApplication = null; } })
      .addCase(withdrawApplication.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { clearApplicationsError, clearCurrentApplication } = applicationsSlice.actions;

// Selectors
export const selectAllApplications = (state) => state.applications.applications;
export const selectCurrentApplication = (state) => state.applications.currentApplication;
export const selectApplicationsLoading = (state) => state.applications.loading || state.applications.loadingApplications;
export const selectApplicationsError = (state) => state.applications.error;

export default applicationsSlice.reducer;