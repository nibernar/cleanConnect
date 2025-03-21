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
import { useDispatch, useSelector } from 'react-redux';
import { createListing } from '../../redux/slices/listingsSlice';
import ListingForm from '../../components/host/ListingForm';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';

const CreateListingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.listings);
  
  const [formData, setFormData] = useState({
    title: '',
    accommodationType: '',
    address: '',
    personCount: 1,
    date: new Date(),
    startTime: '09:00',
    endTime: '12:00',
    squareMeters: '',
    services: [],
    equipment: [],
    notes: '',
  });
  
  const [price, setPrice] = useState({
    basePrice: 0,
    commission: 0,
    totalPrice: 0
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [showPriceSummary, setShowPriceSummary] = useState(false);

  // Calculate price when relevant fields change
  useEffect(() => {
    calculatePrice();
  }, [formData.squareMeters, formData.services, formData.startTime, formData.endTime]);

  const calculatePrice = () => {
    // Base calculation
    const baseHourlyRate = 15.50; // 15,50€ per hour
    
    // Calculate duration in hours
    const startTimeParts = formData.startTime.split(':').map(part => parseInt(part, 10));
    const endTimeParts = formData.endTime.split(':').map(part => parseInt(part, 10));
    
    const startHours = startTimeParts[0] + (startTimeParts[1] / 60);
    const endHours = endTimeParts[0] + (endTimeParts[1] / 60);
    
    let duration = endHours - startHours;
    if (duration <= 0) duration = 0; // Prevent negative duration
    
    // Base price based on hours
    let basePrice = baseHourlyRate * duration;
    
    // Add price based on square meters
    const squareMeters = parseInt(formData.squareMeters, 10) || 0;
    
    // Add 20% for every 50m² above 100m²
    if (squareMeters > 100) {
      const additionalSqMeters = squareMeters - 100;
      const additionalFactor = Math.floor(additionalSqMeters / 50) * 0.2;
      basePrice += basePrice * additionalFactor;
    }
    
    // Add price based on services
    // Each premium service adds 10% to the base price
    const premiumServiceCount = formData.services.filter(service => 
      ['windows', 'laundry', 'ironing', 'dishes'].includes(service)
    ).length;
    
    basePrice += basePrice * (premiumServiceCount * 0.1);
    
    // Round to 2 decimal places
    basePrice = Math.round(basePrice * 100) / 100;
    
    // Calculate commission (15%)
    const commission = basePrice * 0.15;
    
    // Calculate total price
    const totalPrice = basePrice + commission;
    
    setPrice({
      basePrice,
      commission,
      totalPrice
    });
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = "Veuillez saisir un titre";
    if (!formData.accommodationType) errors.accommodationType = "Veuillez sélectionner un type d'hébergement";
    if (!formData.address.trim()) errors.address = "Veuillez saisir une adresse";
    if (!formData.personCount || formData.personCount < 1) errors.personCount = "Veuillez indiquer le nombre de personnes";
    if (!formData.squareMeters) errors.squareMeters = "Veuillez indiquer la superficie";
    if (formData.services.length === 0) errors.services = "Veuillez sélectionner au moins un service";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setShowPriceSummary(true);
    }
  };

  const handleConfirmSubmit = () => {
    dispatch(createListing(formData))
      .unwrap()
      .then((listing) => {
        Alert.alert(
          "Annonce publiée",
          "Votre annonce a été publiée avec succès.",
          [{ text: "OK", onPress: () => navigation.navigate('ListingDetailScreen', { listingId: listing._id }) }]
        );
      })
      .catch((err) => {
        console.error('Error creating listing:', err);
      });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
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
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <ListingForm
          formData={formData}
          onChange={handleChange}
          errors={validationErrors}
        />
        
        <View style={styles.priceSection}>
          <Text style={styles.priceSectionTitle}>Tarification estimée</Text>
          <Text style={styles.priceSectionSubtitle}>
            Le prix est calculé automatiquement en fonction de la superficie,
            des services demandés et de la durée.
          </Text>
          
          <Card style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix de base</Text>
              <Text style={styles.priceValue}>{formatCurrency(price.basePrice)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Commission (15%)</Text>
              <Text style={styles.priceValue}>{formatCurrency(price.commission)}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(price.totalPrice)}</Text>
            </View>
          </Card>
        </View>
        
        <Button 
          title="Publier l'annonce" 
          onPress={handleSubmit} 
          style={styles.submitButton}
          loading={loading}
        />
      </ScrollView>
      
      {/* Price Summary Modal */}
      {showPriceSummary && (
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
                <Text style={styles.modalItemValue}>{formData.title}</Text>
              </View>
              <View style={styles.modalItem}>
                <Text style={styles.modalItemLabel}>Type d'hébergement:</Text>
                <Text style={styles.modalItemValue}>{formData.accommodationType}</Text>
              </View>
              <View style={styles.modalItem}>
                <Text style={styles.modalItemLabel}>Superficie:</Text>
                <Text style={styles.modalItemValue}>{formData.squareMeters} m²</Text>
              </View>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Date et heure</Text>
              <View style={styles.modalItem}>
                <Text style={styles.modalItemLabel}>Date:</Text>
                <Text style={styles.modalItemValue}>
                  {formData.date.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.modalItem}>
                <Text style={styles.modalItemLabel}>Horaires:</Text>
                <Text style={styles.modalItemValue}>{formData.startTime} - {formData.endTime}</Text>
              </View>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Tarification</Text>
              <View style={styles.modalItem}>
                <Text style={styles.modalItemLabel}>Prix de base:</Text>
                <Text style={styles.modalItemValue}>{formatCurrency(price.basePrice)}</Text>
              </View>
              <View style={styles.modalItem}>
                <Text style={styles.modalItemLabel}>Commission (15%):</Text>
                <Text style={styles.modalItemValue}>{formatCurrency(price.commission)}</Text>
              </View>
              <View style={[styles.modalItem, styles.modalTotalItem]}>
                <Text style={styles.modalTotalLabel}>Total:</Text>
                <Text style={styles.modalTotalValue}>{formatCurrency(price.totalPrice)}</Text>
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
              >
                {loading ? (
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
  priceSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  priceSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  priceSectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 15,
  },
  priceCard: {
    padding: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  priceValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  submitButton: {
    marginTop: 20,
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