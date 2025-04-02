import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importer le thème complet
import { colors, spacing, typography, shadows } from '../../utils/theme'; 
import { formatDate, formatCurrency, formatTimeRange } from '../../utils/formatters';
import Rating from '../common/Rating'; // Assurez-vous que ce composant existe

const ListingCard = ({ 
  listing, 
  onPress, 
  onDelete, 
  onViewApplications, 
  showActions = false, 
  style = {},
  status 
}) => {
  const listingId = listing.id || listing._id;
  const actualStatus = status || (listing.status || 'active');
  
  const getStatusStyles = () => {
    let config = { color: colors?.primary, icon: 'help-circle-outline', text: 'Inconnu' };
    switch (actualStatus) {
      case 'published': config = { color: colors?.success, icon: 'checkmark-circle-outline', text: 'Active' }; break;
      case 'pending': config = { color: colors?.warning, icon: 'time-outline', text: 'En attente' }; break;
      case 'booked': config = { color: colors?.info, icon: 'calendar-outline', text: 'Réservée' }; break;
      case 'completed': config = { color: colors?.info, icon: 'checkmark-done-outline', text: 'Terminée' }; break;
      case 'cancelled': config = { color: colors?.error, icon: 'close-circle-outline', text: 'Annulée' }; break;
    }
    // Utiliser une couleur de fond dérivée ou une couleur claire par défaut
    config.backgroundColor = config.color ? `${config.color}20` : colors?.lightGray || '#eee'; 
    return config;
  };

  const statusInfo = getStatusStyles();

  const handlePress = () => { if (listingId && onPress) onPress(); };
  const handleDelete = () => { if (listingId && onDelete) onDelete(); };
  const handleViewApplications = () => { if (listingId && onViewApplications) onViewApplications(); };

  return (
    <View style={[styles.outerContainer, style]}>
      <TouchableOpacity 
        // Correction: Retirer shadows.small pour le moment
        style={[styles.container /*, shadows?.small */]} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <Ionicons name="home-outline" size={18} color={colors?.background || 'white'}/>
            <Text style={styles.typeText}>{listing.accommodationType || 'N/A'}</Text>
          </View>
          <View style={[styles.statusContainer, { backgroundColor: statusInfo.backgroundColor }]}>
            <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color || colors?.text} />
            <Text style={[styles.statusText, { color: statusInfo.color || colors?.text }]}>{statusInfo.text}</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.cardTitle} numberOfLines={1}>{listing.title || 'Annonce sans titre'}</Text>{/* Ajout titre */} 
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors?.primary} />
            <Text style={styles.infoText} numberOfLines={1}>{listing.address || 'Adresse non spécifiée'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors?.primary} />
            <Text style={styles.infoText}>{formatDate(listing)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={colors?.primary} />
            <Text style={styles.infoText}>{formatTimeRange(listing)}</Text>
          </View>
          
          {/* Optionnel: Afficher la surface */}
          {/* <View style={styles.infoRow}>
            <Ionicons name="square-outline" size={16} color={colors?.primary} />
            <Text style={styles.infoText}>{listing.area} m²</Text>
          </View> */}
        </View>
        
        <View style={styles.footer}>
          <View style={styles.applicantsContainer}>
             <Ionicons name="people-outline" size={16} color={colors?.textSecondary} />
            <Text style={styles.applicantsText}>
              {listing.applicationCount !== undefined ? listing.applicationCount : listing.applications?.length || 0} candidat(s)
            </Text>
          </View>
          <Text style={styles.priceText}>{formatCurrency(listing.price)}</Text>
        </View>
      </TouchableOpacity>
      
      {showActions && (
        <View style={styles.actionsContainer}>
          {onViewApplications && (
            <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={handleViewApplications}>
              <Ionicons name="people-outline" size={16} color={colors?.primary} />
              <Text style={styles.actionButtonText}>Candidatures</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={16} color={colors?.error} />
              <Text style={[styles.actionButtonText, { color: colors?.error }]}>Supprimer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// Styles avec fallbacks
let styles = {};
try {
    styles = StyleSheet.create({
        outerContainer: { marginBottom: spacing?.md || 16 },
        container: { 
            backgroundColor: colors?.background || 'white', 
            borderRadius: 8, 
            overflow: 'hidden', 
            borderWidth: 1, 
            borderColor: colors?.border || '#eee', 
            elevation: 1 // Ombre minimale pour web/android sans shadows
        },
        header: { flexDirection: 'row', justifyContent: 'space-between' },
        typeContainer: { backgroundColor: colors?.primary || 'blue', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing?.sm || 8, paddingVertical: spacing?.xs || 4, borderTopLeftRadius: 8, borderBottomRightRadius: 8 },
        typeText: { color: colors?.background || 'white', fontSize: 12, fontWeight: 'bold', marginLeft: spacing?.xs || 4 },
        statusContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing?.sm || 8, paddingVertical: spacing?.xs || 4, borderTopRightRadius: 8, borderBottomLeftRadius: 8 },
        statusText: { fontSize: 12, fontWeight: 'bold', marginLeft: spacing?.xs || 4 },
        content: { padding: spacing?.md || 16 },
        cardTitle: { ...(typography?.h4 || {fontSize: 16, fontWeight:'bold'}), marginBottom: spacing?.sm || 8 }, // Ajout style titre
        infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing?.sm || 8 },
        infoText: { ...(typography?.bodySmall || {fontSize: 14}), color: colors?.textSecondary || 'grey', marginLeft: spacing?.sm || 8, flex: 1 }, // Utiliser textSecondary
        footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors?.border || '#eee', padding: spacing?.md || 16, backgroundColor: colors?.card || '#f8f9fa' },
        applicantsContainer: { flexDirection: 'row', alignItems: 'center' },
        applicantsText: { ...(typography?.bodySmall || {fontSize: 14}), color: colors?.textSecondary || 'grey', marginLeft: spacing?.xs || 4 },
        priceText: { ...(typography?.h3 || {fontSize: 18}), color: colors?.primary || 'blue', fontWeight: 'bold' },
        actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing?.xs || 4 },
        actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing?.xs || 4, paddingHorizontal: spacing?.sm || 8, borderRadius: 4, borderWidth: 1, flex: 1, justifyContent: 'center' },
        viewButton: { borderColor: colors?.primary || 'blue', marginRight: spacing?.xs || 4 },
        deleteButton: { borderColor: colors?.error || 'red', marginLeft: spacing?.xs || 4 },
        actionButtonText: { ...(typography?.bodySmall || {fontSize: 14}), marginLeft: spacing?.xs || 4, color: colors?.primary || 'blue', fontWeight: '500' },
    });
} catch(e) {
     console.error("Style error ListingCard (Host):"); // Log spécifique
     styles = StyleSheet.create({ /* fallback */ });
}

export default ListingCard;
