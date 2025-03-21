import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Configuration de l'API avec gestion intelligente des URLs selon la plateforme
 * 
 * Cette configuration permet de résoudre le problème de connexion sur Android
 * en utilisant l'adresse IP appropriée selon le type de dispositif
 */

// Fonction pour obtenir l'adresse IP appropriée pour Android
const getAndroidDeviceIP = () => {
  // Vérifier si nous sommes sur un émulateur ou un vrai dispositif
  // Pour un vrai smartphone, utiliser l'adresse IP réelle de la machine hôte
  const isEmulator = !!(
    Constants.executionEnvironment === 'bare' && 
    /emulator|simulator/i.test(Constants.deviceName || '')
  );
  
  if (isEmulator) {
    // 10.0.2.2 est l'adresse spéciale qui pointe vers la machine hôte
    // depuis l'émulateur Android standard
    return '10.0.2.2';
  } else {
    // Pour un vrai dispositif, utiliser l'adresse IP réelle de la machine
    // Remplacer par l'adresse IP de votre machine sur le réseau local
    return '192.168.9.194';
  }
};

// Options de configuration pour différents environnements
export const API_ENVIRONMENTS = {
  development: {
    // Adresse API pour le développement local
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    
    // Timeout des requêtes en millisecondes
    timeout: 15000,
  },
  production: {
    // URL de production 
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.votre-domaine.com/api/v1',
    timeout: 30000,
  },
};

// Sélection de l'environnement (développement par défaut)
const ENV = process.env.EXPO_PUBLIC_ENV || 'development';
const config = API_ENVIRONMENTS[ENV];

/**
 * Détermine l'URL de base de l'API en fonction de la plateforme
 * - Sur Android Emulator: utilise 10.0.2.2 au lieu de localhost
 * - Sur vrai smartphone Android: utilise l'adresse IP réelle de la machine
 * - Sur Web: utilise localhost ou l'URL originale
 * 
 * @returns {string} L'URL de base appropriée pour la plateforme
 */
export const getApiBaseUrl = () => {
  // En production, on utilise toujours l'URL de production
  if (ENV === 'production') {
    return config.baseUrl;
  }
  
  const baseUrl = config.baseUrl;
  
  // En développement sur mobile, on adapte l'URL
  if (Platform.OS === 'android') {
    if (baseUrl.includes('localhost')) {
      // Remplacer localhost par l'IP appropriée selon le type de dispositif
      return baseUrl.replace('localhost', getAndroidDeviceIP());
    }
  }
  
  // Par défaut, on retourne l'URL configurée sans modification
  return baseUrl;
};

// Fonction pour faciliter le débogage des problèmes de connexion
export const getNetworkInfo = () => {
  return {
    platform: Platform.OS,
    baseUrl: getApiBaseUrl(),
    originalUrl: config.baseUrl,
    timeout: config.timeout,
    isEmulator: !!(
      Constants.executionEnvironment === 'bare' && 
      /emulator|simulator/i.test(Constants.deviceName || '')
    )
  };
};

// Configuration exportée pour l'API
export default {
  baseUrl: getApiBaseUrl(),
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  }
};