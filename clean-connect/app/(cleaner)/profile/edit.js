import React from 'react';
import { useRouter } from 'expo-router';
import EditProfileScreen from '../../../src/screens/common/EditProfileScreen';

export default function EditCleanerProfile() {
  const router = useRouter();
  
  const handleUpdateSuccess = () => {
    // Show success message and navigate back
    router.back();
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <EditProfileScreen 
      userType="cleaner"
      onUpdateSuccess={handleUpdateSuccess}
      onCancel={handleCancel}
    />
  );
}