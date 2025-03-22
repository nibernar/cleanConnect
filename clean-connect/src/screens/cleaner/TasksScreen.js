import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Modal,
  Image,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { 
  fetchBookingById, 
  updateTaskStatus, 
  completeBooking, 
  disputeBooking 
} from '../../redux/slices/bookingsSlice';
import TaskChecklist from '../../components/cleaner/TaskChecklist';
import { colors, spacing, typography, shadows } from '../../utils/theme';
import { router } from 'expo-router'; // Importer router

/**
 * Screen for displaying and checking off cleaning tasks
 */
const TasksScreen = ({ route }) => {
  const dispatch = useDispatch();
  const { bookingId } = route.params;
  const { currentBooking, loading, taskUpdateLoading } = useSelector(state => state.bookings);
  const [tasks, setTasks] = useState([]);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePhotos, setDisputePhotos] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (bookingId) {
      dispatch(fetchBookingById(bookingId));
    }
  }, [dispatch, bookingId]);

  useEffect(() => {
    // Request camera permissions
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (currentBooking?.services) {
      // Convert services to task format
      const initialTasks = Object.entries(currentBooking.services)
        .filter(([_, included]) => included)
        .map(([service]) => ({
          id: service.replace(/\s/g, '_').toLowerCase(),
          name: service,
          completed: false
        }));
      
      setTasks(initialTasks);
    }
  }, [currentBooking]);

  useEffect(() => {
    // Check if all tasks are completed
    if (tasks.length > 0) {
      const allCompleted = tasks.every(task => task.completed);
      setAllTasksCompleted(allCompleted);
    }
  }, [tasks]);

  const handleTaskToggle = (taskId) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    
    setTasks(updatedTasks);
    
    // Update task status on the server
    const taskToUpdate = updatedTasks.find(task => task.id === taskId);
    dispatch(updateTaskStatus({
      bookingId,
      taskId,
      completed: taskToUpdate.completed
    }));
  };

  const verifyLocation = async () => {
    setLocationLoading(true);
    
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission refusée",
          "Nous avons besoin de votre localisation pour vérifier votre présence sur le lieu de la mission."
        );
        setLocationLoading(false);
        return;
      }
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      // Get booking location coordinates
      const bookingCoords = currentBooking.location.coordinates;
      
      // Calculate distance between current location and booking location
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        bookingCoords.latitude,
        bookingCoords.longitude
      );
      
      // If within 100 meters, consider them at the location
      if (distance <= 0.1) {
        setLocationVerified(true);
        Alert.alert(
          "Localisation vérifiée",
          "Votre présence sur le lieu de la mission a été confirmée."
        );
      } else {
        Alert.alert(
          "Localisation incorrecte",
          `Vous semblez être à ${Math.round(distance * 1000)} mètres du lieu de la mission. Veuillez vous rendre à l'adresse indiquée.`
        );
      }
    } catch (error) {
      Alert.alert(
        "Erreur de localisation",
        "Impossible de vérifier votre position. Veuillez vérifier que la géolocalisation est activée."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // Calculate distance between two coordinates in kilometers (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const handleCompleteMission = () => {
    if (!allTasksCompleted) {
      Alert.alert(
        "Tâches incomplètes",
        "Veuillez compléter toutes les tâches avant de terminer la mission."
      );
      return;
    }
    
    Alert.alert(
      "Terminer la mission",
      "Confirmez-vous avoir terminé toutes les tâches de cette mission ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Confirmer",
          onPress: () => {
            dispatch(completeBooking(bookingId));
            Alert.alert(
              "Mission terminée",
              "Merci d'avoir effectué cette mission. Le paiement sera débloqué dans 7 jours en l'absence de réclamation.",
              [
                {
                  text: "OK",
                  onPress: () => router.push('Schedule')
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleOpenDispute = () => {
    setShowDisputeModal(true);
  };

  const handleTakePhoto = async () => {
    if (cameraVisible) {
      // Take photo with camera
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync();
          setDisputePhotos([...disputePhotos, photo.uri]);
          setCameraVisible(false);
        } catch (error) {
          Alert.alert("Erreur", "Impossible de prendre une photo");
        }
      }
    } else {
      // Open camera
      if (hasPermission) {
        setCameraVisible(true);
      } else {
        Alert.alert(
          "Accès refusé",
          "Nous avons besoin d'accéder à votre appareil photo pour prendre des photos."
        );
      }
    }
  };

  const handlePickImage = async () => {
    // Pick image from library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert(
        "Accès refusé",
        "Nous avons besoin d'accéder à votre galerie pour sélectionner des photos."
      );
      return;
    }
    
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!pickerResult.canceled) {
      setDisputePhotos([...disputePhotos, pickerResult.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index) => {
    const updatedPhotos = [...disputePhotos];
    updatedPhotos.splice(index, 1);
    setDisputePhotos(updatedPhotos);
  };

  const handleSubmitDispute = () => {
    if (disputeReason.trim() === '') {
      Alert.alert("Erreur", "Veuillez indiquer la raison de votre contestation.");
      return;
    }
    
    if (disputePhotos.length === 0) {
      Alert.alert("Erreur", "Veuillez prendre au moins une photo comme preuve.");
      return;
    }
    
    dispatch(disputeBooking({
      bookingId,
      reason: disputeReason,
      photos: disputePhotos
    }));
    
    setShowDisputeModal(false);
    
    Alert.alert(
      "Contestation envoyée",
      "Votre contestation a été envoyée. Nous l'examinerons dans les plus brefs délais.",
      [
        {
          text: "OK",
          onPress: () => router.push('Schedule')
        }
      ]
    );
  };

  if (loading || !currentBooking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des tâches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Liste des tâches</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{currentBooking.accommodationType}</Text>
          <Text style={styles.infoAddress}>{currentBooking.location.address}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              {currentBooking.startTime} - {currentBooking.endTime}
            </Text>
          </View>
        </View>
        
        {/* Location verification section */}
        {!locationVerified && (
          <View style={[styles.verificationCard, shadows.medium]}>
            <Text style={styles.verificationTitle}>Vérification de présence</Text>
            <Text style={styles.verificationText}>
              Veuillez confirmer votre présence sur le lieu de la mission en vérifiant votre position.
            </Text>
            <TouchableOpacity 
              style={styles.verificationButton}
              onPress={verifyLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Ionicons name="location" size={20} color={colors.background} />
                  <Text style={styles.verificationButtonText}>Vérifier ma position</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Tasks section */}
        <View style={[styles.tasksCard, shadows.medium]}>
          <View style={styles.tasksHeader}>
            <Text style={styles.tasksTitle}>Tâches à réaliser</Text>
            <View style={styles.taskCounter}>
              <Text style={styles.taskCounterText}>
                {tasks.filter(task => task.completed).length}/{tasks.length}
              </Text>
            </View>
          </View>
          
          <TaskChecklist 
            tasks={tasks} 
            onToggle={handleTaskToggle}
            loading={taskUpdateLoading}
            disabled={!locationVerified}
          />
          
          {!locationVerified && (
            <Text style={styles.taskWarning}>
              Veuillez d'abord vérifier votre position pour accéder aux tâches
            </Text>
          )}
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {locationVerified && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.disputeButton]}
                onPress={handleOpenDispute}
              >
                <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                <Text style={styles.disputeButtonText}>Signaler un problème</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  styles.completeButton,
                  !allTasksCompleted && styles.disabledButton
                ]}
                onPress={handleCompleteMission}
                disabled={!allTasksCompleted}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.background} />
                <Text style={styles.completeButtonText}>
                  Terminer la mission
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Dispute Modal */}
      <Modal
        visible={showDisputeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Signaler un problème</Text>
              <TouchableOpacity onPress={() => setShowDisputeModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <Text style={styles.modalLabel}>Expliquez le problème rencontré</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Description détaillée du problème..."
                placeholderTextColor={colors.textTertiary}
                value={disputeReason}
                onChangeText={setDisputeReason}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
              
              <Text style={styles.modalLabel}>Ajoutez des photos comme preuve</Text>
              <View style={styles.photoActions}>
                <TouchableOpacity 
                  style={styles.photoButton}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={20} color={colors.background} />
                  <Text style={styles.photoButtonText}>Prendre une photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoButton}
                  onPress={handlePickImage}
                >
                  <Ionicons name="image" size={20} color={colors.background} />
                  <Text style={styles.photoButtonText}>Galerie</Text>
                </TouchableOpacity>
              </View>
              
              {/* Photos preview */}
              {disputePhotos.length > 0 && (
                <View style={styles.photosContainer}>
                  {disputePhotos.map((photo, index) => (
                    <View key={index} style={styles.photoPreviewContainer}>
                      <Image source={{ uri: photo }} style={styles.photoPreview} />
                      <TouchableOpacity 
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmitDispute}
              >
                <Text style={styles.submitButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Camera Modal */}
      {cameraVisible && (
        <Modal
          visible={cameraVisible}
          animationType="slide"
          onRequestClose={() => setCameraVisible(false)}
        >
          <View style={styles.cameraContainer}>
            <Camera 
              ref={cameraRef}
              style={styles.camera}
              type={Camera.Constants.Type.back}
            />
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={() => setCameraVisible(false)}
              >
                <Ionicons name="close" size={28} color={colors.background} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={handleTakePhoto}
              >
                <View style={styles.captureCircle} />
              </TouchableOpacity>
              
              <View style={styles.cameraButtonPlaceholder} />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h1,
    flex: 1,
  },
  infoCard: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  infoAddress: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  verificationCard: {
    backgroundColor: colors.background,
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
  },
  verificationTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  verificationText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  verificationButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  verificationButtonText: {
    ...typography.button,
    color: colors.background,
    marginLeft: spacing.sm,
  },
  tasksCard: {
    backgroundColor: colors.background,
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  tasksTitle: {
    ...typography.h2,
  },
  taskCounter: {
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  taskCounterText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  taskWarning: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actionsContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  disputeButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
  },
  disputeButtonText: {
    ...typography.button,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  completeButtonText: {
    ...typography.button,
    color: colors.background,
    marginLeft: spacing.sm,
  },
  disabledButton: {
    backgroundColor: colors.textTertiary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h2,
  },
  modalLabel: {
    ...typography.bodySmall,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    height: 100,
    ...typography.body,
  },
  photoActions: {
    flexDirection: 'row',
    marginVertical: spacing.md,
  },
  photoButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  photoButtonText: {
    ...typography.button,
    color: colors.background,
    marginLeft: spacing.xs,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoPreviewContainer: {
    position: 'relative',
    margin: spacing.xs,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.background,
    borderRadius: 15,
  },
  submitButton: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.background,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.text,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cameraButton: {
    padding: spacing.sm,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
  },
  cameraButtonPlaceholder: {
    width: 40,
  },
});

export default TasksScreen;