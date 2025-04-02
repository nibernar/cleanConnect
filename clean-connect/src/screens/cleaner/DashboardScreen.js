import React, { useEffect, useState, useCallback } from 'react';
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
// Correction: Importer depuis theme.js et corriger le chemin
import { colors, spacing, typography, shadows } from '../../../src/utils/theme'; 
import Card from '../../components/common/Card'; 
import { getCleanerStats, getAvailableListings, clearCleanerSliceErrors as clearErrors, selectCleanerLoading, selectCleanerError, selectCleanerStats, selectCleanerAvailableListings } from '../../redux/slices/cleanerSlice'; 
import { getUnreadNotificationsCount } from '../../redux/slices/notificationsSlice';
import ListingCard from '../../components/cleaner/ListingSwipeCard'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { checkAuthToken } from '../../utils/apiDebugUtils';
import ApiErrorDisplay from '../../components/common/ApiErrorDisplay';
import { formatCurrency } from '../../utils/formatters';
import { selectUserProfile, fetchProfile } from '../../redux/slices/userSlice'; 
import { selectAuthUser } from '../../redux/slices/authSlice';

const DashboardScreen = () => {
  const dispatch = useDispatch();
  
  const userProfile = useSelector(selectUserProfile);
  const authUser = useSelector(selectAuthUser);
  const user = userProfile || authUser;
  
  const stats = useSelector(selectCleanerStats);
  const availableListings = useSelector(selectCleanerAvailableListings) || [];
  const loading = useSelector(selectCleanerLoading);
  const error = useSelector(selectCleanerError);
  const { unreadCount } = useSelector(state => state.notifications);
  const [refreshing, setRefreshing] = useState(false);

  const DASHBOARD_LISTINGS_LIMIT = 5;

  useEffect(() => {
      console.log('[DashboardScreen] User object used for verification check:', JSON.stringify(user, null, 2));
  }, [user]);

  const loadDashboardData = useCallback(() => {
    console.log("[DashboardScreen] Loading dashboard data...");
    if (user?.role === 'cleaner') {
        dispatch(clearErrors()); 
        dispatch(fetchProfile()); 
        dispatch(getCleanerStats());
        dispatch(getAvailableListings(DASHBOARD_LISTINGS_LIMIT));
        dispatch(getUnreadNotificationsCount());
    } else {
        console.warn("[DashboardScreen] User role is not cleaner or not defined yet. Role:", user?.role);
        if (user?.role) {
             dispatch(getUnreadNotificationsCount());
        }
    }
  }, [dispatch, user?.role]);

  useEffect(() => {
      loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
      if (!loading) {
          setRefreshing(false);
      }
  }, [loading]);

  const navigateToJobs = () => { router.push('/(cleaner)/jobs'); };
  const navigateToSchedule = () => { router.push('/(cleaner)/schedule'); };
  const navigateToNotifications = () => { router.push('/(cleaner)/notifications'); }; 
  const navigateToMessages = () => { router.push('/(cleaner)/messages'); };
  const navigateToProfile = () => { router.push('/(cleaner)/profile'); };
  const navigateToListingDetail = (listingId) => { router.push(`/(cleaner)/listings/${listingId}`); };

  const renderAvailableListings = () => {
    if (!Array.isArray(availableListings) || availableListings.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="search-outline" size={50} color={colors.textLight || 'grey'} />
            <Text style={styles.emptyText}>Aucune mission disponible</Text>
          </View>
        </Card>
      );
    }
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingsContainer}>
        {availableListings.map(listing => (
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

  const showVerificationMessage = user && user.role === 'cleaner' && !user.isVerified; 

  const renderContent = () => {
    if (loading && !refreshing && (!stats || availableListings.length === 0) ) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary || 'blue'} /><Text style={styles.statusText}>Chargement...</Text></View>;
    }
    if (error && !refreshing) {
         return <View style={styles.errorContainer}><ApiErrorDisplay error={error} onRetry={loadDashboardData} /></View>;
    }
    if (!user) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary || 'blue'} /><Text style={styles.statusText}>Chargement utilisateur...</Text></View>; 
    }
    return (
         <>
            {showVerificationMessage && (
                <Card style={styles.verificationCard}>
                    <View style={styles.verificationContent}>
                        <Ionicons name="alert-circle" size={30} color={colors.warning || 'orange'} />
                        <View style={styles.verificationText}>
                        <Text style={styles.verificationTitle}>Complétez votre profil</Text>
                        <Text style={styles.verificationDesc}>
                            Pour postuler à des missions, vous devez compléter votre profil et vérifier votre identité.
                        </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.verificationButton} onPress={navigateToProfile}>
                        <Text style={styles.verificationButtonText}>Compléter mon profil</Text>
                    </TouchableOpacity>
                </Card>
            )}

            <View style={styles.statsContainer}>
                 <Card style={styles.statCard}><View style={styles.statContent}><Ionicons name="cash-outline" size={30} color={colors.primary} /><View style={styles.statText}><Text style={styles.statAmount}>{formatCurrency(stats?.totalEarnings || 0)}</Text><Text style={styles.statLabel}>Gains (Mois)</Text></View></View></Card>
                 <Card style={styles.statCard}><View style={styles.statContent}><Ionicons name="star-outline" size={30} color={colors.primary} /><View style={styles.statText}><Text style={styles.statAmount}>{stats?.averageRating || 0}</Text><Text style={styles.statLabel}>Note Moy.</Text></View></View></Card>
                 <Card style={styles.statCard}><View style={styles.statContent}><Ionicons name="checkmark-circle-outline" size={30} color={colors.primary} /><View style={styles.statText}><Text style={styles.statAmount}>{stats?.completedBookings || 0}</Text><Text style={styles.statLabel}>Missions Finies</Text></View></View></Card>
                 <Card style={styles.statCard}><View style={styles.statContent}><Ionicons name="time-outline" size={30} color={colors.primary} /><View style={styles.statText}><Text style={styles.statAmount}>{stats?.upcomingBookings || 0}</Text><Text style={styles.statLabel}>Missions Prévues</Text></View></View></Card>
             </View>
            <View style={styles.section}>
                 <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Missions disponibles</Text><TouchableOpacity onPress={navigateToJobs}><Text style={styles.seeAllText}>Voir tout</Text></TouchableOpacity></View>
                 {renderAvailableListings()} 
             </View>
             <View style={styles.section}>
                 <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Prochaines missions</Text><TouchableOpacity onPress={navigateToSchedule}><Text style={styles.seeAllText}>Voir tout</Text></TouchableOpacity></View>
                 <Card style={styles.emptyCard}><View style={styles.emptyContent}><Ionicons name="calendar-outline" size={50} color={colors.textLight || 'grey'} /><Text style={styles.emptyText}>Vous n'avez pas de missions à venir</Text></View></Card>
            </View>
        </>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary || 'blue']} />}
    >
      <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Bonjour, {user?.firstName || 'Utilisateur'}</Text>
            <Text style={styles.subText}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={styles.notificationsContainer}>
             <TouchableOpacity style={styles.iconButton} onPress={navigateToNotifications}><Ionicons name="notifications" size={24} color={colors.primary} />{unreadCount > 0 && (<View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>)}</TouchableOpacity>
             <TouchableOpacity style={styles.iconButton} onPress={navigateToMessages}><Ionicons name="mail" size={24} color={colors.primary} /></TouchableOpacity>
          </View>
      </View>

      <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToJobs}><View style={styles.actionIcon}><Ionicons name="search-outline" size={24} color="white" /></View><Text style={styles.actionText}>Chercher</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToSchedule}><View style={styles.actionIcon}><Ionicons name="calendar-outline" size={24} color="white" /></View><Text style={styles.actionText}>Planning</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToProfile}><View style={styles.actionIcon}><Ionicons name="person-outline" size={24} color="white" /></View><Text style={styles.actionText}>Profil</Text></TouchableOpacity>
      </View>

      {renderContent()} 

    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background || '#f8f9fa' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.border || '#eee' },
    welcomeText: { ...(typography.h1 || { fontSize: 22, fontWeight: 'bold' }), color: colors.text || '#000' }, // Fallback pour typography
    subText: { ...(typography.bodySmall || {fontSize: 14}), color: colors.textLight || 'grey', marginTop: 2 },
    notificationsContainer: { flexDirection: 'row' },
    iconButton: { padding: 8, position: 'relative' },
    badge: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.error || 'red', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: 'white', marginBottom: 10 },
    actionButton: { alignItems: 'center' },
    actionIcon: { backgroundColor: colors.primary || 'blue', borderRadius: 25, width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    actionText: { ...(typography.caption || {fontSize: 12}), color: colors.text || '#000', textAlign: 'center' },
    loadingContainer: { flex:1, padding: 30, alignItems: 'center', justifyContent:'center' },
    statusText: { marginTop: spacing.sm || 10, color: colors.textSecondary || 'grey'},
    errorContainer: { flex:1, padding: 30, alignItems: 'center', justifyContent:'center' },
    statsContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md || 15, paddingTop: 5, justifyContent: 'space-between' },
    statCard: { width: '48%', marginBottom: spacing.md || 15, backgroundColor:'white', borderRadius:8, ...(shadows.small || {}) }, // Ajouter shadow
    statContent: { flexDirection: 'row', alignItems: 'center', padding: spacing.md || 15 },
    statText: { marginLeft: spacing.sm || 10, flexShrink: 1 },
    statAmount: { ...(typography.h4 || {fontSize: 18, fontWeight: 'bold'}), color: colors.text || '#000' },
    statLabel: { ...(typography.caption || {fontSize: 12}), color: colors.textLight || 'grey' },
    section: { marginBottom: spacing.lg || 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md || 15, marginBottom: spacing.sm || 10 },
    sectionTitle: { ...(typography.h3 || {fontSize: 18, fontWeight: 'bold'}), color: colors.text || '#000' },
    seeAllText: { color: colors.primary || 'blue', fontWeight: '500' },
    listingsContainer: { paddingHorizontal: spacing.md || 15, paddingBottom: spacing.sm || 5 },
    listingCard: { width: 280, marginRight: spacing.md || 15 },
    emptyCard: { marginHorizontal: spacing.md || 15, backgroundColor:'white', borderRadius:8 }, 
    emptyContent: { padding: spacing.lg || 30, alignItems: 'center' },
    emptyText: { ...(typography.body || {fontSize: 16}), color: colors.textLight || 'grey', marginTop: spacing.sm || 10, textAlign: 'center' },
    verificationCard: { margin: spacing.md || 15, marginBottom: spacing.xs || 5, backgroundColor: colors.lightWarning || '#fff3cd', borderLeftWidth: 4, borderLeftColor: colors.warning || 'orange', borderRadius:8 },
    verificationContent: { flexDirection: 'row', padding: spacing.md || 15 },
    verificationText: { flex: 1, marginLeft: spacing.sm || 10 },
    verificationTitle: { ...(typography.h4 || {fontSize: 16}), fontWeight: 'bold', color: colors.text || '#000', marginBottom: spacing.xs || 5 },
    verificationDesc: { ...(typography.bodySmall || {fontSize: 14}), color: colors.text || '#000', lineHeight: 20 },
    verificationButton: { backgroundColor: 'white', paddingVertical: spacing.sm || 10, paddingHorizontal: spacing.md || 15, borderRadius: 5, alignSelf: 'flex-end', marginRight: spacing.md || 15, marginBottom: spacing.md || 15, borderWidth: 1, borderColor: colors.primary || 'blue' },
    verificationButtonText: { color: colors.primary || 'blue', fontWeight: 'bold' }
});

export default DashboardScreen;
