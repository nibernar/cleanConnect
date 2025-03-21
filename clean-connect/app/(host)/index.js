import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'expo-router';

/**
 * Index du groupe host - utilise la redirection vers le tableau de bord host
 * mais effectue également une vérification du rôle pour s'assurer que l'utilisateur
 * est bien un host
 */
export default function Index() {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  console.log('[DEBUG] (host)/index.js - Mounted, auth state:', {
    isAuthenticated,
    userType: user?.userType,
    userId: user?.id
  });
  
  // Vérifier si l'utilisateur est authentifié
  if (!isAuthenticated) {
    console.log('[DEBUG] (host)/index.js - Non authentifié, redirection vers login');
    return <Redirect href="/login" />;
  }
  
  // Si l'utilisateur est un cleaner, rediriger vers le dashboard central
  if (user?.userType === 'cleaner') {
    console.log('[DEBUG] (host)/index.js - Utilisateur CLEANER détecté, redirection vers /dashboard');
    return <Redirect href="/dashboard" />;
  }
  
  // Pour les hosts, rediriger vers leur tableau de bord
  console.log('[DEBUG] (host)/index.js - Utilisateur HOST confirmé, redirection vers /host/dashboard');
  return <Redirect href="/host/dashboard" />;
}