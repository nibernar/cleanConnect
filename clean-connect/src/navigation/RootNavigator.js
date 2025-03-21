import React from 'react';
import { useSelector } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import HostNavigator from './HostNavigator';
import CleanerNavigator from './CleanerNavigator';
import LoadingScreen from '../screens/common/AuthLoadingScreen';

const Stack = createStackNavigator();

/**
 * Root navigator that manages authentication state and user type routing
 */
const RootNavigator = () => {
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);

  // While checking authentication status, show loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // Not authenticated - show auth flow
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        // Authenticated - route based on user type
        user?.userType === 'host' ? (
          <Stack.Screen name="Host" component={HostNavigator} />
        ) : (
          <Stack.Screen name="Cleaner" component={CleanerNavigator} />
        )
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;