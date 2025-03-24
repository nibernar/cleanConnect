import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ListingDetailScreen from '../../../../src/screens/host/ListingDetailScreen';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const handleViewApplications = () => {
    router.push(`/(host)/listings/${id}/applications`);
  };
  
  const handleEditListing = () => {
    // Implémenter la logique de modification d'annonce si nécessaire
  };
  
  const handleClaimForm = () => {
    router.push(`/(host)/listings/${id}/claim`);
  };
  
  const handlePayment = () => {
    router.push(`/(host)/listings/${id}/payment`);
  };
  
  return (
    <ListingDetailScreen
      listingId={id}
      onViewApplications={handleViewApplications}
      onEditListing={handleEditListing}
      onClaimForm={handleClaimForm}
      onPayment={handlePayment}
    />
  );
}