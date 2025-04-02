const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser, // Utilisé pour PUT /:id (Admin)
  deleteUser, // Utilisé pour DELETE /:id (Admin)
  updateMyProfile // Nouveau contrôleur à créer pour PUT /profile
} = require('../controllers/user.controller');

// Importer getMe du contrôleur d'authentification pour GET /profile
const { getMe } = require('../controllers/auth.controller');

const User = require('../models/User');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

// --- Routes Publiques/Authentifiées (AVANT authorize('admin')) --- 

// Middleware pour s'assurer que l'utilisateur est connecté pour les routes suivantes
router.use(protect); 

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/profile', getMe);

// NOUVELLE ROUTE: Mettre à jour le profil de l'utilisateur connecté
router.put('/profile', updateMyProfile); // Accessible à tous les utilisateurs connectés

// --- Routes Réservées aux Admins (APRÈS authorize('admin')) ---

// Appliquer l'autorisation admin pour les routes restantes
router.use(authorize('admin'));

// Gérer tous les utilisateurs (Admin)
router
  .route('/')
  .get(advancedResults(User), getUsers)
  .post(createUser);

// Gérer un utilisateur spécifique par ID (Admin)
router
  .route('/:id')
  .get(getUser)
  .put(updateUser) // Mise à jour par l'admin
  .delete(deleteUser);

module.exports = router;
