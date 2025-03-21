const User = require('../models/User');
const Host = require('../models/Host');
const Cleaner = require('../models/Cleaner');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { validateSiret } = require('../services/siretVerification');

/**
 * @desc    Inscrire un nouvel utilisateur (hébergeur ou nettoyeur)
 * @route   POST /api/auth/register, /api/auth/register/host, /api/auth/register/cleaner
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    role,
    phone,
    location,
    // Champs spécifiques aux hébergeurs
    companyName,
    isCompany,
    businessDetails,
    // Champs spécifiques aux nettoyeurs
    siret,
    bankAccount,
    workPreferences
  } = req.body;

  console.log('Register API called with:', {
    path: req.path,
    body: req.body
  });

  // Déterminer le rôle en fonction de l'URL si non spécifié dans le corps
  let userRole = role;
  if (!userRole) {
    if (req.path.includes('/host')) {
      userRole = 'host';
    } else if (req.path.includes('/cleaner')) {
      userRole = 'cleaner';
    } else {
      return next(new ErrorResponse('Le rôle de l\'utilisateur est requis', 400));
    }
  }

  // Créer l'utilisateur de base
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: userRole,
    phone,
    location: location || {}
  });

  // Créer le profil spécifique en fonction du rôle
  if (userRole === 'host') {
    await Host.create({
      user: user._id,
      companyName,
      isCompany: isCompany || false,
      businessDetails: businessDetails || {}
    });
  } else if (userRole === 'cleaner') {
    // Vérifier le SIRET si fourni
    if (siret) {
      const isValid = await validateSiret(siret);
      if (!isValid) {
        await User.findByIdAndDelete(user._id);
        return next(new ErrorResponse('Numéro SIRET invalide', 400));
      }
    }

    await Cleaner.create({
      user: user._id,
      businessDetails: {
        siret,
        isAutoEntrepreneur: true
      },
      bankAccount: bankAccount || {},
      workPreferences: workPreferences || {}
    });
  }

  sendTokenResponse(user, 201, res);
});

/**
 * @desc    Connecter un utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Valider email et mot de passe
  if (!email || !password) {
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }

  // Vérifier l'utilisateur
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // Vérifier si le mot de passe correspond
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Déconnecter l'utilisateur / effacer le cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Obtenir l'utilisateur actuel
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  let userData = await User.findById(req.user.id);

  // Ajouter les détails spécifiques au rôle
  if (userData.role === 'host') {
    const hostData = await Host.findOne({ user: userData._id });
    userData = { ...userData._doc, hostProfile: hostData };
  } else if (userData.role === 'cleaner') {
    const cleanerData = await Cleaner.findOne({ user: userData._id });
    userData = { ...userData._doc, cleanerProfile: cleanerData };
  }

  res.status(200).json({
    success: true,
    data: userData
  });
});

/**
 * @desc    Mettre à jour les détails utilisateur
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    location: req.body.location
  };

  // Filtrer les champs non définis
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Mettre à jour le mot de passe
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Vérifier le mot de passe actuel
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Mot de passe incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Mot de passe oublié
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('Aucun utilisateur avec cet email', 404));
  }

  // TODO: Implémenter la logique d'envoi d'email pour réinitialisation
  // Pour l'instant, on renvoie juste un message de succès
  res.status(200).json({
    success: true,
    data: 'Email envoyé'
  });
});

/**
 * @desc    Réinitialiser le mot de passe
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // TODO: Implémenter la logique complète de réinitialisation
  // Pour l'instant, on renvoie juste un message d'erreur
  return next(new ErrorResponse('Cette fonctionnalité n\'est pas encore implémentée', 501));
});

// Fonction utilitaire pour envoyer la réponse avec token
const sendTokenResponse = (user, statusCode, res) => {
  // Créer token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  });
};