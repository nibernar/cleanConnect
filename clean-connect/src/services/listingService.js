import { apiService } from './apiService';
import { transformListingToBackend, transformListingToFrontend } from '../utils/dataAdapters';
import { calculateListingPrice } from '../utils/priceCalculator';
import { measurePerformance } from '../utils/debugUtils';

/**
 * Service for listing related API calls
 */
const listingService = {
  /**
   * Get all listings with filtering and pagination
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated listings
   */
  getListings: measurePerformance(async (params = {}) => {
    const response = await apiService.get('/listings', params);
    // Transform each listing to frontend format
    if (response && response.data) {
      response.data = response.data.map(listing => transformListingToFrontend(listing));
    }
    return response;
  }, 'getListings'),

  /**
   * Get a single listing by ID
   * @param {string} id Listing ID
   * @returns {Promise<Object>} Listing data
   */
  getListing: measurePerformance(async (id) => {
    const response = await apiService.get(`/listings/${id}`);
    return transformListingToFrontend(response);
  }, 'getListing'),

  /**
   * Create a new listing
   * @param {Object} listingData Listing data
   * @returns {Promise<Object>} Created listing
   */
  createListing: measurePerformance(async (listingData) => {
    let dataWithPrice = {...listingData};
    
    // Only calculate price if not already provided from the form
    // This prevents double calculation of price
    if (!dataWithPrice.price || 
        (typeof dataWithPrice.price === 'object' && !dataWithPrice.price.totalAmount)) {
      const price = calculateListingPrice(dataWithPrice);
      dataWithPrice = {
        ...dataWithPrice,
        price
      };
    }
    
    // Transform data to backend format
    const backendData = transformListingToBackend(dataWithPrice);
    console.log('Creating listing with data:', backendData);
    
    const response = await apiService.post('/listings', backendData);
    return transformListingToFrontend(response);
  }, 'createListing'),

  /**
   * Update a listing
   * @param {string} id Listing ID
   * @param {Object} listingData Updated listing data
   * @returns {Promise<Object>} Updated listing
   */
  updateListing: measurePerformance(async (id, listingData) => {
    let updatedData = {...listingData};
    
    // Only recalculate price if not already provided AND if relevant fields have changed
    if ((!updatedData.price || 
        (typeof updatedData.price === 'object' && !updatedData.price.totalAmount)) && 
        (updatedData.squareMeters || updatedData.services || 
         updatedData.startTime || updatedData.endTime || updatedData.area)) {
      const price = calculateListingPrice(updatedData);
      updatedData = {
        ...updatedData,
        price
      };
    }
    
    // Transform data to backend format
    const backendData = transformListingToBackend(updatedData);
    console.log('Updating listing with data:', backendData);
    
    const response = await apiService.put(`/listings/${id}`, backendData);
    return transformListingToFrontend(response);
  }, 'updateListing'),

  /**
   * Delete a listing
   * @param {string} id Listing ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteListing: measurePerformance(async (id) => {
    // CORRECTION: Vérifier que l'ID est défini avant d'envoyer la requête
    if (!id) {
      console.error('[ListingService] Tentative de suppression d\'une annonce avec un ID undefined');
      throw new Error('L\'identifiant de l\'annonce est manquant ou invalide');
    }
    
    return await apiService.delete(`/listings/${id}`);
  }, 'deleteListing'),

  /**
   * Get listings for the currently logged in host
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated host listings
   */
  getMyListings: measurePerformance(async (params = {}) => {
    const response = await apiService.get('/listings/me', params);
    if (response && response.data) {
      return response.data.map(listing => transformListingToFrontend(listing));
    }
    return [];
  }, 'getMyListings'),

  /**
   * Apply for a listing as a cleaner
   * @param {string} listingId Listing ID
   * @returns {Promise<Object>} Application result
   */
  applyForListing: measurePerformance(async (listingId) => {
    // CORRECTION: Vérifier que l'ID est défini avant d'envoyer la requête
    if (!listingId) {
      console.error('[ListingService] Tentative de candidature à une annonce avec un ID undefined');
      throw new Error('L\'identifiant de l\'annonce est manquant ou invalide');
    }
    
    const response = await apiService.post(`/listings/${listingId}/apply`);
    return response;
  }, 'applyForListing'),

  /**
   * Get matching listings for a cleaner based on preferences
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated matching listings
   */
  getMatchingListings: measurePerformance(async (params = {}) => {
    const response = await apiService.get('/listings/matches', params);
    if (response && response.data) {
      return response.data.map(listing => transformListingToFrontend(listing));
    }
    return [];
  }, 'getMatchingListings'),

  /**
   * Calculate the price for a listing
   * @param {Object} listingData Listing data for price calculation
   * @returns {Promise<Object>} Price calculation result
   */
  calculatePrice: measurePerformance(async (listingData) => {
    return calculateListingPrice(listingData);
  }, 'calculatePrice'),

  /**
   * Upload images for a listing
   * @param {string} listingId Listing ID
   * @param {FormData} formData Form data with images
   * @returns {Promise<Object>} Upload result
   */
  uploadImages: measurePerformance(async (listingId, formData) => {
    // CORRECTION: Vérifier que l'ID est défini avant d'envoyer la requête
    if (!listingId) {
      console.error('[ListingService] Tentative d\'upload d\'image pour une annonce avec un ID undefined');
      throw new Error('L\'identifiant de l\'annonce est manquant ou invalide');
    }
    
    return await apiService.upload(`/listings/${listingId}/images`, formData);
  }, 'uploadImages'),

  /**
   * Get applications for a specific listing
   * @param {string} listingId Listing ID
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated applications
   */
  getApplications: measurePerformance(async (listingId, params = {}) => {
    // CORRECTION: Vérifier que l'ID est défini avant d'envoyer la requête
    if (!listingId) {
      console.error('[ListingService] Tentative de récupération des candidatures pour une annonce avec un ID undefined');
      throw new Error('L\'identifiant de l\'annonce est manquant ou invalide');
    }
    
    const response = await apiService.get(`/listings/${listingId}/applications`, params);
    return response.data || [];
  }, 'getApplications'),

  /**
   * Accept an application for a listing
   * @param {string} listingId Listing ID
   * @param {string} applicationId Application ID
   * @returns {Promise<Object>} Accepted application
   */
  acceptApplication: measurePerformance(async (listingId, applicationId) => {
    // CORRECTION: Vérifier que les IDs sont définis avant d'envoyer la requête
    if (!listingId || !applicationId) {
      console.error('[ListingService] Tentative d\'acceptation d\'une candidature avec des IDs invalides', 
        { listingId, applicationId });
      throw new Error('Les identifiants de l\'annonce ou de la candidature sont manquants ou invalides');
    }
    
    return await apiService.put(`/listings/${listingId}/applications/${applicationId}/accept`);
  }, 'acceptApplication'),

  /**
   * Reject an application for a listing
   * @param {string} listingId Listing ID
   * @param {string} applicationId Application ID
   * @returns {Promise<Object>} Result of rejection
   */
  rejectApplication: measurePerformance(async (listingId, applicationId) => {
    // CORRECTION: Vérifier que les IDs sont définis avant d'envoyer la requête
    if (!listingId || !applicationId) {
      console.error('[ListingService] Tentative de rejet d\'une candidature avec des IDs invalides', 
        { listingId, applicationId });
      throw new Error('Les identifiants de l\'annonce ou de la candidature sont manquants ou invalides');
    }
    
    return await apiService.put(`/listings/${listingId}/applications/${applicationId}/reject`);
  }, 'rejectApplication')
};

export default listingService;