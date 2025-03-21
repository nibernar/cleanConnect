import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Écran de sélection du type de compte lors de l'inscription
 * Permet à l'utilisateur de choisir entre s'inscrire comme propriétaire ou prestataire
 */
export default function RegisterChoiceScreen() {
  /**
   * Naviguer vers l'inscription en tant que propriétaire
   */
  const handleHostSelection = () => {
    router.push('/register/host');
  };

  /**
   * Naviguer vers l'inscription en tant que prestataire
   */
  const handleCleanerSelection = () => {
    router.push('/register/cleaner');
  };

  /**
   * Revenir à l'écran de connexion
   */
  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <MaterialIcons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Image
            source={require('../src/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Choisissez votre profil</Text>
          <Text style={styles.headerSubtitle}>
            Sélectionnez le type de compte qui correspond à vos besoins
          </Text>
        </View>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={handleHostSelection}
          >
            <View style={styles.iconContainer}>
              <Image 
                source={require('../src/assets/host-icon.png')} 
                style={styles.optionIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionTitle}>Propriétaire</Text>
            <Text style={styles.optionDescription}>
              Vous souhaitez faire nettoyer vos logements par des professionnels
            </Text>
            <View style={styles.featureContainer}>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Publiez des annonces de ménage</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Trouvez des prestataires qualifiés</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Gérez vos propriétés facilement</Text>
              </View>
            </View>
            <Text style={styles.selectButtonText}>Sélectionner →</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={handleCleanerSelection}
          >
            <View style={styles.iconContainer}>
              <Image 
                source={require('../src/assets/cleaner-icon.png')} 
                style={styles.optionIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionTitle}>Prestataire</Text>
            <Text style={styles.optionDescription}>
              Vous êtes un professionnel du nettoyage à la recherche de missions
            </Text>
            <View style={styles.featureContainer}>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Trouvez des missions de ménage</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Gérez votre planning facilement</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Développez votre activité</Text>
              </View>
            </View>
            <Text style={styles.selectButtonText}>Sélectionner →</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Déjà un compte? <Text style={styles.loginLink} onPress={() => router.push('/(auth)/')}>Se connecter</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  backButton: {
    padding: 10,
    marginLeft: 10,
    marginTop: 5,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  optionIcon: {
    width: 70,
    height: 70,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'right',
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});