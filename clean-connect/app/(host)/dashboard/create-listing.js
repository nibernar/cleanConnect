import React from 'react';
import { useRouter } from 'expo-router';
import CreateListingScreen from '../../../src/screens/host/CreateListingScreen';

export default function CreateListing() {
  const router = useRouter();
  
  const handleListingCreated = () => {
    router.push('/(host)/listings');
  };
  
  const handleCancel = () => {
    router.back();
  };

  return (
    <CreateListingScreen 
      onListingCreated={handleListingCreated}
      onCancel={handleCancel}
    />
  );
}