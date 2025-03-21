import React from 'react';
import { Stack } from 'expo-router';

export default function ListingsLayout() {
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
          title: 'Mes annonces',
        }} 
      />
      <Stack.Screen 
        name="applications/index"
        options={{ 
          title: 'Candidatures',
        }} 
      />
      <Stack.Screen 
        name="applications/[id]"
        options={{ 
          title: 'Détail candidature',
        }} 
      />
    </Stack>
  );
}