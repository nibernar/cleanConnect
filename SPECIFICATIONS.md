# Spécifications du projet "CleanConnect"

## Description générale
Application mobile de mise en relation entre professionnels du ménage et professionnels de l'hébergement.

## Fonctionnalités principales

### Système d'utilisateurs
- Deux types d'utilisateurs : hébergeurs et professionnels de ménage
- Formulaires d'inscription différents selon le type d'utilisateur
- Vérification d'identité (Siret ou pièce d'identité)
- Système d'authentification sécurisée

### Pour les hébergeurs
- Tableau de bord avec onglets (Nouvelle annonce, Messages, Annonces publiées, Notifications, Profil)
- Création d'annonces de ménage avec détails précis (type d'hébergement, adresse, dates, etc.)
- Calcul automatique du prix (base de 15,50€/heure + commission de 15%)
- Système de paiement sécurisé
- Notification et validation des candidatures
- Système de réclamation avec preuves photographiques

### Pour les professionnels de ménage
- Tableau de bord avec onglets (Recherches, Messages, Notifications, Profil, Facturation, Planning)
- Préférences de travail (périmètre, disponibilité, etc.)
- Interface de recherche par swipe des annonces correspondant aux préférences
- Système de candidature aux annonces
- Planning des missions
- Suivi et validation des tâches à accomplir durant la mission
- Système de facturation automatique
- Réception des paiements

### Fonctionnalités communes
- Système de messagerie
- Notifications en temps réel
- Système d'évaluation (notes sur 5 étoiles)
- Gestion des factures et paiements

### Fonctionnalités avancées
- Géolocalisation pour vérifier la présence sur le lieu de mission
- Possibilité de se rétracter avec preuves photographiques
- Édition automatique de factures

## Architecture technique

### Frontend
- Application mobile React Native (iOS/Android)
- UI/UX intuitive et moderne
- Gestion des états avec Redux
- Navigation avec React Navigation

### Backend
- API REST avec Node.js/Express
- Base de données MongoDB
- Authentification JWT
- Gestion des paiements avec Stripe
- Notifications push avec Firebase
- Stockage cloud pour les images

### Sécurité
- Chiffrement des données sensibles (RIB, informations personnelles)
- Protection CSRF/XSS
- Rate limiting
- Validation des entrées utilisateur

## Flux utilisateur principal
1. Inscription/Connexion
2. Publication d'annonce (hébergeur) ou recherche d'annonce (professionnel)
3. Matching et validation
4. Paiement sécurisé
5. Réalisation de la mission
6. Validation des tâches
7. Période de réclamation
8. Paiement du professionnel
9. Facturation

## MVP (Version minimale viable)
Pour la première version, focus sur:
- Inscription/Connexion des deux types d'utilisateurs
- Publication d'annonces simples
- Système basique de matching
- Paiement sécurisé
- Facturation automatique