import { apiService } from './apiService';

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
    return await apiService.get('/invoices', params);
  },

  /**
   * Get a single invoice by ID
   * @param {string} id Invoice ID
   * @returns {Promise<Object>} Invoice data
   */
  getInvoice: async (id) => {
    return await apiService.get(`/invoices/${id}`);
  },

  /**
   * Get invoice for a specific booking
   * @param {string} bookingId Booking ID
   * @returns {Promise<Object>} Invoice data
   */
  getBookingInvoice: async (bookingId) => {
    return await apiService.get(`/invoices/booking/${bookingId}`);
  },

  /**
   * Download invoice PDF
   * @param {string} invoiceId Invoice ID
   * @returns {Promise<Blob>} Invoice PDF blob
   */
  downloadInvoice: async (invoiceId) => {
    return await apiService.download(`/invoices/${invoiceId}/download`);
  },

  /**
   * Get host invoices
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated host invoices
   */
  getHostInvoices: async (params = {}) => {
    return await apiService.get('/invoices/host', params);
  },

  /**
   * Get cleaner invoices
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated cleaner invoices
   */
  getCleanerInvoices: async (params = {}) => {
    return await apiService.get('/invoices/cleaner', params);
  },

  /**
   * Get invoice statistics
   * @param {Object} params Query parameters with date range
   * @returns {Promise<Object>} Invoice statistics
   */
  getInvoiceStatistics: async (params = {}) => {
    return await apiService.get('/invoices/statistics', params);
  },

  /**
   * Get payment history
   * @param {Object} params Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated payment history
   */
  getPaymentHistory: async (params = {}) => {
    return await apiService.get('/invoices/payments', params);
  },

  /**
   * Send invoice by email
   * @param {string} invoiceId Invoice ID
   * @param {Object} emailData Email data with recipient address
   * @returns {Promise<Object>} Operation result
   */
  sendInvoiceByEmail: async (invoiceId, emailData) => {
    return await apiService.post(`/invoices/${invoiceId}/send-email`, emailData);
  },

  /**
   * Get monthly earnings (for cleaner)
   * @param {Object} params Query parameters with date range
   * @returns {Promise<Object>} Monthly earnings data
   */
  getMonthlyEarnings: async (params = {}) => {
    return await apiService.get('/invoices/earnings/monthly', params);
  },

  /**
   * Get yearly earnings (for cleaner)
   * @param {Object} params Query parameters with year
   * @returns {Promise<Object>} Yearly earnings data
   */
  getYearlyEarnings: async (params = {}) => {
    return await apiService.get('/invoices/earnings/yearly', params);
  }
};

export default invoiceService;