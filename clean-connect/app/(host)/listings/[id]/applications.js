import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ApplicationsScreen from '../../../../src/screens/host/ApplicationsScreen';

export default function ListingApplications() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const handleApplicationPress = (applicationId) => {
    router.push(`/(host)/listings/applications/${applicationId}`);
  };
  
  return (
    <ApplicationsScreen 
      listingId={id}
      onApplicationPress={handleApplicationPress}
    />
  );
}