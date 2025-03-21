import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import colors from '../../../../src/utils/colors';
import Card from '../../../../src/components/common/Card';
import ApiErrorDisplay from '../../../../src/components/common/ApiErrorDisplay';
import Button from '../../../../src/components/common/Button';
import { getListingDetails, applyToListing, clearListingErrors } from '../../../../src/redux/slices/listingsSlice';
import { formatDateTime, formatCurrency } from '../../../../src/utils/formatters';
import ListingDetailsSection from '../../../../src/components/listings/ListingDetailsSection';
import AddressDisplayCard from '../../../../src/components/listings/AddressDisplayCard';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);
  
  const { currentListing, loading, error } = useSelector(state => state.listings);
  const user = useSelector(state => state.user.user || state.auth.user);

  // Load listing details
  useEffect(() => {
    dispatch(clearListingErrors());
    dispatch(getListingDetails(id));
  }, [dispatch, id]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(clearListingErrors());
    dispatch(getListingDetails(id)).finally(() => {
      setRefreshing(false);
    });
  };

  const handleApply = async () => {
    if (!user?.isVerified) {
      Alert.alert(
        "Profil incomplet",
        "Pour postuler à des missions, vous devez compléter votre profil et vérifier votre identité.",
        [
          {
            text: "Compléter mon profil",
            onPress: () => router.push('/(cleaner)/profile'),
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
      return;
    }
    
    setApplying(true);
    try {
      await dispatch(applyToListing(id)).unwrap();
      Alert.alert(
        "Candidature envoyée",
        "Votre candidature a bien été envoyée. L'hôte vous contactera s'il est intéressé.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue lors de l'envoi de votre candidature.");
    } finally {
      setApplying(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvre cette mission de nettoyage: ${currentListing?.title} sur CleanConnect`,
        url: `https://cleanconnect.app/listings/${id}`,
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de partager cette mission.");
    }
  };

  const navigateBack = () => {
    router.back();
  };

  if (loading && !refreshing && !currentListing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <ApiErrorDisplay 
        error={error} 
        onRetry={() => {
          dispatch(clearListingErrors());
          dispatch(getListingDetails(id));
        }}
        message="Impossible de charger les détails de la mission"
      />
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={navigateBack}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {currentListing && (
        <View style={styles.content}>
          <Card style={styles.mainCard}>
            <Text style={styles.title}>{currentListing.title}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatCurrency(currentListing.price)}</Text>
            </View>

            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={18} color={colors.text} />
              <Text style={styles.dateText}>
                {formatDateTime(currentListing.startDate)}
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Statut:</Text>
              <View style={[styles.statusBadge, { backgroundColor: currentListing.status === 'open' ? colors.success : colors.warning }]}>
                <Text style={styles.statusText}>
                  {currentListing.status === 'open' ? 'Disponible' : 'Non disponible'}
                </Text>
              </View>
            </View>

            {currentListing.hasApplied && (
              <View style={styles.appliedBanner}>
                <MaterialIcons name="check-circle" size={20} color={colors.white} />
                <Text style={styles.appliedText}>Vous avez postulé à cette mission</Text>
              </View>
            )}
          </Card>

          <AddressDisplayCard 
            address={currentListing.address} 
            style={styles.sectionCard}
            displayOnly
          />

          <ListingDetailsSection 
            listing={currentListing}
            style={styles.sectionCard}
          />

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{currentListing.description}</Text>
          </Card>

          {!currentListing.hasApplied && currentListing.status === 'open' && (
            <Button
              title={applying ? "Envoi en cours..." : "Postuler à cette mission"}
              onPress={handleApply}
              loading={applying}
              style={styles.applyButton}
              disabled={applying || currentListing.status !== 'open'}
            />
          )}

          {currentListing.hasApplied && (
            <Card style={styles.appliedCard}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <Text style={styles.appliedCardText}>
                Vous avez déjà postulé à cette mission. L'hôte vous contactera s'il accepte votre candidature.
              </Text>
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  mainCard: {
    marginBottom: 16,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: colors.white,
    fontWeight: '500',
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  applyButton: {
    marginVertical: 16,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  appliedText: {
    color: colors.white,
    fontWeight: '500',
    marginLeft: 8,
  },
  appliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.surfaceVariant,
  },
  appliedCardText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
});