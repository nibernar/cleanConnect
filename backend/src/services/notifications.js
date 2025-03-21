/**
 * Service de notification pour l'application CleanConnect
 * Gère l'envoi de notifications via Firebase Cloud Messaging
 */

const admin = require('firebase-admin');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Initialisation de Firebase Admin (en production, utiliser les variables d'environnement)
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (!firebaseInitialized) {
    try {
      // En production, chargez ces valeurs depuis des variables d'environnement
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        databaseURL: process.env.FIREBASE_DB_URL
      });
      firebaseInitialized = true;
      console.log('Firebase Admin SDK initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Firebase Admin SDK:', error);
      // En mode développement, on peut continuer sans Firebase
      if (process.env.NODE_ENV === 'development') {
        console.log('Continuant en mode développement sans Firebase');
        firebaseInitialized = true;
      }
    }
  }
};

/**
 * Envoyer une notification push à un utilisateur
 * @param {string} userId - ID de l'utilisateur destinataire
 * @param {Object} notification - Objet notification à envoyer
 * @returns {Promise<boolean>} - Succès de l'envoi
 */
exports.sendPushNotification = async (userId, notification) => {
  try {
    initializeFirebase();

    // Récupérer les tokens FCM de l'utilisateur
    const user = await User.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`Aucun token FCM trouvé pour l'utilisateur ${userId}`);
      return false;
    }

    if (!firebaseInitialized || process.env.NODE_ENV === 'development') {
      console.log('Mode développement: simulation d\'envoi de notification push', {
        userId,
        title: notification.title,
        body: notification.message
      });
      return true;
    }

    // Préparer le message
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        type: notification.type,
        modelType: notification.relatedTo.modelType,
        modelId: notification.relatedTo.modelId.toString(),
        notificationId: notification._id.toString(),
        actionRequired: notification.actionRequired ? 'true' : 'false',
        actionType: notification.actionType || ''
      },
      tokens: user.fcmTokens
    };

    // Envoyer la notification
    const response = await admin.messaging().sendMulticast(message);
    console.log(`${response.successCount} notifications envoyées avec succès sur ${response.tokenCount}`);

    // Vérifier les tokens invalides
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log(`Échec de l'envoi au token ${user.fcmTokens[idx]}: ${resp.error.code}`);
          invalidTokens.push(user.fcmTokens[idx]);
        }
      });

      // Supprimer les tokens invalides
      if (invalidTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: invalidTokens } }
        });
      }
    }

    // Marquer la notification comme envoyée
    await Notification.findByIdAndUpdate(notification._id, {
      pushNotificationSent: true
    });

    return response.successCount > 0;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification push:', error);
    return false;
  }
};

/**
 * Créer une notification dans la base de données et l'envoyer
 * @param {Object} notificationData - Données de la notification
 * @param {boolean} sendPush - Envoyer une notification push
 * @returns {Promise<Object>} - Notification créée
 */
exports.createNotification = async (notificationData, sendPush = true) => {
  try {
    // Créer la notification en base de données
    const notification = await Notification.create(notificationData);

    // Envoyer la notification push si demandé
    if (sendPush) {
      await this.sendPushNotification(notificationData.recipient, notification);
    }

    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

/**
 * Marquer une notification comme lue
 * @param {string} notificationId - ID de la notification
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Notification mise à jour
 */
exports.markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    return notification;
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    throw error;
  }
};

/**
 * Marquer une action de notification comme complétée
 * @param {string} notificationId - ID de la notification
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Notification mise à jour
 */
exports.completeAction = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId, 
        recipient: userId, 
        actionRequired: true,
        actionCompleted: false
      },
      { 
        actionCompleted: true,
        actionCompletedAt: new Date(),
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    return notification;
  } catch (error) {
    console.error('Erreur lors du marquage de l\'action comme complétée:', error);
    throw error;
  }
};

/**
 * Créer des notifications pour un booking entre un hébergeur et un professionnel
 * @param {Object} booking - Objet booking
 * @param {string} type - Type de notification
 * @param {Object} additionalData - Données supplémentaires
 * @returns {Promise<Array>} - Notifications créées
 */
exports.createBookingNotifications = async (booking, type, additionalData = {}) => {
  try {
    const notifications = [];
    const { host, cleaner } = booking;
    
    // Récupérer les utilisateurs associés
    const hostUser = await User.findOne({ hostProfile: host });
    const cleanerUser = await User.findOne({ cleanerProfile: cleaner });
    
    if (!hostUser || !cleanerUser) {
      throw new Error('Utilisateurs non trouvés pour la réservation');
    }
    
    let hostNotification, cleanerNotification;
    
    // Configurer les notifications en fonction du type
    switch (type) {
      case 'booking_confirmed':
        hostNotification = {
          recipient: hostUser._id,
          type: 'booking_confirmed',
          title: 'Réservation confirmée',
          message: `Votre réservation de ménage a été confirmée et le paiement a été traité.`,
          relatedTo: {
            modelType: 'Booking',
            modelId: booking._id
          },
          actionRequired: false
        };
        
        cleanerNotification = {
          recipient: cleanerUser._id,
          type: 'booking_confirmed',
          title: 'Nouvelle mission confirmée',
          message: `Une nouvelle mission a été confirmée et ajoutée à votre planning.`,
          relatedTo: {
            modelType: 'Booking',
            modelId: booking._id
          },
          actionRequired: false
        };
        break;
        
      case 'day_before_reminder':
        hostNotification = {
          recipient: hostUser._id,
          type: 'day_before_reminder',
          title: 'Rappel: Mission de ménage demain',
          message: `Votre mission de ménage est prévue pour demain.`,
          relatedTo: {
            modelType: 'Booking',
            modelId: booking._id
          },
          actionRequired: false
        };
        
        cleanerNotification = {
          recipient: cleanerUser._id,
          type: 'day_before_reminder',
          title: 'Rappel: Mission de ménage demain',
          message: `Vous avez une mission de ménage prévue pour demain.`,
          relatedTo: {
            modelType: 'Booking',
            modelId: booking._id
          },
          actionRequired: false
        };
        break;
        
      case 'cleaner_arrived':
        hostNotification = {
          recipient: hostUser._id,
          type: 'cleaner_arrived',
          title: 'Le professionnel est arrivé',
          message: `Le professionnel de ménage est arrivé sur le lieu de la mission.`,
          relatedTo: {
            modelType: 'Booking',
            modelId: booking._id
          },
          actionRequired: false
        };
        break;
        
      case 'task_completed':
        hostNotification = {
          recipient: hostUser._id,
          type: 'task_completed',
          title: 'Mission terminée',
          message: `Le professionnel a terminé toutes les tâches de la mission.`,
          relatedTo: {
            modelType: 'Booking',
            modelId: booking._id
          },
          actionRequired: true,
          actionType: 'review'
        };
        break;
        
      case 'contact_info_shared':
        cleanerNotification = {
          recipient: cleanerUser._id,
          type: 'contact_info_shared',
          title: 'Informations de contact partagées',
          message: `Les informations de contact pour votre mission ont été partagées.`,
          relatedTo: {
            modelType: 'Booking',
            modelId: booking._id
          },
          actionRequired: false
        };
        break;
        
      // Autres types de notifications...
      default:
        break;
    }
    
    // Créer les notifications configurées
    if (hostNotification) {
      const notification = await this.createNotification({
        ...hostNotification,
        ...additionalData
      });
      notifications.push(notification);
    }
    
    if (cleanerNotification) {
      const notification = await this.createNotification({
        ...cleanerNotification,
        ...additionalData
      });
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Erreur lors de la création des notifications de réservation:', error);
    throw error;
  }
};