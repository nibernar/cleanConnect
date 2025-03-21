import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import invoiceService from '../../services/invoiceService';

// Async thunks
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async ({ page = 1, limit = 10, sortBy = 'date', order = 'desc' }, { rejectWithValue }) => {
    try {
      const response = await invoiceService.getInvoices(page, limit, sortBy, order);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération des factures'
      );
    }
  }
);

export const fetchInvoiceById = createAsyncThunk(
  'invoices/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await invoiceService.getInvoiceById(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération de la facture'
      );
    }
  }
);

export const downloadInvoice = createAsyncThunk(
  'invoices/download',
  async (id, { rejectWithValue }) => {
    try {
      const response = await invoiceService.downloadInvoice(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de téléchargement de la facture'
      );
    }
  }
);

// For hosts to see their payment history
export const fetchPaymentHistory = createAsyncThunk(
  'invoices/fetchPaymentHistory',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await invoiceService.getPaymentHistory(page, limit);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération de l\'historique des paiements'
      );
    }
  }
);

// For cleaners to see their earnings
export const fetchEarnings = createAsyncThunk(
  'invoices/fetchEarnings',
  async ({ period = 'all' }, { rejectWithValue }) => {
    try {
      const response = await invoiceService.getEarnings(period);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération des gains'
      );
    }
  }
);

// Initial state
const initialState = {
  invoices: [],
  currentInvoice: null,
  paymentHistory: [],
  earnings: null,
  isLoading: false,
  downloadLoading: false,
  error: null,
  downloadStatus: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  }
};

// Slice
const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    clearInvoicesError: (state) => {
      state.error = null;
    },
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null;
    },
    clearDownloadStatus: (state) => {
      state.downloadStatus = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch invoices
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total
        };
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch invoice by ID
      .addCase(fetchInvoiceById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentInvoice = action.payload;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Download invoice
      .addCase(downloadInvoice.pending, (state) => {
        state.downloadLoading = true;
        state.error = null;
        state.downloadStatus = 'pending';
      })
      .addCase(downloadInvoice.fulfilled, (state) => {
        state.downloadLoading = false;
        state.downloadStatus = 'success';
      })
      .addCase(downloadInvoice.rejected, (state, action) => {
        state.downloadLoading = false;
        state.error = action.payload;
        state.downloadStatus = 'failed';
      })
      
      // Fetch payment history
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentHistory = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total
        };
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch earnings
      .addCase(fetchEarnings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEarnings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.earnings = action.payload;
      })
      .addCase(fetchEarnings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearInvoicesError, clearCurrentInvoice, clearDownloadStatus } = invoicesSlice.actions;

export default invoicesSlice.reducer;