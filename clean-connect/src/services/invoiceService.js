// Correction: Importer 'api' depuis './api'
import api from './api'; 

/**
 * Service for invoice related API calls
 */
const invoiceService = {
  /**
   * Get all invoices with pagination
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated invoices
   */
  getInvoices: async (params = {}) => {
    // Correction: Utiliser api.get
    return await api.get('/invoices', params);
  },

  /**
   * Get a single invoice by ID
   * @param {string} id Invoice ID
   * @returns {Promise<Object>} Invoice data
   */
  getInvoice: async (id) => {
    // Correction: Utiliser api.get
    return await api.get(`/invoices/${id}`);
  },

  /**
   * Get invoice for a specific booking
   * @param {string} bookingId Booking ID
   * @returns {Promise<Object>} Invoice data
   */
  getBookingInvoice: async (bookingId) => {
    // Correction: Utiliser api.get
    // Vérifier si la route backend est correcte
    return await api.get(`/invoices/booking/${bookingId}`); 
  },

  /**
   * Download invoice PDF
   * @param {string} invoiceId Invoice ID
   * @returns {Promise<Blob>} Invoice PDF blob
   */
  downloadInvoice: async (invoiceId) => {
    // Correction: Utiliser api.get avec responseType blob si nécessaire
    // L'objet 'api' exporté par api.js a-t-il une méthode download?
    // Sinon, il faut configurer axios pour le blob
    try {
        const response = await api.get(`/invoices/${invoiceId}/download`, { responseType: 'blob' });
        return response; // Retourner la réponse complète pour accéder au blob
    } catch(error) {
        console.error('Error downloading invoice:', error);
        throw error; // Renvoyer l'erreur
    }
  },

  /**
   * Get host invoices
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated host invoices
   */
  getHostInvoices: async (params = {}) => {
    // Correction: Utiliser api.get
    // Vérifier si la route est /invoices/me ou /invoices/host
    return await api.get('/invoices/me?type=host', params); // Supposition
  },

  /**
   * Get cleaner invoices
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated cleaner invoices
   */
  getCleanerInvoices: async (params = {}) => {
    // Correction: Utiliser api.get
     // Vérifier si la route est /invoices/me ou /invoices/cleaner
    return await api.get('/invoices/me?type=cleaner', params); // Supposition
  },

  /**
   * Get invoice statistics
   * @param {Object} params Query parameters with date range
   * @returns {Promise<Object>} Invoice statistics
   */
  getInvoiceStatistics: async (params = {}) => {
    // Correction: Utiliser api.get
    return await api.get('/invoices/statistics', params);
  },

  /**
   * Get payment history
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated payment history
   */
  getPaymentHistory: async (params = {}) => {
    // Correction: Utiliser api.get
    return await api.get('/invoices/payments', params);
  },

  /**
   * Send invoice by email
   * @param {string} invoiceId Invoice ID
   * @param {Object} emailData Email data with recipient address
   * @returns {Promise<Object>} Operation result
   */
  sendInvoiceByEmail: async (invoiceId, emailData) => {
    // Correction: Utiliser api.post
    return await api.post(`/invoices/${invoiceId}/send-email`, emailData);
  },

  /**
   * Get monthly earnings (for cleaner)
   * @param {Object} params Query parameters with date range
   * @returns {Promise<Object>} Monthly earnings data
   */
  getMonthlyEarnings: async (params = {}) => {
    // Correction: Utiliser api.get
    // Vérifier si la route est correcte (peut-être /cleaners/me/earnings?)
    return await api.get('/invoices/earnings/monthly', params);
  },

  /**
   * Get yearly earnings (for cleaner)
   * @param {Object} params Query parameters with year
   * @returns {Promise<Object>} Yearly earnings data
   */
  getYearlyEarnings: async (params = {}) => {
    // Correction: Utiliser api.get
    // Vérifier si la route est correcte
    return await api.get('/invoices/earnings/yearly', params);
  }
};

export default invoiceService;
