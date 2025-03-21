import React from 'react';
import { useRouter } from 'expo-router';
import SearchScreen from '../../../src/screens/cleaner/SearchScreen';

export default function Search() {
  const router = useRouter();
  
  const handleBookingPress = (bookingId) => {
    router.push(`/(cleaner)/search/${bookingId}`);
  };
  
  return (
    <SearchScreen 
      onBookingPress={handleBookingPress}
    />
  );
}