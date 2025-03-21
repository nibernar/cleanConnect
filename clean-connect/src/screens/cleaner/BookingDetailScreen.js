import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// Replace direct import with our platform-specific abstraction
import { MapView, Marker } from '../../components/map';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchBookingById, cancelBooking } from '../../redux/slices/bookingsSlice';
import Rating from '../../components/common/Rating';
import { colors, spacing, typography, shadows } from '../../utils/theme';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

/**
 * Screen for displaying detailed information about a booking
 */
const BookingDetailScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params;
  const { currentBooking, loading } = useSelector(state => state.bookings);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0
  });

  useEffect(() => {
    if (bookingId) {
      dispatch(fetchBookingById(bookingId));
    }
  }, [dispatch, bookingId]);

  useEffect(() => {
    if (currentBooking?.date) {
      // Set up countdown
      const updateCountdown = () => {
        const now = new Date();
        const bookingDate = new Date(currentBooking.date);
        bookingDate.setHours(
          parseInt(currentBooking.startTime.split(':')[0]),
          parseInt(currentBooking.startTime.split(':')[1])
        );
        
        // Time difference in milliseconds
        const diff = bookingDate - now;
        
        if (diff > 0) {
          // Convert to days, hours, minutes
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          setCountdown({ days, hours, minutes });
        } else {
          // Booking has started or is in the past
          setCountdown({ days: 0, hours: 0, minutes: 0 });
          
          // If booking has started and status is confirmed, show address
          if (currentBooking.status === 'confirmed') {
            setShowFullAddress(true);
          }
        }
      };
      
      // Update immediately
      updateCountdown();
      
      // Then update every minute
      const intervalId = setInterval(updateCountdown, 60000);
      return () => clearInterval(intervalId);
    }
  }, [currentBooking]);

  const handleCancel = () => {
    Alert.alert(
      "Annuler cette mission",
      "Êtes-vous sûr de vouloir annuler cette mission ? Cette action est irréversible.",
      [
        {
          text: "Non",
          style: "cancel"
        },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => {
            dispatch(cancelBooking(bookingId));
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleStartMission = () => {
    // Navigate to tasks screen to start the cleaning mission
    navigation.navigate('Tasks', { bookingId });
  };

  const handleContactHost = () => {
    if (currentBooking?.host?.phone) {
      Linking.openURL(`tel:${currentBooking.host.phone}`);
    } else {
      navigation.navigate('Chat', { 
        conversationId: currentBooking.conversationId || 'new',
        recipientId: currentBooking.host.id,
        recipientName: `${currentBooking.host.firstName} ${currentBooking.host.lastName}`
      });
    }
  };

  const handleNavigate = () => {
    const { latitude, longitude } = currentBooking.location.coordinates;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${latitude},${longitude}`;
    const label = currentBooking.location.address;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    Linking.openURL(url);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente de confirmation';
      case 'confirmed':
        return 'Confirmé';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      case 'disputed':
        return 'Litige en cours';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.success;
      case 'completed':
        return colors.info;
      case 'cancelled':
        return colors.error;
      case 'disputed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  if (loading || !currentBooking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get accommodation image based on type
  const getAccommodationImage = (type) => {
    const typeMap = {
      'Appartement': require('../../assets/apartment.jpg'),
      'Maison': require('../../assets/house.jpg'),
      'Studio': require('../../assets/studio.jpg'),
      'Villa': require('../../assets/villa.jpg'),
      'Loft': require('../../assets/loft.jpg'),
      'Chambre d\'hôtel': require('../../assets/hotel-room.jpg'),
    };
    
    return typeMap[type] || require('../../assets/default-accommodation.jpg');
  };

  const canStartMission = currentBooking.status === 'confirmed' && countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0;
  const bookingIsPast = new Date(currentBooking.date) < new Date();
  const canCancel = currentBooking.status === 'confirmed' && !bookingIsPast;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* Header with image and basic info */}
        <View style={styles.imageContainer}>
          <Image 
            source={getAccommodationImage(currentBooking.accommodationType)} 
            style={styles.accommodationImage}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.background} />
          </TouchableOpacity>
          
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor(currentBooking.status) }]}>
              {getStatusLabel(currentBooking.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.content}>
          {/* Main info card */}
          <View style={[styles.card, shadows.medium]}>
            <Text style={styles.title}>
              {currentBooking.accommodationType} • {currentBooking.area} m²
            </Text>
            
            <View style={styles.hostInfo}>
              <View style={styles.hostImageContainer}>
                <Text style={styles.hostInitials}>
                  {currentBooking.host.firstName[0]}{currentBooking.host.lastName[0]}
                </Text>
              </View>
              
              <View style={styles.hostDetails}>
                <Text style={styles.hostName}>
                  {currentBooking.host.firstName} {currentBooking.host.lastName}
                </Text>
                <View style={styles.hostRating}>
                  <Rating value={currentBooking.host.averageRating || 4.5} size={16} readonly />
                  <Text style={styles.reviewCount}>
                    ({currentBooking.host.reviewCount || 0})
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleContactHost}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.divider} />
            
            {currentBooking.status === 'confirmed' && !bookingIsPast && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownTitle}>Commence dans</Text>
                <View style={styles.countdownValues}>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{countdown.days}</Text>
                    <Text style={styles.countdownLabel}>jours</Text>
                  </View>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{countdown.hours}</Text>
                    <Text style={styles.countdownLabel}>heures</Text>
                  </View>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{countdown.minutes}</Text>
                    <Text style={styles.countdownLabel}>min</Text>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                {formatDate(currentBooking.date)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                {currentBooking.startTime} - {currentBooking.endTime}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <View style={styles.addressContainer}>
                {showFullAddress ? (
                  <>
                    <Text style={styles.infoText}>
                      {currentBooking.location.address}
                    </Text>
                    <TouchableOpacity 
                      style={styles.navigateButton}
                      onPress={handleNavigate}
                    >
                      <Ionicons name="navigate" size={16} color={colors.primary} />
                      <Text style={styles.navigateText}>Y aller</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.infoText}>
                    {currentBooking.locationApprox || 'Adresse révélée le jour du ménage'}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                {currentBooking.price} € (environ {Math.round(currentBooking.price * 0.85)} € après commission)
              </Text>
            </View>
          </View>
          
          {/* Map Card (only shown when address is revealed) */}
          {showFullAddress && currentBooking.location.coordinates && (
            <View style={[styles.card, shadows.medium]}>
              <Text style={styles.sectionTitle}>Localisation</Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: currentBooking.location.coordinates.latitude,
                    longitude: currentBooking.location.coordinates.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  provider="google"
                >
                  <Marker
                    coordinate={{
                      latitude: currentBooking.location.coordinates.latitude,
                      longitude: currentBooking.location.coordinates.longitude,
                    }}
                    title={currentBooking.accommodationType}
                    description="Lieu de la mission"
                  />
                </MapView>
              </View>
            </View>
          )}
          
          {/* Services Card */}
          <View style={[styles.card, shadows.medium]}>
            <Text style={styles.sectionTitle}>Services à réaliser</Text>
            
            <View style={styles.servicesList}>
              {Object.entries(currentBooking.services || {})
                .filter(([_, included]) => included)
                .map(([service]) => (
                  <View key={service} style={styles.serviceItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.serviceText}>{service}</Text>
                  </View>
                ))
              }
            </View>
          </View>
          
          {/* Equipment Card */}
          <View style={[styles.card, shadows.medium]}>
            <Text style={styles.sectionTitle}>Équipements disponibles</Text>
            
            <View style={styles.servicesList}>
              {Object.entries(currentBooking.equipment || {})
                .filter(([_, available]) => available)
                .map(([equipment]) => (
                  <View key={equipment} style={styles.serviceItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.serviceText}>{equipment}</Text>
                  </View>
                ))
              }
            </View>
          </View>
          
          {/* Notes Card */}
          {currentBooking.notes && (
            <View style={[styles.card, shadows.medium]}>
              <Text style={styles.sectionTitle}>Notes complémentaires</Text>
              <Text style={styles.notesText}>{currentBooking.notes}</Text>
            </View>
          )}
          
          {/* Action buttons */}
          <View style={[styles.actionsCard, shadows.medium]}>
            {canStartMission && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleStartMission}
              >
                <Ionicons name="play-circle-outline" size={20} color={colors.background} />
                <Text style={styles.primaryButtonText}>Commencer la mission</Text>
              </TouchableOpacity>
            )}
            
            {canCancel && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                <Text style={styles.cancelButtonText}>Annuler la mission</Text>
              </TouchableOpacity>
            )}
            
            {currentBooking.status === 'completed' && (
              <View style={styles.completedMessage}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.completedText}>
                  Mission terminée le {formatDate(currentBooking.completedAt)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  accommodationImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: spacing.xs,
  },
  statusContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...shadows.small,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: 'bold',
  },
  content: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hostImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostInitials: {
    ...typography.h3,
    color: colors.background,
  },
  hostDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  hostName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  hostRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    ...typography.caption,
    marginLeft: spacing.xs,
    color: colors.textSecondary,
  },
  contactButton: {
    padding: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  countdownContainer: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  countdownTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  countdownValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  countdownItem: {
    alignItems: 'center',
  },
  countdownNumber: {
    ...typography.h1,
    color: colors.primary,
  },
  countdownLabel: {
    ...typography.caption,
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
  },
  addressContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  navigateText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  servicesList: {
    marginTop: spacing.xs,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  serviceText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  notesText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actionsCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.xxl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.background,
    marginLeft: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  completedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  completedText: {
    ...typography.body,
    color: colors.success,
    marginLeft: spacing.sm,
  },
});

export default BookingDetailScreen;