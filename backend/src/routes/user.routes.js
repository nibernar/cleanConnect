const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');

// Importer getMe du contrôleur d'authentification pour la route profile
const { getMe } = require('../controllers/auth.controller');

const User = require('../models/User');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

// Route pour le profil utilisateur - accessible à tous les utilisateurs authentifiés
router.get('/profile', protect, getMe);

// Toutes les autres routes utilisateur nécessitent le rôle admin
router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(advancedResults(User), getUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;