import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../src/redux/authActions';
import { router } from 'expo-router';
import { redirectBasedOnAuth } from '../../src/utils/routingService';
import { clearError } from '../../src/redux/slices/authSlice';

/**
 * Écran de connexion amélioré avec une meilleure gestion des erreurs
 * et une redirection basée sur le type d'utilisateur
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated, user } = useSelector(state => state.auth);
  
  // Effet pour vérifier l'authentification et rediriger si nécessaire
  useEffect(() => {
    console.log('[LoginScreen] Vérification état authentification:', { isAuthenticated, userId: user?.id });
    
    // Nettoyer les erreurs précédentes
    dispatch(clearError());
    
    // Si l'utilisateur est déjà authentifié, rediriger vers le dashboard approprié
    if (isAuthenticated) {
      console.log('[LoginScreen] Utilisateur déjà authentifié, redirection');
      redirectBasedOnAuth(isAuthenticated, user);
    }
  }, [isAuthenticated, user, dispatch]);
  
  /**
   * Gestion de la soumission du formulaire de connexion
   */
  const handleLogin = () => {
    // Réinitialiser les messages d'erreur
    setEmailError('');
    setPasswordError('');
    
    // Valider les entrées
    let isValid = true;
    
    if (!email) {
      setEmailError('L\'email est requis');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email invalide');
      isValid = false;
    }
    
    if (!password) {
      setPasswordError('Le mot de passe est requis');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      isValid = false;
    }
    
    if (isValid) {
      console.log('[LoginScreen] Tentative de connexion avec:', email);
      // Dispatch de l'action de connexion
      dispatch(login({ email, password }));
    }
  };
  
  /**
   * Navigation vers l'écran de récupération de mot de passe
   */
  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };
  
  /**
   * Navigation vers l'écran de sélection du type d'inscription
   */
  const handleRegister = () => {
    router.push('/register-choice');
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../src/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>CleanConnect</Text>
          <Text style={styles.tagline}>La solution de ménage professionnelle</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Connexion</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Entrez votre email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            {emailError ? <Text style={styles.errorMessage}>{emailError}</Text> : null}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="Entrez votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {passwordError ? <Text style={styles.errorMessage}>{passwordError}</Text> : null}
          </View>
          
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPassword}>Mot de passe oublié?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, isLoading ? styles.buttonDisabled : null]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Pas encore de compte?</Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Lien vers l'outil de diagnostic (uniquement en développement) */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.devTools}
            onPress={() => router.push('/dev/diagnostic')}
          >
            <Text style={styles.devToolsText}>Outils développeur</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorMessage: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 5,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPassword: {
    color: '#2196F3',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
    marginRight: 5,
  },
  registerLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  devTools: {
    alignSelf: 'center',
    marginTop: 30,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  devToolsText: {
    color: 'white',
    fontWeight: 'bold',
  },
});