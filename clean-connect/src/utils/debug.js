/**
 * Utilitaire de débogage pour l'application
 * Peut être importé et utilisé via la console ou dans un écran de débogage
 */
import { runIntegrationChecks } from './integrationChecker';
import { logTransformation } from './debugUtils';
import { store } from '../redux/store';
import listingService from '../services/listingService';

// Mettre à disposition un outil global pour le débogage dans l'environnement dev
if (__DEV__) {
  // Attacher à l'objet global pour y accéder depuis la console
  global.debugTools = {
    // Fonctions de vérification d'intégration
    checkIntegration: runIntegrationChecks,
    
    // Accès au store Redux
    getReduxState: () => store.getState(),
    
    // Fonctions de services pour tests directs
    listingService,
    
    // Exemples de données pour tests
    sampleData: {
      listing: {
        title: 'Nettoyage appartement test',
        accommodationType: 'Appartement',
        address: '123 Rue de Test, 75001 Paris',
        date: new Date(),
        startTime: '09:00',
        endTime: '12:00',
        personCount: 1,
        area: 75,
        services: {
          'Dépoussiérage': true,
          'Nettoyage des sols': true,
          'Nettoyage salle de bain': true
        },
        equipment: {
          'Aspirateur': true,
          'Serpillière': true
        },
        notes: 'Test de debug'
      }
    },
    
    // Fonctions utilitaires
    transformData: (data, direction = 'toBackend') => {
      if (direction === 'toBackend') {
        const { transformListingToBackend } = require('./dataAdapters');
        return transformListingToBackend(data);
      } else {
        const { transformListingToFrontend } = require('./dataAdapters');
        return transformListingToFrontend(data);
      }
    },
    
    // Test rapide d'un endpoint API
    testEndpoint: async (method, url, data = null) => {
      const { apiService } = require('../services/apiService');
      try {
        let response;
        if (method.toUpperCase() === 'GET') {
          response = await apiService.get(url);
        } else if (method.toUpperCase() === 'POST') {
          response = await apiService.post(url, data || {});
        } else if (method.toUpperCase() === 'PUT') {
          response = await apiService.put(url, data || {});
        } else if (method.toUpperCase() === 'DELETE') {
          response = await apiService.delete(url);
        }
        console.log(`✅ ${method.toUpperCase()} ${url} Succès:`, response);
        return response;
      } catch (error) {
        console.error(`❌ ${method.toUpperCase()} ${url} Erreur:`, error);
        throw error;
      }
    }
  };
  
  console.log('🛠️ Outils de débogage disponibles via global.debugTools');
}

/**
 * Fonction pour exécuter un diagnostic complet de l'intégration
 * @returns {Promise<Object>} Résultats du diagnostic
 */
export const runDiagnostic = async () => {
  console.group('🔍 Diagnostic d\'intégration');
  
  try {
    // Vérification de la connexion et des endpoints
    const results = await runIntegrationChecks();
    
    // Test d'une création d'annonce fictive (sans l'envoyer réellement)
    const testListing = global.debugTools?.sampleData.listing || {
      title: 'Test listing',
      accommodationType: 'Appartement',
      address: '123 Test Street',
      date: new Date(),
      services: ['regular_cleaning']
    };
    
    const transformedData = global.debugTools?.transformData(testListing);
    console.log('🧪 Test de transformation:', transformedData);
    
    // Calcul du prix
    const { calculateListingPrice } = require('./priceCalculator');
    const price = calculateListingPrice(testListing);
    console.log('💰 Calcul du prix:', price);
    
    // Retourner les résultats complets
    const diagnosticResults = {
      ...results,
      transformTest: {
        input: testListing,
        output: transformedData
      },
      priceCalculation: price
    };
    
    console.log('✅ Diagnostic terminé avec succès');
    console.groupEnd();
    
    return diagnosticResults;
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    console.groupEnd();
    throw error;
  }
};

export default {
  runDiagnostic
};