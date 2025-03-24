import React from 'react';
import { useRouter } from 'expo-router';
import ListingsScreen from '../../../src/screens/host/ListingsScreen';

export default function Listings() {
  const router = useRouter();
  
  const handleListingPress = (listingId) => {
    router.push(`/(host)/listings/${listingId}`);
  };
  
  const handleViewApplications = (listingId) => {
    router.push(`/(host)/listings/${listingId}/applications`);
  };

  const handleCreateListing = () => {
    router.push('/(host)/listings/create');
  };

  return (
    <ListingsScreen 
      onListingPress={handleListingPress}
      onViewApplications={handleViewApplications}
      onCreateListing={handleCreateListing}
    />
  );
}