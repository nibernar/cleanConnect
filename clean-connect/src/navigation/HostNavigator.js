import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

// Host screens
import DashboardScreen from '../screens/host/DashboardScreen';
import CreateListingScreen from '../screens/host/CreateListingScreen';
import ListingsScreen from '../screens/host/ListingsScreen';
import ListingDetailScreen from '../screens/host/ListingDetailScreen';
import ApplicationsScreen from '../screens/host/ApplicationsScreen';
import ApplicationDetailScreen from '../screens/host/ApplicationDetailScreen';
import PaymentScreen from '../screens/host/PaymentScreen';
import ClaimFormScreen from '../screens/host/ClaimFormScreen';

// Common screens
import ProfileScreen from '../screens/common/ProfileScreen';
import MessagesScreen from '../screens/common/MessagesScreen';
import ChatScreen from '../screens/common/ChatScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import InvoicesScreen from '../screens/common/InvoicesScreen';
import InvoiceDetailScreen from '../screens/common/InvoiceDetailScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const DashboardStack = () => (
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
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Tableau de bord' }} />
    <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ title: 'Nouvelle annonce' }} />
    <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} options={{ title: 'Candidature' }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Paiement' }} />
  </Stack.Navigator>
);

const ListingsStack = () => (
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
    <Stack.Screen name="Listings" component={ListingsScreen} options={{ title: 'Mes annonces' }} />
    <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Détail annonce' }} />
    <Stack.Screen name="Applications" component={ApplicationsScreen} options={{ title: 'Candidatures' }} />
    <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} options={{ title: 'Candidature' }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Paiement' }} />
    <Stack.Screen name="ClaimForm" component={ClaimFormScreen} options={{ title: 'Réclamation' }} />
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
    <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Détail annonce' }} />
    <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} options={{ title: 'Candidature' }} />
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
    <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Factures' }} />
    <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Détail facture' }} />
  </Stack.Navigator>
);

const HostNavigator = () => {
  const { unreadNotifications } = useSelector(state => state.notifications);
  const { unreadMessages } = useSelector(state => state.messages);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ListingsTab') {
            iconName = focused ? 'list' : 'list-outline';
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
        name="DashboardTab" 
        component={DashboardStack} 
        options={{ 
          title: 'Tableau de bord',
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="ListingsTab" 
        component={ListingsStack} 
        options={{ 
          title: 'Annonces',
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

export default HostNavigator;