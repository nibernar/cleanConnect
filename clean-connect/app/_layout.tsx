import React, { useEffect, useState, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../src/redux/store';
import LoadingScreen from '../src/screens/common/AuthLoadingScreen';
import { isClient } from '../src/utils/ssrHelpers';
import { restoreSession } from '../src/redux/authActions';
import { fetchProfile } from '../src/redux/slices/userSlice';
import { determineUserType } from '../src/utils/userTypeDetector';
import { 
  redirectBasedOnAuth, 
  isUserInCorrectRouteGroup, 
  ROUTES, 
  setNavigationReady 
} from '../src/utils/routingService';

// Import setup pour initialiser l'application correctement
import '../src/utils/setupApp';

// Hook de protection des routes simplifié et robuste
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const state = useSelector(state => state);
  const navigationInitialized = useRef(false);
  
  // Déterminer le type d'utilisateur de façon intelligente
  const userType = determineUserType(user, state, '_layout.tsx/useProtectedRoute');
  
  console.log(`[Layout] caaaca ${userType} dans ${segments}`)

  // Premier effet: initialiser la navigation quand tous les composants sont montés
  useEffect(() => {
    if (!navigationInitialized.current) {
      console.log('[Layout] Initialisation du système de navigation');
      // Important: on marque le système de navigation comme prêt seulement après
      // que le composant Root Layout ait été complètement monté
      setNavigationReady(true);
      navigationInitialized.current = true;
    }
  }, []);
  
  // Second effet: gérer les redirections et protections de routes
  useEffect(() => {
    console.log('[Layout] Analyse de route:', {
      segments,
      firstSegment: segments[0], 
      isAuthenticated,
      userType,
      userId: user?.id,
      navigationReady: navigationInitialized.current
    });
    
    // Si le système de navigation n'est pas initialisé, on arrête là
    if (!navigationInitialized.current) {
      console.log('[Layout] Système de navigation pas encore initialisé, report des redirections');
      return;
    }
    
    // Si l'utilisateur n'est pas authentifié et n'est pas sur une route d'authentification
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated) {
      const publicRoutes = ['login', 'register', 'register-choice']; // ✅ Routes accessibles sans auth
    
      if (!publicRoutes.includes(segments[0])) {
        console.log('[Layout] Non authentifié, redirection vers login');
        router.replace(ROUTES.LOGIN);
      }
      return;
    }
    
    // À ce stade, l'utilisateur est authentifié
    
    // Essayer de récupérer le profil si nécessaire
    if (isAuthenticated && (!userType || !user?.userType)) {
      console.log('[Layout] Type utilisateur manquant, tentative de récupération du profil');
      dispatch(fetchProfile());
    }
    
    // Si l'utilisateur est dans le groupe auth, le rediriger vers le dashboard
    if (inAuthGroup) {
      console.log('[Layout] Utilisateur authentifié dans groupe auth, redirection');
      router.replace('/dashboard');
      return;
    }
    
    // Si l'utilisateur est à la racine, rediriger vers le dashboard
    if (segments[0] === '') {
      console.log('[Layout] Utilisateur à la racine, redirection vers dashboard');
      router.replace('/dashboard');
      return;
    }
    
    // Vérifier que l'utilisateur est dans le bon groupe de routes
    if (userType && !isUserInCorrectRouteGroup(segments, userType)) {
      console.log(`[Layout] Utilisateur ${userType} dans mauvais groupe, redirection`);
      router.replace('/dashboard');
    }
    
  }, [isAuthenticated, segments, user, userType, dispatch, router]);
}

// Composant interne qui utilise les hooks Redux
function Main() {
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const hasAttemptedProfileFetch = useRef(false);
  
  // Effet pour restaurer la session au démarrage
  useEffect(() => {
    if (isAuthenticated && !user?.userType && !hasAttemptedProfileFetch.current) {
      console.log('[Layout/Main] userType manquant, récupération du profil');
      dispatch(fetchProfile());
      hasAttemptedProfileFetch.current = true;
    }
  }, [isAuthenticated, user, dispatch]);
  
  console.log('[Layout/Main] État principal:', {
    isAuthenticated,
    userType: user?.userType,
    loading
  });
  
  // Utiliser notre hook personnalisé pour la protection des routes
  useProtectedRoute();
  
  if (loading) {
    console.log('[Layout/Main] Affichage LoadingScreen');
    return <LoadingScreen />;
  }

  console.log('[Layout/Main] Rendu du slot principal');
  return <Slot />;
}

// Composant racine qui fournit le Provider Redux
export default function RootLayout() {
  // État pour suivre si l'app est prête à être affichée en SSR
  const [isReady, setIsReady] = useState(isClient);
  
  // En SSR, on marque l'app comme prête immédiatement
  useEffect(() => {
    if (!isReady) {
      console.log('[Layout/RootLayout] Marquage app prête');
      setIsReady(true);
    }
  }, [isReady]);

  // Si pas prêt, montrer un écran de chargement
  if (!isReady) {
    return <LoadingScreen />;
  }

  // Si on est côté client, utiliser PersistGate, sinon juste Provider
  return (
    <Provider store={store}>
      {isClient && persistor ? (
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <Main />
        </PersistGate>
      ) : (
        <Main />
      )}
    </Provider>
  );
}