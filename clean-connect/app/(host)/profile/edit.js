import React from 'react';
import { useRouter } from 'expo-router';
import EditProfileScreen from '../../../src/screens/common/EditProfileScreen';

export default function EditHostProfile() {
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
      userType="host"
      onUpdateSuccess={handleUpdateSuccess}
      onCancel={handleCancel}
    />
  );
}