import { Redirect } from 'expo-router';

/**
 * Route par défaut pour le groupe host
 * Redirige automatiquement vers le tableau de bord host
 */
export default function HostIndex() {
  return <Redirect href="/(host)/dashboard" />;
}