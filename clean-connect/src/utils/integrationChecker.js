/**
 * Utilitaire pour vérifier l'intégration correcte entre frontend et backend
 */
import { apiService } from '../services/apiService';
import { transformListingToBackend, transformListingToFrontend } from './dataAdapters';
import { calculateListingPrice } from './priceCalculator';

/**
 * Vérifie l'authenticité du token et la connexion au backend
 * @returns {Promise<boolean>} - true si l'authentification est valide
 */
export const checkAuthentication = async () => {
  try {
    await apiService.get('/auth/me');
    console.log('✅ Authentification valide');
    return true;
  } catch (error) {
    console.error('❌ Problème d\'authentification:', error.message);
    return false;
  }
};

/**
 * Vérifie les endpoints backend nécessaires pour les annonces
 * @returns {Promise<Object>} - Statut de chaque endpoint
 */
export const checkListingEndpoints = async () => {
  const endpoints = [
    { method: 'GET', url: '/listings', description: 'Récupération des annonces' },
    { method: 'GET', url: '/listings/me', description: 'Annonces de l\'hébergeur' },
    { method: 'POST', url: '/listings', description: 'Création d\'annonce', skipTest: true },
    { method: 'GET', url: '/listings/matches', description: 'Annonces correspondantes pour nettoyeur' }
  ];

  const results = {};

  for (const endpoint of endpoints) {
    if (endpoint.skipTest) {
      results[endpoint.url] = { status: 'skipped', message: 'Test ignoré pour éviter de créer des données' };
      continue;
    }

    try {
      let response;
      
      if (endpoint.method === 'GET') {
        response = await apiService.get(endpoint.url);
      } else if (endpoint.method === 'POST' && !endpoint.skipTest) {
        response = await apiService.post(endpoint.url, {});
      }
      
      results[endpoint.url] = { 
        status: 'success', 
        message: `${endpoint.description} fonctionne` 
      };
    } catch (error) {
      results[endpoint.url] = { 
        status: 'error', 
        message: `${endpoint.description}: ${error.message}` 
      };
    }
  }

  console.log('📊 Résultats de vérification des endpoints:', results);
  return results;
};

/**
 * Vérifie la transformation des données
 * @returns {Object} - Résultats des tests de transformation
 */
export const checkDataTransformation = () => {
  // Exemple de données frontend
  const frontendData = {
    title: 'Nettoyage appartement',
    accommodationType: 'Appartement',
    address: '123 Rue du Test, 75001 Paris',
    date: new Date('2023-06-15'),
    startTime: '09:00',
    endTime: '12:00',
    personCount: 1,
    area: 75,
    services: {
      'Dépoussiérage': true,
      'Nettoyage des sols': true,
      'Nettoyage salle de bain': false
    },
    equipment: {
      'Aspirateur': true,
      'Serpillière': false
    },
    notes: 'Test de nettoyage'
  };

  // Test de transformation frontend -> backend
  const backendData = transformListingToBackend(frontendData);
  
  // Test de transformation backend -> frontend
  const roundTripData = transformListingToFrontend(backendData);
  
  // Vérification du calcul de prix
  const price = calculateListingPrice(frontendData);
  
  const transformationResults = {
    frontendToBackend: {
      status: Boolean(backendData && backendData.accommodationType),
      data: backendData
    },
    backendToFrontend: {
      status: Boolean(roundTripData && roundTripData.accommodationType),
      data: roundTripData
    },
    priceCalculation: {
      status: Boolean(price && price.totalAmount > 0),
      data: price
    }
  };
  
  console.log('🔄 Résultats des tests de transformation:', transformationResults);
  return transformationResults;
};

/**
 * Exécute tous les tests d'intégration
 * @returns {Promise<Object>} - Résultats globaux des tests
 */
export const runIntegrationChecks = async () => {
  console.group('🧪 Vérification de l\'intégration frontend/backend');
  
  const authStatus = await checkAuthentication();
  const endpointResults = await checkListingEndpoints();
  const transformationResults = checkDataTransformation();
  
  const results = {
    authentication: authStatus,
    endpoints: endpointResults,
    dataTransformation: transformationResults,
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 Résultats complets des tests d\'intégration:', results);
  console.groupEnd();
  
  return results;
};

export default {
  checkAuthentication,
  checkListingEndpoints,
  checkDataTransformation,
  runIntegrationChecks
};