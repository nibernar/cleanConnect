import React from 'react';
import { useRouter } from 'expo-router';
import UserTypeSelectionScreen from '../../src/screens/auth/UserTypeSelectionScreen';

export default function RegisterChoice() {
  const router = useRouter();
  
  // Passing the router down to the component is an alternative to using
  // hooks directly in the component, but since we're using expo-router
  // in the routes, it's best to handle navigation here.
  
  return (
    <UserTypeSelectionScreen />
  );
}