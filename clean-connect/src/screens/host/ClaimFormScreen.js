import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Button, TextInput, Card, Chip, List, RadioButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { submitClaim } from '../../redux/actions/hostActions';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { router } from 'expo-router'; // Importer router

const validationSchema = Yup.object().shape({
  issueType: Yup.string().required('Veuillez sélectionner un type de problème'),
  description: Yup.string().required('La description est requise').min(20, 'Description trop courte (minimum 20 caractères)'),
  claimAmount: Yup.number().when('issueType', {
    is: (type) => type === 'damage',
    then: Yup.number().required('Montant requis').min(1, 'Le montant doit être supérieur à 0'),
    otherwise: Yup.number().nullable(),
  }),
});

const ClaimFormScreen = ({ route }) => {
  const { listingId, bookingId } = route.params;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', "L'accès à la galerie de photos est nécessaire pour ajouter des images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (images.length >= 3) {
        Alert.alert('Limite atteinte', 'Vous pouvez ajouter au maximum 3 images.');
        return;
      }
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      const claimData = {
        listingId,
        bookingId,
        ...values,
        images,
      };
      
      await dispatch(submitClaim(claimData));
      
      Alert.alert(
        'Réclamation envoyée',
        'Votre réclamation a été soumise avec succès. Nous la traiterons dans les plus brefs délais.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Erreur', "Une erreur est survenue lors de l'envoi de votre réclamation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#344955" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Formulaire de réclamation</Text>
        <Text style={styles.description}>
          Veuillez fournir des détails précis concernant votre problème. Notre équipe traitera votre demande dans les plus brefs délais.
        </Text>

        <Formik
          initialValues={{
            issueType: '',
            description: '',
            claimAmount: '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Type de problème</Text>
              
              <RadioButton.Group
                onValueChange={(value) => setFieldValue('issueType', value)}
                value={values.issueType}
              >
                <View style={styles.radioOption}>
                  <RadioButton value="incomplete" color="#344955" />
                  <Text style={styles.radioLabel}>Service incomplet ou insatisfaisant</Text>
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton value="nonattendance" color="#344955" />
                  <Text style={styles.radioLabel}>Prestataire non présent</Text>
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton value="damage" color="#344955" />
                  <Text style={styles.radioLabel}>Dommage causé à votre propriété</Text>
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton value="other" color="#344955" />
                  <Text style={styles.radioLabel}>Autre problème</Text>
                </View>
              </RadioButton.Group>
              
              {touched.issueType && errors.issueType && (
                <Text style={styles.errorText}>{errors.issueType}</Text>
              )}

              {values.issueType === 'damage' && (
                <View style={styles.amountContainer}>
                  <TextInput
                    label="Montant de la réclamation (€)"
                    value={values.claimAmount}
                    onChangeText={handleChange('claimAmount')}
                    onBlur={handleBlur('claimAmount')}
                    style={styles.input}
                    keyboardType="numeric"
                    mode="outlined"
                    error={touched.claimAmount && errors.claimAmount}
                  />
                  {touched.claimAmount && errors.claimAmount && (
                    <Text style={styles.errorText}>{errors.claimAmount}</Text>
                  )}
                </View>
              )}

              <Text style={styles.sectionTitle}>Description du problème</Text>
              <TextInput
                label="Décrivez le problème en détail"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                style={styles.textArea}
                mode="outlined"
                multiline
                numberOfLines={6}
                error={touched.description && errors.description}
              />
              {touched.description && errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}

              <Text style={styles.sectionTitle}>Photos (optionnel)</Text>
              <Text style={styles.photoHelper}>
                Ajoutez jusqu'à 3 photos pour illustrer le problème.
              </Text>

              <View style={styles.imagesContainer}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image }} style={styles.image} />
                    <Button
                      icon="close"
                      mode="contained"
                      onPress={() => removeImage(index)}
                      style={styles.removeButton}
                      compact
                    >
                      Retirer
                    </Button>
                  </View>
                ))}

                {images.length < 3 && (
                  <Button
                    icon="camera"
                    mode="outlined"
                    onPress={handleImagePick}
                    style={styles.addPhotoButton}
                  >
                    Ajouter une photo
                  </Button>
                )}
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>
                  <MaterialIcons name="info" size={16} color="#0277bd" /> Informations importantes
                </Text>
                <Text style={styles.infoText}>
                  • Votre réclamation sera examinée sous 48h ouvrées.
                </Text>
                <Text style={styles.infoText}>
                  • Des justificatifs supplémentaires peuvent vous être demandés.
                </Text>
                <Text style={styles.infoText}>
                  • Le remboursement, si applicable, sera effectué via votre moyen de paiement initial.
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={loading}
                disabled={loading}
                icon="send"
              >
                Soumettre ma réclamation
              </Button>
              
              <Button
                mode="text"
                onPress={() => router.back()}
                style={styles.cancelButton}
              >
                Annuler
              </Button>
            </View>
          )}
        </Formik>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#344955',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  textArea: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  amountContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  photoHelper: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  imageContainer: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 4,
  },
  removeButton: {
    backgroundColor: '#f44336',
    marginTop: 4,
  },
  addPhotoButton: {
    width: '48%',
    height: 120,
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  infoContainer: {
    backgroundColor: '#e1f5fe',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0277bd',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#344955',
    paddingVertical: 6,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default ClaimFormScreen;