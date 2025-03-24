import React from 'react';
import { useRouter } from 'expo-router';
import RegisterHostScreen from '../../../src/screens/auth/RegisterHostScreen';

export default function RegisterHost() {
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
    <RegisterHostScreen 
      onRegistrationSuccess={handleRegistrationSuccess}
      onCancel={handleCancel}
    />
  );
}