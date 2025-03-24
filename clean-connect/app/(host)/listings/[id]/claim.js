import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ClaimFormScreen from '../../../../src/screens/host/ClaimFormScreen';

export default function ClaimForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const handleSubmitClaim = () => {
    router.back();
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <ClaimFormScreen 
      listingId={id}
      onSubmitClaim={handleSubmitClaim}
      onCancel={handleCancel}
    />
  );
}