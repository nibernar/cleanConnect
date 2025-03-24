import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { createListing } from '../../redux/slices/listingsSlice';
import ListingForm from '../../components/host/ListingForm';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';
import { formatPrice } from '../../utils/priceCalculator';
import { getErrorMessage } from '../../utils/errorHandler';

/**
 * Screen for creating a new cleaning listing
 * @param {Object} props
 * @param {Function} props.onListingCreated - Callback when listing is successfully created
 * @param {Function} props.onCancel - Callback when user cancels listing creation
 */
const CreateListingScreen = ({ onListingCreated, onCancel }) => {
  const dispatch = useDispatch();
  const router = useRouter(); // Use Expo Router hook
  const { loading, error } = useSelector(state => state.listings);
  const [showPriceSummary, setShowPriceSummary] = useState(false);
  const [submittingListing, setSubmittingListing] = useState(false);
  const [listingData, setListingData] = useState(null);

  // Handle form submission
  const handleSubmit = (formData) => {
    // Save form data for confirmation modal
    setListingData(formData);
    // Show the price summary confirmation modal
    setShowPriceSummary(true);
  };

  // Handle final confirmation and submission to backend
  const handleConfirmSubmit = () => {
    if (!listingData) return;
    
    setSubmittingListing(true);
    
    dispatch(createListing(listingData))
      .unwrap()
      .then((listing) => {
        setSubmittingListing(false);
        Alert.alert(
          "Annonce publiée",
          "Votre annonce a été publiée avec succès.",
          [{ 
            text: "OK", 
            onPress: () => {
              // Use callback if provided, otherwise navigate with router
              if (onListingCreated) {
                onListingCreated(listing);
              } else {
                const listingId = listing._id || listing.id;
                // Utiliser une navigation directe avec l'ID
                router.push(`/(host)/listings/${listingId}`);
              }
            } 
          }]
        );
      })
      .catch((err) => {
        setSubmittingListing(false);
        console.error('Error creating listing:', err);
        
        Alert.alert(
          "Erreur",
          getErrorMessage(err, 'Échec de la création de l\'annonce'),
          [{ text: "OK" }]
        );
      });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Nouvelle annonce</Text>
            <Text style={styles.subtitle}>
              Créez une annonce pour trouver un professionnel de ménage
            </Text>
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
            </View>
          )}
          
          <ListingForm
            onSubmit={handleSubmit}
            isLoading={loading}
          />
        </ScrollView>
        
        {/* Price Summary Modal */}
        {showPriceSummary && listingData && (
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPriceSummary(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>Récapitulatif de l'annonce</Text>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Informations générales</Text>
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemLabel}>Titre:</Text>
                  <Text style={styles.modalItemValue}>{listingData.title}</Text>
                </View>
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemLabel}>Type d'hébergement:</Text>
                  <Text style={styles.modalItemValue}>{listingData.accommodationType}</Text>
                </View>
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemLabel}>Superficie:</Text>
                  <Text style={styles.modalItemValue}>{listingData.squareMeters} m²</Text>
                </View>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Date et heure</Text>
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemLabel}>Date:</Text>
                  <Text style={styles.modalItemValue}>
                    {new Date(listingData.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemLabel}>Horaires:</Text>
                  <Text style={styles.modalItemValue}>
                    {typeof listingData.startTime === 'string' 
                      ? listingData.startTime 
                      : listingData.startTime.toLocaleTimeString('fr-FR', {
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false
                        })
                    } - {
                      typeof listingData.endTime === 'string' 
                        ? listingData.endTime 
                        : listingData.endTime.toLocaleTimeString('fr-FR', {
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false
                          })
                      }
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Tarification</Text>
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemLabel}>Prix de base:</Text>
                  <Text style={styles.modalItemValue}>
                    {formatPrice(listingData.price.baseAmount)}
                  </Text>
                </View>
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemLabel}>Commission (15%):</Text>
                  <Text style={styles.modalItemValue}>
                    {formatPrice(listingData.price.commission)}
                  </Text>
                </View>
                <View style={[styles.modalItem, styles.modalTotalItem]}>
                  <Text style={styles.modalTotalLabel}>Total:</Text>
                  <Text style={styles.modalTotalValue}>
                    {formatPrice(listingData.price.totalAmount)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowPriceSummary(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleConfirmSubmit}
                  disabled={submittingListing}
                >
                  {submittingListing ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.modalButtonConfirmText}>Confirmer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  errorContainer: {
    backgroundColor: colors.errorBackground,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: colors.error,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 5,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalItemLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  modalItemValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  modalTotalItem: {
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonCancel: {
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonCancelText: {
    color: colors.text,
    fontWeight: '500',
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CreateListingScreen;