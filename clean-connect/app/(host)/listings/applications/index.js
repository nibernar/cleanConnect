import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ApplicationsScreen from '../../../../src/screens/host/ApplicationsScreen';

export default function AllApplications() {
  const router = useRouter();
  const { listingId } = useLocalSearchParams();
  
  const handleApplicationPress = (applicationId) => {
    router.push(`/(host)/listings/applications/${applicationId}`);
  };
  
  return (
    <ApplicationsScreen 
      listingId={listingId}  // Passer le listingId obtenu des params s'il existe
      onApplicationPress={handleApplicationPress}
      showAllApplications={!listingId} // Afficher toutes les applications seulement s'il n'y a pas de listingId
    />
  );
}