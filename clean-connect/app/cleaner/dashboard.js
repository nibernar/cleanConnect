import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

// Import des composants et services
import Card from '../../../clean-connect/src/components/common/Card';
import smartApiService from '../../src/services/smartApiService';
import { determineUserType } from '../../src/utils/userTypeDetector';
import ListingSwipeCard from '../../../clean-connect/src/components/cleaner/ListingSwipeCard';

/**
 * Dashboard pour les utilisateurs de type "cleaner"
 * Cette page affiche les statistiques, les missions disponibles et les actions rapides
 */
export default function CleanerDashboard() {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [stats, setStats] = useState({ completedJobs: 0, earnings: 0, pending: 0 });
  const [availableListings, setAvailableListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Vérifier que l'utilisateur est bien un cleaner
  const userType = useSelector(state => {
    const fullState = state;
    return determineUserType(state.auth.user, fullState, 'CleanerDashboard');
  });
  
  // Vérifier l'authentification et le type d'utilisateur
  useEffect(() => {
    console.log('[CleanerDashboard] Vérification du type utilisateur:', userType);
    
    // Si pas authentifié, rediriger vers login
    if (!isAuthenticated) {
      console.log('[CleanerDashboard] Utilisateur non authentifié, redirection vers login');
      router.replace('/(auth)/');
      return;
    }
    
    // Si l'utilisateur n'est pas un cleaner, rediriger vers le dashboard
    if (userType && userType !== 'cleaner') {
      console.log(`[CleanerDashboard] L'utilisateur est de type ${userType}, redirection vers dashboard principal`);
      router.replace('/dashboard');
      return;
    }
    
    // Charger les données du dashboard
    loadDashboardData();
  }, [isAuthenticated, userType]);
  
  // Fonction pour charger les données du dashboard
  const loadDashboardData = async () => {
    try {
      setError(null);
      console.log('[CleanerDashboard] Chargement des données du dashboard...');
      
      // Récupérer les statistiques en utilisant le service API intelligent
      const statsResponse = await smartApiService.getStats();
      if (statsResponse && statsResponse.data) {
        setStats(statsResponse.data);
      }
      
      // Récupérer les annonces disponibles
      const listingsResponse = await smartApiService.getListings(5);
      if (listingsResponse && listingsResponse.data) {
        setAvailableListings(listingsResponse.data);
      }
      
      console.log('[CleanerDashboard] Données chargées avec succès');
    } catch (err) {
      console.error('[CleanerDashboard] Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données du tableau de bord. Veuillez réessayer.');
    }
  };
  
  // Gérer le rafraîchissement par glisser-tirer
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  };
  
  // Navigation vers les missions disponibles
  const navigateToJobs = () => {
    router.push('/(cleaner)/search');
  };
  
  // Navigation vers le planning
  const navigateToSchedule = () => {
    router.push('/(cleaner)/schedule');
  };
  
  // Navigation vers le détail d'une annonce
  const navigateToListingDetail = (listingId) => {
    router.push(`/(cleaner)/listings/${listingId}`);
  };
  
  // Formatter les montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  // Afficher les annonces disponibles
  const renderAvailableListings = () => {
    if (availableListings.length === 0) {
      return (
        <Card style={styles.emptyListingCard}>
          <Text style={styles.emptyText}>Aucune mission disponible pour le moment.</Text>
          <TouchableOpacity style={styles.searchButton} onPress={navigateToJobs}>
            <Text style={styles.searchButtonText}>Rechercher des missions</Text>
          </TouchableOpacity>
        </Card>
      );
    }
    
    return availableListings.map(listing => (
      <TouchableOpacity key={listing._id} onPress={() => navigateToListingDetail(listing._id)}>
        <ListingSwipeCard 
          listing={listing}
          onPress={() => navigateToListingDetail(listing._id)}
        />
      </TouchableOpacity>
    ));
  };
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Bonjour, {user?.firstName || 'Prestataire'}</Text>
        <Text style={styles.welcomeSubtitle}>Bienvenue sur votre espace CleanConnect</Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedJobs || 0}</Text>
          <Text style={styles.statLabel}>Missions complétées</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending || 0}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(stats.earnings || 0)}</Text>
          <Text style={styles.statLabel}>Revenus</Text>
        </Card>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={navigateToJobs}>
          <MaterialIcons name="search" size={24} color="#007BFF" />
          <Text style={styles.actionText}>Trouver des missions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={navigateToSchedule}>
          <MaterialIcons name="event" size={24} color="#007BFF" />
          <Text style={styles.actionText}>Mon planning</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Missions disponibles</Text>
          <TouchableOpacity onPress={navigateToJobs}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.listingsContainer}>
          {renderAvailableListings()}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  errorContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  retryButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  statCard: {
    flex: 1,
    margin: 5,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionText: {
    color: '#007BFF',
    marginTop: 5,
    fontSize: 14,
  },
  sectionContainer: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllText: {
    color: '#007BFF',
    fontSize: 14,
  },
  listingsContainer: {
    marginTop: 10,
  },
  emptyListingCard: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});