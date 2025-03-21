import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

export default function CleanerLayout() {
  const { unreadNotifications } = useSelector(state => state.notifications);
  const { unreadMessages } = useSelector(state => state.messages);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#344955',
        tabBarInactiveTintColor: 'gray',
        headerShown: false
      })}
    >
      <Tabs.Screen 
        name="search"
        options={{ 
          title: 'Recherche'
        }} 
      />
      <Tabs.Screen 
        name="schedule"
        options={{ 
          title: 'Planning'
        }} 
      />
      <Tabs.Screen 
        name="messages"
        options={{ 
          title: 'Messages',
          tabBarBadge: unreadMessages > 0 ? unreadMessages : null
        }} 
      />
      <Tabs.Screen 
        name="notifications"
        options={{ 
          title: 'Notifications',
          tabBarBadge: unreadNotifications > 0 ? unreadNotifications : null
        }} 
      />
      <Tabs.Screen 
        name="profile"
        options={{ 
          title: 'Profil'
        }} 
      />
    </Tabs>
  );
}