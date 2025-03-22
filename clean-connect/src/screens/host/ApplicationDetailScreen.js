import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Button, Card, Avatar, Divider, Chip } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { approveApplication, rejectApplication, fetchApplicationDetail } from '../../redux/actions/hostActions';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDate } from '../../utils/formatters';

// Modifier pour accepter l'applicationId comme prop directe ou via route.params
const ApplicationDetailScreen = ({ 
  route, 
  navigation, 
  applicationId: propApplicationId,
  listingId: propListingId,
  onAccept,
  onReject,
  onMessage
}) => {
  // Obtenir les IDs soit depuis les props directes, soit depuis route.params
  const applicationId = propApplicationId || (route?.params ? route.params.applicationId : undefined);
  const listingId = propListingId || (route?.params ? route.params.listingId : undefined);
  
  const dispatch = useDispatch();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return;
    }
    
    const loadApplicationDetail = async () => {
      try {
        const result = await dispatch(fetchApplicationDetail(applicationId));
        setApplication(result);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de charger les détails de la candidature');
      } finally {
        setLoading(false);
      }
    };

    loadApplicationDetail();
  }, [dispatch, applicationId]);

  const handleApprove = async () => {
    if (!applicationId) return;
    
    // Si un gestionnaire personnalisé est fourni, l'utiliser
    if (onAccept) {
      onAccept(applicationId);
      return;
    }
    
    setProcessing(true);
    try {
      await dispatch(approveApplication(applicationId));
      Alert.alert(
        'Candidature approuvée',
        'Vous avez accepté cette candidature. Le prestataire a été notifié.',
        [{ text: 'OK', onPress: () => router.push('Payment', { applicationId, listingId }) }]
      );
    } catch (error) {
      Alert.alert('Erreur', "Une erreur s'est produite lors de l'approbation de la candidature");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!applicationId) return;
    
    // Si un gestionnaire personnalisé est fourni, l'utiliser
    if (onReject) {
      onReject(applicationId);
      return;
    }
    
    setProcessing(true);
    try {
      await dispatch(rejectApplication(applicationId));
      Alert.alert(
        'Candidature refusée',
        'Vous avez refusé cette candidature. Le prestataire a été notifié.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erreur', "Une erreur s'est produite lors du refus de la candidature");
    } finally {
      setProcessing(false);
    }
  };

  const handleContactCleaner = () => {
    if (!application || !application.cleaner) return;
    
    // Si un gestionnaire personnalisé est fourni, l'utiliser
    if (onMessage) {
      onMessage(application.cleaner.id);
      return;
    }
    
    router.push('Chat', {
      recipientId: application.cleaner.id,
      name: `${application.cleaner.firstName} ${application.cleaner.lastName}`,
    });
  };

  // Si l'applicationId est manquant, afficher un message d'erreur
  if (!applicationId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Identifiant de candidature manquant</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          Retour
        </Button>
      </View>
    );
  }

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
        <Text style={styles.errorText}>Impossible de charger les détails de la candidature</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          Retour
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Title
            title={`${application.cleaner.firstName} ${application.cleaner.lastName}`}
            subtitle={`Candidature du ${formatDate(application.appliedAt)}`}
            left={(props) => (
              <Avatar.Image
                {...props}
                source={
                  application.cleaner.profilePicture
                    ? { uri: application.cleaner.profilePicture }
                    : require('../../assets/default-avatar.png')
                }
              />
            )}
          />
          <Card.Content>
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Statut :</Text>
              <Chip
                mode="outlined"
                style={[
                  styles.statusChip,
                  application.status === 'pending'
                    ? styles.pendingChip
                    : application.status === 'approved'
                    ? styles.approvedChip
                    : styles.rejectedChip,
                ]}
              >
                {application.status === 'pending'
                  ? 'En attente'
                  : application.status === 'approved'
                  ? 'Approuvée'
                  : 'Refusée'}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Informations générales</Text>
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color="#344955" style={styles.icon} />
              <Text style={styles.infoText}>{application.cleaner.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#344955" style={styles.icon} />
              <Text style={styles.infoText}>{application.cleaner.phone || 'Non renseigné'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#344955" style={styles.icon} />
              <Text style={styles.infoText}>{application.cleaner.address || 'Non renseigné'}</Text>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Expérience et compétences</Text>
            <Text style={styles.experience}>
              {application.cleaner.experience || 'Aucune expérience spécifiée'}
            </Text>

            <View style={styles.skillsContainer}>
              {application.cleaner.skills &&
                application.cleaner.skills.map((skill, index) => (
                  <Chip key={index} style={styles.skillChip} textStyle={styles.skillText}>
                    {skill}
                  </Chip>
                ))}
              {(!application.cleaner.skills || application.cleaner.skills.length === 0) && (
                <Text style={styles.noSkills}>Aucune compétence spécifiée</Text>
              )}
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Message du candidat</Text>
            <Text style={styles.message}>{application.message || 'Aucun message'}</Text>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Disponibilité</Text>
            <Text style={styles.availability}>
              {application.cleaner.availability || 'Disponibilité non spécifiée'}
            </Text>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Évaluations</Text>
            {application.cleaner.rating ? (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>{application.cleaner.rating.toFixed(1)}</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons
                      key={star}
                      name={star <= Math.round(application.cleaner.rating) ? 'star' : 'star-border'}
                      size={24}
                      color="#FFC107"
                    />
                  ))}
                </View>
                <Text style={styles.reviewsCount}>
                  ({application.cleaner.reviewsCount || 0} avis)
                </Text>
              </View>
            ) : (
              <Text style={styles.noRating}>Aucune évaluation pour l'instant</Text>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleContactCleaner}
            style={styles.contactButton}
            icon="message-text"
          >
            Contacter
          </Button>

          {application.status === 'pending' && (
            <View style={styles.decisionButtons}>
              <Button
                mode="contained"
                onPress={handleApprove}
                style={styles.approveButton}
                loading={processing}
                disabled={processing}
                icon="check"
              >
                Approuver
              </Button>
              <Button
                mode="outlined"
                onPress={handleReject}
                style={styles.rejectButton}
                loading={processing}
                disabled={processing}
                icon="close"
              >
                Refuser
              </Button>
            </View>
          )}

          {application.status === 'approved' && (
            <Button
              mode="contained"
              onPress={() => router.push('Payment', { applicationId, listingId })}
              style={styles.paymentButton}
              icon="credit-card"
            >
              Procéder au paiement
            </Button>
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#344955',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 16,
  },
  experience: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillChip: {
    margin: 4,
    backgroundColor: '#e0f2f1',
  },
  skillText: {
    color: '#00796b',
  },
  noSkills: {
    fontStyle: 'italic',
    color: '#757575',
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  availability: {
    fontSize: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewsCount: {
    marginLeft: 8,
    color: '#757575',
  },
  noRating: {
    fontStyle: 'italic',
    color: '#757575',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  statusChip: {
    height: 30,
  },
  pendingChip: {
    backgroundColor: '#FFF9C4',
  },
  approvedChip: {
    backgroundColor: '#E8F5E9',
  },
  rejectedChip: {
    backgroundColor: '#FFEBEE',
  },
  actionsContainer: {
    marginTop: 8,
  },
  contactButton: {
    marginBottom: 16,
    backgroundColor: '#607D8B',
  },
  decisionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: '#F44336',
    borderWidth: 1,
  },
  paymentButton: {
    backgroundColor: '#344955',
  },
  button: {
    width: '50%',
  },
});

export default ApplicationDetailScreen;