import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Redirect, useRouter } from 'expo-router';
import { determineUserType } from '../src/utils/userTypeDetector';
import { fetchProfile } from '../src/redux/slices/userSlice';

/**
 * Route universelle qui détecte intelligemment le type d'utilisateur
 * et redirige vers le tableau de bord approprié.
 */
export default function DashboardRouter() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading: authLoading } = useSelector(state => state.auth);
  const { loading: userLoading } = useSelector(state => state.user);
  const state = useSelector(state => state);
  
  // Combinaison de tous les états de chargement
  const isLoading = authLoading || userLoading;
  
  // Tenter de récupérer le profil utilisateur si nécessaire
  useEffect(() => {
    if (isAuthenticated && !user?.userType) {
      console.log('[DashboardRouter] Type utilisateur inconnu, récupération du profil');
      dispatch(fetchProfile());
    }
  }, [isAuthenticated, user, dispatch]);
  
  // Si chargement en cours, afficher un écran de chargement
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Chargement de votre tableau de bord...</Text>
      </View>
    );
  }
  
  // Si non authentifié, rediriger vers login
  if (!isAuthenticated) {
    console.log('[DashboardRouter] Non authentifié, redirection vers login');
    return <Redirect href="/(auth)/" />;
  }
  
  // Déterminer le type d'utilisateur
  const userType = determineUserType(user, state, 'DashboardRouter');
  console.log(`[DashboardRouter] Type utilisateur déterminé: ${userType}`);
  
  // Rediriger en fonction du type d'utilisateur
  if (userType === 'host') {
    return <Redirect href="/(host)/" />;
  } else if (userType === 'cleaner') {
    return <Redirect href="/(cleaner)/" />;
  }
  
  // Si le type d'utilisateur n'est pas encore déterminé, afficher un écran d'attente
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