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
  const userType = determineUserType(user, state, '_layout.js/useProtectedRoute');
  
  console.log(`[Layout] Utilisateur de type ${userType || 'inconnu'} dans le segment ${segments[0]}`);

  // Premier effet: initialiser la navigation
  useEffect(() => {
    if (!navigationInitialized.current) {
      console.log('[Layout] Initialisation du système de navigation');
      navigationInitialized.current = true;
    }
  }, []);
  
  // Second effet: gérer les redirections et protections de routes
  useEffect(() => {
    if (!navigationInitialized.current) {
      return;
    }
    
    // Vérifier si l'utilisateur est sur une route d'authentification
    const inAuthGroup = segments[0] === '(auth)';
    
    // Si l'utilisateur n'est pas authentifié, il ne doit accéder qu'aux routes publiques
    if (!isAuthenticated) {
      // Routes publiques: tout ce qui est dans (auth) et diagnostic
      if (!inAuthGroup && segments[0] !== 'diagnostic') {
        console.log('[Layout] Utilisateur non authentifié, redirection vers login');
        router.replace('/(auth)/');
      }
      return;
    }
    
    // À ce stade, l'utilisateur est authentifié
    
    // Essayer de récupérer le profil si le type d'utilisateur est manquant
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
    
    // Vérifier que l'utilisateur est dans le bon groupe de routes selon son type
    if (userType) {
      // Rediriger les hosts qui tentent d'accéder aux pages cleaner
      if (userType === 'host' && segments[0] === '(cleaner)') {
        console.log('[Layout] Host tentant d\'accéder à une page cleaner, redirection');
        router.replace('/(host)/');
        return;
      }
      
      // Rediriger les cleaners qui tentent d'accéder aux pages host
      if (userType === 'cleaner' && segments[0] === '(host)') {
        console.log('[Layout] Cleaner tentant d\'accéder à une page host, redirection');
        router.replace('/(cleaner)/');
        return;
      }
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
  
  // Utiliser notre hook personnalisé pour la protection des routes
  useProtectedRoute();
  
  if (loading) {
    console.log('[Layout/Main] Affichage LoadingScreen');
    return <LoadingScreen />;
  }

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