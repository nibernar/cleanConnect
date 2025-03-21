import React from 'react';
import { useRouter } from 'expo-router';
import UserTypeSelectionScreen from '../../src/screens/auth/UserTypeSelectionScreen';

export default function RegisterSelection() {
  const router = useRouter();
  
  const handleHostSelection = () => {
    router.push('/(auth)/register-host');
  };
  
  const handleCleanerSelection = () => {
    router.push('/(auth)/register-cleaner');
  };
  
  return (
    <UserTypeSelectionScreen 
      onHostSelect={handleHostSelection}
      onCleanerSelect={handleCleanerSelection}
    />
  );
}