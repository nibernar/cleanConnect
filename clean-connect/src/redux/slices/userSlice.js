import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService';
import { api } from '../../services/api'; 
import { AUTH_ACTION_TYPES, USER_SYNC_ACTION_TYPE } from '../actionTypes'; 

// --- Définitions complètes des Thunks --- 
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile', 
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      console.log('🔄 Fetching user profile from API...');
      const response = await api.get('/users/profile'); 
      console.log('✅ Profile fetched successfully:', response);
      let userData = response.data || response; 
      if (!userData?.success && response?.success) userData = response.data;
      if (!userData?.userType) {
        console.log('🔍 userType manquant, tentative de déduction...');
        if (userData.cleanerId || userData.cleaner) userData.userType = 'cleaner';
        else if (userData.hostId || userData.host) userData.userType = 'host';
        else if (userData.role) userData.userType = userData.role;
        else console.log('⚠️ Impossible de déduire le type');
        if(userData.userType) console.log(`👤 Type utilisateur déterminé: ${userData.userType}`);
      }
      return userData;
    } catch (error) {
      console.error('❌ Profile fetch error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Échec récupération profil');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
   async (profileData, { rejectWithValue }) => {
    try {
      console.log('🔄 Updating user profile with data:', profileData);
      const response = await userService.updateProfile(profileData);
      console.log('✅ Profile updated successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ Profile update error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Échec mise à jour profil');
    }
  }
);

export const updateMyCleanerData = createAsyncThunk(
  'user/updateMyCleanerData',
  async (cleanerData, { rejectWithValue }) => {
    try {
      console.log('🔄 Updating cleaner specific data:', cleanerData);
      const response = await userService.updateCleanerProfile(cleanerData);
      console.log('✅ Cleaner data updated successfully:', response);
      return response.data || response; 
    } catch (error) {
      console.error('❌ Cleaner data update error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Échec mise à jour détails cleaner');
    }
  }
);

export const updateProfilePicture = createAsyncThunk( 
  'user/updateProfilePicture', 
  async (imageFile, { rejectWithValue }) => { 
    try { 
      const response = await userService.uploadProfilePicture(imageFile); 
      return response; 
    } catch (error) { 
      return rejectWithValue( error.response?.data?.message || 'Échec mise à jour photo profil' ); 
    } 
});

export const changePassword = createAsyncThunk( 
  'user/changePassword', 
  async ({ currentPassword, newPassword }, { rejectWithValue }) => { 
    try { 
      const response = await userService.updatePassword({ currentPassword, newPassword }); 
      return response; 
    } catch (error) { 
      return rejectWithValue( error.response?.data?.message || 'Échec changement mot de passe' ); 
    } 
  } 
);

export const fetchCleanerPreferences = createAsyncThunk( 
  'user/fetchCleanerPreferences', 
  async (_, { rejectWithValue }) => { 
    try { 
      const response = await userService.getCleanerProfile(); // getCleanerProfile renvoie tout le profil, y compris prefs?
      return response.workPreferences || response.data?.workPreferences || null; // Extraire seulement les préférences
    } catch (error) { 
      return rejectWithValue( error.response?.data?.message || 'Échec récupération préférences' ); 
    } 
  } 
);

export const updateCleanerPreferences = createAsyncThunk( 
  'user/updateCleanerPreferences', 
  async (preferencesData, { rejectWithValue }) => { 
    try { 
      const response = await userService.updateCleanerPreferences(preferencesData);
      return response.data || response; // Renvoyer les préférences mises à jour
    } catch (error) { 
      return rejectWithValue( error.response?.data?.message || 'Échec mise à jour préférences' ); 
    } 
  } 
);

export const updateBankInfo = createAsyncThunk( 
  'user/updateBankInfo', 
  async (bankData, { rejectWithValue }) => { 
    try { 
      const response = await userService.updateBankingInfo(bankData);
      return response.data || response; // Renvoyer les infos bancaires mises à jour
    } catch (error) { 
      return rejectWithValue( error.response?.data?.message || 'Échec mise à jour infos bancaires' ); 
    } 
  } 
);
// --- Fin Définitions Thunks --- 

// Initial state
const initialState = { profile: null, user: null, preferences: null, isLoading: false, error: null, updateStatus: null, passwordChangeStatus: null, loading: false };

const syncLogic = (state, action) => {
  if (action.payload === null) {
    console.log('[userSlice] Syncing from Auth: Resetting state.');
    Object.assign(state, initialState);
  } else {
    console.log('[userSlice] Syncing from Auth: Updating user data.', action.payload);
    state.profile = action.payload;
    state.user = action.payload;
    state.isLoading = false; state.loading = false; state.error = null;
  }
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: { 
      clearUserError: (state) => { state.error = null; },
      clearUpdateStatus: (state) => { state.updateStatus = null; },
      clearPasswordChangeStatus: (state) => { state.passwordChangeStatus = null; },
      updateSettings: (state, action) => {
        if (state.profile) { state.profile.settings = { ...state.profile.settings, ...action.payload }; }
        if (state.user) { state.user.settings = { ...state.user.settings, ...action.payload }; }
      }
   },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => { state.isLoading = true; state.loading = true; state.error = null; })
      .addCase(fetchProfile.fulfilled, (state, action) => { state.isLoading = false; state.loading = false; state.profile = action.payload; state.user = action.payload; })
      .addCase(fetchProfile.rejected, (state, action) => { state.isLoading = false; state.loading = false; state.error = action.payload; })
      .addCase(updateProfile.pending, (state) => { state.isLoading = true; state.loading = true; state.error = null; state.updateStatus = 'pending'; })
      .addCase(updateProfile.fulfilled, (state, action) => { state.isLoading = false; state.loading = false; state.profile = action.payload; state.user = action.payload; state.updateStatus = 'success'; })
      .addCase(updateProfile.rejected, (state, action) => { state.isLoading = false; state.loading = false; state.error = action.payload; state.updateStatus = 'failed'; })
      .addCase(updateMyCleanerData.pending, (state) => { state.isLoading = true; state.loading = true; state.error = null; state.updateStatus = 'pending'; })
      .addCase(updateMyCleanerData.fulfilled, (state, action) => { state.isLoading = false; state.loading = false; if (state.profile && action.payload) { state.profile = { ...state.profile, ...action.payload }; } if (state.user && action.payload) { state.user = { ...state.user, ...action.payload }; } state.updateStatus = 'success'; })
      .addCase(updateMyCleanerData.rejected, (state, action) => { state.isLoading = false; state.loading = false; state.error = action.payload; state.updateStatus = 'failed'; })
      .addCase(updateProfilePicture.pending, (state) => { state.isLoading = true; state.loading = true; state.error = null; state.updateStatus = 'pending'; })
      .addCase(updateProfilePicture.fulfilled, (state, action) => { 
          state.isLoading = false; state.loading = false; state.updateStatus = 'success'; 
          if (state.profile && action.payload?.profileImage) state.profile.profileImage = action.payload.profileImage;
          if (state.user && action.payload?.profileImage) state.user.profileImage = action.payload.profileImage;
       })
      .addCase(updateProfilePicture.rejected, (state, action) => { state.isLoading = false; state.loading = false; state.error = action.payload; state.updateStatus = 'failed'; })
      .addCase(changePassword.pending, (state) => { state.isLoading = true; state.loading = true; state.error = null; state.passwordChangeStatus = 'pending'; })
      .addCase(changePassword.fulfilled, (state) => { state.isLoading = false; state.loading = false; state.passwordChangeStatus = 'success'; })
      .addCase(changePassword.rejected, (state, action) => { state.isLoading = false; state.loading = false; state.error = action.payload; state.passwordChangeStatus = 'failed'; })
      .addCase(fetchCleanerPreferences.pending, (state) => { state.isLoading = true; state.loading = true; state.error = null; })
      .addCase(fetchCleanerPreferences.fulfilled, (state, action) => { state.isLoading = false; state.loading = false; state.preferences = action.payload; })
      .addCase(fetchCleanerPreferences.rejected, (state, action) => { state.isLoading = false; state.loading = false; state.error = action.payload; })
      .addCase(updateCleanerPreferences.pending, (state) => { state.isLoading = true; state.loading = true; state.error = null; state.updateStatus = 'pending'; })
      .addCase(updateCleanerPreferences.fulfilled, (state, action) => { state.isLoading = false; state.loading = false; state.preferences = action.payload; state.updateStatus = 'success'; })
      .addCase(updateCleanerPreferences.rejected, (state, action) => { state.isLoading = false; state.loading = false; state.error = action.payload; state.updateStatus = 'failed'; })
      .addCase(updateBankInfo.pending, (state) => { state.isLoading = true; state.loading = true; state.error = null; state.updateStatus = 'pending'; })
      .addCase(updateBankInfo.fulfilled, (state, action) => { 
          state.isLoading = false; state.loading = false; state.updateStatus = 'success';
          if (state.profile && action.payload?.bankInfo) state.profile.bankInfo = action.payload.bankInfo;
          if (state.user && action.payload?.bankInfo) state.user.bankInfo = action.payload.bankInfo;
       })
      .addCase(updateBankInfo.rejected, (state, action) => { state.isLoading = false; state.loading = false; state.error = action.payload; state.updateStatus = 'failed'; })
      .addCase(AUTH_ACTION_TYPES.LOGOUT + '/fulfilled', (state) => {
          console.log('[userSlice] Resetting state due to logout.fulfilled action');
          Object.assign(state, initialState);
      })
      .addCase(USER_SYNC_ACTION_TYPE, syncLogic);
  }
});

export const { 
  clearUserError, 
  clearUpdateStatus, 
  clearPasswordChangeStatus,
  updateSettings
} = userSlice.actions;

// --- SÉLECTEURS --- 
export const selectUser = (state) => state.user.user; 
export const selectUserProfile = (state) => state.user.profile;
export const selectUserLoading = (state) => state.user.isLoading || state.user.loading;
export const selectUserError = (state) => state.user.error;
export const selectUserUpdateStatus = (state) => state.user.updateStatus;
export const selectPasswordChangeStatus = (state) => state.user.passwordChangeStatus;
export const selectCleanerPreferences = (state) => state.user.preferences;

export default userSlice.reducer;
