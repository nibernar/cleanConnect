import React from 'react';
import { Stack } from 'expo-router';
import colors from '../../../src/utils/colors';

export default function RegisterLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="host" 
        options={{ 
          title: 'Inscription Hébergeur',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="cleaner" 
        options={{ 
          title: 'Inscription Agent de Nettoyage',
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}