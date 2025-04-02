// Correction: Importer { api } et renommer
import { api as apiInstance } from './api'; 

// Wrapper pour assurer que l'instance api est chargée
const getApi = () => {
    console.log("[getApi in listingService] Checking apiInstance. Is it defined?", !!apiInstance);
    if (!apiInstance) {
        console.error("API instance (listingService) requested before module fully loaded!");
        try {
            console.log("[getApi in listingService] Attempting dynamic require...");
            const dynamicApi = require('./api').api;
            console.log("[getApi in listingService] Dynamic require result:", typeof dynamicApi);
            if(dynamicApi) return dynamicApi;
            else throw new Error("Dynamic require returned undefined"); // Forcer une erreur si undefined
        } catch (e) {
             console.error("Dynamic API import failed in listingService:", e);
             // Si le require dynamique échoue, on ne peut rien faire -> lancer erreur
             throw new Error("API instance is not available in listingService.");
        }
        // Ne devrait plus atteindre ici si on lance une erreur
        // return { get: ()=>Promise.reject("API not loaded"), post: ()=>Promise.reject("API not loaded"), put: ()=>Promise.reject("API not loaded"), delete: ()=>Promise.reject("API not loaded"), patch: ()=>Promise.reject("API not loaded"), upload: ()=>Promise.reject("API not loaded"), setAuthToken: ()=>{} }; 
    }
    // Si apiInstance est défini, le retourner
    return apiInstance;
};

const listingService = {
  getListings: async (params = {}) => {
    const currentApi = getApi(); // Obtenir l'instance
    return await currentApi.get('/listings', params);
  },
  getListing: async (id) => {
    const currentApi = getApi();
    return await currentApi.get(`/listings/${id}`);
  },
  createListing: async (listingData) => {
    const currentApi = getApi();
    return await currentApi.post('/listings', listingData);
  },
  updateListing: async (id, listingData) => {
    const currentApi = getApi();
    return await currentApi.put(`/listings/${id}`, listingData);
  },
  deleteListing: async (id) => {
    const currentApi = getApi();
    return await currentApi.delete(`/listings/${id}`); 
  },
  getMyListings: async (params = {}) => {
    const currentApi = getApi();
    return await currentApi.get('/listings/me', params);
  },
  applyForListing: async (listingId) => {
    const currentApi = getApi();
    return await currentApi.post(`/listings/${listingId}/apply`);
  },
  getMatchingListings: async (params = {}) => {
    console.log("[listingService] getMatchingListings called. Getting API instance...");
    const currentApi = getApi(); // Obtenir l'instance
    console.log("[listingService] API instance obtained. Calling get...");
    return await currentApi.get('/listings/matches', params);
  },
  calculatePrice: async (listingData) => {
    const currentApi = getApi();
    return await currentApi.post('/listings/calculate-price', listingData);
  },
  uploadImages: async (listingId, formData) => {
    const currentApi = getApi();
    return await currentApi.upload(`/listings/${listingId}/images`, formData);
  },
  getApplications: async (listingId, params = {}) => {
    const currentApi = getApi();
    return await currentApi.get(`/listings/${listingId}/applications`, params);
  }
};

export default listingService;
