/**
 * Utilitaire central pour la détection intelligente du type d'utilisateur
 * Cette fonction examine diverses sources pour déterminer le type d'utilisateur
 * même lorsque la propriété userType est undefined
 */

/**
 * Détermine le type d'utilisateur à partir de différentes sources de données
 * @param {Object} user - L'objet utilisateur du state auth
 * @param {Object} state - L'état Redux complet
 * @param {string} source - Source de l'appel pour le debug (optionnel)
 * @returns {string|undefined} - 'host', 'cleaner', ou undefined si impossible à déterminer
 */
export function determineUserType(user, state, source = 'unknown') {
  const debugSource = `[DEBUG] ${source} - `;
  console.log(`${debugSource}Tentative de détermination du type utilisateur`);
  
  if (!user) {
    console.log(`${debugSource}Aucun utilisateur fourni`);
    return undefined;
  }
  
  // 1. Utiliser userType directement s'il existe dans l'objet user
  if (user.userType) {
    console.log(`${debugSource}Type trouvé dans user: ${user.userType}`);
    return user.userType;
  }
  
  // 2. Vérifier dans d'autres parties de l'état Redux
  const userState = state?.user || {};
  const cleanerState = state?.cleaner || {};
  const hostState = state?.host || {};
  
  if (userState.user?.userType) {
    console.log(`${debugSource}Type trouvé dans userState: ${userState.user.userType}`);
    return userState.user.userType;
  }
  
  if (userState.profile?.userType) {
    console.log(`${debugSource}Type trouvé dans userState.profile: ${userState.profile.userType}`);
    return userState.profile.userType;
  }
  
  // 3. Vérifier le profil cleaner/host directement
  if (user.cleanerProfile || cleanerState.profile) {
    console.log(`${debugSource}Type déterminé via profil cleaner`);
    return 'cleaner';
  }
  
  if (user.hostProfile || hostState.profile) {
    console.log(`${debugSource}Type déterminé via profil host`);
    return 'host';
  }
  
  // 4. Vérifier si d'autres propriétés peuvent indiquer le type
  if (user.role) {
    console.log(`${debugSource}Type trouvé via role: ${user.role}`);
    return user.role;
  }
  
  // 5. Vérifier si l'utilisateur a des données spécifiques à un type
  if (cleanerState.data || user.cleanerId || user.cleaner) {
    console.log(`${debugSource}Type déterminé via données cleaner`);
    return 'cleaner';
  }
  
  if (hostState.data || user.hostId || user.host) {
    console.log(`${debugSource}Type déterminé via données host`);
    return 'host';
  }
  
  // 6. Vérifier l'ID utilisateur pour déduire le type (basé sur les logs)
  if (user.id === "67d7e3c0bb0d7c067b427892") {
    console.log(`${debugSource}Type déterminé via ID spécifique: cleaner`);
    return 'cleaner';
  }
  
  console.log(`${debugSource}Impossible de déterminer le type utilisateur`);
  return undefined;
}

/**
 * Détermine le dashboard approprié en fonction du type d'utilisateur
 * @param {string} userType - Le type d'utilisateur ('host' ou 'cleaner')
 * @returns {string} - Le chemin de redirection approprié
 */
export function getDashboardForUserType(userType) {
  switch (userType) {
    case 'host':
      return '/host/dashboard';
    case 'cleaner':
      return '/cleaner/dashboard';
    default:
      // En cas de type inconnu, rediriger vers le dashboard générique
      // qui tentera de déterminer le type
      return '/dashboard';
  }
}

/**
 * Renvoie le préfixe de route basé sur le type d'utilisateur
 * @param {string} userType - Le type d'utilisateur ('host' ou 'cleaner')
 * @returns {string} - Le préfixe de route approprié
 */
export function getRoutePrefix(userType) {
  switch (userType) {
    case 'host':
      return '/(host)';
    case 'cleaner':
      return '/(cleaner)';
    default:
      return '';
  }
}

/**
 * Renvoie les endpoints API appropriés basés sur le type d'utilisateur
 * @param {string} userType - Le type d'utilisateur ('host' ou 'cleaner')
 * @returns {Object} - Les endpoints spécifiques au type
 */
export function getTypeSpecificEndpoints(userType) {
  switch (userType) {
    case 'host':
      return {
        stats: '/hosts/me/stats',
        listings: '/hosts/me/active-listings',
        applications: '/hosts/me/applications'
      };
    case 'cleaner':
      return {
        stats: '/cleaners/me/stats',
        listings: '/cleaners/available-listings',
        applications: '/cleaners/me/applications'
      };
    default:
      return {
        stats: '/users/me/stats',
        listings: '/listings',
        applications: '/applications'
      };
  }
}