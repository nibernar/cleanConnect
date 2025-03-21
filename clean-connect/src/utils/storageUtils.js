import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utilitaire de stockage qui fonctionne à la fois côté client et serveur
 * Utilise AsyncStorage en environnement client, et un stockage en mémoire en SSR
 */

// Stockage en mémoire pour l'environnement serveur
const memoryStorage = new Map();

// Détecte si nous sommes dans un environnement serveur
const isServer = () => typeof window === 'undefined';

/**
 * Récupère une valeur du stockage
 * @param {string} key - La clé de stockage
 * @returns {Promise<string|null>} La valeur ou null si non trouvée
 */
export const getStorageItem = async (key) => {
  try {
    if (isServer()) {
      return memoryStorage.get(key) || null;
    }
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Erreur lors de la récupération de données:', error);
    return null;
  }
};

/**
 * Enregistre une valeur dans le stockage
 * @param {string} key - La clé de stockage
 * @param {string} value - La valeur à stocker
 * @returns {Promise<boolean>} true si succès, false si échec
 */
export const setStorageItem = async (key, value) => {
  try {
    if (isServer()) {
      memoryStorage.set(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
    return true;
  } catch (error) {
    console.error('Erreur lors du stockage de données:', error);
    return false;
  }
};

/**
 * Supprime une valeur du stockage
 * @param {string} key - La clé à supprimer
 * @returns {Promise<boolean>} true si succès, false si échec
 */
export const removeStorageItem = async (key) => {
  try {
    if (isServer()) {
      memoryStorage.delete(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de données:', error);
    return false;
  }
};