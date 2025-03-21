import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

// Import des composants et services
import Card from '../../src/components/common/Card';
import smartApiService from '../../src/services/smartApiService';
import { determineUserType } from '../../src/utils/userTypeDetector';

/**
 * Dashboard pour les utilisateurs de type "host"
 * Cette page affiche les statistiques, les annonces actives et les actions rapides
 */
export default function HostDashboard() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [stats, setStats] = useState({ bookings: 0, earnings: 0, listings: 0 });
  const [activeListings, setActiveListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Vérifier que l'utilisateur est bien un host
  const userType = useSelector(state => {
    const fullState = state;
    return determineUserType(state.auth.user, fullState, 'HostDashboard');
  });
  
  // Vérifier l'authentification et le type d'utilisateur
  useEffect(() => {
    console.log('[HostDashboard] Vérification du type utilisateur:', userType);
    
    // Si pas authentifié, rediriger vers login
    if (!isAuthenticated) {
      console.log('[HostDashboard] Utilisateur non authentifié, redirection vers login');
      router.replace('/(auth)/');
      return;
    }
    
    // Si l'utilisateur n'est pas un host, rediriger vers le dashboard
    if (userType && userType !== 'host') {
      console.log(`[HostDashboard] L'utilisateur est de type ${userType}, redirection vers dashboard principal`);
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
      console.log('[HostDashboard] Chargement des données du dashboard...');
      
      // Récupérer les statistiques en utilisant le service API intelligent
      const statsResponse = await smartApiService.getStats();
      if (statsResponse && statsResponse.data) {
        setStats(statsResponse.data);
      }
      
      // Récupérer les annonces actives
      const listingsResponse = await smartApiService.getListings(5);
      if (listingsResponse && listingsResponse.data) {
        setActiveListings(listingsResponse.data);
      }
      
      console.log('[HostDashboard] Données chargées avec succès');
    } catch (err) {
      console.error('[HostDashboard] Erreur lors du chargement des données:', err);
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
  
  // Navigation vers la création d'une annonce
  const navigateToCreateListing = () => {
    router.push('/(host)/dashboard/create-listing');
  };
  
  // Navigation vers la liste des annonces
  const navigateToListings = () => {
    router.push('/(host)/listings');
  };
  
  // Navigation vers le détail d'une annonce
  const navigateToListingDetail = (listingId) => {
    router.push(`/(host)/listings/${listingId}`);
  };
  
  // Formatter les montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  // Afficher les annonces actives
  const renderActiveListings = () => {
    if (activeListings.length === 0) {
      return (
        <Card style={styles.emptyListingCard}>
          <Text style={styles.emptyText}>Vous n'avez pas encore d'annonces actives.</Text>
          <TouchableOpacity style={styles.createButton} onPress={navigateToCreateListing}>
            <Text style={styles.createButtonText}>Créer une annonce</Text>
          </TouchableOpacity>
        </Card>
      );
    }
    
    return activeListings.map(listing => (
      <TouchableOpacity key={listing._id} onPress={() => navigateToListingDetail(listing._id)}>
        <Card style={styles.listingCard}>
          <View style={styles.listingHeader}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: listing.status === 'active' ? '#4CAF50' : '#FFC107' }]}>
              <Text style={styles.statusText}>{listing.status === 'active' ? 'Active' : 'En attente'}</Text>
            </View>
          </View>
          
          <View style={styles.listingDetails}>
            <Text style={styles.listingInfo}>
              <MaterialIcons name="location-on" size={16} /> {listing.location}
            </Text>
            <Text style={styles.listingInfo}>
              <MaterialIcons name="event" size={16} /> {new Date(listing.dateRequired).toLocaleDateString()}
            </Text>
            <Text style={styles.listingPrice}>{formatCurrency(listing.price)}</Text>
          </View>
        </Card>
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
        <Text style={styles.welcomeTitle}>Bonjour, {user?.firstName || 'Propriétaire'}</Text>
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
          <Text style={styles.statValue}>{stats.listings || 0}</Text>
          <Text style={styles.statLabel}>Annonces</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.bookings || 0}</Text>
          <Text style={styles.statLabel}>Réservations</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(stats.earnings || 0)}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </Card>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={navigateToCreateListing}>
          <MaterialIcons name="add-circle" size={24} color="#007BFF" />
          <Text style={styles.actionText}>Créer une annonce</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={navigateToListings}>
          <MaterialIcons name="list" size={24} color="#007BFF" />
          <Text style={styles.actionText}>Voir mes annonces</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Annonces récentes</Text>
          <TouchableOpacity onPress={navigateToListings}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.listingsContainer}>
          {renderActiveListings()}
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
  listingCard: {
    marginBottom: 15,
    padding: 15,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listingDetails: {
    marginTop: 5,
  },
  listingInfo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
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
  createButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});