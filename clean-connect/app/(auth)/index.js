import { Redirect } from 'expo-router';

/**
 * Route par défaut pour le groupe d'authentification
 * Redirige automatiquement vers l'écran de connexion
 */
export default function AuthIndex() {
  return <Redirect href="/(auth)/login" />;
}