import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../../src/screens/auth/LoginScreen';

export default function Login() {
  const router = useRouter();
  
  const handleLogin = () => {
    // Login is handled by Redux, this is for additional navigation if needed
    // The actual redirection to dashboard happens in _layout.js
  };
  
  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };
  
  const handleRegister = () => {
    router.push('/(auth)/register-choice');
  };
  
  return (
    <LoginScreen 
      onLogin={handleLogin}
      onForgotPassword={handleForgotPassword}
      onRegister={handleRegister}
    />
  );
}