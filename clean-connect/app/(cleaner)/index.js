import { Redirect } from 'expo-router';

/**
 * Route par défaut pour le groupe cleaner
 * Redirige automatiquement vers le tableau de bord cleaner
 */
export default function CleanerIndex() {
  return <Redirect href="/(cleaner)/dashboard" />;
}