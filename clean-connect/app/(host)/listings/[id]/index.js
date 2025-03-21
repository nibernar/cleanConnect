import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ListingDetailScreen from '../../../../src/screens/host/ListingDetailScreen';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const handleViewApplications = () => {
    // Correction du chemin pour accéder aux candidatures
    router.push(`/(host)/listings/applications?listingId=${id}`);
  };
  
  const handleEditListing = () => {
    // Implémenter la logique de modification d'annonce si nécessaire
  };
  
  const handleClaimForm = () => {
    router.push(`/(host)/listings/[id]/claim?id=${id}`);
  };
  
  const handlePayment = () => {
    router.push(`/(host)/listings/[id]/payment?id=${id}`);
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