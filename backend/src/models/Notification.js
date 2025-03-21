const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'new_application', // Pour l'hébergeur: un professionnel a candidaté
      'application_accepted', // Pour le professionnel: candidature acceptée
      'application_rejected', // Pour le professionnel: candidature refusée
      'payment_received', // Pour l'hébergeur: confirmation de paiement
      'booking_confirmed', // Pour les deux: réservation confirmée
      'booking_cancelled', // Pour les deux: réservation annulée
      'day_before_reminder', // Pour les deux: rappel la veille
      'cleaner_arrived', // Pour l'hébergeur: le professionnel est arrivé
      'task_completed', // Pour l'hébergeur: tâches terminées
      'contact_info_shared', // Pour le professionnel: infos de contact partagées
      'complaint_submitted', // Pour le professionnel: réclamation soumise
      'payment_released', // Pour le professionnel: paiement libéré
      'review_received', // Pour les deux: nouvelle évaluation reçue
      'message_received', // Pour les deux: nouveau message
      'system_notification' // Notifications générales du système
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedTo: {
    modelType: {
      type: String,
      enum: ['Booking', 'Listing', 'Review', 'Message', 'User'],
      required: true
    },
    modelId: {
      type: mongoose.Schema.ObjectId,
      required: true
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionType: {
    type: String,
    enum: [
      'view', // Simplement voir l'élément lié
      'approve', // Approuver une candidature
      'pay', // Effectuer un paiement
      'confirm', // Confirmer une action
      'respond', // Répondre à un message ou réclamation
      'complete', // Terminer une tâche
      'review' // Laisser une évaluation
    ]
  },
  actionCompleted: {
    type: Boolean,
    default: false
  },
  actionCompletedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  pushNotificationSent: {
    type: Boolean,
    default: false
  },
  emailNotificationSent: {
    type: Boolean,
    default: false
  }
});

// Index pour les requêtes fréquentes
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);