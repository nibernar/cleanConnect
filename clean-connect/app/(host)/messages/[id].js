import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ChatScreen from '../../../src/screens/common/ChatScreen';

export default function Chat() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  
  const handleGoBack = () => {
    router.back();
  };
  
  return (
    <ChatScreen 
      userId={id}
      userName={name}
      onGoBack={handleGoBack}
    />
  );
}