import React from 'react';
import { useRouter } from 'expo-router';
import RegisterCleanerScreen from '../../src/screens/auth/RegisterCleanerScreen';

export default function RegisterCleaner() {
  const router = useRouter();
  
  const handleRegisterComplete = () => {
    // Cette fonction sera remplacée par la vraie logique d'enregistrement
    // Elle est normalement gérée par Redux dans votre application
    router.push('/(auth)/');
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  return (
    <RegisterCleanerScreen 
      onRegisterComplete={handleRegisterComplete}
      onGoBack={handleGoBack}
    />
  );
}