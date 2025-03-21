import React from 'react';
import { Stack } from 'expo-router';

export default function DashboardLayout() {
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
          title: 'Tableau de bord',
        }} 
      />
      <Stack.Screen 
        name="create-listing" 
        options={{ 
          title: 'Nouvelle annonce',
        }} 
      />
      <Stack.Screen 
        name="payment" 
        options={{ 
          title: 'Paiement',
        }} 
      />
    </Stack>
  );
}