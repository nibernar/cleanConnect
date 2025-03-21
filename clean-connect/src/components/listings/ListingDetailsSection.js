import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import colors from '../../utils/colors';
import Card from '../common/Card';
import { formatDuration } from '../../utils/formatters';

/**
 * Component to display listing details such as surface area, duration, services
 * @param {Object} props - Component props
 * @param {Object} props.listing - The listing object with all details
 * @param {Object} props.style - Additional style for the component
 * @returns {JSX.Element} The ListingDetailsSection component
 */
const ListingDetailsSection = ({ listing, style }) => {
  if (!listing) return null;

  // Helper function to render service icons
  const renderServiceIcon = (service) => {
    switch (service) {
      case 'standard':
        return <Ionicons name="home-outline" size={20} color={colors.primary} />;
      case 'deepCleaning':
        return <FontAwesome5 name="broom" size={18} color={colors.primary} />;
      case 'windows':
        return <MaterialIcons name="window" size={20} color={colors.primary} />;
      case 'fridge':
        return <FontAwesome5 name="temperature-low" size={18} color={colors.primary} />;
      case 'oven':
        return <MaterialIcons name="microwave" size={20} color={colors.primary} />;
      case 'laundry':
        return <MaterialIcons name="local-laundry-service" size={20} color={colors.primary} />;
      default:
        return <Ionicons name="checkbox-outline" size={20} color={colors.primary} />;
    }
  };

  // Service labels in French
  const serviceLabels = {
    standard: 'Nettoyage standard',
    deepCleaning: 'Nettoyage en profondeur',
    windows: 'Nettoyage des vitres',
    fridge: 'Nettoyage du réfrigérateur',
    oven: 'Nettoyage du four',
    laundry: 'Service de linge',
  };

  return (
    <Card style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Détails de la mission</Text>
      
      {/* Surface Area */}
      <View style={styles.detailRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="resize-outline" size={20} color={colors.primary} />
        </View>
        <Text style={styles.detailText}>
          Surface: <Text style={styles.detailValue}>{listing.squareMeters} m²</Text>
        </Text>
      </View>
      
      {/* Duration */}
      <View style={styles.detailRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
        </View>
        <Text style={styles.detailText}>
          Durée estimée: <Text style={styles.detailValue}>{formatDuration(listing.durationInMinutes)}</Text>
        </Text>
      </View>

      {/* Services */}
      <Text style={styles.servicesTitle}>Services demandés:</Text>
      
      {listing.services && listing.services.length > 0 ? (
        listing.services.map((service, index) => (
          <View key={`service-${index}`} style={styles.serviceRow}>
            <View style={styles.iconContainer}>
              {renderServiceIcon(service)}
            </View>
            <Text style={styles.serviceText}>
              {serviceLabels[service] || service}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noServices}>Aucun service supplémentaire demandé</Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: 16,
    color: colors.text,
  },
  detailValue: {
    fontWeight: '500',
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  serviceText: {
    fontSize: 15,
    color: colors.text,
  },
  noServices: {
    fontSize: 15,
    color: colors.textLight,
    fontStyle: 'italic',
    marginLeft: 38,
  },
});

export default ListingDetailsSection;