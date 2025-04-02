import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import listingService from '../../services/listingService';
import { transformListingToFrontend } from '../../utils/dataAdapters';
import { handleListingError } from '../../services/errorHandlers';
import { AUTH_ACTION_TYPES, USER_SYNC_ACTION_TYPE } from '../actionTypes'; 

const ERROR_ACTIONS = { FETCH_ERROR: 'listings/fetchError', CREATE_ERROR: 'listings/createError', UPDATE_ERROR: 'listings/updateError', DELETE_ERROR: 'listings/deleteError', APPLICATION_ERROR: 'listings/applicationError' };

// --- Définitions complètes des Thunks --- 
export const fetchListings = createAsyncThunk(
    'listings/fetchAll',
    async (params = {}, { rejectWithValue, dispatch }) => { 
        try { 
            const response = await listingService.getListings(params); 
            return response; // Le reducer gère la structure { data, pagination, ...}
        } catch (e) { 
            return rejectWithValue(handleListingError(e, dispatch, ERROR_ACTIONS.FETCH_ERROR)); 
        } 
    }
);

export const fetchListingsForCleaner = createAsyncThunk(
  'listings/fetchForCleaner',
  async (params = {}, { rejectWithValue, dispatch }) => {
    console.log('[listingsSlice - Thunk] fetchListingsForCleaner STARTING. Params:', params);
    try {
      console.log('[listingsSlice - Thunk] Calling listingService.getMatchingListings...');
      const response = await listingService.getMatchingListings(params);
      console.log('[listingsSlice - Thunk] API call successful. Response:', response);
      // Le reducer gère la structure de réponse
      return response; 
    } catch (error) {
       console.error('[listingsSlice - Thunk] Error in fetchListingsForCleaner:', error);
       const errorMessage = handleListingError(error, dispatch, ERROR_ACTIONS.FETCH_ERROR);
       return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMyListings = createAsyncThunk(
    'listings/fetchMine',
    async (_, { rejectWithValue, dispatch }) => { 
        try { 
            const response = await listingService.getMyListings(); 
            console.log('API response structure fetchMyListings:', response);
            return response; 
        } catch (e) { 
            return rejectWithValue(handleListingError(e, dispatch, ERROR_ACTIONS.FETCH_ERROR)); 
        } 
    }
);

export const fetchListingById = createAsyncThunk(
    'listings/fetchById',
    async (id, { rejectWithValue, dispatch }) => { 
        try { 
            const response = await listingService.getListing(id);
            return response.data || response; // Extrait data si présent
        } catch (e) { 
            return rejectWithValue(handleListingError(e, dispatch, ERROR_ACTIONS.FETCH_ERROR)); 
        } 
    }
);

export const createListing = createAsyncThunk(
    'listings/create',
    async (listingData, { rejectWithValue, dispatch }) => { 
        try { 
            const response = await listingService.createListing(listingData); 
            return response.data || response;
        } catch (e) { 
            return rejectWithValue(handleListingError(e, dispatch, ERROR_ACTIONS.CREATE_ERROR)); 
        } 
    }
);

export const updateListing = createAsyncThunk(
    'listings/update',
    async ({ id, listingData }, { rejectWithValue, dispatch }) => { 
        try { 
            const response = await listingService.updateListing(id, listingData); 
            return response.data || response;
        } catch (e) { 
            return rejectWithValue(handleListingError(e, dispatch, ERROR_ACTIONS.UPDATE_ERROR)); 
        } 
    }
);

export const deleteListing = createAsyncThunk(
    'listings/delete',
    async (id, { rejectWithValue, dispatch }) => { 
        try { 
            await listingService.deleteListing(id); 
            return id; // Retourne l'ID pour suppression du state
        } catch (e) { 
            return rejectWithValue(handleListingError(e, dispatch, ERROR_ACTIONS.DELETE_ERROR)); 
        } 
    }
);

export const applyToListing = createAsyncThunk(
    'listings/apply',
    async (listingId, { rejectWithValue, dispatch }) => { 
        try { 
            const response = await listingService.applyForListing(listingId); 
            return response.data || response; // Retourner la réponse (peut-être la candidature)
        } catch (e) { 
            return rejectWithValue(handleListingError(e, dispatch, ERROR_ACTIONS.APPLICATION_ERROR)); 
        } 
    }
);

export const rejectListing = createAsyncThunk(
  'listings/reject',
  async (listingId, { rejectWithValue }) => {
    try {
      console.log(`[listingsSlice] Cleaner rejected listing ID: ${listingId}`);
      return listingId;
    } catch (error) {
      console.error('[listingsSlice] Error rejecting listing:', error);
      return rejectWithValue('Erreur lors du rejet');
    }
  }
);
// --- Fin Définitions Thunks --- 

// Initial state
const initialState = { listings: [], currentListing: null, loading: false, error: null, success: false, pagination: { total: 0, page: 1, limit: 10 } };

// Slice definition
const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: { 
      clearListingsError: (state) => { state.error = null; },
      clearListingsSuccess: (state) => { state.success = false; },
      resetListings: (state) => { Object.assign(state, initialState); }
   },
  extraReducers: (builder) => {
    builder
      // fetchListings
      .addCase(fetchListings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchListings.fulfilled, (state, action) => {
          state.loading = false; let l=[], p={t:0,p:1,l:10};
          if (action.payload?.data && Array.isArray(action.payload.data)) { l = action.payload.data; p = { t: action.payload.count || l.length, p: action.payload.pagination?.currentPage || 1, l: action.payload.pagination?.limit || l.length }; }
          else if (action.payload?.listings && Array.isArray(action.payload.listings)) { l = action.payload.listings; p = { t: action.payload.total, p: action.payload.page, l: action.payload.limit }; }
          else if (Array.isArray(action.payload)) { l = action.payload; p = { t: l.length, p: 1, l: l.length }; }
          state.listings = l.map(transformListingToFrontend); state.pagination = p;
      })
      .addCase(fetchListings.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // fetchListingsForCleaner
      .addCase(fetchListingsForCleaner.pending, (state) => {
        console.log('[listingsSlice - Reducer] fetchListingsForCleaner PENDING'); 
        state.loading = true; state.error = null; 
      })
      .addCase(fetchListingsForCleaner.fulfilled, (state, action) => {
        console.log('[listingsSlice - Reducer] fetchListingsForCleaner FULFILLED'); 
        state.loading = false;
        console.log('[DEBUG] fetchListingsForCleaner.fulfilled payload:', JSON.stringify(action.payload, null, 2));
        try {
             let listingsArray = []; let paginationData = { total: 0, page: 1, limit: 10 }; let l=[], p=paginationData;
             if (action.payload?.data && Array.isArray(action.payload.data)) { l = action.payload.data; p = { t: action.payload.count || l.length, p: action.payload.pagination?.currentPage || 1, l: action.payload.pagination?.limit || l.length }; console.log('[DEBUG] Detected structure: { data: [...] }'); }
             else if (action.payload?.listings && Array.isArray(action.payload.listings)) { l = action.payload.listings; p = { t: action.payload.total, p: action.payload.page, l: action.payload.limit }; console.log('[DEBUG] Detected structure: { listings: [...] }'); }
             else if (Array.isArray(action.payload)) { l = action.payload; p = { t: l.length, p: 1, l: l.length }; console.log('[DEBUG] Detected structure: [...] (Array)'); }
             else { console.error('[ERROR] Unknown payload structure:', action.payload); state.error = 'Format API inconnu.'; l = []; }
             state.listings = l.map(transformListingToFrontend); state.pagination = p;
        } catch (mapError) { console.error('[ERROR] Map error:', mapError); state.error = 'Erreur traitement annonces.'; state.listings = []; state.pagination = initialState.pagination; }
      })
      .addCase(fetchListingsForCleaner.rejected, (state, action) => {
        console.log('[listingsSlice - Reducer] fetchListingsForCleaner REJECTED', action.payload); 
        state.loading = false; state.error = action.payload; state.listings = []; // Vider en cas d'erreur
      })
      // fetchMyListings
      .addCase(fetchMyListings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyListings.fulfilled, (state, action) => { /* ... adapter si besoin ... */ state.loading = false; let l=[], p={t:0,p:1,l:10}; if (action.payload?.data && Array.isArray(action.payload.data)) { l = action.payload.data; p = { t: action.payload.count || l.length, p: action.payload.pagination?.currentPage || 1, l: action.payload.pagination?.limit || l.length }; } else if (Array.isArray(action.payload)) { l = action.payload; p = { t: l.length, p: 1, l: l.length }; } state.listings = l.map(transformListingToFrontend); state.pagination = p; })
      .addCase(fetchMyListings.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // fetchListingById
      .addCase(fetchListingById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchListingById.fulfilled, (state, action) => { state.loading = false; if(action.payload && typeof action.payload === 'object'){ state.currentListing = transformListingToFrontend(action.payload); } else { state.error = 'Données annonce invalides.'; state.currentListing = null; } })
      .addCase(fetchListingById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // createListing
      .addCase(createListing.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(createListing.fulfilled, (state, action) => { state.loading = false; state.success = true; if(action.payload && typeof action.payload === 'object'){ state.currentListing = transformListingToFrontend(action.payload); } else { state.error = 'Réponse invalide création.'; } })
      .addCase(createListing.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.success = false; })
      // updateListing
      .addCase(updateListing.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(updateListing.fulfilled, (state, action) => { state.loading = false; state.success = true; if(action.payload && typeof action.payload === 'object'){ const updated = transformListingToFrontend(action.payload); state.currentListing = updated; const index = state.listings.findIndex(l => l.id === updated.id); if(index !== -1) state.listings[index] = updated; } else { state.error = 'Réponse invalide MàJ.'; } })
      .addCase(updateListing.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.success = false; })
      // deleteListing
      .addCase(deleteListing.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(deleteListing.fulfilled, (state, action) => { state.loading = false; state.success = true; const deletedId = action.payload; state.listings = state.listings.filter(l => l.id !== deletedId); if (state.currentListing?.id === deletedId) state.currentListing = null; })
      .addCase(deleteListing.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.success = false; })
      // rejectListing
      .addCase(rejectListing.pending, (state) => { /* Optionnel */ })
      .addCase(rejectListing.fulfilled, (state, action) => { const rejectedId = action.payload; state.listings = state.listings.filter(l => l.id !== rejectedId && l._id !== rejectedId); })
      .addCase(rejectListing.rejected, (state, action) => { state.error = action.payload; })
      // applyToListing
      .addCase(applyToListing.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(applyToListing.fulfilled, (state, action) => {
        state.loading = false;
        const appliedListingId = action.payload?.listing || action.payload?.listingId || action.payload?.data?.listing || action.payload?.data?.listingId;
        console.log("[listingsSlice] applyToListing.fulfilled - Applied to Listing ID:", appliedListingId);
        if (appliedListingId) {
            console.log(`[listingsSlice] Removing listing ${appliedListingId} from state.listings`);
            state.listings = state.listings.filter(l => l.id !== appliedListingId && l._id !== appliedListingId);
        }
        // Ligne qui posait problème (currentListing peut être null) est retirée
      })
      .addCase(applyToListing.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { clearListingsError, clearListingsSuccess, resetListings } = listingsSlice.actions;

// Selectors
export const selectAllListings = (state) => state.listings.listings;
export const selectCurrentListing = (state) => state.listings.currentListing;
export const selectListingsLoading = (state) => state.listings.loading;
export const selectListingsError = (state) => state.listings.error;
export const selectListingsSuccess = (state) => state.listings.success;
export const selectListingsPagination = (state) => state.listings.pagination;

export default listingsSlice.reducer;
