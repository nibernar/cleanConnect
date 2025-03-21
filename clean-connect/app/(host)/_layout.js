import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

export default function HostLayout() {
  const { unreadNotifications } = useSelector(state => state.notifications);
  const { unreadMessages } = useSelector(state => state.messages);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'listings') {
            iconName = focused ? 'list' : 'list-outline';
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
        headerShown: false,
        // Garantir que chaque onglet maintient son propre historique de navigation
        unmountOnBlur: false
      })}
    >
      <Tabs.Screen 
        name="dashboard"
        options={{ 
          title: 'Tableau de bord'
        }} 
      />
      <Tabs.Screen 
        name="listings"
        options={{ 
          title: 'Annonces',
          // Forcer un remontage de l'onglet Annonces pour éviter les problèmes de navigation persistante
          unmountOnBlur: true
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
      {/* Masquer explicitement l'onglet index - suppression de href: null qui crée le conflit */}
      <Tabs.Screen 
        name="index"
        options={{ 
          tabBarButton: () => null,
          tabBarShowLabel: false
        }} 
      />
    </Tabs>
  );
}