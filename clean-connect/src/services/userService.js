import { apiService } from './apiService';

/**
 * Service for user related API calls
 */
const userService = {
  /**
   * Get user profile
   * @returns {Promise<Object>} User profile data
   */
  getProfile: async () => {
    return await apiService.get('/users/profile');
  },

  /**
   * Update user profile
   * @param {Object} profileData Updated profile data
   * @returns {Promise<Object>} Updated user profile
   */
  updateProfile: async (profileData) => {
    return await apiService.put('/users/profile', profileData);
  },

  /**
   * Update user password
   * @param {Object} passwordData Current and new password
   * @returns {Promise<Object>} Update result
   */
  updatePassword: async (passwordData) => {
    return await apiService.put('/users/password', passwordData);
  },

  /**
   * Get host profile
   * @returns {Promise<Object>} Host profile data
   */
  getHostProfile: async () => {
    return await apiService.get('/hosts/profile');
  },

  /**
   * Update host profile
   * @param {Object} profileData Updated profile data
   * @returns {Promise<Object>} Updated host profile
   */
  updateHostProfile: async (profileData) => {
    return await apiService.put('/hosts/profile', profileData);
  },

  /**
   * Get cleaner profile
   * @returns {Promise<Object>} Cleaner profile data
   */
  getCleanerProfile: async () => {
    return await apiService.get('/cleaners/profile');
  },

  /**
   * Update cleaner profile
   * @param {Object} profileData Updated profile data
   * @returns {Promise<Object>} Updated cleaner profile
   */
  updateCleanerProfile: async (profileData) => {
    return await apiService.put('/cleaners/profile', profileData);
  },

  /**
   * Update cleaner work preferences
   * @param {Object} preferencesData Updated preferences data
   * @returns {Promise<Object>} Updated preferences
   */
  updateCleanerPreferences: async (preferencesData) => {
    return await apiService.put('/cleaners/preferences', preferencesData);
  },

  /**
   * Get cleaner's banking information
   * @returns {Promise<Object>} Banking information
   */
  getBankingInfo: async () => {
    return await apiService.get('/cleaners/banking');
  },

  /**
   * Update cleaner's banking information
   * @param {Object} bankingData Banking information data
   * @returns {Promise<Object>} Updated banking information
   */
  updateBankingInfo: async (bankingData) => {
    return await apiService.put('/cleaners/banking', bankingData);
  },

  /**
   * Upload profile picture
   * @param {FormData} formData Form data with image
   * @returns {Promise<Object>} Upload result
   */
  uploadProfilePicture: async (imageUri) => {
    const formData = new FormData();
    formData.append('profilePicture', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile-picture.jpg'
    });
    
    return await apiService.upload('/users/profile-picture', formData);
  },

  /**
   * Upload identity document
   * @param {FormData} formData Form data with document
   * @returns {Promise<Object>} Upload result
   */
  uploadIdentityDocument: async (imageUri, documentType) => {
    const formData = new FormData();
    formData.append('document', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${documentType}-document.jpg`
    });
    formData.append('documentType', documentType);
    
    return await apiService.upload('/users/identity-document', formData);
  },

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  getStatistics: async () => {
    return await apiService.get('/users/statistics');
  }
};

export default userService;