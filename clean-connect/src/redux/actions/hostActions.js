/**
 * Redux actions for host-related functionality
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

/**
 * Fetch the details of a specific application
 */
export const fetchApplicationDetail = createAsyncThunk(
  'host/fetchApplicationDetail',
  async ({ applicationId }, { rejectWithValue }) => {
    try {
      const response = await API.get(`/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Approve a rental application
 */
export const approveApplication = createAsyncThunk(
  'host/approveApplication',
  async ({ applicationId, listingId }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/applications/${applicationId}/approve`, { listingId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Reject a rental application
 */
export const rejectApplication = createAsyncThunk(
  'host/rejectApplication',
  async ({ applicationId, listingId, reason }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/applications/${applicationId}/reject`, { 
        listingId,
        reason
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Submit a damage claim for a property
 */
export const submitClaim = createAsyncThunk(
  'host/submitClaim',
  async (claimData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Add all text fields to form data
      Object.keys(claimData).forEach(key => {
        if (key !== 'images' && claimData[key] !== undefined) {
          formData.append(key, claimData[key]);
        }
      });
      
      // Add images to form data if present
      if (claimData.images && claimData.images.length > 0) {
        claimData.images.forEach((image, index) => {
          const imageName = image.uri.split('/').pop();
          const imageType = 'image/' + (imageName.split('.').pop() === 'png' ? 'png' : 'jpeg');
          
          formData.append('images', {
            uri: image.uri,
            name: imageName,
            type: imageType
          });
        });
      }
      
      const response = await API.post('/claims', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Process a payment for a reservation
 */
export const processPayment = createAsyncThunk(
  'host/processPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await API.post('/payments/process', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Fetch a list of all bookings for the host
 */
export const fetchHostBookings = createAsyncThunk(
  'host/fetchBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/bookings/host');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Fetch host dashboard data with earnings and statistics
 */
export const fetchHostDashboard = createAsyncThunk(
  'host/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/host/dashboard');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);