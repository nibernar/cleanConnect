import React from 'react';
import { useRouter } from 'expo-router';
import DashboardScreen from '../../../src/screens/host/DashboardScreen';

export default function Dashboard() {
  const router = useRouter();
  
  const handleCreateListing = () => {
    router.push('/(host)/dashboard/create-listing');
  };
  
  const handleViewApplicationDetail = (applicationId) => {
    router.push(`/(host)/listings/applications/${applicationId}`);
  };
  
  const handlePayment = () => {
    router.push('/(host)/dashboard/payment');
  };

  return (
    <DashboardScreen 
      onCreateListing={handleCreateListing}
      onViewApplicationDetail={handleViewApplicationDetail}
      onPayment={handlePayment}
    />
  );
}