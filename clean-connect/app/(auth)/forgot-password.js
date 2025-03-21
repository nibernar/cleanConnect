import React from 'react';
import { useRouter } from 'expo-router';
import ForgotPasswordScreen from '../../src/screens/auth/ForgotPasswordScreen';

export default function ForgotPassword() {
  const router = useRouter();
  
  const handleResetPassword = () => {
    // Cette fonction sera appelée après l'envoi réussi du mail de réinitialisation
    // Normalement gérée par Redux dans votre application
  };
  
  const handleGoBack = () => {
    router.back();
    // Alternative plus explicite: router.push('/(auth)/');
  };
  
  return (
    <ForgotPasswordScreen 
      onResetPassword={handleResetPassword}
      onGoBack={handleGoBack}
    />
  );
}