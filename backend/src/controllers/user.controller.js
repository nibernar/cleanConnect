const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user by ID (Admin)
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user (Admin)
// @route   POST /api/v1/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user by ID (Admin)
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  // L'admin peut potentiellement tout mettre à jour (sauf mot de passe ici)
  const { password, ...updateData } = req.body;

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update current logged in user profile
// @route   PUT /api/v1/users/profile
// @access  Private (All authenticated users)
exports.updateMyProfile = asyncHandler(async (req, res, next) => {
  // Champs autorisés à être mis à jour par l'utilisateur lui-même
  const allowedFields = [
    'firstName',
    'lastName',
    'phone',
    'location', // Si location est un objet, s'assurer de la validation/structure
    // Exclure explicitement : email, role, password, etc.
  ];

  const fieldsToUpdate = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      fieldsToUpdate[field] = req.body[field];
    }
  });

  // Vérifier si des champs valides sont fournis
  if (Object.keys(fieldsToUpdate).length === 0) {
      return next(new ErrorResponse('Aucun champ valide fourni pour la mise à jour', 400));
  }

  // Mettre à jour l'utilisateur connecté
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true, // Retourne le document mis à jour
    runValidators: true // Exécute les validateurs Mongoose
  });

  // Note: findByIdAndUpdate ne retourne pas d'erreur si l'ID n'existe pas,
  // mais comme on utilise req.user.id (d'un user forcément existant car connecté via protect),
  // on n'a pas besoin de vérifier si user est null ici.

  res.status(200).json({
    success: true,
    data: user // Renvoyer l'utilisateur mis à jour
  });
});


// @desc    Delete user (Admin)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Avant de supprimer l'utilisateur, considérer la suppression des données associées
  // (ex: profils Host/Cleaner, listings, bookings liés ?)
  // Pour l'instant, suppression simple :
  await user.deleteOne(); // Utiliser deleteOne() ou remove() selon la version/préférence

  res.status(200).json({
    success: true,
    data: {}
  });
});
