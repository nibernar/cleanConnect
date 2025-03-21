import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router, useSegments } from 'expo-router';
import { determineUserType } from '../src/utils/userTypeDetector';
import { restoreSession } from '../src/redux/authActions';
import { fetchProfile } from '../src/redux/slices/userSlice';
import { redirectBasedOnAuth, safeNavigate, ROUTES } from '../src/utils/routingService';

/**
 * Page d'index principale qui redirige intelligemment les utilisateurs
 * - Si l'utilisateur est authentifié -> Redirection vers le dashboard approprié
 * - Si l'utilisateur n'est pas authentifié -> Redirection vers la page de connexion
 */
export default function Index() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading: authLoading } = useSelector(state => state.auth);
  const { loading: userLoading } = useSelector(state => state.user);
  const state = useSelector(state => state);
  const redirectionAttempted = useRef(false);
  const segments = useSegments();
  
  // Combinaison de tous les états de chargement
  const isLoading = authLoading || userLoading;
  
  useEffect(() => {
    console.log('[Index] Vérification de l\'état d\'authentification:', { 
      isAuthenticated, 
      userId: user?.id,
      segments,
      redirectionAttempted: redirectionAttempted.current
    });
    
    // Éviter les redirections multiples
    if (redirectionAttempted.current) {
      console.log('[Index] Redirection déjà tentée, pas de nouvelle redirection');
      return;
    }
    
    if (isLoading) {
      console.log('[Index] Chargement en cours, attente...');
      return;
    }
    
    // Si l'utilisateur est authentifié mais que le type d'utilisateur n'est pas défini
    // On tente d'abord de restaurer la session puis de récupérer le profil
    if (isAuthenticated && !user?.userType) {
      console.log('[Index] Utilisateur authentifié mais sans type défini, tentative de récupération');
      
      // Tentative de restauration de session
      dispatch(restoreSession()).then(() => {
        dispatch(fetchProfile()).then(() => {
          const userType = determineUserType(user, state, 'Index-afterFetch');
          console.log('[Index] Type utilisateur déterminé après récupération:', userType);
          
          // Marquer la redirection comme tentée
          redirectionAttempted.current = true;
          
          // Redirection basée sur le type récupéré - utilisation du mécanisme sécurisé
          if (isAuthenticated) {
            if (userType === 'host') {
              safeNavigate(() => router.replace(ROUTES.HOST_DASHBOARD));
            } else if (userType === 'cleaner') {
              safeNavigate(() => router.replace(ROUTES.CLEANER_DASHBOARD));
            } else {
              safeNavigate(() => router.replace(ROUTES.DASHBOARD));
            }
          } else {
            safeNavigate(() => router.replace(ROUTES.LOGIN));
          }
        });
      });
      return;
    }
    
    // Marquer la redirection comme tentée
    redirectionAttempted.current = true;
    
    // Redirection standard basée sur l'authentification
    // Utilisation du mécanisme sécurisé que nous avons mis en place
    if (isAuthenticated) {
      const userType = determineUserType(user, state, 'Index-initialCheck');
      
      if (userType === 'host') {
        safeNavigate(() => router.replace(ROUTES.HOST_DASHBOARD));
      } else if (userType === 'cleaner') {
        safeNavigate(() => router.replace(ROUTES.CLEANER_DASHBOARD));
      } else {
        safeNavigate(() => router.replace(ROUTES.DASHBOARD));
      }
    } else {
      safeNavigate(() => router.replace(ROUTES.LOGIN));
    }
  }, [isAuthenticated, user, isLoading, dispatch, segments]);
  
  // Afficher un écran de chargement pendant la redirection
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.text}>Préparation de votre espace CleanConnect...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});