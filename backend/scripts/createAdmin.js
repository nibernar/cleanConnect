// backend/scripts/createAdmin.js

// Charger les variables d'environnement (MONGO_URI)
require('dotenv').config({ path: '../.env' }); // Chemin relatif depuis scripts/ vers .env

const mongoose = require('mongoose');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});
const User = require('../src/models/User'); // Chemin relatif vers le modèle User
const connectDB = require('../src/config/db'); // Chemin relatif vers la connexion DB

// Fonction pour poser une question
const askQuestion = (query) => {
  return new Promise((resolve) => readline.question(query, resolve));
};

// Fonction asynchrone principale
const createAdminUser = async () => {
  console.log('--- Script de Création d\'Administrateur ---');
  let email = null; // Déclarer email ici pour le scope du catch

  try {
    // Connexion à la base de données
    console.log('Connexion à MongoDB...');
    await connectDB();
    console.log('Connecté à MongoDB.');

    // Demander les informations
    email = await askQuestion('Email de l\'administrateur : ');
    const password = await askQuestion('Mot de passe de l\'administrateur : ');
    const firstName = await askQuestion('Prénom (Optionnel) : ');
    const lastName = await askQuestion('Nom (Optionnel) : ');

    // Validation simple
    if (!email || !password) {
      console.error('\nErreur: L\'email et le mot de passe sont obligatoires.');
      readline.close();
      process.exit(1);
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error(`\nErreur: Un utilisateur avec l'email ${email} existe déjà.`);
      readline.close();
      process.exit(1);
    }

    // Créer l'utilisateur admin
    console.log('\nCréation de l\'utilisateur admin...');
    const adminUser = await User.create({
      email,
      password, // Le pre-save hook dans le modèle User devrait hasher le mdp
      firstName: firstName || 'Admin',
      lastName: lastName || 'User',
      role: 'admin',
      isVerified: true, // Marquer comme vérifié par défaut pour l'admin
      emailVerified: true, // Marquer email comme vérifié
    });

    console.log('\n--- Succès ---');
    console.log('Utilisateur Administrateur créé :');
    console.log(`  ID: ${adminUser._id}`);
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Rôle: ${adminUser.role}`);
    console.log('--------------');

  } catch (error) {
    console.error('\n--- Erreur ---');
    console.error('Erreur lors de la création de l\'administrateur :', error.message);
    if (error.code === 11000 && email) {
         console.error(`L'email ${email} est probablement déjà utilisé.`);
    }
    process.exit(1); // Quitter avec un code d'erreur
  } finally {
    // Fermer readline et la connexion DB
    readline.close();
    console.log('\nDéconnexion de MongoDB...');
    await mongoose.disconnect();
    console.log('Déconnecté.');
    process.exit(0); // Quitter proprement
  }
};

// Lancer la fonction principale
createAdminUser();
