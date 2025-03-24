import React from 'react';
import { useRouter } from 'expo-router';
import ApplicationsScreen from '../../../../src/screens/host/ApplicationsScreen';

export default function AllApplications() {
  const router = useRouter();
  
  const handleApplicationPress = (applicationId) => {
    router.push(`/(host)/listings/applications/${applicationId}`);
  };
  
  return (
    <ApplicationsScreen 
      // Aucun ID de listing spécifique car c'est la vue de toutes les candidatures
      onApplicationPress={handleApplicationPress}
      showAllApplications
    />
  );
}