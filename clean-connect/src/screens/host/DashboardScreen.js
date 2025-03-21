import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getHostStats, getActiveListings } from '../../redux/slices/hostSlice';
import { getUnreadNotificationsCount } from '../../redux/slices/notificationsSlice';
import Card from '../../components/common/Card';
import ListingCard from '../../components/host/ListingCard';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);
  const { stats, activeListings, loading } = useSelector(state => state.host);
  const { unreadCount } = useSelector(state => state.notifications);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [dispatch]);

  const loadDashboardData = () => {
    dispatch(getHostStats());
    dispatch(getActiveListings());
    dispatch(getUnreadNotificationsCount());
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      dispatch(getHostStats()),
      dispatch(getActiveListings()),
      dispatch(getUnreadNotificationsCount())
    ]).finally(() => setRefreshing(false));
  };

  const navigateToCreateListing = () => {
    navigation.navigate('CreateListingScreen');
  };

  const navigateToListings = () => {
    navigation.navigate('ListingsScreen');
  };

  const navigateToApplications = () => {
    navigation.navigate('ApplicationsScreen');
  };

  const navigateToNotifications = () => {
    navigation.navigate('NotificationsScreen');
  };

  const navigateToMessages = () => {
    navigation.navigate('MessagesScreen');
  };

  const navigateToListingDetail = (listingId) => {
    navigation.navigate('ListingDetailScreen', { listingId });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
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

      {loading && !refreshing ? (
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
            
            {activeListings.length === 0 ? (
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
            ) : (
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listingsContainer}
              >
                {activeListings.map(listing => (
                  <ListingCard 
                    key={listing._id}
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
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prochains services</Text>
            </View>
            
            {stats?.upcomingBookings?.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyContent}>
                  <Ionicons name="calendar-outline" size={50} color={colors.textLight} />
                  <Text style={styles.emptyText}>Vous n'avez pas de services prévus</Text>
                </View>
              </Card>
            ) : (
              stats?.upcomingBookings?.map(booking => (
                <Card key={booking._id} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingTitle}>{booking.listing.title}</Text>
                    <Text style={styles.bookingStatus}>{booking.status}</Text>
                  </View>
                  
                  <View style={styles.bookingDetails}>
                    <View style={styles.bookingDetail}>
                      <Ionicons name="calendar-outline" size={18} color={colors.textLight} />
                      <Text style={styles.bookingText}>
                        {new Date(booking.date).toLocaleDateString('fr-FR', { 
                          day: '2-digit', 
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    
                    <View style={styles.bookingDetail}>
                      <Ionicons name="time-outline" size={18} color={colors.textLight} />
                      <Text style={styles.bookingText}>
                        {booking.startTime} - {booking.endTime}
                      </Text>
                    </View>
                    
                    <View style={styles.bookingDetail}>
                      <Ionicons name="person-outline" size={18} color={colors.textLight} />
                      <Text style={styles.bookingText}>
                        {booking.cleaner.name}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => navigation.navigate('BookingDetailScreen', { bookingId: booking._id })}
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
    color: colors.success,
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
  },
});

export default DashboardScreen;