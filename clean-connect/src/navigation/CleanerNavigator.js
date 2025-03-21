import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

// Cleaner screens
import SearchScreen from '../screens/cleaner/SearchScreen';
import ScheduleScreen from '../screens/cleaner/ScheduleScreen';
import PreferencesScreen from '../screens/cleaner/PreferencesScreen';
import BookingDetailScreen from '../screens/cleaner/BookingDetailScreen';
import TasksScreen from '../screens/cleaner/TasksScreen';

// Common screens
import ProfileScreen from '../screens/common/ProfileScreen';
import MessagesScreen from '../screens/common/MessagesScreen';
import ChatScreen from '../screens/common/ChatScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import InvoicesScreen from '../screens/common/InvoicesScreen';
import InvoiceDetailScreen from '../screens/common/InvoiceDetailScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import BankingInfoScreen from '../screens/cleaner/BankingInfoScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const SearchStack = () => (
  <Stack.Navigator
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
    <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Recherche' }} />
    <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Détail réservation' }} />
  </Stack.Navigator>
);

const ScheduleStack = () => (
  <Stack.Navigator
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
    <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Planning' }} />
    <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Détail réservation' }} />
    <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Tâches à réaliser' }} />
  </Stack.Navigator>
);

const MessagesStack = () => (
  <Stack.Navigator
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
    <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.name })} />
  </Stack.Navigator>
);

const NotificationsStack = () => (
  <Stack.Navigator
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
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Détail réservation' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
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
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Modifier profil' }} />
    <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ title: 'Préférences de travail' }} />
    <Stack.Screen name="BankingInfo" component={BankingInfoScreen} options={{ title: 'Informations bancaires' }} />
    <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Factures' }} />
    <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Détail facture' }} />
  </Stack.Navigator>
);

const CleanerNavigator = () => {
  const { unreadNotifications } = useSelector(state => state.notifications);
  const { unreadMessages } = useSelector(state => state.messages);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'ScheduleTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'MessagesTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'NotificationsTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#344955',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="SearchTab" 
        component={SearchStack} 
        options={{ 
          title: 'Recherche',
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="ScheduleTab" 
        component={ScheduleStack} 
        options={{ 
          title: 'Planning',
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="MessagesTab" 
        component={MessagesStack} 
        options={{ 
          title: 'Messages',
          headerShown: false,
          tabBarBadge: unreadMessages > 0 ? unreadMessages : null
        }} 
      />
      <Tab.Screen 
        name="NotificationsTab" 
        component={NotificationsStack} 
        options={{ 
          title: 'Notifications',
          headerShown: false,
          tabBarBadge: unreadNotifications > 0 ? unreadNotifications : null
        }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStack} 
        options={{ 
          title: 'Profil',
          headerShown: false
        }} 
      />
    </Tab.Navigator>
  );
};

export default CleanerNavigator;