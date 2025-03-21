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
    console.log('🔍 userService: Fetching user profile');
    try {
      const response = await apiService.get('/users/profile');
      console.log('📦 userService: Profile data received:', response);
      // Handle both success response formats (with or without data property)
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error fetching profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData Updated profile data
   * @returns {Promise<Object>} Updated user profile
   */
  updateProfile: async (profileData) => {
    console.log('🔄 userService: Updating profile with data:', profileData);
    try {
      const response = await apiService.put('/users/profile', profileData);
      console.log('✅ userService: Profile updated successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Update user password
   * @param {Object} passwordData Current and new password
   * @returns {Promise<Object>} Update result
   */
  updatePassword: async (passwordData) => {
    console.log('🔑 userService: Updating password');
    try {
      const response = await apiService.put('/users/password', passwordData);
      console.log('✅ userService: Password updated successfully');
      return response;
    } catch (error) {
      console.error('❌ userService: Error updating password:', error);
      throw error;
    }
  },

  /**
   * Get host profile
   * @returns {Promise<Object>} Host profile data
   */
  getHostProfile: async () => {
    console.log('🔍 userService: Fetching host profile');
    try {
      const response = await apiService.get('/hosts/profile');
      console.log('📦 userService: Host profile data received:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error fetching host profile:', error);
      throw error;
    }
  },

  /**
   * Update host profile
   * @param {Object} profileData Updated profile data
   * @returns {Promise<Object>} Updated host profile
   */
  updateHostProfile: async (profileData) => {
    console.log('🔄 userService: Updating host profile with data:', profileData);
    try {
      const response = await apiService.put('/hosts/profile', profileData);
      console.log('✅ userService: Host profile updated successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error updating host profile:', error);
      throw error;
    }
  },

  /**
   * Get cleaner profile
   * @returns {Promise<Object>} Cleaner profile data
   */
  getCleanerProfile: async () => {
    console.log('🔍 userService: Fetching cleaner profile');
    try {
      const response = await apiService.get('/cleaners/profile');
      console.log('📦 userService: Cleaner profile data received:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error fetching cleaner profile:', error);
      throw error;
    }
  },

  /**
   * Update cleaner profile
   * @param {Object} profileData Updated profile data
   * @returns {Promise<Object>} Updated cleaner profile
   */
  updateCleanerProfile: async (profileData) => {
    console.log('🔄 userService: Updating cleaner profile with data:', profileData);
    try {
      const response = await apiService.put('/cleaners/profile', profileData);
      console.log('✅ userService: Cleaner profile updated successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error updating cleaner profile:', error);
      throw error;
    }
  },

  /**
   * Update cleaner work preferences
   * @param {Object} preferencesData Updated preferences data
   * @returns {Promise<Object>} Updated preferences
   */
  updateCleanerPreferences: async (preferencesData) => {
    console.log('🔄 userService: Updating cleaner preferences with data:', preferencesData);
    try {
      const response = await apiService.put('/cleaners/preferences', preferencesData);
      console.log('✅ userService: Cleaner preferences updated successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error updating cleaner preferences:', error);
      throw error;
    }
  },

  /**
   * Get cleaner's banking information
   * @returns {Promise<Object>} Banking information
   */
  getBankingInfo: async () => {
    console.log('🔍 userService: Fetching banking information');
    try {
      const response = await apiService.get('/cleaners/banking');
      console.log('📦 userService: Banking information received:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error fetching banking information:', error);
      throw error;
    }
  },

  /**
   * Update cleaner's banking information
   * @param {Object} bankingData Banking information data
   * @returns {Promise<Object>} Updated banking information
   */
  updateBankingInfo: async (bankingData) => {
    console.log('🔄 userService: Updating banking information with data:', bankingData);
    try {
      const response = await apiService.put('/cleaners/banking', bankingData);
      console.log('✅ userService: Banking information updated successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error updating banking information:', error);
      throw error;
    }
  },

  /**
   * Upload profile picture
   * @param {String} imageUri URI of the image to upload
   * @returns {Promise<Object>} Upload result
   */
  uploadProfilePicture: async (imageUri) => {
    console.log('🖼️ userService: Uploading profile picture:', imageUri);
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg'
      });
      
      const response = await apiService.upload('/users/profile-picture', formData);
      console.log('✅ userService: Profile picture uploaded successfully:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error uploading profile picture:', error);
      throw error;
    }
  },

  /**
   * Upload identity document
   * @param {String} imageUri URI of the document image
   * @param {String} documentType Type of the document
   * @returns {Promise<Object>} Upload result
   */
  uploadIdentityDocument: async (imageUri, documentType) => {
    console.log('📄 userService: Uploading identity document of type:', documentType);
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${documentType}-document.jpg`
      });
      formData.append('documentType', documentType);
      
      const response = await apiService.upload('/users/identity-document', formData);
      console.log('✅ userService: Identity document uploaded successfully');
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error uploading identity document:', error);
      throw error;
    }
  },

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  getStatistics: async () => {
    console.log('📊 userService: Fetching user statistics');
    try {
      const response = await apiService.get('/users/statistics');
      console.log('📦 userService: User statistics received:', response);
      return response.data || response;
    } catch (error) {
      console.error('❌ userService: Error fetching user statistics:', error);
      throw error;
    }
  }
};

export default userService;