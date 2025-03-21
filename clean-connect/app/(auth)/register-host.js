import React from 'react';
import { useRouter } from 'expo-router';
import RegisterHostScreen from '../../src/screens/auth/RegisterHostScreen';

export default function RegisterHost() {
  const router = useRouter();
  
  const handleRegisterComplete = () => {
    // Cette fonction sera remplacée par la vraie logique d'enregistrement de votre application
    // Elle est normalement gérée par Redux dans votre application
    router.push('/(auth)/');
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  return (
    <RegisterHostScreen 
      onRegisterComplete={handleRegisterComplete}
      onGoBack={handleGoBack}
    />
  );
}