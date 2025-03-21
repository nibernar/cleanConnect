import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';
import Card from '../common/Card';

/**
 * Component to display an address with map controls
 * @param {Object} props - Component props
 * @param {Object} props.address - The address object with street, city, etc.
 * @param {Object} props.style - Additional style for the component
 * @param {boolean} props.displayOnly - If true, no map controls will be shown (just display)
 * @returns {JSX.Element} The AddressDisplayCard component
 */
const AddressDisplayCard = ({ address, style, displayOnly = false }) => {
  if (!address) return null;

  const formattedAddress = `${address.street || ''}, ${address.postalCode || ''} ${address.city || ''}`;

  // Open address in maps app
  const openMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${formattedAddress}`,
      android: `geo:0,0?q=${encodeURIComponent(formattedAddress)}`
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps in browser
        Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(formattedAddress)}`);
      }
    });
  };

  return (
    <Card style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Adresse</Text>
      
      <View style={styles.addressContainer}>
        <Ionicons name="location-outline" size={22} color={colors.primary} style={styles.icon} />
        <View style={styles.addressTextContainer}>
          {address.street && <Text style={styles.addressStreet}>{address.street}</Text>}
          <Text style={styles.addressCity}>
            {address.postalCode && `${address.postalCode} `}
            {address.city}
          </Text>
        </View>
      </View>

      {!displayOnly && (
        <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
          <Ionicons name="map-outline" size={16} color={colors.primary} />
          <Text style={styles.mapButtonText}>Voir sur la carte</Text>
        </TouchableOpacity>
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
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressStreet: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  addressCity: {
    fontSize: 15,
    color: colors.textLight,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  mapButtonText: {
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default AddressDisplayCard;