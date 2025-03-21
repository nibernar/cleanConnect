import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterHostScreen from '../screens/auth/RegisterHostScreen';
import RegisterCleanerScreen from '../screens/auth/RegisterCleanerScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import UserTypeSelectionScreen from '../screens/auth/UserTypeSelectionScreen';

const Stack = createStackNavigator();

/**
 * Navigator for authentication flow (login, registration, etc.)
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
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
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Connexion' }}
      />
      <Stack.Screen 
        name="UserTypeSelection" 
        component={UserTypeSelectionScreen} 
        options={{ title: 'Type de compte' }}
      />
      <Stack.Screen 
        name="RegisterHost" 
        component={RegisterHostScreen} 
        options={{ title: 'Inscription Hébergeur' }}
      />
      <Stack.Screen 
        name="RegisterCleaner" 
        component={RegisterCleanerScreen} 
        options={{ title: 'Inscription Professionnel' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ title: 'Mot de passe oublié' }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;