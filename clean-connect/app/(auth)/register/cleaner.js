import React from 'react';
import { useRouter } from 'expo-router';
import RegisterCleanerScreen from '../../../src/screens/auth/RegisterCleanerScreen';

export default function RegisterCleaner() {
  const router = useRouter();
  
  const handleRegistrationSuccess = () => {
    // Redirect to dashboard after successful registration
    // This is typically handled by Redux auth slice
    router.replace('/dashboard');
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <RegisterCleanerScreen 
      onRegistrationSuccess={handleRegistrationSuccess}
      onCancel={handleCancel}
    />
  );
}