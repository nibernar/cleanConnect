import { apiService } from './apiService';

/**
 * Service for authentication related API calls
 */
const authService = {
  /**
   * Login with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} User data and token
   */
  login: async (email, password) => {
    return await apiService.post('/auth/login', { email, password });
  },

  /**
   * Register a new host
   * @param {Object} userData Host registration data
   * @returns {Promise<Object>} New user data and token
   */
  registerHost: async (userData) => {
    console.log('Registering host with data:', userData);
    return await apiService.post('/auth/register/host', userData);
  },

  /**
   * Register a new cleaner
   * @param {Object} userData Cleaner registration data
   * @returns {Promise<Object>} New user data and token
   */
  registerCleaner: async (userData) => {
    console.log('Registering cleaner with data:', userData);
    return await apiService.post('/auth/register/cleaner', userData);
  },

  /**
   * Get current user data
   * @returns {Promise<Object>} User data
   */
  getCurrentUser: async () => {
    console.log('Appel de getCurrentUser via API');
    try {
      const userData = await apiService.get('/auth/me');
      console.log('Données utilisateur récupérées avec succès:', userData);
      return userData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      throw error;
    }
  },

  /**
   * Verify email with token
   * @param {string} token Verification token
   * @returns {Promise<Object>} Verification result
   */
  verifyEmail: async (token) => {
    return await apiService.get(`/auth/verify-email/${token}`);
  },

  /**
   * Request password reset email
   * @param {string} email 
   * @returns {Promise<Object>} Request result
   */
  requestPasswordReset: async (email) => {
    return await apiService.post('/auth/forgotpassword', { email });
  },

  /**
   * Reset password with token
   * @param {string} token Reset token
   * @param {string} newPassword New password
   * @returns {Promise<Object>} Reset result
   */
  resetPassword: async (token, newPassword) => {
    return await apiService.post(`/auth/resetpassword/${token}`, {
      password: newPassword
    });
  },

  /**
   * Verify SIRET number
   * @param {string} siret SIRET number
   * @returns {Promise<Object>} Verification result
   */
  verifySiret: async (siret) => {
    return await apiService.post('/auth/verify-siret', { siret });
  }
};

export default authService;