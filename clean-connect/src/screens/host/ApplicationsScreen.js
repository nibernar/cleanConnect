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
import { 
  getListingApplications, 
  getApplicationById, 
  acceptApplication, 
  rejectApplication 
} from '../../redux/slices/applicationsSlice';
import { getListing } from '../../redux/slices/listingsSlice';
import ApplicationCard from '../../components/host/ApplicationCard';
import PaymentForm from '../../components/host/PaymentForm';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Rating from '../../components/common/Rating';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';

const ApplicationsScreen = ({ route, navigation }) => {
  const { listingId } = route.params || {};
  const dispatch = useDispatch();
  const { applications, currentApplication, loading, error } = useSelector(state => state.applications);
  const { currentListing } = useSelector(state => state.listings);
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'pending', 'accepted', 'rejected'
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [dispatch, listingId]);

  const loadData = () => {
    if (listingId) {
      dispatch(getListingApplications(listingId));
      dispatch(getListing(listingId));
    } else {
      // Load all applications across listings if no listingId provided
      dispatch(getListingApplications());
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  };

  const handleApplicationPress = (applicationId) => {
    dispatch(getApplicationById(applicationId))
      .unwrap()
      .then(() => {
        setSelectedApplicationId(applicationId);
      });
  };

  const handleAcceptApplication = (applicationId) => {
    Alert.alert(
      "Accepter la candidature",
      "Êtes-vous sûr de vouloir accepter cette candidature ? Vous devrez effectuer le paiement pour confirmer la réservation.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Accepter", 
          onPress: () => {
            dispatch(acceptApplication(applicationId))
              .unwrap()
              .then(() => {
                setSelectedApplicationId(null);
                setShowPaymentModal(true);
              });
          }
        }
      ]
    );
  };

  const handleRejectApplication = (applicationId) => {
    Alert.alert(
      "Rejeter la candidature",
      "Êtes-vous sûr de vouloir rejeter cette candidature ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Rejeter", 
          onPress: () => {
            dispatch(rejectApplication(applicationId))
              .unwrap()
              .then(() => {
                setSelectedApplicationId(null);
              });
          },
          style: "destructive"
        }
      ]
    );
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    Alert.alert(
      "Paiement réussi",
      "Votre réservation a été confirmée avec succès.",
      [{ text: "OK" }]
    );
    loadData();
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  const filteredApplications = () => {
    if (!applications) return [];
    
    switch (filter) {
      case 'pending':
        return applications.filter(app => app.status === 'pending');
      case 'accepted':
        return applications.filter(app => app.status === 'accepted');
      case 'rejected':
        return applications.filter(app => app.status === 'rejected');
      default:
        return applications;
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={70} color={colors.textLight} />
      <Text style={styles.emptyTitle}>Aucune candidature</Text>
      <Text style={styles.emptyText}>
        {filter === 'pending' ? 
          "Vous n'avez pas de candidatures en attente." : 
          filter === 'accepted' ? 
            "Vous n'avez pas encore accepté de candidatures." :
            "Vous n'avez pas de candidatures rejetées."}
      </Text>
    </View>
  );

  const renderApplicationItem = ({ item }) => (
    <ApplicationCard 
      application={item}
      onPress={() => handleApplicationPress(item._id)}
      style={styles.applicationCard}
    />
  );

  if (loading && !refreshing && (!applications || applications.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {listingId && currentListing ? 
            `Candidatures: ${currentListing.title}` : 
            "Toutes les candidatures"}
        </Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'pending' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('pending')}
        >
          <Text 
            style={[
              styles.filterButtonText,
              filter === 'pending' && styles.filterButtonTextActive
            ]}
          >
            En attente
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'accepted' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('accepted')}
        >
          <Text 
            style={[
              styles.filterButtonText,
              filter === 'accepted' && styles.filterButtonTextActive
            ]}
          >
            Acceptées
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'rejected' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('rejected')}
        >
          <Text 
            style={[
              styles.filterButtonText,
              filter === 'rejected' && styles.filterButtonTextActive
            ]}
          >
            Rejetées
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredApplications()}
        keyExtractor={item => item._id}
        renderItem={renderApplicationItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={
          filteredApplications().length === 0 ? styles.listEmptyContent : styles.listContent
        }
      />
      
      {/* Application Details Modal */}
      {selectedApplicationId && currentApplication && (
        <Modal
          visible={!!selectedApplicationId}
          onClose={() => setSelectedApplicationId(null)}
          title="Détails de la candidature"
        >
          <View style={styles.modalContent}>
            <View style={styles.applicantInfo}>
              <View style={styles.applicantHeader}>
                {currentApplication.cleaner.profileImage ? (
                  <Image 
                    source={{ uri: currentApplication.cleaner.profileImage }}
                    style={styles.applicantImage}
                  />
                ) : (
                  <View style={styles.applicantImagePlaceholder}>
                    <Text style={styles.applicantImagePlaceholderText}>
                      {currentApplication.cleaner.firstName?.charAt(0) || 'C'}
                    </Text>
                  </View>
                )}
                
                <View style={styles.applicantNameContainer}>
                  <Text style={styles.applicantName}>
                    {currentApplication.cleaner.firstName} {currentApplication.cleaner.lastName}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Rating value={currentApplication.cleaner.rating || 0} size={16} />
                    <Text style={styles.ratingText}>
                      ({currentApplication.cleaner.completedBookings || 0} réservations)
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text style={styles.infoText}>{currentApplication.cleaner.location}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="calendar-check-outline" size={18} color={colors.primary} />
                <Text style={styles.infoText}>
                  {currentApplication.cleaner.completedBookings || 0} services réalisés
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.infoText}>
                  Membre depuis {new Date(currentApplication.cleaner.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>
            
            {currentApplication.message && (
              <Card style={styles.messageCard}>
                <Text style={styles.messageLabel}>Message:</Text>
                <Text style={styles.messageText}>{currentApplication.message}</Text>
              </Card>
            )}
            
            {currentApplication.status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectApplication(currentApplication._id)}
                >
                  <Text style={styles.rejectButtonText}>Refuser</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleAcceptApplication(currentApplication._id)}
                >
                  <Text style={styles.acceptButtonText}>Accepter</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {currentApplication.status === 'accepted' && (
              <View style={styles.statusContainer}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>
                  Candidature acceptée
                </Text>
              </View>
            )}
            
            {currentApplication.status === 'rejected' && (
              <View style={styles.statusContainer}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
                <Text style={[styles.statusText, { color: colors.error }]}>
                  Candidature refusée
                </Text>
              </View>
            )}
          </View>
        </Modal>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && currentListing && (
        <Modal
          visible={showPaymentModal}
          onClose={handlePaymentCancel}
          title="Paiement"
        >
          <PaymentForm
            listing={currentListing}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </Modal>
      )}
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
  applicationCard: {
    marginBottom: 15,
  },
  modalContent: {
    padding: 10,
  },
  applicantInfo: {
    marginBottom: 20,
  },
  applicantHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  applicantImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  applicantImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  applicantImagePlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  applicantNameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  applicantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 10,
  },
  messageCard: {
    padding: 15,
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  rejectButton: {
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectButtonText: {
    color: colors.error,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: colors.lightBackground,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ApplicationsScreen;