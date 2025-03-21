import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Button, TextInput, Card, Title, Paragraph, RadioButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApplicationDetail, processPayment } from '../../redux/actions/hostActions';
import { MaterialIcons } from '@expo/vector-icons';

const PaymentScreen = ({ route, navigation }) => {
  const { applicationId, listingId } = route.params;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [application, setApplication] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadApplicationDetail = async () => {
      try {
        const result = await dispatch(fetchApplicationDetail(applicationId));
        setApplication(result);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de charger les détails de la réservation');
      } finally {
        setLoading(false);
      }
    };

    loadApplicationDetail();
  }, [dispatch, applicationId]);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (paymentMethod === 'creditCard') {
      if (!cardNumber || cardNumber.length < 16) {
        newErrors.cardNumber = 'Numéro de carte invalide';
        isValid = false;
      }
      
      if (!expiryDate || !expiryDate.match(/^\d{2}\/\d{2}$/)) {
        newErrors.expiryDate = 'Format date invalide (MM/AA)';
        isValid = false;
      }
      
      if (!cvv || cvv.length < 3) {
        newErrors.cvv = 'Code de sécurité invalide';
        isValid = false;
      }
      
      if (!nameOnCard) {
        newErrors.nameOnCard = 'Nom du titulaire requis';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    
    setProcessing(true);
    try {
      await dispatch(processPayment({
        applicationId,
        listingId,
        paymentMethod,
        paymentDetails: paymentMethod === 'creditCard' ? {
          cardNumber,
          expiryDate,
          cvv,
          nameOnCard
        } : {}
      }));
      
      Alert.alert(
        'Paiement réussi',
        'Votre paiement a été traité avec succès. La réservation est confirmée.',
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
      );
    } catch (error) {
      Alert.alert('Erreur', "Une erreur s'est produite lors du traitement du paiement");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#344955" />
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Impossible de charger les détails de la réservation</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          Retour
        </Button>
      </View>
    );
  }

  const totalAmount = application.listing?.price || 0;
  const serviceFee = totalAmount * 0.10; // 10% service fee
  const totalWithFees = totalAmount + serviceFee;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Résumé de la réservation</Title>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Prestation :</Text>
              <Text style={styles.summaryValue}>{application.listing?.title || 'N/A'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Prestataire :</Text>
              <Text style={styles.summaryValue}>
                {`${application.cleaner?.firstName || ''} ${application.cleaner?.lastName || ''}`}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date :</Text>
              <Text style={styles.summaryValue}>{application.listing?.date || 'N/A'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Adresse :</Text>
              <Text style={styles.summaryValue}>{application.listing?.address || 'N/A'}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Prix de la prestation :</Text>
              <Text style={styles.summaryValue}>{totalAmount.toFixed(2)} €</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frais de service (10%) :</Text>
              <Text style={styles.summaryValue}>{serviceFee.toFixed(2)} €</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.totalLabel]}>Total à payer :</Text>
              <Text style={[styles.summaryValue, styles.totalValue]}>{totalWithFees.toFixed(2)} €</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.paymentCard}>
          <Card.Content>
            <Title style={styles.paymentTitle}>Méthode de paiement</Title>
            
            <RadioButton.Group onValueChange={value => setPaymentMethod(value)} value={paymentMethod}>
              <View style={styles.radioOption}>
                <RadioButton value="creditCard" color="#344955" />
                <Text style={styles.radioLabel}>Carte de crédit</Text>
                <MaterialIcons name="credit-card" size={24} color="#344955" style={styles.radioIcon} />
              </View>
              
              <View style={styles.radioOption}>
                <RadioButton value="paypal" color="#344955" />
                <Text style={styles.radioLabel}>PayPal</Text>
                <MaterialIcons name="payment" size={24} color="#344955" style={styles.radioIcon} />
              </View>
            </RadioButton.Group>

            {paymentMethod === 'creditCard' && (
              <View style={styles.cardForm}>
                <TextInput
                  label="Numéro de carte"
                  value={cardNumber}
                  onChangeText={text => setCardNumber(text.replace(/[^0-9]/g, ''))}
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={16}
                  error={errors.cardNumber}
                  mode="outlined"
                />
                {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
                
                <View style={styles.rowInputs}>
                  <TextInput
                    label="Date d'expiration (MM/AA)"
                    value={expiryDate}
                    onChangeText={text => {
                      const formatted = text.replace(/[^0-9]/g, '');
                      if (formatted.length <= 2) {
                        setExpiryDate(formatted);
                      } else {
                        setExpiryDate(`${formatted.slice(0, 2)}/${formatted.slice(2, 4)}`);
                      }
                    }}
                    style={[styles.input, styles.smallInput]}
                    keyboardType="numeric"
                    maxLength={5}
                    error={errors.expiryDate}
                    mode="outlined"
                  />
                  
                  <TextInput
                    label="CVV"
                    value={cvv}
                    onChangeText={text => setCvv(text.replace(/[^0-9]/g, ''))}
                    style={[styles.input, styles.smallInput]}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    error={errors.cvv}
                    mode="outlined"
                  />
                </View>
                
                {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}
                {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
                
                <TextInput
                  label="Nom du titulaire"
                  value={nameOnCard}
                  onChangeText={setNameOnCard}
                  style={styles.input}
                  error={errors.nameOnCard}
                  mode="outlined"
                />
                {errors.nameOnCard && <Text style={styles.errorText}>{errors.nameOnCard}</Text>}
              </View>
            )}

            {paymentMethod === 'paypal' && (
              <View style={styles.paypalContainer}>
                <Paragraph style={styles.paypalText}>
                  Vous serez redirigé vers PayPal pour finaliser votre paiement de {totalWithFees.toFixed(2)} €.
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>

        <Text style={styles.securityNote}>
          <MaterialIcons name="lock" size={16} color="#666" /> Toutes les transactions sont sécurisées et cryptées.
        </Text>

        <Button
          mode="contained"
          onPress={handlePayment}
          style={styles.payButton}
          loading={processing}
          disabled={processing}
          icon="credit-card-check"
        >
          Payer {totalWithFees.toFixed(2)} €
        </Button>
        
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={processing}
        >
          Annuler
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    marginBottom: 10,
    marginLeft: 5,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#344955',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#344955',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#344955',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  paymentCard: {
    marginBottom: 16,
    elevation: 2,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#344955',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  radioIcon: {
    marginLeft: 'auto',
  },
  cardForm: {
    marginTop: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallInput: {
    width: '48%',
  },
  paypalContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
  },
  paypalText: {
    fontSize: 16,
    textAlign: 'center',
  },
  securityNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  payButton: {
    marginBottom: 12,
    paddingVertical: 6,
    backgroundColor: '#344955',
  },
  cancelButton: {
    marginBottom: 24,
  },
  button: {
    width: '50%',
  },
});

export default PaymentScreen;