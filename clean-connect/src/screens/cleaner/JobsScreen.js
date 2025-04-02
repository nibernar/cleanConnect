import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';

// Importer l'action et les sélecteurs Redux corrigés
import {
  fetchMyBookings, // Utiliser l'action qui est réellement exportée
  selectAllBookings, // Utiliser le sélecteur correct pour la liste
  selectBookingsLoading,
  selectBookingsError
  /* clearErrors */ // S'assurer que clearErrors existe et est exporté si utilisé
} from '../../redux/slices/bookingsSlice';

// Importer le composant Card (adapter le chemin si nécessaire)
// import BookingCard from '../../components/cleaner/BookingCard'; // COMMENTÉ - N'existe pas ici
// Ou utiliser une Card générique si BookingCard n'existe pas
// import Card from '../../components/common/Card'; // Décommenter si un Card générique est utilisé

import ApiErrorDisplay from '../../components/common/ApiErrorDisplay';
import colors from '../../utils/colors'; // Assurez-vous que ce fichier existe et est correct

const JobsScreen = () => {
  const dispatch = useDispatch();
  const router = useRouter(); // Hook pour la navigation

  // Utiliser les sélecteurs correctement importés
  const bookings = useSelector(selectAllBookings); // <- Corrigé
  const loading = useSelector(selectBookingsLoading);
  const error = useSelector(selectBookingsError);
  const [refreshing, setRefreshing] = React.useState(false);

  // Fonction pour charger les données
  const loadBookings = useCallback(() => {
    // Optionnel : Dispatch clearErrors() si elle existe et est importée
    dispatch(fetchMyBookings()); // <- Utiliser la bonne action
  }, [dispatch]);

  // Charger les données au montage de l'écran
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Fonction pour gérer le "tirer pour rafraîchir"
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
    // Arrêter l'indicateur de rafraîchissement une fois le chargement terminé (même en cas d'erreur)
    // Note: Redux Toolkit Query ou un middleware gère souvent cela automatiquement.
    // Ici, on peut le faire manuellement, mais c'est mieux si la slice gère la fin du loading.
    // Pour simplifier, on suppose que 'loading' passera à false via Redux.
    // On attend la fin de l'état loading venant de Redux.
  }, [loadBookings]);

  // Surveiller la fin du chargement pour arrêter le rafraîchissement
  useEffect(() => {
    if (!loading) {
      setRefreshing(false);
    }
  }, [loading]);

  // Fonction pour naviguer vers le détail d'une mission
  const handleNavigateToDetails = (bookingId) => {
    if (bookingId) {
      // Adapter la route si nécessaire. '/bookings/' est une supposition logique.
      router.push(`/(cleaner)/bookings/${bookingId}`);
      console.log(`Navigating to details for booking: ${bookingId}`); // Log pour débogage
    } else {
      console.warn('Attempted to navigate with invalid bookingId');
    }
  };

  // Rendu d'un élément de la liste
  const renderBookingItem = ({ item }) => {
    // Utiliser le rendu simple car BookingCard n'existe pas dans cleaner/
    return (
      <TouchableOpacity onPress={() => handleNavigateToDetails(item._id)}>
        {/* Vous pouvez encapsuler ceci dans un composant Card générique si vous en avez un */}
        {/* <Card style={styles.simpleBookingCard}> */}
        <View style={styles.simpleBookingCard}>
          <Text style={styles.bookingTitle}>{item.listing?.title || 'Titre non disponible'}</Text>
          {/* Vérifier l'existence de startTime avant de formater */}
          <Text>Date: {item.startTime ? new Date(item.startTime).toLocaleDateString('fr-FR') : 'Non définie'}</Text>
          <Text>Statut: {item.status || 'Inconnu'}</Text>
          {/* Ajouter d'autres détails si nécessaire, ex: adresse partielle, heure */}
          {item.listing?.address?.city && <Text>Ville: {item.listing.address.city}</Text>}
        </View>
        {/* </Card> */}
      </TouchableOpacity>
    );
  };

  // Rendu conditionnel basé sur l'état de chargement et d'erreur
  const renderContent = () => {
    if (loading && !refreshing) {
      return <ActivityIndicator size="large" color={colors.primary} style={styles.centered} />;
    }

    if (error && !refreshing) {
      return (
        <ApiErrorDisplay
          error={error}
          onRetry={loadBookings}
          message="Impossible de charger les missions."
        />
      );
    }

    // S'assurer que bookings est un tableau avant de vérifier sa longueur
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Vous n'avez aucune mission confirmée pour le moment.</Text>
        </View>
      );
    }
    
    // Trier les réservations par date de début (du plus proche au plus lointain)
    // S'assurer que startTime existe avant de trier
     const sortedBookings = [...bookings]
       .filter(b => b.startTime) // Filtrer ceux sans startTime pour éviter les erreurs
       .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Afficher aussi ceux sans date, mais à la fin (ou au début)
    const bookingsWithoutDate = bookings.filter(b => !b.startTime);
    const finalBookingList = [...sortedBookings, ...bookingsWithoutDate];


    return (
      <FlatList
        data={finalBookingList} // Utiliser la liste triée et filtrée
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id || `booking-${Math.random()}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Missions</Text>
      {renderContent()}
    </View>
  );
};

// Styles (légèrement ajustés pour la carte simple)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#f8f9fa', // Couleur de fond par défaut
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text || '#333',
    padding: 16,
    paddingBottom: 10,
    textAlign: 'center',
    backgroundColor: 'white', // Fond blanc pour le titre
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#eee',
  },
  listContainer: {
    paddingVertical: 10,
    // paddingHorizontal: 8, // Pas nécessaire si la carte prend toute la largeur
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight || '#888',
    textAlign: 'center',
  },
  // Styles pour la carte simple
  simpleBookingCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16, // Ajouter un peu d'espace horizontal
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8, // Augmenter l'espace
    color: colors.text || '#333',
  },
});

export default JobsScreen;