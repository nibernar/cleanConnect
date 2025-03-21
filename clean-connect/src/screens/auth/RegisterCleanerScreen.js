import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerCleaner } from '../../redux/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import colors from '../../utils/colors';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useRouter } from 'expo-router';

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required('Le prénom est requis'),
  lastName: Yup.string().required('Le nom est requis'),
  email: Yup.string().email('Email invalide').required("L'email est requis"),
  phone: Yup.string().required('Le numéro de téléphone est requis'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .required('Le mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Les mots de passe doivent correspondre')
    .required('Veuillez confirmer votre mot de passe'),
  address: Yup.string().required('L\'adresse est requise'),
  city: Yup.string().required('La ville est requise'),
  postalCode: Yup.string().required('Le code postal est requis')
});

const RegisterCleanerScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleRegister = (values) => {
    const userData = {
      ...values,
      role: 'cleaner', // Utiliser 'role' pour correspondre à l'API backend
      location: { // Formatter l'emplacement comme attendu par le backend
        address: values.address,
        city: values.city,
        postalCode: values.postalCode
      }
    };
    
    // Supprimer les champs qui sont maintenant dans location
    delete userData.address;
    delete userData.city;
    delete userData.postalCode;
    // Supprimer confirmPassword qui n'est pas nécessaire pour le backend
    delete userData.confirmPassword;
    
    dispatch(registerCleaner(userData)); // Correction: Utiliser registerCleaner au lieu de register
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>CleanConnect</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>Inscription - Agent de nettoyage</Text>
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <Formik
            initialValues={{ 
              firstName: '', 
              lastName: '', 
              email: '', 
              phone: '',
              password: '', 
              confirmPassword: '',
              address: '',
              city: '',
              postalCode: '' 
            }}
            validationSchema={validationSchema}
            onSubmit={handleRegister}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View>
                <Input
                  label="Prénom"
                  value={values.firstName}
                  onChangeText={handleChange('firstName')}
                  onBlur={handleBlur('firstName')}
                  placeholder="Votre prénom"
                  error={touched.firstName && errors.firstName}
                />
                
                <Input
                  label="Nom"
                  value={values.lastName}
                  onChangeText={handleChange('lastName')}
                  onBlur={handleBlur('lastName')}
                  placeholder="Votre nom"
                  error={touched.lastName && errors.lastName}
                />
                
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
                  label="Téléphone"
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  placeholder="Votre numéro de téléphone"
                  keyboardType="phone-pad"
                  error={touched.phone && errors.phone}
                />
                
                <Input
                  label="Adresse"
                  value={values.address}
                  onChangeText={handleChange('address')}
                  onBlur={handleBlur('address')}
                  placeholder="Votre adresse"
                  error={touched.address && errors.address}
                />
                
                <Input
                  label="Ville"
                  value={values.city}
                  onChangeText={handleChange('city')}
                  onBlur={handleBlur('city')}
                  placeholder="Votre ville"
                  error={touched.city && errors.city}
                />
                
                <Input
                  label="Code postal"
                  value={values.postalCode}
                  onChangeText={handleChange('postalCode')}
                  onBlur={handleBlur('postalCode')}
                  placeholder="Votre code postal"
                  keyboardType="numeric"
                  error={touched.postalCode && errors.postalCode}
                />
                
                <Input
                  label="Mot de passe"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  placeholder="Créez votre mot de passe"
                  secureTextEntry
                  error={touched.password && errors.password}
                />
                
                <Input
                  label="Confirmer le mot de passe"
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  placeholder="Confirmez votre mot de passe"
                  secureTextEntry
                  error={touched.confirmPassword && errors.confirmPassword}
                />
                
                <Button 
                  title="S'inscrire" 
                  onPress={handleSubmit} 
                  loading={loading}
                  style={styles.button}
                />
              </View>
            )}
          </Formik>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  formContainer: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
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
  button: {
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  footerText: {
    color: colors.text,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default RegisterCleanerScreen;