import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '../../redux/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import colors from '../../utils/colors';

const ForgotPasswordScreen = ({ onGoBack, onResetPassword }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(state => state.auth);

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Format d'email invalide";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      dispatch(forgotPassword({ email }));
      if (onResetPassword && success) {
        onResetPassword();
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>CleanConnect</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>Réinitialisation du mot de passe</Text>
          <Text style={styles.description}>
            Veuillez entrer l'adresse email associée à votre compte. 
            Nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          {success && (
            <Text style={styles.successText}>
              Un email de réinitialisation a été envoyé à {email}. 
              Veuillez vérifier votre boîte de réception.
            </Text>
          )}
          
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Votre email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          
          <Button 
            title="Envoyer le lien" 
            onPress={handleSubmit} 
            loading={loading}
            style={styles.button}
            disabled={success}
          />
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity onPress={onGoBack}>
            <Text style={styles.backLink}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: colors.text,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.textLight,
  },
  errorText: {
    color: colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
  successText: {
    color: colors.success,
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
  footer: {
    alignItems: 'center',
  },
  backLink: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;