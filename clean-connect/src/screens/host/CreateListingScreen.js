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
// *** MODIFICATION: S'assurer d'importer formatPrice depuis le bon endroit ***
import { formatPrice } from '../../utils/priceCalculator'; // ou depuis formatters si déplacé
import { getErrorMessage } from '../../utils/errorHandler';

const CreateListingScreen = ({ onListingCreated, onCancel }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  // Utiliser le state loading et error du slice listings
  const { loading: listingLoading, error: listingError } = useSelector(state => state.listings);
  const [showPriceSummary, setShowPriceSummary] = useState(false);
  const [submittingListing, setSubmittingListing] = useState(false); // Garder pour le spinner du bouton Confirmer
  const [listingData, setListingData] = useState(null);

  // Le handleSubmit du formulaire met à jour listingData et ouvre la modale
  const handleSubmit = (formData) => {
    console.log("[CreateListingScreen] Form submitted, data:", formData);
    // Vérifier si formData contient bien l'objet price
    if (!formData || !formData.price || typeof formData.price.baseAmount === 'undefined') {
        console.error("[CreateListingScreen] Price data missing in submitted form data!", formData);
        Alert.alert("Erreur", "Les données de prix sont manquantes. Impossible de continuer.");
        return;
    }
    setListingData(formData);
    setShowPriceSummary(true);
  };

  // La confirmation depuis la modale déclenche l'appel API
  const handleConfirmSubmit = () => {
    if (!listingData) return;

    setSubmittingListing(true); // Activer spinner sur bouton Confirmer

    dispatch(createListing(listingData)) // listingData contient déjà le prix
      .unwrap()
      .then((newlyCreatedListing) => {
        setSubmittingListing(false);
        setShowPriceSummary(false); // Fermer la modale
        Alert.alert(
          "Annonce publiée",
          "Votre annonce a été publiée avec succès.",
          [{
            text: "OK",
            onPress: () => {
              if (onListingCreated) {
                onListingCreated(newlyCreatedListing);
              } else {
                // S'assurer que l'ID est bien récupéré
                const listingId = newlyCreatedListing?._id || newlyCreatedListing?.id;
                if (listingId) {
                    console.log(`Navigating to /(host)/listings/${listingId}`);
                    router.push(`/(host)/listings/${listingId}`);
                } else {
                    console.error("Could not get ID from created listing, navigating back.", newlyCreatedListing);
                    router.back(); // Fallback
                }
              }
            }
          }]
        );
      })
      .catch((err) => {
        setSubmittingListing(false);
        // Ne pas fermer la modale en cas d'erreur pour permettre correction
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // 'height' peut être mieux
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // Ajuster si nécessaire
      >
        {/* Mettre ScrollView à l'intérieur pour qu'il respecte le KAV */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled" // Important pour que les clics fonctionnent même si clavier ouvert
        >
          <View style={styles.header}>
            <Text style={styles.title}>Nouvelle annonce</Text>
            <Text style={styles.subtitle}>
              Créez une annonce pour trouver un professionnel de ménage
            </Text>
          </View>

          {/* Utiliser listingError ici */}
          {listingError && !showPriceSummary && ( // Afficher seulement si pas dans la modale
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{getErrorMessage(listingError)}</Text>
            </View>
          )}

          <ListingForm
            onSubmit={handleSubmit}
            // Utiliser listingLoading pour l'état initial potentiel du formulaire
            isLoading={listingLoading && !listingData} // Loading pendant le chargement initial si nécessaire
            onCancel={handleCancel} // Passer onCancel
          />
        </ScrollView>

        {/* Modale de Récapitulatif/Confirmation */}
        {showPriceSummary && listingData && listingData.price && ( // Vérifier listingData.price
          // Utiliser un composant Modal standard pour une meilleure gestion (z-index, etc.)
          // Mais pour l'instant on garde la View overlay
          <View style={styles.modalOverlay}>
            {/* Utiliser ScrollView pour le contenu si la modale peut devenir longue */}
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Card style={styles.modalContent}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowPriceSummary(false)}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>

                  <Text style={styles.modalTitle}>Récapitulatif de l'annonce</Text>

                  {/* Section Infos */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Informations générales</Text>
                    <View style={styles.modalItem}>
                      <Text style={styles.modalItemLabel}>Titre:</Text>
                      <Text style={styles.modalItemValue} numberOfLines={1}>{listingData.title}</Text>
                    </View>
                    <View style={styles.modalItem}>
                        <Text style={styles.modalItemLabel}>Type:</Text>
                        {/* Afficher le label correspondant à la value */}
                        <Text style={styles.modalItemValue}>
                            {ACCOMMODATION_TYPES.find(t => t.value === listingData.accommodationType)?.label || listingData.accommodationType}
                        </Text>
                    </View>
                     <View style={styles.modalItem}>
                      <Text style={styles.modalItemLabel}>Adresse:</Text>
                      <Text style={styles.modalItemValue} numberOfLines={2}>{`${listingData.address || ''}, ${listingData.postalCode || ''} ${listingData.city || ''}`.trim()}</Text>
                    </View>
                    <View style={styles.modalItem}>
                      <Text style={styles.modalItemLabel}>Superficie:</Text>
                      {/* S'assurer d'afficher la bonne clé (area ou squareMeters) */}
                      <Text style={styles.modalItemValue}>{listingData.squareMeters || listingData.area || 'N/A'} m²</Text>
                    </View>
                  </View>

                  {/* Section Date/Heure */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Date et heure</Text>
                    <View style={styles.modalItem}>
                      <Text style={styles.modalItemLabel}>Date:</Text>
                      <Text style={styles.modalItemValue}>
                        {listingData.date ? new Date(listingData.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.modalItem}>
                      <Text style={styles.modalItemLabel}>Horaires:</Text>
                      <Text style={styles.modalItemValue}>
                        {listingData.startTime || 'N/A'} - {listingData.endTime || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Section Tarification */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Tarification Estimée</Text>
                    <View style={styles.modalItem}>
                      <Text style={styles.modalItemLabel}>Prix de base (HT):</Text>
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
                      <Text style={styles.modalTotalLabel}>Total Estimé (TTC):</Text>
                      <Text style={styles.modalTotalValue}>
                        {formatPrice(listingData.price.totalAmount)}
                      </Text>
                    </View>
                  </View>

                  {/* Boutons Modale */}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonCancel]}
                      onPress={() => setShowPriceSummary(false)} // Simplement fermer pour modifier
                      disabled={submittingListing} // Désactiver pendant la soumission
                    >
                      <Text style={styles.modalButtonCancelText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonConfirm]}
                      onPress={handleConfirmSubmit} // Utilise listingData du state
                      disabled={submittingListing}
                    >
                      {submittingListing ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.modalButtonConfirmText}>Confirmer et Publier</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </Card>
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
};

// Styles (ajout de fallback pour errorBackground et ajustements)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60, // Plus d'espace en bas
    flexGrow: 1, // Important pour KAV avec ScrollView
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
    color: colors.textSecondary || '#6c757d',
  },
  errorContainer: {
    backgroundColor: colors.errorBackground || 'rgba(229, 57, 53, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: colors.error || '#E53935',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Un peu plus sombre
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingVertical: 40, // Espace haut/bas
  },
  modalContent: {
    width: '90%',
    // maxHeight: '90%', // Retirer max-height pour laisser ScrollView gérer
    padding: 20,
    position: 'relative',
    backgroundColor: colors.card || '#F8F9FA',
    borderRadius: 8,
    elevation: 5, // Ombre Android
    shadowColor: '#000', // Ombre iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 5,
    // backgroundColor: 'rgba(0,0,0,0.1)', // Cercle léger pour mieux voir
    // borderRadius: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 15, // Moins d'espace entre sections
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600', // Un peu moins gras
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
    alignItems: 'flex-start',
  },
  modalItemLabel: {
    fontSize: 14,
    color: colors.textSecondary || '#6c757d',
    marginRight: 8,
    flexBasis: '40%', // Donner une largeur au label
    flexShrink: 0,
  },
  modalItemValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1, // Permettre retour à la ligne
    flexGrow: 1,
  },
  modalTotalItem: {
    marginTop: 10,
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
    justifyContent: 'space-between', // Espace égal
    marginTop: 25, // Plus d'espace avant boutons
    gap: 10,
  },
  modalButton: {
    flex: 1, // Pour qu'ils prennent la même largeur
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
    borderColor: colors.primary, // Utiliser couleur primaire pour bordure
    backgroundColor: 'transparent',
  },
  modalButtonCancelText: {
    color: colors.primary, // Utiliser couleur primaire pour texte
    fontWeight: 'bold',
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

// Ajouter une fonction de transformation pour s'assurer que les labels sont utilisés dans la modale
const ACCOMMODATION_TYPES = [ { value: 'apartment', label: 'Appartement' }, { value: 'house', label: 'Maison' },{ value: 'studio', label: 'Studio' }, { value: 'loft', label: 'Loft' },{ value: 'villa', label: 'Villa' }, { value: 'hotel_room', label: "Chambre d'hôtel" },{ value: 'other', label: 'Autre' } ];


export default CreateListingScreen;
