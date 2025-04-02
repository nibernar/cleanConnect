import { createSlice } from '@reduxjs/toolkit';
// Importer les actions asynchrones (thunks) définies ailleurs
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
// Importer les types depuis actionTypes.js
import { AUTH_ACTION_TYPES } from '../actionTypes'; 

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
    clearError: (state) => { state.error = null; },
    clearVerificationStatus: (state) => { state.verificationStatus = null; },
    clearPasswordResetStatus: (state) => { state.passwordResetStatus = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.isLoading = false; state.isAuthenticated = true; state.user = action.payload.user; state.token = action.payload.token; })
      .addCase(login.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; state.isAuthenticated = false; state.user = null; state.token = null; })
      .addCase(registerHost.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerHost.fulfilled, (state, action) => { state.isLoading = false; state.isAuthenticated = true; state.user = action.payload.user; state.token = action.payload.token; })
      .addCase(registerHost.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(registerCleaner.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerCleaner.fulfilled, (state, action) => { state.isLoading = false; state.isAuthenticated = true; state.user = action.payload.user; state.token = action.payload.token; })
      .addCase(registerCleaner.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(logout.pending, (state) => { state.isLoading = true; }) 
      .addCase(logout.fulfilled, (state) => { 
          console.log("[AuthSlice] Logout fulfilled, resetting state.");
          Object.assign(state, initialState); 
       })
      .addCase(logout.rejected, (state, action) => { 
          console.error("[AuthSlice] Logout rejected:", action.payload);
          Object.assign(state, initialState);
          state.isLoading = false; 
       })
      .addCase(restoreSession.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(restoreSession.fulfilled, (state, action) => { state.isLoading = false; state.isAuthenticated = true; state.user = action.payload.user; state.token = action.payload.token; })
      .addCase(restoreSession.rejected, (state) => { 
          Object.assign(state, initialState); 
          state.isLoading = false; 
        })
      .addCase(verifyEmail.pending, (state) => { state.isLoading = true; state.error = null; state.verificationStatus = 'pending'; })
      .addCase(verifyEmail.fulfilled, (state) => { state.isLoading = false; state.verificationStatus = 'success'; if (state.user) state.user.emailVerified = true; })
      .addCase(verifyEmail.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; state.verificationStatus = 'failed'; })
      .addCase(requestPasswordReset.pending, (state) => { state.isLoading = true; state.error = null; state.passwordResetStatus = 'pending'; })
      .addCase(requestPasswordReset.fulfilled, (state) => { state.isLoading = false; state.passwordResetStatus = 'emailSent'; })
      .addCase(requestPasswordReset.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; state.passwordResetStatus = 'failed'; })
      .addCase(resetPassword.pending, (state) => { state.isLoading = true; state.error = null; state.passwordResetStatus = 'resetting'; })
      .addCase(resetPassword.fulfilled, (state) => { state.isLoading = false; state.passwordResetStatus = 'success'; })
      .addCase(resetPassword.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; state.passwordResetStatus = 'failed'; });
  }
});

// Exporter les actions synchrones générées par createSlice
export const { clearError, clearVerificationStatus, clearPasswordResetStatus } = authSlice.actions;

// Correction: Ré-exporter les actions asynchrones (thunks) importées
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

// --- SÉLECTEURS --- 
export const selectAuthUser = (state) => state.auth.user;
export const selectAuthToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectVerificationStatus = (state) => state.auth.verificationStatus;
export const selectPasswordResetStatus = (state) => state.auth.passwordResetStatus;
export const selectUserRole = (state) => state.auth.user?.role;

export default authSlice.reducer;