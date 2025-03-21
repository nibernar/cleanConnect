import React from 'react';
import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4A6572',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Messages',
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={({ route }) => ({ 
          title: route.params?.name || 'Conversation',
        })} 
      />
    </Stack>
  );
}