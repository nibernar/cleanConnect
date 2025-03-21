import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import colors from '../../utils/colors';

const UserTypeSelectionScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>CleanConnect</Text>
      </View>
      
      <Text style={styles.subtitle}>Je souhaite m'inscrire en tant que :</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => router.push('/register-host')}
        >
          <Image 
            source={require('../../assets/host-icon.png')} 
            style={styles.optionIcon}
          />
          <Text style={styles.optionTitle}>Hôte</Text>
          <Text style={styles.optionDescription}>
            J'ai besoin de services de nettoyage pour mes propriétés
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => router.push('/register-cleaner')}
        >
          <Image 
            source={require('../../assets/cleaner-icon.png')} 
            style={styles.optionIcon}
          />
          <Text style={styles.optionTitle}>Agent de nettoyage</Text>
          <Text style={styles.optionDescription}>
            Je souhaite offrir mes services de nettoyage
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.loginLink}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
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
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    color: colors.text,
  },
  optionsContainer: {
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.primary,
  },
  optionDescription: {
    textAlign: 'center',
    color: colors.text,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
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

export default UserTypeSelectionScreen;