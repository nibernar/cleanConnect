import React from 'react';
import { Stack } from 'expo-router';

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4A6572',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Recherche',
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Détail réservation',
        }} 
      />
    </Stack>
  );
}