// Correction: Importer { api } depuis './api'
import { api } from './api'; 

const authService = {
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password });
  },
  registerHost: async (userData) => {
    return await api.post('/auth/register/host', userData);
  },
  registerCleaner: async (userData) => {
    return await api.post('/auth/register/cleaner', userData);
  },
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },
  verifyEmail: async (token) => {
    return await api.get(`/auth/verify-email/${token}`);
  },
  requestPasswordReset: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },
  resetPassword: async (token, newPassword) => {
    return await api.post(`/auth/reset-password/${token}`, { password: newPassword });
  },
  verifySiret: async (siret) => {
    return await api.post('/auth/verify-siret', { siret });
  }
};

export default authService;
