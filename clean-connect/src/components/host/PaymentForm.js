import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, spacing, typography, shadows } from '../../utils/theme';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';
import { Ionicons } from '@expo/vector-icons';

/**
 * Payment form component for hosts to pay for cleaning services
 * @param {Object} booking - Booking data with price information
 * @param {function} onPaymentComplete - Function called on successful payment
 * @param {boolean} isLoading - Loading state for payment processing
 */
const PaymentForm = ({ booking, onPaymentComplete, isLoading = false }) => {
  const [form, setForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    // Format card number with spaces
    if (field === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    
    // Format expiry date
    if (field === 'expiryDate') {
      value = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d{0,2})/, (_, a, b) => b ? `${a}/${b}` : a);
    }
    
    // Limit CVV to 3-4 digits
    if (field === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 4);
    }
    
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate card number (should be 16 digits, spaces ignored)
    if (!form.cardNumber || form.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Numéro de carte invalide';
    }
    
    // Validate expiry date (should be MM/YY format and not expired)
    if (!form.expiryDate || !/^\d\d\/\d\d$/.test(form.expiryDate)) {
      newErrors.expiryDate = 'Date d\'expiration invalide';
    } else {
      const [month, year] = form.expiryDate.split('/');
      const expiryDate = new Date(2000 + parseInt(year, 10), parseInt(month, 10) - 1);
      if (expiryDate < new Date()) {
        newErrors.expiryDate = 'Carte expirée';
      }
    }
    
    // Validate CVV (should be 3-4 digits)
    if (!form.cvv || form.cvv.length < 3) {
      newErrors.cvv = 'CVV invalide';
    }
    
    // Validate card holder name
    if (!form.cardName || form.cardName.trim().length < 3) {
      newErrors.cardName = 'Nom du titulaire requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // In a real app, we would send payment info to a secure payment processor
      // Here we just simulate success
      setTimeout(() => {
        Alert.alert(
          'Paiement confirmé',
          'Votre paiement a été traité avec succès. Votre réservation est maintenant confirmée.'
        );
        onPaymentComplete();
      }, 1500);
    }
  };

  // Format price with commas
  const formatPrice = (price) => {
    return price.toFixed(2).replace('.', ',');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Paiement</Text>
      
      <Card style={styles.bookingSummary} noShadow>
        <Text style={styles.summaryTitle}>Résumé de la réservation</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type d'hébergement:</Text>
          <Text style={styles.summaryValue}>{booking.listing.accommodationType}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date:</Text>
          <Text style={styles.summaryValue}>{new Date(booking.listing.date).toLocaleDateString('fr-FR')}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Horaires:</Text>
          <Text style={styles.summaryValue}>{booking.listing.startTime} - {booking.listing.endTime}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Adresse:</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>{booking.listing.address}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Prix total:</Text>
          <Text style={styles.priceValue}>{formatPrice(booking.listing.price)} €</Text>
        </View>
        
        <Text style={styles.priceInfo}>
          (dont TVA: {formatPrice(booking.listing.price * 0.2)} €)
        </Text>
      </Card>
      
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Informations de paiement</Text>
        
        <View style={styles.cardTypeRow}>
          <View style={[styles.cardType, styles.cardTypeSelected]}>
            <Ionicons name="card-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTypeText}>Carte bancaire</Text>
          </View>
        </View>
        
        <Input
          label="Numéro de carte"
          value={form.cardNumber}
          onChangeText={(value) => handleInputChange('cardNumber', value)}
          placeholder="1234 5678 9012 3456"
          keyboardType="numeric"
          error={errors.cardNumber}
          maxLength={19} // 16 digits + 3 spaces
        />
        
        <View style={styles.rowFields}>
          <Input
            label="Date d'expiration"
            value={form.expiryDate}
            onChangeText={(value) => handleInputChange('expiryDate', value)}
            placeholder="MM/AA"
            keyboardType="numeric"
            error={errors.expiryDate}
            style={styles.expiryField}
            maxLength={5} // MM/YY
          />
          
          <Input
            label="CVV"
            value={form.cvv}
            onChangeText={(value) => handleInputChange('cvv', value)}
            placeholder="123"
            keyboardType="numeric"
            error={errors.cvv}
            style={styles.cvvField}
            maxLength={4}
            secureTextEntry
          />
        </View>
        
        <Input
          label="Titulaire de la carte"
          value={form.cardName}
          onChangeText={(value) => handleInputChange('cardName', value)}
          placeholder="NOM Prénom"
          autoCapitalize="characters"
          error={errors.cardName}
        />
      </View>
      
      <View style={styles.securityNote}>
        <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
        <Text style={styles.securityText}>
          Paiement sécurisé. Vos données de carte sont chiffrées.
        </Text>
      </View>
      
      <Button
        title={`Payer ${formatPrice(booking.listing.price)} €`}
        onPress={handleSubmit}
        loading={isLoading}
        style={styles.payButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  bookingSummary: {
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
  },
  summaryTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  priceLabel: {
    ...typography.body,
    fontWeight: 'bold',
  },
  priceValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  priceInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  paymentSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  cardTypeRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  cardType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  cardTypeSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10', // 10% opacity
  },
  cardTypeText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expiryField: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cvvField: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  securityText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  payButton: {
    marginBottom: spacing.xl,
  },
});

export default PaymentForm;