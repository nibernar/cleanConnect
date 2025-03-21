import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'expo-router';

/**
 * Index du groupe cleaner - utilise la redirection vers le tableau de bord cleaner
 */
export default function Index() {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  console.log('[DEBUG] (cleaner)/index.js - Mounted, auth state:', {
    isAuthenticated,
    userType: user?.userType,
    userId: user?.id
  });
  
  // Vérifier si l'utilisateur est authentifié
  if (!isAuthenticated) {
    console.log('[DEBUG] (cleaner)/index.js - Non authentifié, redirection vers login');
    return <Redirect href="/login" />;
  }
  
  // Si l'utilisateur est un host, rediriger vers le point central de redirection
  if (user?.userType === 'host') {
    console.log('[DEBUG] (cleaner)/index.js - Utilisateur HOST détecté, redirection vers /dashboard');
    return <Redirect href="/dashboard" />;
  }
  
  // Pour les cleaners, afficher le tableau de bord sans redirection supplémentaire
  // car nous sommes déjà dans le bon groupe (cleaner)
  console.log('[DEBUG] (cleaner)/index.js - Utilisateur CLEANER confirmé - chargement du dashboard.');
  return <Redirect href="/cleaner/dashboard" />;
}