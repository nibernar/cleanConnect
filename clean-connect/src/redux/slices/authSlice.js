import { createSlice } from '@reduxjs/toolkit';
import { 
  login, 
  logout, 
  registerHost, 
  registerCleaner, 
  restoreSession, 
  verifyEmail, 
  requestPasswordReset, 
  resetPassword 
} from '../authActions';

// Slice
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  verificationStatus: null,
  passwordResetStatus: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearVerificationStatus: (state) => {
      state.verificationStatus = null;
    },
    clearPasswordResetStatus: (state) => {
      state.passwordResetStatus = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Register Host
      .addCase(registerHost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerHost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerHost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Register Cleaner
      .addCase(registerCleaner.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerCleaner.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerCleaner.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        return initialState;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Restore Session
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(restoreSession.rejected, (state) => {
        return {
          ...initialState,
          isLoading: false
        };
      })
      
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.verificationStatus = 'pending';
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.verificationStatus = 'success';
        if (state.user) {
          state.user.emailVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.verificationStatus = 'failed';
      })
      
      // Request Password Reset
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.passwordResetStatus = 'pending';
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
        state.passwordResetStatus = 'emailSent';
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.passwordResetStatus = 'failed';
      })
      
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.passwordResetStatus = 'resetting';
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.passwordResetStatus = 'success';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.passwordResetStatus = 'failed';
      });
  }
});

export const { clearError, clearVerificationStatus, clearPasswordResetStatus } = authSlice.actions;

// Re-export les actions depuis authActions pour faciliter l'utilisation
export { 
  login,
  logout,
  registerHost,
  registerCleaner,
  restoreSession,
  verifyEmail,
  requestPasswordReset,
  resetPassword
};

export default authSlice.reducer;