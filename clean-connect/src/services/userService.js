// Correction: Importer { api } au niveau supérieur
import { api as apiInstance } from './api'; 

// Wrapper pour s'assurer que l'instance api est chargée
// Peut être utile si des dépendances circulaires posent problème
const getApi = () => {
    if (!apiInstance) {
        console.error("API instance requested before module fully loaded!");
        // Tenter une ré-importation dynamique (solution de secours)
        try {
            const dynamicApi = require('./api').api;
            if(dynamicApi) return dynamicApi;
        } catch (e) {
             console.error("Dynamic API import failed:", e);
        }
        // Retourner un objet mock pour éviter le crash immédiat mais signaler l'erreur
        return { get: ()=>Promise.reject("API not loaded"), post: ()=>Promise.reject("API not loaded"), put: ()=>Promise.reject("API not loaded"), delete: ()=>Promise.reject("API not loaded"), patch: ()=>Promise.reject("API not loaded"), upload: ()=>Promise.reject("API not loaded"), setAuthToken: ()=>{} }; 
    }
    return apiInstance;
};


const userService = {
  // --- User Profile (Common) ---
  getProfile: async () => {
    return await getApi().get('/users/profile');
  },
  updateProfile: async (profileData) => {
    // Utiliser getApi() pour être sûr
    return await getApi().put('/users/profile', profileData);
  },
  updatePassword: async (passwordData) => {
    return await getApi().put('/auth/updatepassword', passwordData); 
  },
  uploadProfilePicture: async (imageUri) => {
    const formData = new FormData();
    formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'profile-picture.jpg' });
    return await getApi().upload('/users/profile/photo', formData); 
  },
  uploadIdentityDocument: async (imageUri, documentType) => {
    const formData = new FormData();
    formData.append('file', { uri: imageUri, type: 'image/jpeg', name: `${documentType}-document.jpg` });
    formData.append('documentType', documentType);
    return await getApi().upload('/users/identity-document', formData);
  },
  getStatistics: async () => {
    return await getApi().get('/users/statistics');
  },

  // --- Host Specific ---
  getHostProfile: async () => {
    return await getApi().get('/hosts/me'); 
  },
  updateHostProfile: async (profileData) => {
    return await getApi().put('/hosts/me', profileData);
  },

  // --- Cleaner Specific ---
  getCleanerProfile: async () => {
    return await getApi().get('/cleaners/me'); 
  },
  updateCleanerProfile: async (profileData) => {
    return await getApi().put('/cleaners/me', profileData);
  },
  updateCleanerPreferences: async (preferencesData) => {
    return await getApi().put('/cleaners/me/preferences', preferencesData);
  },
  getBankingInfo: async () => {
    return await getApi().get('/cleaners/me/banking');
  },
  updateBankingInfo: async (bankingData) => {
    return await getApi().put('/cleaners/me/banking', bankingData);
  },

  // --- Admin Specific --- 
  getAllCleaners: async (params = {}) => {
      return await getApi().get('/cleaners', params);
  },
  verifyCleanerStatus: async (cleanerId, status) => {
      return await getApi().put(`/cleaners/${cleanerId}/verify`, { status });
  }
};

export default userService;
