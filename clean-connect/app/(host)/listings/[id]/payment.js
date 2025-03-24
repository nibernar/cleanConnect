import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PaymentScreen from '../../../../src/screens/host/PaymentScreen';

export default function Payment() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const handlePaymentComplete = () => {
    router.back();
  };
  
  const handleCancel = () => {
    router.back();
  };

  return (
    <PaymentScreen 
      onPaymentComplete={handlePaymentComplete}
      onCancel={handleCancel}
      listingId={id}
    />
  );
}