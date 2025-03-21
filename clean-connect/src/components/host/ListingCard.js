import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, typography } from '../../utils/theme';
import { formatDate, formatCurrency, formatTimeRange } from '../../utils/formatters';

/**
 * Card component to display a listing in the host dashboard
 * @param {Object} listing - Listing data
 * @param {function} onPress - Function to execute on press
 * @param {function} onDelete - Function to execute on delete
 * @param {function} onViewApplications - Function to execute on view applications
 * @param {boolean} showActions - Whether to show action buttons
 * @param {Object} style - Additional styles for the container
 * @param {string} status - Status of the listing (active, pending, completed)
 */
const ListingCard = ({ 
  listing, 
  onPress, 
  onDelete, 
  onViewApplications, 
  showActions = false, 
  style = {},
  status 
}) => {
  // Ensure that the ID of the listing is correctly retrieved
  const listingId = listing.id || listing._id;
  
  // Determine status if not provided
  const actualStatus = status || (listing.status || 'active');
  
  const getStatusStyles = () => {
    switch (actualStatus) {
      case 'pending':
        return {
          color: colors.warning,
          icon: 'time-outline',
          text: 'En attente'
        };
      case 'completed':
        return {
          color: colors.success,
          icon: 'checkmark-circle-outline',
          text: 'Terminé'
        };
      case 'booked':
        return {
          color: colors.info,
          icon: 'calendar-outline',
          text: 'Réservé'
        };
      default:
        return {
          color: colors.primary,
          icon: 'ellipsis-horizontal-circle-outline',
          text: 'Active'
        };
    }
  };

  const statusInfo = getStatusStyles();

  // Fonctions de gestion des événements avec vérification de l'ID
  const handlePress = () => {
    if (!listingId) {
      return;
    }
    if (onPress) onPress();
  };

  const handleDelete = () => {
    if (!listingId) {
      return;
    }
    if (onDelete) onDelete();
  };

  const handleViewApplications = () => {
    if (!listingId) {
      return;
    }
    if (onViewApplications) onViewApplications();
  };

  return (
    <View style={[styles.outerContainer, style]}>
      <TouchableOpacity 
        style={[styles.container, shadows.small]} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <Ionicons 
              name="home-outline" 
              size={18} 
              color={colors.background}
            />
            <Text style={styles.typeText}>{listing.accommodationType}</Text>
          </View>
          <View style={[styles.statusContainer, { backgroundColor: statusInfo.color }]}>
            <Ionicons 
              name={statusInfo.icon} 
              size={14} 
              color={colors.background}
            />
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {listing.address}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {/* Pass the complete listing object to the formatter */}
              {formatDate(listing)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {/* Pass the complete listing object to the formatter */}
              {formatTimeRange(listing)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="square-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {listing.area} m²
            </Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.applicantsContainer}>
            <Text style={styles.applicantsText}>
              {listing.applicantsCount || 0} candidat(s)
            </Text>
          </View>
          <Text style={styles.priceText}>{formatCurrency(listing.price)}</Text>
        </View>
      </TouchableOpacity>
      
      {showActions && (
        <View style={styles.actionsContainer}>
          {onViewApplications && (
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={handleViewApplications}
            >
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={styles.actionButtonText}>Candidatures</Text>
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Supprimer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: spacing.md,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  typeContainer: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  typeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  statusText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  content: {
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    marginLeft: spacing.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  applicantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  priceText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  viewButton: {
    borderColor: colors.primary,
    marginRight: spacing.xs,
  },
  deleteButton: {
    borderColor: colors.error,
    marginLeft: spacing.xs,
  },
  actionButtonText: {
    ...typography.bodySmall,
    marginLeft: spacing.xs,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default ListingCard;