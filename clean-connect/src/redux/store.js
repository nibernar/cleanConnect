import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isClient } from '../utils/ssrHelpers';

// Reducers
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import listingsReducer from './slices/listingsSlice';
import cleanerReducer from './slices/cleanerSlice';
import hostReducer from './slices/hostSlice';
import notificationsReducer from './slices/notificationsSlice';
import messagesReducer from './slices/messagesSlice';
import applicationsReducer from './slices/applicationsSlice';
import invoicesReducer from './slices/invoicesSlice';
import bookingsReducer from './slices/bookingsSlice';
import adminReducer from './slices/adminSlice'; // <-- Importer le nouveau reducer

// Middleware
import syncUserStateMiddleware from './middleware/syncUserStateMiddleware';

// Import reducers
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  listings: listingsReducer,
  cleaner: cleanerReducer,
  host: hostReducer,
  notifications: notificationsReducer,
  messages: messagesReducer,
  applications: applicationsReducer,
  invoices: invoicesReducer,
  bookings: bookingsReducer,
  admin: adminReducer, // <-- Ajouter le reducer admin ici
});

// Configuration de persistence
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  // Whitelist - seuls ces reducers seront persistés
  whitelist: ['auth'], // Ne pas persister l'état admin par défaut
  // Blacklist - ces reducers ne seront pas persistés
  blacklist: ['admin', 'user', 'listings', 'cleaner', 'host', 'notifications', 'messages', 'applications', 'invoices', 'bookings'], // Ajouter admin à la blacklist
};

// Définir store basé sur l'environnement
let store;
let persistor;

const createStore = () => {
  if (isClient) {
    console.log('Initialisation du store avec persistence (Client)');
    const persistedReducer = persistReducer(persistConfig, rootReducer);
    
    store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(syncUserStateMiddleware),
      devTools: process.env.NODE_ENV !== 'production',
    });
    
    persistor = persistStore(store);
    
    return { store, persistor };
  } else {
    console.log('Initialisation du store sans persistence (SSR)');
    store = configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(syncUserStateMiddleware),
      devTools: process.env.NODE_ENV !== 'production',
    });
    
    return { store };
  }
};

if (!store) {
  const storeConfig = createStore();
  store = storeConfig.store;
  persistor = storeConfig.persistor;
}

export { store, persistor };
