import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import listingService from '../../services/listingService';
import { transformListingToFrontend } from '../../utils/dataAdapters';
import { handleListingError } from '../../services/errorHandlers';

// Action type constants for error handling
const ERROR_ACTIONS = {
  FETCH_ERROR: 'listings/fetchError',
  CREATE_ERROR: 'listings/createError',
  UPDATE_ERROR: 'listings/updateError',
  DELETE_ERROR: 'listings/deleteError',
  APPLICATION_ERROR: 'listings/applicationError'
};

// Async thunks
export const fetchListings = createAsyncThunk(
  'listings/fetchAll',
  async (params, { rejectWithValue, dispatch }) => {
    try {
      const response = await listingService.getListings(params);
      return response;
    } catch (error) {
      const errorMessage = handleListingError(error, dispatch, ERROR_ACTIONS.FETCH_ERROR);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchListingsForCleaner = createAsyncThunk(
  'listings/fetchForCleaner',
  async (params, { rejectWithValue, dispatch }) => {
    try {
      const response = await listingService.getMatchingListings(params);
      return response;
    } catch (error) {
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
      console.log('API response structure:', response);
      return response;
    } catch (error) {
      const errorMessage = handleListingError(error, dispatch, ERROR_ACTIONS.FETCH_ERROR);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchListingById = createAsyncThunk(
  'listings/fetchById',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await listingService.getListing(id);
      return response;
    } catch (error) {
      const errorMessage = handleListingError(error, dispatch, ERROR_ACTIONS.FETCH_ERROR);
      return rejectWithValue(errorMessage);
    }
  }
);

export const createListing = createAsyncThunk(
  'listings/create',
  async (listingData, { rejectWithValue, dispatch }) => {
    try {
      const response = await listingService.createListing(listingData);
      return response;
    } catch (error) {
      const errorMessage = handleListingError(error, dispatch, ERROR_ACTIONS.CREATE_ERROR);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateListing = createAsyncThunk(
  'listings/update',
  async ({ id, listingData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await listingService.updateListing(id, listingData);
      return response;
    } catch (error) {
      const errorMessage = handleListingError(error, dispatch, ERROR_ACTIONS.UPDATE_ERROR);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteListing = createAsyncThunk(
  'listings/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await listingService.deleteListing(id);
      return id;
    } catch (error) {
      const errorMessage = handleListingError(error, dispatch, ERROR_ACTIONS.DELETE_ERROR);
      return rejectWithValue(errorMessage);
    }
  }
);

export const applyToListing = createAsyncThunk(
  'listings/apply',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await listingService.applyForListing(id);
      return response;
    } catch (error) {
      const errorMessage = handleListingError(error, dispatch, ERROR_ACTIONS.APPLICATION_ERROR);
      return rejectWithValue(errorMessage);
    }
  }
);

export const rejectListing = createAsyncThunk(
  'listings/reject',
  async (id, { rejectWithValue, getState, dispatch }) => {
    try {
      // Add implementation for rejecting an application if needed
      return id;
    } catch (error) {
      const errorMessage = handleListingError(error, dispatch, ERROR_ACTIONS.APPLICATION_ERROR);
      return rejectWithValue(errorMessage);
    }
  }
);

// Helper functions for use in components
export const getListingDetails = (id) => (dispatch) => {
  dispatch(clearListingsError());
  return dispatch(fetchListingById(id));
};

export const clearListingErrors = () => (dispatch) => {
  dispatch(clearListingsError());
};

// Slice definition
const listingsSlice = createSlice({
  name: 'listings',
  initialState: {
    listings: [],
    currentListing: null,
    loading: false,
    error: null,
    success: false,
    pagination: {
      total: 0,
      page: 1,
      limit: 10
    }
  },
  reducers: {
    clearListingsError: (state) => {
      state.error = null;
    },
    clearListingsSuccess: (state) => {
      state.success = false;
    },
    resetListings: (state) => {
      state.listings = [];
      state.currentListing = null;
      state.error = null;
      state.success = false;
      state.pagination = {
        total: 0,
        page: 1,
        limit: 10
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchListings
      .addCase(fetchListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = action.payload.listings.map(transformListingToFrontend);
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit
        };
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchListingsForCleaner
      .addCase(fetchListingsForCleaner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListingsForCleaner.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = action.payload.listings.map(transformListingToFrontend);
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit
        };
      })
      .addCase(fetchListingsForCleaner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchMyListings
      .addCase(fetchMyListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyListings.fulfilled, (state, action) => {
        state.loading = false;
        
        // Vérifier si action.payload est un tableau (ce qui est le cas ici)
        if (Array.isArray(action.payload)) {
          state.listings = action.payload.map(transformListingToFrontend);
          state.pagination = {
            total: action.payload.length,
            page: 1,
            limit: action.payload.length
          };
        } 
        // Garder la structure existante pour la compatibilité
        else if (action.payload && action.payload.listings) {
          state.listings = action.payload.listings.map(transformListingToFrontend);
          state.pagination = {
            total: action.payload.total,
            page: action.payload.page,
            limit: action.payload.limit
          };
        }
        // Cas d'erreur
        else {
          state.listings = [];
          state.pagination = {
            total: 0,
            page: 1,
            limit: 10
          };
          console.error('Format de réponse API inattendu:', action.payload);
        }
      })
      .addCase(fetchMyListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchListingById
      .addCase(fetchListingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentListing = transformListingToFrontend(action.payload);
      })
      .addCase(fetchListingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // createListing
      .addCase(createListing.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createListing.fulfilled, (state, action) => {
        state.loading = false;
        state.currentListing = transformListingToFrontend(action.payload);
        state.success = true;
      })
      .addCase(createListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // updateListing
      .addCase(updateListing.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateListing.fulfilled, (state, action) => {
        state.loading = false;
        state.currentListing = transformListingToFrontend(action.payload);
        state.success = true;
      })
      .addCase(updateListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // deleteListing
      .addCase(deleteListing.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteListing.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = state.listings.filter(listing => listing.id !== action.payload);
        state.currentListing = null;
        state.success = true;
      })
      .addCase(deleteListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // applyToListing
      .addCase(applyToListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyToListing.fulfilled, (state, action) => {
        state.loading = false;
        // Update the current listing if needed
        if (state.currentListing) {
          state.currentListing = {
            ...state.currentListing,
            hasApplied: true
          };
        }
      })
      .addCase(applyToListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearListingsError, clearListingsSuccess, resetListings } = listingsSlice.actions;

export default listingsSlice.reducer;