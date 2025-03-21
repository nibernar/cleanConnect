import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import CreateListingScreen from '../../src/screens/host/CreateListingScreen';
import { Redirect } from 'expo-router';

export default function CreateListing() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  // Vérifier si l'utilisateur est authentifié et a le rôle host
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  
  // Rediriger les utilisateurs cleaner car cette fonctionnalité est réservée aux hosts
  if (user?.userType === 'cleaner') {
    return <Redirect href="/(cleaner)/" />;
  }
  
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