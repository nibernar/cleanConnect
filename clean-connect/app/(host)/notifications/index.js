import React from 'react';
import { useRouter } from 'expo-router';
import NotificationsScreen from '../../../src/screens/common/NotificationsScreen';

export default function Notifications() {
  const router = useRouter();
  
  const handleNotificationPress = (notification) => {
    // Redirection basée sur le type de notification
    if (notification.type === 'application') {
      router.push(`/(host)/listings/applications/${notification.applicationId}`);
    } else if (notification.type === 'listing') {
      router.push(`/(host)/listings/${notification.listingId}`);
    } else if (notification.type === 'message') {
      router.push(`/(host)/messages/${notification.userId}`);
    }
  };
  
  return (
    <NotificationsScreen 
      onNotificationPress={handleNotificationPress}
    />
  );
}