import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import bookingService from '../../services/bookingService';

// Async thunks
export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingService.getMyBookings();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération des réservations'
      );
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'bookings/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingById(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération de la réservation'
      );
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/create',
  async ({ listingId, applicationId, paymentDetails }, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(listingId, applicationId, paymentDetails);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de création de la réservation'
      );
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bookingService.cancelBooking(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec d\'annulation de la réservation'
      );
    }
  }
);

export const completeBookingTasks = createAsyncThunk(
  'bookings/completeTasks',
  async ({ bookingId, tasks }, { rejectWithValue }) => {
    try {
      const response = await bookingService.completeBookingTasks(bookingId, tasks);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de validation des tâches'
      );
    }
  }
);

export const submitIssueReport = createAsyncThunk(
  'bookings/submitIssue',
  async ({ bookingId, issueData }, { rejectWithValue }) => {
    try {
      const response = await bookingService.submitIssueReport(bookingId, issueData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de signalement du problème'
      );
    }
  }
);

export const submitClaim = createAsyncThunk(
  'bookings/submitClaim',
  async ({ bookingId, claimData }, { rejectWithValue }) => {
    try {
      const response = await bookingService.submitClaim(bookingId, claimData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de soumission de la réclamation'
      );
    }
  }
);

// Initial state
const initialState = {
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
  issueSubmitStatus: null,
  claimSubmitStatus: null,
  taskCompletionStatus: null,
};

// Slice
const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearBookingsError: (state) => {
      state.error = null;
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearIssueSubmitStatus: (state) => {
      state.issueSubmitStatus = null;
    },
    clearClaimSubmitStatus: (state) => {
      state.claimSubmitStatus = null;
    },
    clearTaskCompletionStatus: (state) => {
      state.taskCompletionStatus = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch my bookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch booking by ID
      .addCase(fetchBookingById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings.unshift(action.payload);
        state.currentBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Cancel booking
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update in bookings array
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        // Update currentBooking if it's the same
        if (state.currentBooking && state.currentBooking._id === action.payload._id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Complete booking tasks
      .addCase(completeBookingTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.taskCompletionStatus = 'pending';
      })
      .addCase(completeBookingTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.taskCompletionStatus = 'success';
        
        // Update in bookings array
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        // Update current booking
        if (state.currentBooking && state.currentBooking._id === action.payload._id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(completeBookingTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.taskCompletionStatus = 'failed';
      })
      
      // Submit issue report
      .addCase(submitIssueReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.issueSubmitStatus = 'pending';
      })
      .addCase(submitIssueReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.issueSubmitStatus = 'success';
        
        // Update in bookings array
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        // Update current booking
        if (state.currentBooking && state.currentBooking._id === action.payload._id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(submitIssueReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.issueSubmitStatus = 'failed';
      })
      
      // Submit claim
      .addCase(submitClaim.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.claimSubmitStatus = 'pending';
      })
      .addCase(submitClaim.fulfilled, (state, action) => {
        state.isLoading = false;
        state.claimSubmitStatus = 'success';
        
        // Update in bookings array
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        // Update current booking
        if (state.currentBooking && state.currentBooking._id === action.payload._id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(submitClaim.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.claimSubmitStatus = 'failed';
      });
  }
});

export const { 
  clearBookingsError, 
  clearCurrentBooking,
  clearIssueSubmitStatus,
  clearClaimSubmitStatus,
  clearTaskCompletionStatus
} = bookingsSlice.actions;

// Selectors (AJOUT DE CE BLOC)
export const selectAllBookings = (state) => state.bookings.bookings;
export const selectCurrentBooking = (state) => state.bookings.currentBooking;
export const selectBookingsLoading = (state) => state.bookings.isLoading;
export const selectBookingsError = (state) => state.bookings.error;
export const selectIssueSubmitStatus = (state) => state.bookings.issueSubmitStatus;
export const selectClaimSubmitStatus = (state) => state.bookings.claimSubmitStatus;
export const selectTaskCompletionStatus = (state) => state.bookings.taskCompletionStatus;


export default bookingsSlice.reducer; // Cette ligne est maintenant APRES les exports des sélecteurs