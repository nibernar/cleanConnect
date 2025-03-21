const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protéger les routes
exports.protect = async (req, res, next) => {
  let token;
  
  // Pour le débogage - log la requête entrante
  console.log(`🔒 Auth Request: ${req.method} ${req.originalUrl}`);
  console.log(`🔑 Auth Headers: ${req.headers.authorization ? 'Bearer Token present' : 'No Bearer Token'}`);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extraire le token du header
    token = req.headers.authorization.split(' ')[1];
    console.log(`🔑 Token extrait: ${token ? token.substring(0, 15) + '...' : 'none'}`);
  } else if (req.cookies && req.cookies.token) {
    // Alternative: essayer d'obtenir le token des cookies
    token = req.cookies.token;
    console.log(`🍪 Token trouvé dans les cookies: ${token.substring(0, 15) + '...'}`);
  }

  // Vérifier si le token existe
  if (!token) {
    console.log('❌ Pas de token trouvé dans la requête');
    return next(new ErrorResponse('Non autorisé à accéder à cette ressource - Token manquant', 401));
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ Token vérifié pour l'utilisateur ID: ${decoded.id}`);

    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log(`❌ Utilisateur introuvable pour l'ID: ${decoded.id}`);
      return next(new ErrorResponse('Utilisateur non trouvé - Token invalide', 401));
    }
    
    console.log(`👤 Utilisateur authentifié: ${user.email} (${user.role})`);
    req.user = user;

    next();
  } catch (err) {
    console.log(`❌ Erreur de vérification du token: ${err.message}`);
    if (err.name === 'TokenExpiredError') {
      return next(new ErrorResponse('Session expirée - Veuillez vous reconnecter', 401));
    }
    return next(new ErrorResponse(`Non autorisé - ${err.message}`, 401));
  }
};

// Accorder l'accès à des rôles spécifiques
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('❌ Tentative d\'autorisation sans utilisateur');
      return next(
        new ErrorResponse('Erreur interne: Authentification requise avant autorisation', 500)
      );
    }
    
    console.log(`🔐 Vérification des rôles: ${req.user.role} doit être parmi [${roles.join(', ')}]`);
    
    if (!roles.includes(req.user.role)) {
      console.log(`❌ Rôle non autorisé: ${req.user.role}`);
      return next(
        new ErrorResponse(
          `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`,
          403
        )
      );
    }
    
    console.log(`✅ Autorisation accordée pour ${req.user.email} (${req.user.role})`);
    next();
  };
};