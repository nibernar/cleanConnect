import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, typography } from '../../utils/theme';
import { formatDate, formatCurrency, formatTimeRange } from '../../utils/formatters';
import Rating from '../common/Rating';

const { width } = Dimensions.get('window');

/**
 * Card component for swiping through available listings (Tinder-like)
 * @param {Object} listing - Listing data
 */
const ListingSwipeCard = ({ listing }) => {
  // Determine random accommodation image based on type
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

  // Extract host from listing for display
  const host = listing.host || {
    firstName: 'Hôte',
    lastName: 'Anonyme',
    averageRating: 4.5,
    reviewCount: 12
  };

  return (
    <View style={[styles.container, shadows.medium]}>
      <Image 
        source={getAccommodationImage(listing.accommodationType)}
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.overlay}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeText}>{listing.accommodationType}</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{formatCurrency(listing.price)}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.locationText}>{listing.locationApprox || 'Zone à proximité'}</Text>
          </View>
          
          <View style={styles.hostRatingContainer}>
            <Rating value={host.averageRating} size={14} readonly />
            <Text style={styles.reviewCount}>({host.reviewCount})</Text>
          </View>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>
          Ménage • {listing.area} m²
        </Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            {/* Passer l'objet listing complet au formatter */}
            {formatDate(listing, 'EEEE d MMMM yyyy')}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            {/* Passer l'objet listing complet au formatter */}
            {formatTimeRange(listing)}
          </Text>
        </View>
        
        <View style={styles.servicesContainer}>
          {Object.entries(listing.services || {})
            .filter(([_, included]) => included)
            .map(([service], index) => (
              <View key={service} style={styles.serviceTag}>
                <Text style={styles.serviceText} numberOfLines={1}>{service}</Text>
              </View>
            ))
          }
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.swipeHintContainer}>
          <Ionicons name="arrow-back" size={20} color={colors.error} />
          <Text style={styles.swipeHintText}>Passer</Text>
        </View>
        
        <View style={styles.swipeHintContainer}>
          <Text style={[styles.swipeHintText, { color: colors.success }]}>Postuler</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.success} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    width: width - 32,
    marginHorizontal: 16,
    marginBottom: spacing.lg,
    height: 480,
  },
  image: {
    width: '100%',
    height: 200,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  typeContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  typeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  priceText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    color: colors.textSecondary,
  },
  hostRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    ...typography.caption,
    marginLeft: spacing.xs,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  serviceTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  serviceText: {
    ...typography.caption,
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 'auto',
  },
  swipeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHintText: {
    ...typography.bodySmall,
    marginHorizontal: spacing.xs,
  },
});

export default ListingSwipeCard;