# CleanConnect

Application mobile de mise en relation entre professionnels du ménage et professionnels de l'hébergement.

## Checklist de développement

- [x] Créer les spécifications du projet
- [x] Initialiser Git
- [x] Configurer les dépendances du projet
- [x] Mettre en place la structure du répertoire
- [x] Développer le backend (API REST)
  - [x] Modèles de données
    - [x] User
    - [x] Host
    - [x] Cleaner
    - [x] Listing
    - [x] Booking
    - [x] Review
    - [x] Notification
    - [x] Message
    - [x] Conversation
    - [x] Invoice
  - [x] Contrôleurs
    - [x] Auth Controller
    - [x] Host Controller
    - [x] Cleaner Controller
    - [x] Listing Controller
    - [x] Booking Controller
    - [x] Review Controller
    - [x] Notification Controller
    - [x] Message Controller
    - [x] Invoice Controller
    - [x] User Controller
  - [x] Middlewares
    - [x] Middleware d'authentification
    - [x] Middleware async handler
    - [x] Middleware advanced results (pagination)
  - [x] Services
    - [x] Service de vérification SIRET
    - [x] Service de paiement (Stripe)
    - [x] Service de notifications
  - [x] Routes API
    - [x] Auth Routes
    - [x] User Routes
    - [x] Host Routes
    - [x] Cleaner Routes
    - [x] Listing Routes
    - [x] Booking Routes
    - [x] Review Routes
    - [x] Notification Routes
    - [x] Message Routes
    - [x] Invoice Routes
- [ ] Développer le frontend mobile
  - [x] Configuration Expo (package.json et dépendances installées)
  - [x] Configurer le point d'entrée (App)
  - [x] Créer les composants UI
    - [x] Composants communs de base (Input, Button, Card)
    - [x] Composants communs avancés (ListItem, Modal, ImagePicker, Rating, DateTimePicker)
    - [x] Composants pour l'hébergeur
      - [x] ListingCard
      - [x] ListingForm
      - [x] ApplicationCard
      - [x] PaymentForm
      - [x] ClaimForm
    - [x] Composants pour le professionnel de ménage
      - [x] ListingSwipeCard
      - [x] BookingCard
      - [x] PreferencesForm
      - [x] TaskChecklist
    - [x] Composants de messagerie
      - [x] MessageBubble
      - [x] ChatInput
      - [x] ConversationItem
  - [x] Implémenter la navigation
  - [x] Intégrer Redux pour la gestion d'état
    - [x] Store configuration
    - [x] Auth slice
    - [x] Listings slice
    - [x] Bookings slice
    - [x] Messages slice
    - [x] Notifications slice
    - [x] User slice
    - [x] Invoices slice
  - [x] Connecter l'API
    - [x] Intercepteurs pour token auth
    - [x] Services API pour chaque entité
  - [x] Implémenter les écrans
    - [x] Écrans d'authentification (login, inscription)
    - [x] Écrans communs
      - [x] ProfileScreen (profil utilisateur)
      - [x] MessagesScreen (liste des conversations)
      - [x] ChatScreen (messagerie)
      - [x] NotificationsScreen (centre de notifications)
      - [x] InvoicesScreen (factures)
    - [x] Écrans hébergeur
      - [x] DashboardScreen (tableau de bord)
      - [x] CreateListingScreen (création d'annonce)
      - [x] ListingsScreen (gestion des annonces)
      - [x] ListingDetailScreen (détail d'annonce)
      - [x] ApplicationsScreen (candidatures)
    - [x] Écrans professionnel de ménage
      - [x] SearchScreen (recherche avec swipe)
      - [x] ScheduleScreen (planning des missions)
      - [x] PreferencesScreen (préférences de travail)
      - [x] BookingDetailScreen (détail d'une réservation)
      - [x] TasksScreen (checklist des tâches)
- [ ] Écrire les tests
  - [x] Tests unitaires backend
    - [x] Tests des modèles (User, Booking, Listing, Review)
    - [x] Tests des contrôleurs (Auth, Host, Cleaner, Listing, Booking, Review, Notification, Message, Invoice, User)
    - [x] Tests des middlewares (Auth)
    - [x] Tests des services (Payment, Notification, SIRET Verification)
  - [x] Tests d'intégration API
    - [x] Tests d'intégration Auth
    - [x] Tests d'intégration Listings
    - [x] Tests d'intégration Bookings
    - [x] Tests d'intégration Reviews
    - [x] Tests d'intégration Messages
    - [x] Tests d'intégration Notifications
    - [x] Tests d'intégration Invoices
  - [ ] Tests unitaires frontend
    - [ ] Tests des composants (TaskChecklist, ApplicationCard, BookingCard, ClaimForm, ListingCard, ListingForm, ListingSwipeCard, PaymentForm, PreferencesForm, MessageBubble, ChatInput, ConversationItem)
    - [ ] Tests des écrans (TasksScreen, DashboardScreen, SearchScreen, ScheduleScreen, ProfileScreen, MessagesScreen, ChatScreen, NotificationsScreen, InvoicesScreen, CreateListingScreen, ListingsScreen, ListingDetailScreen, ApplicationsScreen, PreferencesScreen, BookingDetailScreen)
    - [ ] Tests Redux (authSlice, bookingsSlice, listingsSlice, notificationsSlice, messagesSlice, userSlice, invoicesSlice)
- [x] Configurer les outils de build et déploiement
  - [x] Configuration ESLint/Prettier
  - [x] Setup CI/CD
  - [ ] Documentation de déploiement

## Architecture

L'application est divisée en deux parties principales:

1. **Backend**: API REST avec Node.js/Express et MongoDB
2. **Frontend**: Application mobile React Native pour iOS et Android

## Installation

### Prérequis

- Node.js (v14 ou plus)
- MongoDB
- React Native environment (pour le développement mobile)

### Installation du backend

```bash
# Se placer dans le répertoire backend
cd backend

# Installer les dépendances
npm install

# Créer un fichier .env basé sur le modèle
cp .env.example .env

# Éditer le fichier .env avec vos configurations
# Remplir avec les informations de votre MongoDB, clés Stripe, etc.

# Démarrer le serveur en mode développement
npm run dev
```

### Installation du frontend

```bash
# Se placer dans le répertoire frontend
cd frontend

# Installer les dépendances
npm install

# Pour iOS uniquement, installer les pods
cd ios && pod install && cd ..

# Démarrer le simulateur iOS
npm run ios

# Ou démarrer le simulateur Android
npm run android
```

## Utilisation

### Compte de test

Pour tester l'application rapidement, vous pouvez utiliser les comptes de test suivants:

**Hébergeur:**
- Email: host@example.com
- Mot de passe: password123

**Professionnel de ménage:**
- Email: cleaner@example.com
- Mot de passe: password123

### Flux d'utilisation principal

1. L'hébergeur crée une annonce de ménage
2. Le professionnel de ménage parcourt les annonces et postule
3. L'hébergeur accepte la candidature et effectue le paiement
4. Le jour du ménage, le professionnel arrive et exécute les tâches
5. Une fois les tâches complétées, le professionnel marque le travail comme terminé
6. L'hébergeur peut vérifier et signaler des problèmes si nécessaire
7. Le paiement est libéré au professionnel après 7 jours sans réclamation

## Technologies utilisées

- **Backend**: Node.js, Express, MongoDB, JWT, Stripe API
- **Frontend**: React Native, Redux, React Navigation
- **DevOps**: Git, Jest (tests), GitHub Actions (CI/CD)


run le front : npx expo start