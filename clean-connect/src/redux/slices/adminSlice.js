// src/redux/slices/adminSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService'; // Importer le service

// Async Thunks
export const fetchAllCleaners = createAsyncThunk(
  'admin/fetchAllCleaners',
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log('[AdminSlice] Fetching all cleaners...');
      // Appelle GET /api/v1/cleaners (protégé admin)
      const response = await userService.getAllCleaners(params);
      console.log('[AdminSlice] Cleaners fetched:', response);
      // Retourner les données (supposons une structure avec data et pagination)
      return response; // Ou response.data si le service le retourne déjà
    } catch (error) {
      console.error('[AdminSlice] Error fetching cleaners:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des cleaners');
    }
  }
);

export const verifyCleaner = createAsyncThunk(
  'admin/verifyCleaner',
  async ({ cleanerId, status }, { rejectWithValue }) => {
    try {
      console.log(`[AdminSlice] Updating cleaner ${cleanerId} status to ${status}...`);
      // Appelle PUT /api/v1/cleaners/:id/verify (protégé admin)
      const response = await userService.verifyCleanerStatus(cleanerId, status);
      console.log('[AdminSlice] Cleaner status updated:', response);
      // Retourne le cleaner mis à jour pour mettre à jour le state localement
      return response.data || response; // Adapter selon la structure de réponse
    } catch (error) {
      console.error('[AdminSlice] Error updating cleaner status:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  }
);

// Initial State
const initialState = {
  cleaners: [],
  pagination: null, // Pour stocker les infos de pagination si l'API les renvoie
  loading: false,
  error: null,
  updateStatus: null, // Pour suivre l'état de la vérification
};

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    clearAdminUpdateStatus: (state) => {
        state.updateStatus = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAllCleaners
      .addCase(fetchAllCleaners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCleaners.fulfilled, (state, action) => {
        state.loading = false;
        // Adapter selon la structure réelle de la réponse (action.payload)
        if (action.payload?.data && Array.isArray(action.payload.data)) {
            state.cleaners = action.payload.data;
            state.pagination = action.payload.pagination || null;
        } else if (Array.isArray(action.payload)) { // Si l'API renvoie juste le tableau
             state.cleaners = action.payload;
             state.pagination = null;
        } else {
            console.error("[AdminSlice] Unexpected payload structure for fetchAllCleaners:", action.payload);
            state.error = "Format de réponse inattendu";
            state.cleaners = [];
            state.pagination = null;
        }
      })
      .addCase(fetchAllCleaners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.cleaners = []; // Vider en cas d'erreur
      })

      // verifyCleaner
      .addCase(verifyCleaner.pending, (state) => {
        state.updateStatus = 'pending';
        state.error = null; // Peut-être garder l'ancienne erreur?
      })
      .addCase(verifyCleaner.fulfilled, (state, action) => {
        state.updateStatus = 'success';
        // Mettre à jour le cleaner spécifique dans la liste
        const updatedCleaner = action.payload;
        const index = state.cleaners.findIndex(c => c._id === updatedCleaner?._id);
        if (index !== -1 && updatedCleaner) {
          state.cleaners[index] = updatedCleaner;
          // Si l'on veut aussi mettre à jour le userSlice (pas idéal)
          // dispatch(updateUserInList(updatedCleaner.user)) 
        }
      })
      .addCase(verifyCleaner.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = action.payload; // Erreur spécifique à la mise à jour
      });
  },
});

export const { clearAdminError, clearAdminUpdateStatus } = adminSlice.actions;

// Selectors
export const selectAllCleaners = (state) => state.admin.cleaners;
export const selectAdminLoading = (state) => state.admin.loading;
export const selectAdminError = (state) => state.admin.error;
export const selectAdminUpdateStatus = (state) => state.admin.updateStatus;
export const selectAdminPagination = (state) => state.admin.pagination;

export default adminSlice.reducer;
