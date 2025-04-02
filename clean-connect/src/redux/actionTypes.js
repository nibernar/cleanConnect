// src/redux/actionTypes.js

export const AUTH_ACTION_TYPES = {
  LOGIN: 'auth/login',
  REGISTER_HOST: 'auth/registerHost',
  REGISTER_CLEANER: 'auth/registerCleaner',
  LOGOUT: 'auth/logout',
  RESTORE_SESSION: 'auth/restoreSession',
  VERIFY_EMAIL: 'auth/verifyEmail',
  REQUEST_PASSWORD_RESET: 'auth/requestPasswordReset',
  RESET_PASSWORD: 'auth/resetPassword',
};

export const USER_SYNC_ACTION_TYPE = 'user/syncFromAuth';

// NOUVEAU: Types pour Host Slice (si besoin d'actions synchrones appelées depuis l'extérieur)
export const HOST_ACTION_TYPES = {
    CLEAR_ERROR: 'host/clearError'
    // Ajouter d'autres types si nécessaire
};

// ... autres types ...
