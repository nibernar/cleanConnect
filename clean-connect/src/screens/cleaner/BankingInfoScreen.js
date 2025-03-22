import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { updateBankingInfo, fetchBankingInfo } from '../../redux/actions/userActions';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { router } from 'expo-router'; // Importer router depuis expo-router

const validationSchema = Yup.object().shape({
  accountName: Yup.string().required('Nom du titulaire requis'),
  iban: Yup.string().required('IBAN requis').min(15, 'IBAN invalide'),
  bic: Yup.string().required('BIC requis').min(8, 'BIC invalide'),
  bankName: Yup.string().required('Nom de la banque requis'),
});

const BankingInfoScreen = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.auth);
  const [initialValues, setInitialValues] = useState({
    accountName: '',
    iban: '',
    bic: '',
    bankName: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBankingInfo = async () => {
      try {
        const bankingInfo = await dispatch(fetchBankingInfo(user.id));
        if (bankingInfo) {
          setInitialValues({
            accountName: bankingInfo.accountName || '',
            iban: bankingInfo.iban || '',
            bic: bankingInfo.bic || '',
            bankName: bankingInfo.bankName || '',
          });
        }
      } catch (error) {
        console.error('Error loading banking info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBankingInfo();
  }, [dispatch, user.id]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(updateBankingInfo(user.id, values));
      Alert.alert(
        'Succès',
        'Vos informations bancaires ont été mises à jour avec succès.',
        [{ text: 'OK', onPress: () => router.back() }] // Remplacer navigation.goBack() par router.back()
      );
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour de vos informations bancaires.');
    }
  };

  if (isLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#344955" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Informations Bancaires</Text>
        <Text style={styles.description}>
          Ces informations sont nécessaires pour recevoir vos paiements pour les services de nettoyage effectués.
        </Text>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <TextInput
                label="Nom du titulaire du compte"
                value={values.accountName}
                onChangeText={handleChange('accountName')}
                onBlur={handleBlur('accountName')}
                style={styles.input}
                mode="outlined"
                error={touched.accountName && errors.accountName}
              />
              {touched.accountName && errors.accountName && (
                <Text style={styles.errorText}>{errors.accountName}</Text>
              )}

              <TextInput
                label="IBAN"
                value={values.iban}
                onChangeText={handleChange('iban')}
                onBlur={handleBlur('iban')}
                style={styles.input}
                mode="outlined"
                error={touched.iban && errors.iban}
                autoCapitalize="characters"
              />
              {touched.iban && errors.iban && (
                <Text style={styles.errorText}>{errors.iban}</Text>
              )}

              <TextInput
                label="BIC / SWIFT"
                value={values.bic}
                onChangeText={handleChange('bic')}
                onBlur={handleBlur('bic')}
                style={styles.input}
                mode="outlined"
                error={touched.bic && errors.bic}
                autoCapitalize="characters"
              />
              {touched.bic && errors.bic && (
                <Text style={styles.errorText}>{errors.bic}</Text>
              )}

              <TextInput
                label="Nom de la banque"
                value={values.bankName}
                onChangeText={handleChange('bankName')}
                onBlur={handleBlur('bankName')}
                style={styles.input}
                mode="outlined"
                error={touched.bankName && errors.bankName}
              />
              {touched.bankName && errors.bankName && (
                <Text style={styles.errorText}>{errors.bankName}</Text>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                Enregistrer
              </Button>
            </View>
          )}
        </Formik>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Traitement des paiements</Text>
          <Text style={styles.infoText}>
            Les paiements sont généralement traités dans un délai de 3 à 5 jours ouvrables après la validation du service par le client.
          </Text>
          <Text style={styles.infoText}>
            Toutes vos informations bancaires sont cryptées et sécurisées conformément aux normes en vigueur.
          </Text>
        </View>
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
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#344955',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    color: '#555',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#344955',
    paddingVertical: 6,
  },
  infoContainer: {
    backgroundColor: '#e1f5fe',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0277bd',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
});

export default BankingInfoScreen;
