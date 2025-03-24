import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { Redirect } from 'expo-router';

/**
 * Route racine qui redirige intelligemment:
 * - Si l'utilisateur n'est pas authentifié -> Login
 * - Si l'utilisateur est authentifié -> Dashboard
 */
export default function Index() {
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  
  // Afficher un écran de chargement pendant l'initialisation
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Préparation de votre espace CleanConnect...</Text>
      </View>
    );
  }
  
  // Redirection basée sur l'état d'authentification
  if (isAuthenticated) {
    return <Redirect href="/dashboard/" />;
  } else {
    return <Redirect href="/(auth)/" />;
  }
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