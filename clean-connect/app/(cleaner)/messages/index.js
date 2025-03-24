import React from 'react';
import { useRouter } from 'expo-router';
import MessagesScreen from '../../../src/screens/common/MessagesScreen';

export default function CleanerMessages() {
  const router = useRouter();
  
  const handleConversationPress = (userId, name) => {
    router.push({
      pathname: `/(cleaner)/messages/${userId}`,
      params: { name }
    });
  };
  
  return (
    <MessagesScreen 
      onConversationPress={handleConversationPress}
      userType="cleaner"
    />
  );
}