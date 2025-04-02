// src/redux/middleware/syncUserStateMiddleware.js
import { login, registerHost, registerCleaner, restoreSession, logout } from '../authActions';
// Correction: Importer SEULEMENT le type d'action de synchronisation
import { USER_SYNC_ACTION_TYPE } from '../actionTypes'; 
// Correction: Retirer l'import de userSlice
// import { userSlice } from '../slices/userSlice'; 
// const { syncUserWithAuth } = userSlice.actions; 

const syncUserStateMiddleware = store => next => action => {
  const fulfilledActions = [
    login.fulfilled.type,
    registerHost.fulfilled.type,
    registerCleaner.fulfilled.type,
    restoreSession.fulfilled.type
  ];

  if (fulfilledActions.includes(action.type)) {
    if (action.payload?.user) {
      console.log(`[SyncMiddleware] Action détectée: ${action.type}, dispatching ${USER_SYNC_ACTION_TYPE}...`);
      const userData = action.payload.user;
      console.log(`[SyncMiddleware] Données utilisateur extraites: ID: ${userData.id || userData._id}, Type: ${userData.userType || userData.role}`);
      // Correction: Dispatcher l'action avec le type string
      setTimeout(() => {
         store.dispatch({ type: USER_SYNC_ACTION_TYPE, payload: userData });
      }, 0);
      
    } else {
         console.warn(`[SyncMiddleware] Action ${action.type} fulfilled, mais payload.user manquant.`);
    }
  } 
  else if (action.type === logout.fulfilled.type) {
       console.log(`[SyncMiddleware] Action logout.fulfilled détectée, dispatching ${USER_SYNC_ACTION_TYPE} avec null...`);
       // Correction: Dispatcher l'action avec le type string et payload null
        setTimeout(() => {
            store.dispatch({ type: USER_SYNC_ACTION_TYPE, payload: null });
        }, 0);
  }

  return next(action);
};

export default syncUserStateMiddleware;
