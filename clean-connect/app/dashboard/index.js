import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { determineUserType, getDashboardForUserType } from '../../src/utils/userTypeDetector';
import { fetchProfile } from '../../src/redux/slices/userSlice';
import { restoreSession } from '../../src/redux/authActions';

/**
 * Route universelle qui détecte intelligemment le type d'utilisateur
 * et redirige vers le tableau de bord approprié.
 */
export default function DashboardRouter() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading: authLoading } = useSelector(state => state.auth);
  const { loading: userLoading } = useSelector(state => state.user);
  const state = useSelector(state => state);
  
  // Combinaison de tous les états de chargement
  const isLoading = authLoading || userLoading;
  
  useEffect(() => {
    console.log('[DashboardRouter] Vérification des données utilisateur');
    
    if (!isAuthenticated) {
      console.log('[DashboardRouter] Utilisateur non authentifié, redirection vers login');
      router.replace('/(auth)/');
      return;
    }
    
    // Détecter le type d'utilisateur
    const userType = determineUserType(user, state, 'DashboardRouter');
    
    if (!userType) {
      console.log('[DashboardRouter] Type utilisateur inconnu, tentative de récupération du profil');
      // Essayer d'abord de restaurer la session, puis de récupérer le profil
      dispatch(restoreSession()).then(() => {
        dispatch(fetchProfile());
      });
      return;
    }
    
    // Obtenir le chemin du tableau de bord approprié 
    const dashboardPath = getDashboardForUserType(userType);
    console.log(`[DashboardRouter] Redirection vers ${dashboardPath} (type: ${userType})`);
    
    // Rediriger vers le bon tableau de bord
    router.replace(dashboardPath);
  }, [isAuthenticated, user, dispatch]);
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Chargement de votre tableau de bord...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Détection de votre type de compte...</Text>
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