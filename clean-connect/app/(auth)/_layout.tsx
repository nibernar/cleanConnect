import React from 'react';
import { Stack } from 'expo-router';
import colors from '../../src/utils/colors';

/**
 * Layout pour le groupe d'authentification
 * Utilise Stack Navigator pour les transitions entre écrans
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: false, // Cacher l'en-tête par défaut pour l'auth
        animation: 'slide_from_right',
      }}
    />
  );
}