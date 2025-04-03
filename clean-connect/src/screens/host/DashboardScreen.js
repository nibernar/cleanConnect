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
// MODIFICATION: Importer clearHostErrors
import { getHostStats, getActiveListings, clearHostErrors } from '../../redux/slices/hostSlice';
import { getUnreadNotificationsCount } from '../../redux/slices/notificationsSlice';
import Card from '../../components/common/Card';
import ListingCard from '../../components/host/ListingCard';
import ApiErrorDisplay from '../../components/common/ApiErrorDisplay';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { checkAuthToken } from '../../utils/apiDebugUtils';
import { formatCurrency, formatDate, formatTimeRange } from '../../utils/formatters';

const DashboardScreen = () => {
  const dispatch = useDispatch();

  // Utiliser à la fois auth.user et user.user pour garantir la compatibilité
  const authUser = useSelector(state => state.auth.user);
  const userFromUserState = useSelector(state => state.user.user);
  const authToken = useSelector(state => state.auth.token);

  // Préférer user.user car il est synchronisé avec auth.user mais peut contenir plus de données
  const user = userFromUserState || authUser;

  const { stats, activeListings, loading, error } = useSelector(state => state.host);
  const { unreadCount } = useSelector(state => state.notifications);
  const [refreshing, setRefreshing] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Limit the number of listings to display on dashboard
  const DASHBOARD_LISTINGS_LIMIT = 5;

  // Fonction pour vérifier l'état de l'authentification
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
    // MODIFICATION: Utiliser clearHostErrors()
    dispatch(clearHostErrors());

    // Vérifier l'état de l'authentification avant de charger les données
    checkAuthStatus().then(isAuthenticated => {
      if (isAuthenticated) {
        loadDashboardData();
      } else {
        loadDashboardData();
      }
    });
  }, [dispatch]);

  const loadDashboardData = () => {
    dispatch(getHostStats());
    dispatch(getActiveListings(DASHBOARD_LISTINGS_LIMIT));
    dispatch(getUnreadNotificationsCount());
  };

  const onRefresh = () => {
    setRefreshing(true);
    // MODIFICATION: Utiliser clearHostErrors()
    dispatch(clearHostErrors());

    // Vérifier l'authentification à nouveau sur le rafraîchissement
    checkAuthStatus().then(isAuthenticated => {
      Promise.all([
        dispatch(getHostStats()),
        dispatch(getActiveListings(DASHBOARD_LISTINGS_LIMIT)),
        dispatch(getUnreadNotificationsCount())
      ]).finally(() => {
        setRefreshing(false);
      });
    });
  };

  const navigateToCreateListing = () => {
    router.push('/(host)/dashboard/create-listing');
  };

  const navigateToListings = () => {
    router.push('/(host)/listings');
  };

  const navigateToApplications = () => {
    router.push('/(host)/listings/applications');
  };

  const navigateToNotifications = () => {
    router.push('/(host)/notifications');
  };

  const navigateToMessages = () => {
    router.push('/(host)/messages');
  };

  const navigateToListingDetail = (listingId) => {
    router.push(`/(host)/listings/${listingId}`);
  };

  const renderActiveListings = () => {
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
            // MODIFICATION: Utiliser clearHostErrors()
            dispatch(clearHostErrors());
            checkAuthStatus().then(() => loadDashboardData());
          }}
          message="Impossible de charger les annonces actives"
        />
      );
    }

    // If no listings available, show empty state
    if (Array.isArray(activeListings) && activeListings.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="document-outline" size={50} color={colors.textLight} />
            <Text style={styles.emptyText}>Vous n'avez pas d'annonces actives</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={navigateToCreateListing}
            >
              <Text style={styles.createButtonText}>Créer une annonce</Text>
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
        {Array.isArray(activeListings) && activeListings.map(listing => (
          <ListingCard
            key={listing._id || `listing-${Math.random()}`}
            listing={listing}
            onPress={() => navigateToListingDetail(listing._id)}
            style={styles.listingCard}
          />
        ))}

        <TouchableOpacity
          style={styles.addListingCard}
          onPress={navigateToCreateListing}
        >
          <Ionicons name="add-circle" size={40} color={colors.primary} />
          <Text style={styles.addListingText}>Ajouter une annonce</Text>
        </TouchableOpacity>
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
            Bonjour, {user?.firstName || user?.companyName || 'Utilisateur'}
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
            {/* Add badge for unread messages if needed */}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToCreateListing}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="add-circle" size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Nouvelle annonce</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToListings}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="list" size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Mes annonces</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToApplications}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="people" size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Candidatures</Text>
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
                  <Text style={styles.statAmount}>{formatCurrency(stats?.monthlySpend || 0)}</Text>
                  <Text style={styles.statLabel}>Dépenses du mois</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="calendar-outline" size={30} color={colors.primary} />
                <View style={styles.statText}>
                  <Text style={styles.statAmount}>{stats?.completedBookings || 0}</Text>
                  <Text style={styles.statLabel}>Services réalisés</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="checkmark-circle-outline" size={30} color={colors.primary} />
                <View style={styles.statText}>
                  <Text style={styles.statAmount}>{stats?.activeListings || 0}</Text>
                  <Text style={styles.statLabel}>Annonces actives</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="person-outline" size={30} color={colors.primary} />
                <View style={styles.statText}>
                  <Text style={styles.statAmount}>{stats?.pendingApplications || 0}</Text>
                  <Text style={styles.statLabel}>Candidatures</Text>
                </View>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Annonces actives</Text>
              <TouchableOpacity onPress={navigateToListings}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            {renderActiveListings()}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prochains services</Text>
            </View>

            {!Array.isArray(stats?.upcomingBookings) || stats?.upcomingBookings?.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyContent}>
                  <Ionicons name="calendar-outline" size={50} color={colors.textLight} />
                  <Text style={styles.emptyText}>Vous n'avez pas de services prévus</Text>
                </View>
              </Card>
            ) : (
              Array.isArray(stats?.upcomingBookings) && stats?.upcomingBookings.map(booking => (
                <Card key={booking._id} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingTitle}>{booking.listing?.title || 'Titre non disponible'}</Text>
                    <Text style={styles.bookingStatus}>{booking.status}</Text>
                  </View>

                  <View style={styles.bookingDetails}>
                    <View style={styles.bookingDetail}>
                      <Ionicons name="calendar-outline" size={18} color={colors.textLight} />
                      <Text style={styles.bookingText}>
                        {formatDate(booking)}
                      </Text>
                    </View>

                    <View style={styles.bookingDetail}>
                      <Ionicons name="time-outline" size={18} color={colors.textLight} />
                      <Text style={styles.bookingText}>
                        {formatTimeRange(booking)}
                      </Text>
                    </View>

                    {booking.cleaner && (
                      <View style={styles.bookingDetail}>
                        <Ionicons name="person-outline" size={18} color={colors.textLight} />
                        <Text style={styles.bookingText}>
                          {/* Vérifier que cleaner.name existe */}
                          {`${booking.cleaner.firstName || ''} ${booking.cleaner.lastName || ''}`.trim() || 'Nom non disponible'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => router.push(`/(host)/bookings/${booking._id}`)}
                  >
                    <Text style={styles.viewDetailsText}>Voir détails</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </Card>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

// Styles (inchangés)
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
  addListingCard: {
    width: 150,
    height: 220,
    backgroundColor: colors.lightBackground,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addListingText: {
    marginTop: 10,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
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
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bookingCard: {
    marginHorizontal: 15,
    marginBottom: 10,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  bookingStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.success, // Adapter la couleur selon le statut si nécessaire
  },
  bookingDetails: {
    marginBottom: 15,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bookingText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 5,
  }
});

export default DashboardScreen;