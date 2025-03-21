import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
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
          title: 'Profil',
        }} 
      />
      <Stack.Screen 
        name="edit" 
        options={{ 
          title: 'Modifier profil',
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: 'Paramètres',
        }} 
      />
      <Stack.Screen 
        name="invoices/index" 
        options={{ 
          title: 'Factures',
        }} 
      />
      <Stack.Screen 
        name="invoices/[id]" 
        options={{ 
          title: 'Détail facture',
        }} 
      />
    </Stack>
  );
}