const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
} = require('../controllers/auth.controller');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Routes d'inscription génériques et spécifiques
router.post('/register', register);
router.post('/register/host', register);  // Route spécifique pour l'inscription des hôtes
router.post('/register/cleaner', register);  // Route spécifique pour l'inscription des nettoyeurs

router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;