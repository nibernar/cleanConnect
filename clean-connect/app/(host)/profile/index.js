import React from 'react';
import { useRouter } from 'expo-router';
import ProfileScreen from '../../../src/screens/common/ProfileScreen';

export default function Profile() {
  const router = useRouter();
  
  const handleEditProfile = () => {
    router.push('/(host)/profile/edit');
  };
  
  const handleViewInvoices = () => {
    router.push('/(host)/profile/invoices');
  };
  
  const handleOpenSettings = () => {
    router.push('/(host)/profile/settings');
  };
  
  return (
    <ProfileScreen 
      onEditProfile={handleEditProfile}
      onViewInvoices={handleViewInvoices}
      onOpenSettings={handleOpenSettings}
      userType="host"
    />
  );
}