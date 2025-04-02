// src/screens/cleaner/EditCleanerDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { colors, spacing, typography } from '../../../src/utils/theme';

// Importer l'action et les sélecteurs nécessaires
import {
  updateMyCleanerData,
  selectUserProfile, // Pour pré-remplir
  selectUserLoading,
  selectUserError,
  selectUserUpdateStatus,
  clearUserError, // Pour effacer les erreurs
  clearUpdateStatus // Pour réinitialiser le statut
} from '../../redux/slices/userSlice';

const EditCleanerDetailsScreen = () => {
  const dispatch = useDispatch();
  const profile = useSelector(selectUserProfile);
  const isLoading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  const updateStatus = useSelector(selectUserUpdateStatus);

  const [formData, setFormData] = useState({
    companyName: '', // Nom d'entreprise si applicable
    siret: '',
    iban: '',
    description: '', // Bio/Description
    // Ajouter d'autres champs spécifiques si nécessaire
  });

  useEffect(() => {
    // Pré-remplir le formulaire avec les données existantes
    if (profile) {
      setFormData({
        companyName: profile.businessDetails?.companyName || profile.companyName || '',
        siret: profile.businessDetails?.siret || '',
        iban: profile.bankAccount?.iban || profile.iban || '', // Vérifier la structure exacte
        description: profile.description || ''
      });
    }
    // Nettoyer le statut de mise à jour au montage
    dispatch(clearUpdateStatus());
    dispatch(clearUserError());
  }, [profile, dispatch]);

  // Effet pour gérer la redirection après succès
  useEffect(() => {
    if (updateStatus === 'success') {
      Alert.alert('Succès', 'Vos informations ont été mises à jour.');
      dispatch(clearUpdateStatus()); // Réinitialiser le statut
      router.back(); // Revenir à l'écran précédent
    }
    if (updateStatus === 'failed' && error) {
        Alert.alert('Erreur', `La mise à jour a échoué: ${error}`);
        dispatch(clearUpdateStatus()); // Réinitialiser aussi en cas d'échec
        dispatch(clearUserError());
    }
  }, [updateStatus, error, dispatch, router]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Préparer les données à envoyer au backend
    const cleanerData = {
      businessDetails: {
        companyName: formData.companyName,
        siret: formData.siret
      },
      bankAccount: {
        iban: formData.iban
      },
      description: formData.description
      // Ajouter d'autres champs si nécessaire
    };
    // Nettoyer les objets vides si certains champs ne sont pas remplis
    if(!cleanerData.businessDetails.companyName && !cleanerData.businessDetails.siret) delete cleanerData.businessDetails;
    if(!cleanerData.bankAccount.iban) delete cleanerData.bankAccount;
    if(!cleanerData.description) delete cleanerData.description;

    console.log("Données envoyées à updateMyCleanerData:", cleanerData);
    if (Object.keys(cleanerData).length > 0) {
        dispatch(updateMyCleanerData(cleanerData));
    } else {
        Alert.alert("Info", "Aucune modification détectée.");
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Informations Professionnelles</Text>

      {/* Afficher l'erreur générale du slice si présente */}
      {/* {error && updateStatus !== 'failed' && <Text style={styles.errorText}>{error}</Text>} */} 

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Entreprise</Text>
        <Input
          label="Nom de société (Optionnel)"
          value={formData.companyName}
          onChangeText={(value) => handleChange('companyName', value)}
          placeholder="Nom officiel si applicable"
          style={styles.input}
        />
         <Input
          label="SIRET"
          value={formData.siret}
          onChangeText={(value) => handleChange('siret', value)}
          placeholder="Votre numéro SIRET (14 chiffres)"
          keyboardType="numeric"
          maxLength={14}
          style={styles.input}
        />
      </Card>

      <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Bancaires (pour paiements)</Text>
          <Input
            label="IBAN"
            value={formData.iban}
            onChangeText={(value) => handleChange('iban', value)}
            placeholder="FR76 XXXX XXXX XXXX XXXX XXX"
            autoCapitalize="characters"
            style={styles.input}
          />
        </Card>
        
      <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Description / Bio</Text>
          <Input
            label="Présentez-vous (Optionnel)"
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            placeholder="Décrivez votre expérience, vos spécialités..."
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
          />
        </Card>

      <View style={styles.buttonContainer}>
        <Button 
          title="Annuler" 
          onPress={() => router.back()} 
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
          outline
        />
        <Button 
          title="Enregistrer" 
          onPress={handleSubmit} 
          loading={isLoading && updateStatus === 'pending'} // Afficher loading pendant la mise à jour
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
};

// Styles (Similaires à EditProfileScreen, ajuster si besoin)
let styles = {};
try {
    styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background || '#f8f9fa' },
      title: { ...typography.h2, fontWeight: 'bold', color: colors.text, marginBottom: spacing.lg || 20, paddingHorizontal: spacing.md || 15, paddingTop: spacing.md || 15 },
      errorText: { color: colors.error || 'red', paddingHorizontal: spacing.md || 15, marginBottom: spacing.sm || 10, textAlign: 'center' },
      section: { marginHorizontal: spacing.md || 15, marginBottom: spacing.lg || 20, padding: spacing.md || 15, borderRadius: 8, backgroundColor:'white' },
      sectionTitle: { ...typography.h3, fontWeight: 'bold', marginBottom: spacing.md || 15, color: colors.text },
      input: { marginBottom: spacing.md || 15 },
      textArea: { height: 100, textAlignVertical: 'top' }, // Style pour multiline
      buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.lg || 20, marginHorizontal: spacing.md || 15 },
      cancelButton: { flex: 1, marginRight: spacing.sm || 10, backgroundColor: 'white', borderColor: colors.primary || 'blue' },
      cancelButtonText: { color: colors.primary || 'blue' },
      saveButton: { flex: 1, marginLeft: spacing.sm || 10 },
    });
} catch (themeError) {
     console.error("Erreur style EditCleanerDetailsScreen:", themeError);
     styles = StyleSheet.create({ container:{flex:1}, title:{fontSize:20, fontWeight:'bold'}, errorText:{color:'red'}, section:{margin:15, padding:15}, sectionTitle:{fontSize:18, fontWeight:'bold', marginBottom:15}, input:{marginBottom:15}, textArea:{}, buttonContainer:{flexDirection:'row', margin:15}, cancelButton:{flex:1, marginRight:10}, cancelButtonText:{}, saveButton:{flex:1, marginLeft:10} });
}

export default EditCleanerDetailsScreen;
