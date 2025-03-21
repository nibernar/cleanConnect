import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import colors from '../../utils/colors';

/**
 * Card component to display an application in the host interface
 * 
 * @param {Object} application - Application data
 * @param {Function} onPress - Function to execute when the card is pressed
 * @param {Object} style - Additional styles for the container
 */
const ApplicationCard = ({ application, onPress, style = {} }) => {
  if (!application) return null;

  // Extract necessary information from the application object
  const {
    _id,
    cleaner,
    applicant, // For backward compatibility
    status = 'pending',
    createdAt,
    appliedAt, // Some APIs use appliedAt instead of createdAt
    message,
    listing
  } = application;

  // Use the appropriate applicant info (cleaner is the new structure, applicant for backward compatibility)
  const applicantInfo = cleaner || applicant;

  // Format the date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Get appropriate status styles
  const getStatusStyles = () => {
    switch (status) {
      case 'accepted':
        return {
          color: colors.success,
          backgroundColor: colors.lightSecondary,
          text: 'Acceptée'
        };
      case 'rejected':
        return {
          color: colors.error,
          backgroundColor: colors.lightError,
          text: 'Refusée'
        };
      case 'cancelled':
        return {
          color: colors.textLight,
          backgroundColor: colors.lightBackground,
          text: 'Annulée'
        };
      case 'pending':
      default:
        return {
          color: colors.warning,
          backgroundColor: colors.lightWarning,
          text: 'En attente'
        };
    }
  };

  const statusStyles = getStatusStyles();

  // Build applicant full name
  const getFullName = () => {
    if (!applicantInfo) return 'Candidat inconnu';
    return `${applicantInfo.firstName || ''} ${applicantInfo.lastName || ''}`.trim() || 'Candidat';
  };

  // Format avatar url or use default
  const getAvatarUrl = () => {
    if (applicantInfo && (applicantInfo.avatar || applicantInfo.profileImage)) {
      return { uri: applicantInfo.avatar || applicantInfo.profileImage };
    }
    return null;
  };

  // Get rating display
  const getRatingDisplay = () => {
    if (!applicantInfo) return null;
    
    const ratingValue = applicantInfo.rating || 0;
    if (ratingValue <= 0) return null;
    
    return (
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color={colors.warning} />
        <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
      </View>
    );
  };

  // Get price display
  const getPriceDisplay = () => {
    let price = null;
    
    // Try to extract price from different possible locations
    if (application.price) {
      price = application.price;
    } else if (listing && listing.price) {
      if (typeof listing.price === 'object') {
        price = listing.price.totalAmount || listing.price.baseAmount;
      } else {
        price = listing.price;
      }
    }
    
    if (!price) return null;
    
    return (
      <Text style={styles.priceText}>
        {typeof price === 'number' 
          ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
          : price}
      </Text>
    );
  };

  // Get listing title if available
  const getListingTitle = () => {
    if (!listing || !listing.title) return null;
    
    return (
      <View style={styles.listingInfo}>
        <Ionicons name="home-outline" size={12} color={colors.textLight} />
        <Text style={styles.listingTitle} numberOfLines={1}>
          {listing.title}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.applicantInfo}>
          {getAvatarUrl() ? (
            <Image source={getAvatarUrl()} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={colors.white} />
            </View>
          )}
          
          <View style={styles.applicantDetails}>
            <Text style={styles.applicantName}>{getFullName()}</Text>
            <View style={styles.applicantMeta}>
              {getRatingDisplay()}
              
              <Text style={styles.dateText}>
                Reçue le {formatDate(createdAt || appliedAt)}
              </Text>
            </View>
            {getListingTitle()}
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: statusStyles.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyles.color }]}>
            {statusStyles.text}
          </Text>
        </View>
      </View>
      
      {message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Message:</Text>
          <Text style={styles.messageText} numberOfLines={2}>
            {message}
          </Text>
        </View>
      )}
      
      <View style={styles.footer}>
        {getPriceDisplay()}
        
        <View style={styles.actionIndicator}>
          <Text style={styles.actionText}>Voir détails</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicantDetails: {
    marginLeft: 10,
    flex: 1,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  applicantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 2,
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
  },
  listingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  listingTitle: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: 12,
    backgroundColor: colors.lightBackground,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  }
});

export default ApplicationCard;