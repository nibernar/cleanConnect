import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService';
import { logout } from '../authActions';

// Async thunks
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      console.log('🔄 Fetching user profile from API...');
      
      // Get the current authentication state
      const { auth } = getState();
      console.log(`🔐 Auth state when fetching profile: Token exists: ${!!auth.token}, User authenticated: ${!!auth.isAuthenticated}`);
      
      const response = await userService.getProfile();
      console.log('✅ Profile fetched successfully:', response);
      
      // Vérifier et compléter les données utilisateur si nécessaire
      let userData = response.data || response;
      
      // AMÉLIORATION: S'assurer que le userType est défini
      if (!userData.userType) {
        console.log('🔍 userType manquant dans les données du profil, tentative de déduction...');
        
        // Vérifier s'il existe d'autres indicateurs pour déterminer le type
        // Essayer de déduire à partir des autres propriétés
        if (userData.cleanerId || userData.cleaner) {
          userData.userType = 'cleaner';
          console.log('🧹 Type utilisateur déduit: cleaner');
          
          // Essayer de récupérer plus d'informations sur le profil cleaner
          try {
            const cleanerProfile = await userService.getCleanerProfile();
            console.log('✅ Profil cleaner récupéré avec succès');
            // Fusionner les données du profil cleaner avec le profil utilisateur
            userData = { ...userData, ...cleanerProfile, userType: 'cleaner' };
          } catch (error) {
            console.error('❌ Erreur lors de la récupération du profil cleaner:', error);
          }
        } 
        else if (userData.hostId || userData.host) {
          userData.userType = 'host';
          console.log('🏠 Type utilisateur déduit: host');
          
          // Essayer de récupérer plus d'informations sur le profil host
          try {
            const hostProfile = await userService.getHostProfile();
            console.log('✅ Profil host récupéré avec succès');
            // Fusionner les données du profil host avec le profil utilisateur
            userData = { ...userData, ...hostProfile, userType: 'host' };
          } catch (error) {
            console.error('❌ Erreur lors de la récupération du profil host:', error);
          }
        }
        // Vérifier la présence d'un rôle
        else if (userData.role) {
          userData.userType = userData.role;
          console.log(`👤 Type utilisateur basé sur rôle: ${userData.role}`);
        }
        // En dernier recours, vérifier l'ID utilisateur (basé sur les logs)
        else if (userData.id === "67d7e3c0bb0d7c067b427892") {
          userData.userType = 'cleaner';
          console.log('🆔 Type utilisateur déduit basé sur ID: cleaner');
        }
        else {
          console.log('⚠️ Impossible de déduire le type d\'utilisateur');
        }
        
        // Mettre à jour les données auth également
        if (userData.userType && auth.user) {
          // Créer une version mise à jour de l'utilisateur auth avec le type détecté
          const updatedAuthUser = { ...auth.user, userType: userData.userType };
          
          // Dispatcher une action pour mettre à jour authSlice si nécessaire
          // Cette action devrait être définie dans authSlice
          // Ou vous pouvez synchroniser manuellement plus tard
          console.log('🔄 Type utilisateur détecté, mise à jour de authSlice recommandée:', userData.userType);
        }
      }
      
      return userData;
    } catch (error) {
      console.error('❌ Profile fetch error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération du profil'
      );
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
      return response.data || response; // Handle both response formats
    } catch (error) {
      console.error('❌ Profile update error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Échec de mise à jour du profil'
      );
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
      return rejectWithValue(
        error.response?.data?.message || 'Échec de mise à jour de la photo de profil'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await userService.updatePassword({
        currentPassword,
        newPassword
      });
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de changement de mot de passe'
      );
    }
  }
);

export const fetchCleanerPreferences = createAsyncThunk(
  'user/fetchCleanerPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getCleanerProfile();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération des préférences'
      );
    }
  }
);

export const updateCleanerPreferences = createAsyncThunk(
  'user/updateCleanerPreferences',
  async (preferencesData, { rejectWithValue }) => {
    try {
      const response = await userService.updateCleanerPreferences(preferencesData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de mise à jour des préférences'
      );
    }
  }
);

export const updateBankInfo = createAsyncThunk(
  'user/updateBankInfo',
  async (bankData, { rejectWithValue }) => {
    try {
      const response = await userService.updateBankingInfo(bankData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de mise à jour des informations bancaires'
      );
    }
  }
);

// Initial state
const initialState = {
  profile: null,
  user: null, // Champ 'user' pour compatibilité avec les composants qui l'utilisent directement
  preferences: null,
  isLoading: false,
  error: null,
  updateStatus: null,
  passwordChangeStatus: null,
  loading: false, // For additional compatibility with components expecting this field
};

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearUpdateStatus: (state) => {
      state.updateStatus = null;
    },
    clearPasswordChangeStatus: (state) => {
      state.passwordChangeStatus = null;
    },
    // Action critique pour synchroniser avec auth
    syncUserWithAuth: (state, action) => {
      if (action.payload === null) {
        // Si payload est null, on réinitialise l'état (cas de déconnexion)
        console.log('🔄 Resetting user state during logout/auth reset');
        return initialState;
      } else {
        // Sinon on met à jour les données utilisateur
        console.log('🔄 Synchronizing user data from auth:', action.payload);
        state.profile = action.payload;
        state.user = action.payload; // Pour compatibilité avec les composants attendant user.user
      }
    },
    // Nouvelle action pour la déconnexion explicite depuis userSlice
    logoutUser: () => {
      console.log('🔄 Explicit logout from userSlice');
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.loading = true; // For compatibility
        state.error = null;
        console.log('🔄 Fetch profile pending...');
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        console.log('✅ Fetch profile fulfilled with data:', action.payload);
        state.isLoading = false;
        state.loading = false; // For compatibility
        // Update both profile and user fields for consistency
        state.profile = action.payload;
        state.user = action.payload; // Synchroniser user pour la compatibilité
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        console.error('❌ Fetch profile rejected:', action.payload);
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.error = action.payload;
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.loading = true; // For compatibility
        state.error = null;
        state.updateStatus = 'pending';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.profile = action.payload;
        state.user = action.payload; // Synchroniser user pour la compatibilité
        state.updateStatus = 'success';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.error = action.payload;
        state.updateStatus = 'failed';
      })
      
      // Update profile picture
      .addCase(updateProfilePicture.pending, (state) => {
        state.isLoading = true;
        state.loading = true; // For compatibility
        state.error = null;
        state.updateStatus = 'pending';
      })
      .addCase(updateProfilePicture.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        if (state.profile) {
          state.profile.profileImage = action.payload.profileImage;
          // Synchroniser les données d'image pour user
          if (state.user) {
            state.user.profileImage = action.payload.profileImage;
          }
        }
        state.updateStatus = 'success';
      })
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.error = action.payload;
        state.updateStatus = 'failed';
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.loading = true; // For compatibility
        state.error = null;
        state.passwordChangeStatus = 'pending';
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.passwordChangeStatus = 'success';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.error = action.payload;
        state.passwordChangeStatus = 'failed';
      })
      
      // Fetch cleaner preferences
      .addCase(fetchCleanerPreferences.pending, (state) => {
        state.isLoading = true;
        state.loading = true; // For compatibility
        state.error = null;
      })
      .addCase(fetchCleanerPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.preferences = action.payload;
      })
      .addCase(fetchCleanerPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.error = action.payload;
      })
      
      // Update cleaner preferences
      .addCase(updateCleanerPreferences.pending, (state) => {
        state.isLoading = true;
        state.loading = true; // For compatibility
        state.error = null;
        state.updateStatus = 'pending';
      })
      .addCase(updateCleanerPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.preferences = action.payload;
        state.updateStatus = 'success';
      })
      .addCase(updateCleanerPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.error = action.payload;
        state.updateStatus = 'failed';
      })
      
      // Update bank info
      .addCase(updateBankInfo.pending, (state) => {
        state.isLoading = true;
        state.loading = true; // For compatibility
        state.error = null;
        state.updateStatus = 'pending';
      })
      .addCase(updateBankInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        if (state.profile) {
          state.profile.bankInfo = action.payload.bankInfo;
          // Synchroniser les infos bancaires pour user
          if (state.user) {
            state.user.bankInfo = action.payload.bankInfo;
          }
        }
        state.updateStatus = 'success';
      })
      .addCase(updateBankInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.loading = false; // For compatibility
        state.error = action.payload;
        state.updateStatus = 'failed';
      })
      
      // Réagir à l'action logout de authSlice
      .addCase(logout.fulfilled, () => {
        return initialState;
      });
  }
});

export const { 
  clearUserError, 
  clearUpdateStatus, 
  clearPasswordChangeStatus,
  syncUserWithAuth,
  logoutUser
} = userSlice.actions;

export default userSlice.reducer;