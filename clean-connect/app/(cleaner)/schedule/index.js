import React from 'react';
import { useRouter } from 'expo-router';
import ScheduleScreen from '../../../src/screens/cleaner/ScheduleScreen';

export default function CleanerSchedule() {
  const router = useRouter();
  
  const handleBookingPress = (bookingId) => {
    router.push({
      pathname: `/(cleaner)/schedule/${bookingId}`,
      params: { id: bookingId }
    });
  };
  
  return (
    <ScheduleScreen 
      onBookingPress={handleBookingPress}
    />
  );
}