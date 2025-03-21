import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Stack, Link, router } from 'expo-router';
import { login } from '../src/redux/slices/authSlice';
import Input from '../src/components/common/Input';
import Button from '../src/components/common/Button';
import colors from '../src/utils/colors';
import * as Yup from 'yup';
import { Formik } from 'formik';

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Email invalide').required("L'email est requis"),
  password: Yup.string().required('Le mot de passe est requis'),
});

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleLogin = (values) => {
    dispatch(login(values));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../src/assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>CleanConnect</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.subtitle}>Connexion</Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View>
              <Input
                label="Email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                placeholder="Votre email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={touched.email && errors.email}
              />
              
              <Input
                label="Mot de passe"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                placeholder="Votre mot de passe"
                secureTextEntry
                error={touched.password && errors.password}
              />
              
              <TouchableOpacity
                onPress={() => router.push('/forgot-password')}
                style={styles.forgotPasswordLink}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
              
              <Button 
                title="Se connecter" 
                onPress={handleSubmit} 
                loading={loading}
                style={styles.button}
              />
            </View>
          )}
        </Formik>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Vous n'avez pas de compte ?</Text>
        <TouchableOpacity onPress={() => router.push('/register-choice')}>
          <Text style={styles.registerLink}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: colors.background,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  formContainer: {
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: colors.primary,
  },
  button: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.text,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});