import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
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
          title: 'Connexion',
        }} 
      />
      <Stack.Screen 
        name="register-selection" 
        options={{ 
          title: 'Type de compte',
        }} 
      />
      <Stack.Screen 
        name="register-host" 
        options={{ 
          title: 'Inscription Hébergeur',
        }} 
      />
      <Stack.Screen 
        name="register-cleaner" 
        options={{ 
          title: 'Inscription Professionnel',
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          title: 'Mot de passe oublié',
        }} 
      />
    </Stack>
  );
}