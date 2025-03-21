import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';
import Card from '../../../../clean-connect2/src/components/common/Card';
import { getCleanerStats, getAvailableListings, clearErrors } from '../../redux/slices/cleanerSlice';
import { getUnreadNotificationsCount } from '../../redux/slices/notificationsSlice';
import ListingCard from '../../../../clean-connect2/src/components/host/ListingCard'; // Reusing the same component for listings
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { checkAuthToken } from '../../utils/apiDebugUtils';
import ApiErrorDisplay from '../../../../clean-connect2/src/components/common/ApiErrorDisplay';
import { formatCurrency } from '../../utils/formatters';

const DashboardScreen = () => {
  const dispatch = useDispatch();
  
  // Utiliser à la fois auth.user et user.user pour garantir la compatibilité
  const authUser = useSelector(state => state.auth.user);
  const userFromUserState = useSelector(state => state.user.user);
  const authToken = useSelector(state => state.auth.token);
  
  // Préférer user.user car il est synchronisé avec auth.user mais peut contenir plus de données
  const user = userFromUserState || authUser;
  
  const { stats, availableListings, loading, error } = useSelector(state => state.cleaner);
  const { unreadCount } = useSelector(state => state.notifications);
  const [refreshing, setRefreshing] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  // Limit the number of listings to display on dashboard
  const DASHBOARD_LISTINGS_LIMIT = 5;

  // Fonction de débogage pour vérifier l'état de l'authentification
  const checkAuthStatus = async () => {
    try {
      const token = await checkAuthToken();
      
      // Définir manuellement le token dans l'API si présent
      if (token) {
        api.setAuthToken(token);
      }
      
      setAuthCheckComplete(true);
      return token;
    } catch (error) {
      setAuthCheckComplete(true);
      return false;
    }
  };

  useEffect(() => {
    // Clear any previous errors
    dispatch(clearErrors());
    
    // Vérifier l'état de l'authentification avant de charger les données
    checkAuthStatus().then(isAuthenticated => {
      if (isAuthenticated) {
        loadDashboardData();
      } else {
        // Pour éviter de bloquer l'utilisateur, on charge quand même les données
        // Les slices Redux utiliseront les endpoints de debug en cas d'erreur d'auth
        loadDashboardData();
      }
    });
  }, [dispatch]);

  const loadDashboardData = () => {
    dispatch(getCleanerStats());
    dispatch(getAvailableListings(DASHBOARD_LISTINGS_LIMIT));
    dispatch(getUnreadNotificationsCount());
  };

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(clearErrors());
    
    // Vérifier l'authentification à nouveau sur le rafraîchissement
    checkAuthStatus().then(isAuthenticated => {
      Promise.all([
        dispatch(getCleanerStats()), // Correction de la faute de frappe ici
        dispatch(getAvailableListings(DASHBOARD_LISTINGS_LIMIT)),
        dispatch(getUnreadNotificationsCount())
      ]).finally(() => {
        setRefreshing(false);
      });
    });
  };

  const navigateToJobs = () => {
    router.push('/(cleaner)/jobs');
  };

  const navigateToSchedule = () => {
    router.push('/(cleaner)/schedule');
  };

  const navigateToNotifications = () => {
    router.push('/(cleaner)/notifications');
  };

  const navigateToMessages = () => {
    router.push('/(cleaner)/messages');
  };

  const navigateToProfile = () => {
    router.push('/(cleaner)/profile');
  };
  
  const navigateToListingDetail = (listingId) => {
    router.push({
      pathname: '/(cleaner)/listings/[id]',
      params: { id: listingId }
    });
  };

  const renderAvailableListings = () => {
    // Show loading indicator if we're loading and not refreshing
    if (loading && !refreshing && !error) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    // Show error if we have one
    if (error && !refreshing) {
      return (
        <ApiErrorDisplay 
          error={error} 
          onRetry={() => {
            dispatch(clearErrors());
            checkAuthStatus().then(() => loadDashboardData());
          }}
          message="Impossible de charger les missions disponibles"
        />
      );
    }

    // If no listings available, show empty state
    if (Array.isArray(availableListings) && availableListings.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="search-outline" size={50} color={colors.textLight} />
            <Text style={styles.emptyText}>Aucune mission disponible pour le moment</Text>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={navigateToJobs}
            >
              <Text style={styles.searchButtonText}>Rechercher des missions</Text>
            </TouchableOpacity>
          </View>
        </Card>
      );
    }

    // Otherwise, show the list of listings
    return (
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listingsContainer}
      >
        {Array.isArray(availableListings) && availableListings.map(listing => (
          <ListingCard 
            key={listing._id || `listing-${Math.random()}`}
            listing={listing}
            onPress={() => navigateToListingDetail(listing._id)}
            style={styles.listingCard}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            Bonjour, {user?.firstName || 'Utilisateur'}
          </Text>
          <Text style={styles.subText}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={styles.notificationsContainer}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={navigateToNotifications}
          >
            <Ionicons name="notifications" size={24} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={navigateToMessages}
          >
            <Ionicons name="mail" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={navigateToJobs}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="briefcase" size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Missions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={navigateToSchedule}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="calendar" size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Calendrier</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={navigateToProfile}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="person" size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Profil</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && !error ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="cash-outline" size={30} color={colors.primary} />
                <View style={styles.statText}>
                  <Text style={styles.statAmount}>{formatCurrency(stats?.totalEarnings || 0)}</Text>
                  <Text style={styles.statLabel}>Gains du mois</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="star-outline" size={30} color={colors.primary} />
                <View style={styles.statText}>
                  <Text style={styles.statAmount}>{stats?.averageRating || 0}</Text>
                  <Text style={styles.statLabel}>Évaluations</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="checkmark-circle-outline" size={30} color={colors.primary} />
                <View style={styles.statText}>
                  <Text style={styles.statAmount}>{stats?.completedBookings || 0}</Text>
                  <Text style={styles.statLabel}>Missions terminées</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="time-outline" size={30} color={colors.primary} />
                <View style={styles.statText}>
                  <Text style={styles.statAmount}>{stats?.upcomingBookings || 0}</Text>
                  <Text style={styles.statLabel}>Missions à venir</Text>
                </View>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Missions disponibles</Text>
              <TouchableOpacity onPress={navigateToJobs}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            {renderAvailableListings()}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prochaines missions</Text>
              <TouchableOpacity onPress={navigateToSchedule}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="calendar-outline" size={50} color={colors.textLight} />
                <Text style={styles.emptyText}>Vous n'avez pas de missions à venir</Text>
              </View>
            </Card>
          </View>

          {!user?.isVerified && (
            <Card style={styles.verificationCard}>
              <View style={styles.verificationContent}>
                <Ionicons name="alert-circle" size={30} color={colors.warning} />
                <View style={styles.verificationText}>
                  <Text style={styles.verificationTitle}>Complétez votre profil</Text>
                  <Text style={styles.verificationDesc}>
                    Pour postuler à des missions, vous devez compléter votre profil et vérifier votre identité.
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.verificationButton}
                onPress={navigateToProfile}
              >
                <Text style={styles.verificationButtonText}>Compléter mon profil</Text>
              </TouchableOpacity>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  subText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  notificationsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 15,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  statText: {
    marginLeft: 10,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '500',
  },
  listingsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  listingCard: {
    width: 280,
    marginRight: 15,
  },
  emptyCard: {
    marginHorizontal: 15,
  },
  emptyContent: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  verificationCard: {
    margin: 15,
    marginBottom: 25,
    backgroundColor: colors.lightWarning,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  verificationContent: {
    flexDirection: 'row',
    padding: 15,
  },
  verificationText: {
    flex: 1,
    marginLeft: 10,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  verificationDesc: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  verificationButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginRight: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  verificationButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  }
});

export default DashboardScreen;