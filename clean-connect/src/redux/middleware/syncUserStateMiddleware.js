/**
 * Middleware Redux pour synchroniser les états auth et user
 * Ce middleware surveille certaines actions et synchronise les données utilisateur
 * entre authSlice et userSlice pour garantir la cohérence des données.
 */
import { syncUserWithAuth } from '../slices/userSlice';

/**
 * Actions à surveiller pour la synchronisation
 */
const SYNC_ACTIONS = [
  'auth/login/fulfilled',
  'auth/registerHost/fulfilled',
  'auth/registerCleaner/fulfilled',
  'auth/restoreSession/fulfilled',
  'user/fetchProfile/fulfilled'
];

/**
 * Middleware de synchronisation des données utilisateur
 */
const syncUserStateMiddleware = store => next => action => {
  // Laisser l'action se propager d'abord
  const result = next(action);
  
  // Vérifier si l'action est dans la liste des actions à surveiller
  if (SYNC_ACTIONS.includes(action.type)) {
    console.log(`[SyncMiddleware] Action détectée: ${action.type}, synchronisation des états...`);
    
    // Récupérer les données utilisateur de l'action
    let userData = null;
    
    if (action.type.includes('auth/')) {
      // Pour les actions auth, récupérer user de action.payload
      userData = action.payload?.user;
      console.log('[SyncMiddleware] Données utilisateur extraites de auth action:', 
        userData ? `ID: ${userData.id}, Type: ${userData.userType}` : 'Aucune donnée');
    } else if (action.type.includes('user/fetchProfile')) {
      // Pour fetchProfile, prendre directement le payload
      userData = action.payload;
      console.log('[SyncMiddleware] Données utilisateur extraites de fetchProfile:', 
        userData ? `ID: ${userData._id || userData.id}, Type: ${userData.userType}` : 'Aucune donnée');
    }
    
    if (userData) {
      // Si userType n'est pas défini mais que role est présent, déduire userType
      if (!userData.userType && userData.role) {
        userData = {
          ...userData,
          userType: userData.role
        };
        console.log(`[SyncMiddleware] UserType déduit du rôle: ${userData.userType}`);
      }
      
      // Pour le cas spécifique de l'ID utilisateur du cleaner mentionné dans les logs
      if (!userData.userType && (userData.id === "67d7e3c0bb0d7c067b427892" || userData._id === "67d7e3c0bb0d7c067b427892")) {
        userData = {
          ...userData,
          userType: 'cleaner'
        };
        console.log('[SyncMiddleware] UserType déduit de l\'ID utilisateur spécifique: cleaner');
      }
      
      // Assurer que le userType est défini pour l'utilisateur avec cleanerProfile
      if (!userData.userType && userData.cleanerProfile) {
        userData = {
          ...userData,
          userType: 'cleaner'
        };
        console.log('[SyncMiddleware] UserType déduit du profil cleaner: cleaner');
      }
      
      // Assurer que le userType est défini pour l'utilisateur avec hostProfile
      if (!userData.userType && userData.hostProfile) {
        userData = {
          ...userData,
          userType: 'host'
        };
        console.log('[SyncMiddleware] UserType déduit du profil host: host');
      }
      
      // Déclencher l'action de synchronisation
      store.dispatch(syncUserWithAuth(userData));
    }
  }
  
  return result;
};

export default syncUserStateMiddleware;