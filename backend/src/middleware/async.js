/**
 * Middleware pour éliminer les try/catch répétitifs dans les contrôleurs
 * Permet d'utiliser async/await sans gérer les erreurs à chaque fois
 * @param {Function} fn - Fonction de contrôleur asynchrone
 * @returns {Function} Middleware Express avec gestion d'erreur
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;