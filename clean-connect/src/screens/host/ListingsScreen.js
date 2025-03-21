import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getListings, deleteListing } from '../../redux/slices/listingsSlice';
import ListingCard from '../../components/host/ListingCard';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';

const ListingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { listings, loading, error } = useSelector(state => state.listings);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  useEffect(() => {
    loadListings();
  }, [dispatch]);

  const loadListings = () => {
    dispatch(getListings());
  };

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(getListings()).finally(() => setRefreshing(false));
  };

  const handleCreateListing = () => {
    navigation.navigate('CreateListingScreen');
  };

  const handleListingPress = (listingId) => {
    navigation.navigate('ListingDetailScreen', { listingId });
  };

  const handleDeleteListing = (listingId) => {
    Alert.alert(
      "Supprimer l'annonce",
      "Êtes-vous sûr de vouloir supprimer cette annonce ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          onPress: () => {
            dispatch(deleteListing(listingId));
          },
          style: "destructive"
        }
      ]
    );
  };

  const filteredListings = () => {
    switch (filter) {
      case 'active':
        return listings.filter(listing => 
          !listing.isCompleted && !listing.isCancelled);
      case 'completed':
        return listings.filter(listing => 
          listing.isCompleted || listing.isCancelled);
      default:
        return listings;
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={70} color={colors.textLight} />
      <Text style={styles.emptyTitle}>Aucune annonce</Text>
      <Text style={styles.emptyText}>
        Vous n'avez pas encore publié d'annonces.
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateListing}
      >
        <Text style={styles.createButtonText}>Créer une annonce</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListingItem = ({ item }) => (
    <ListingCard 
      listing={item}
      onPress={() => handleListingPress(item._id)}
      onDelete={() => handleDeleteListing(item._id)}
      showActions
      style={styles.listingCard}
    />
  );

  if (loading && !refreshing && listings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes annonces</Text>
        <TouchableOpacity 
          style={styles.createListingButton}
          onPress={handleCreateListing}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createListingText}>Nouvelle</Text>
        </TouchableOpacity>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadListings} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('all')}
        >
          <Text 
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'active' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('active')}
        >
          <Text 
            style={[
              styles.filterButtonText,
              filter === 'active' && styles.filterButtonTextActive
            ]}
          >
            Actives
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'completed' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('completed')}
        >
          <Text 
            style={[
              styles.filterButtonText,
              filter === 'completed' && styles.filterButtonTextActive
            ]}
          >
            Terminées
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredListings()}
        keyExtractor={item => item._id}
        renderItem={renderListingItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={
          filteredListings().length === 0 ? styles.listEmptyContent : styles.listContent
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  createListingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  createListingText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: colors.errorBackground,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: 10,
  },
  retryButton: {
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterButtonActive: {
    borderBottomColor: colors.primary,
  },
  filterButtonText: {
    color: colors.textLight,
  },
  filterButtonTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listingCard: {
    marginBottom: 15,
  },
});

export default ListingsScreen;