import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image,
  Share
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getListing, deleteListing, updateListing } from '../../redux/slices/listingsSlice';
import { getListingApplications } from '../../redux/slices/applicationsSlice';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ApplicationCard from '../../components/host/ApplicationCard';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import colors from '../../utils/colors';
import { formatDate } from '../../utils/dateUtils';

const ListingDetailScreen = ({ route, navigation }) => {
  const { listingId } = route.params;
  const dispatch = useDispatch();
  const { currentListing, loading, error } = useSelector(state => state.listings);
  const { applications, loadingApplications } = useSelector(state => state.applications);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadListingData();
  }, [dispatch, listingId]);

  const loadListingData = () => {
    dispatch(getListing(listingId));
    dispatch(getListingApplications(listingId));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([
      dispatch(getListing(listingId)),
      dispatch(getListingApplications(listingId))
    ]).finally(() => setRefreshing(false));
  };

  const handleEdit = () => {
    navigation.navigate('EditListingScreen', { listing: currentListing });
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer l'annonce",
      "Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          onPress: () => {
            dispatch(deleteListing(listingId))
              .unwrap()
              .then(() => {
                navigation.goBack();
              });
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Découvrez cette annonce de ménage : "${currentListing.title}". Rejoignez CleanConnect pour postuler !`,
        url: `https://cleanconnect.app/listings/${listingId}`
      });
    } catch (error) {
      Alert.alert('Erreur', 'Le partage a échoué');
    }
  };

  const handleCancelListing = () => {
    Alert.alert(
      "Annuler l'annonce",
      "Êtes-vous sûr de vouloir annuler cette annonce ? Les candidatures en cours seront rejetées.",
      [
        { text: "Retour", style: "cancel" },
        { 
          text: "Annuler l'annonce", 
          onPress: () => {
            dispatch(updateListing({ 
              id: listingId, 
              changes: { isCancelled: true, status: 'cancelled' } 
            }));
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleViewAllApplications = () => {
    navigation.navigate('ApplicationsScreen', { listingId });
  };

  const handleViewApplication = (applicationId) => {
    navigation.navigate('ApplicationDetailScreen', { applicationId, listingId });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getStatusBadge = (status) => {
    let statusText, statusColor, statusBgColor;
    
    switch (status) {
      case 'active':
        statusText = 'Active';
        statusColor = colors.success;
        statusBgColor = colors.successLight;
        break;
      case 'booked':
        statusText = 'Réservée';
        statusColor = colors.primary;
        statusBgColor = colors.primaryLight;
        break;
      case 'completed':
        statusText = 'Terminée';
        statusColor = colors.info;
        statusBgColor = colors.infoLight;
        break;
      case 'cancelled':
        statusText = 'Annulée';
        statusColor = colors.error;
        statusBgColor = colors.errorLight;
        break;
      default:
        statusText = 'Inconnue';
        statusColor = colors.textLight;
        statusBgColor = colors.border;
    }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>
    );
  };

  if (loading && !currentListing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!currentListing) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorMessage}>
          {error || "Impossible de charger les détails de l'annonce"}
        </Text>
        <Button 
          title="Réessayer" 
          onPress={loadListingData} 
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        {currentListing.images && currentListing.images.length > 0 ? (
          <Image 
            source={{ uri: currentListing.images[0] }} 
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="home-outline" size={60} color={colors.lightText} />
          </View>
        )}
        
        <View style={styles.headerOverlay}>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerActionButtons}>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="white" />
              </TouchableOpacity>
              
              {currentListing.status === 'active' && (
                <TouchableOpacity 
                  style={styles.headerActionButton}
                  onPress={handleEdit}
                >
                  <Ionicons name="create-outline" size={24} color="white" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{currentListing.title}</Text>
            {getStatusBadge(currentListing.status)}
          </View>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {formatDate(currentListing.date)}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {currentListing.startTime} - {currentListing.endTime}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialIcons name="square-foot" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {currentListing.squareMeters} m²
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {currentListing.personCount} {currentListing.personCount > 1 ? 'personnes' : 'personne'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="home-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {currentListing.accommodationType}
            </Text>
          </View>
        </View>
      </View>
      
      <Card style={styles.priceCard}>
        <View style={styles.priceContainer}>
          <View>
            <Text style={styles.priceLabel}>Prix total</Text>
            <Text style={styles.price}>
              {formatCurrency(currentListing.totalPrice || 0)}
            </Text>
          </View>
          
          <View style={styles.priceDetails}>
            <Text style={styles.priceDetail}>
              Service: {formatCurrency(currentListing.basePrice || 0)}
            </Text>
            <Text style={styles.priceDetail}>
              Frais: {formatCurrency(currentListing.commission || 0)}
            </Text>
          </View>
        </View>
      </Card>
      
      <Card style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Adresse</Text>
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={24} color={colors.primary} />
          <Text style={styles.address}>{currentListing.address}</Text>
        </View>
      </Card>
      
      <Card style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Services à réaliser</Text>
        <View style={styles.servicesContainer}>
          {currentListing.services && currentListing.services.map(service => (
            <View key={service} style={styles.serviceItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} style={styles.serviceIcon} />
              <Text style={styles.serviceText}>
                {service === 'basic_cleaning' && 'Ménage de base'}
                {service === 'dusting' && 'Dépoussiérage'}
                {service === 'vacuum' && 'Aspirateur'}
                {service === 'mopping' && 'Serpillière'}
                {service === 'bathroom' && 'Nettoyage salle de bain'}
                {service === 'kitchen' && 'Nettoyage cuisine'}
                {service === 'windows' && 'Nettoyage vitres'}
                {service === 'laundry' && 'Lessive'}
                {service === 'ironing' && 'Repassage'}
                {service === 'dishes' && 'Vaisselle'}
              </Text>
            </View>
          ))}
        </View>
      </Card>
      
      {currentListing.equipment && currentListing.equipment.length > 0 && (
        <Card style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Équipements fournis</Text>
          <View style={styles.servicesContainer}>
            {currentListing.equipment.map(equipment => (
              <View key={equipment} style={styles.serviceItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} style={styles.serviceIcon} />
                <Text style={styles.serviceText}>
                  {equipment === 'vacuum_cleaner' && 'Aspirateur'}
                  {equipment === 'mop' && 'Serpillière'}
                  {equipment === 'cleaning_products' && 'Produits ménagers'}
                  {equipment === 'gloves' && 'Gants'}
                  {equipment === 'washer' && 'Machine à laver'}
                  {equipment === 'dryer' && 'Sèche-linge'}
                  {equipment === 'iron' && 'Fer à repasser'}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}
      
      {currentListing.notes && (
        <Card style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{currentListing.notes}</Text>
        </Card>
      )}
      
      {currentListing.status === 'active' && (
        <Card style={styles.applicationsCard}>
          <View style={styles.applicationHeader}>
            <Text style={styles.sectionTitle}>Candidatures</Text>
            {applications && applications.length > 0 && (
              <TouchableOpacity onPress={handleViewAllApplications}>
                <Text style={styles.viewAllText}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loadingApplications ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.applicationLoading} />
          ) : applications && applications.length > 0 ? (
            <View>
              {applications.slice(0, 2).map(application => (
                <ApplicationCard 
                  key={application._id}
                  application={application}
                  onPress={() => handleViewApplication(application._id)}
                  style={styles.applicationCard}
                />
              ))}
              
              {applications.length > 2 && (
                <TouchableOpacity 
                  style={styles.moreApplicationsButton}
                  onPress={handleViewAllApplications}
                >
                  <Text style={styles.moreApplicationsText}>
                    Voir {applications.length - 2} candidature{applications.length - 2 > 1 ? 's' : ''} supplémentaire{applications.length - 2 > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyApplications}>
              <Ionicons name="people-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyApplicationsText}>
                Aucune candidature reçue pour le moment
              </Text>
            </View>
          )}
        </Card>
      )}
      
      {currentListing.status === 'active' && (
        <Button 
          title="Annuler l'annonce" 
          onPress={handleCancelListing}
          color="error"
          style={styles.cancelButton}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorMessage: {
    color: colors.error,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    width: 200,
  },
  header: {
    position: 'relative',
    height: 250,
    backgroundColor: colors.lightBackground,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: 15,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActionButtons: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 5,
    fontSize: 14,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 15,
  },
  priceCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceDetails: {
    alignItems: 'flex-end',
  },
  priceDetail: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  detailCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  address: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginLeft: 10,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  serviceIcon: {
    marginRight: 5,
  },
  serviceText: {
    fontSize: 14,
    color: colors.text,
  },
  notes: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  applicationsCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: {
    color: colors.primary,
    fontWeight: '500',
  },
  applicationLoading: {
    marginTop: 20,
    marginBottom: 20,
  },
  applicationCard: {
    marginBottom: 10,
  },
  emptyApplications: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyApplicationsText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
  moreApplicationsButton: {
    backgroundColor: colors.lightBackground,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  moreApplicationsText: {
    color: colors.primary,
    fontWeight: '500',
  },
  cancelButton: {
    marginHorizontal: 15,
  },
});

export default ListingDetailScreen;