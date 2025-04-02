import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'; // Ajout ActivityIndicator
import { useDispatch, useSelector } from 'react-redux';
// Correction: Importer les bons sélecteurs et actions
import { fetchProfile, updateProfile, selectUser, selectUserLoading, selectUserError } from '../../redux/slices/userSlice';
// Correction: Importer les composants depuis le bon chemin
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ImagePicker from '../../components/common/ImagePicker';
// Correction: Importer le thème depuis le bon chemin et avec les bonnes variables
import { colors, spacing, typography } from '../../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const EditProfileScreen = ({ userType, onUpdateSuccess, onCancel }) => { // Props reçues depuis le fichier de route
  const dispatch = useDispatch();
  // Correction: Utiliser les sélecteurs importés
  const user = useSelector(selectUser);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  // const authUserType = useSelector(state => state.auth.user?.userType); // Peut être utile si userType n'est pas passé en prop

  // Utiliser le type passé en prop ou déduit de l'état
  const effectiveUserType = userType; // Ou authUserType si userType n'est pas fiable
  
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '', // Garder pour l'instant, l'admin peut le voir?
    // email: '', // L'email ne devrait pas être modifiable ici
    phone: '',
    location: '',
    // iban: '', // Retiré de cet écran commun
  });

  // Pas besoin de fetchProfile ici si les données sont déjà dans le store via AuthLoadingScreen ou _layout
  // useEffect(() => {
  //   if (!user) {
  //      dispatch(fetchProfile());
  //   }
  // }, [dispatch, user]);
  
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyName: user.companyName || '',
        // email: user.email || '', // Ne pas pré-remplir l'email s'il n'est pas modifiable
        phone: user.phone || '',
        location: user.location || '',
        // iban: user.iban || '', // Retiré
      });
      setProfileImage(user.profileImage || null);
    } else {
        // Si user est null après chargement, tenter de fetch?
        // dispatch(fetchProfile());
    }
  }, [user]); // Dépendance à user uniquement
  
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async () => {
    // Ne créer l'objet à envoyer qu'avec les champs pertinents pour User
    const userDataToUpdate = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: formData.location,
        // companyName: formData.companyName, // companyName appartient peut-être à Host/Cleaner
        // Ne pas envoyer profileImage ici, utiliser une action/route dédiée?
    };
    
    // Retirer les champs vides pour ne pas écraser avec des ""
    Object.keys(userDataToUpdate).forEach(key => {
        if (userDataToUpdate[key] === '') {
            delete userDataToUpdate[key];
        }
    });

    console.log("Données envoyées à updateProfile:", userDataToUpdate);
    
    // Appeler l'action updateProfile qui met à jour le modèle User
    const resultAction = await dispatch(updateProfile(userDataToUpdate));
    
    // Vérifier si la mise à jour a réussi avant de revenir en arrière
    if (updateProfile.fulfilled.match(resultAction)) {
        Alert.alert("Succès", "Profil mis à jour.");
        if (onUpdateSuccess) {
            onUpdateSuccess(); // Appeler le callback fourni par la route
        } else {
            router.back();
        }
    } else {
        // Gérer l'erreur (peut-être déjà gérée par le slice et affichée via la variable error)
        Alert.alert("Erreur", `La mise à jour a échoué: ${resultAction.payload || 'Erreur inconnue'}`);
    }

    // Logique pour mettre à jour l'image de profil (via une action/route séparée)
    // if (profileImage && profileImage !== user.profileImage) { 
    //   dispatch(updateProfilePicture(profileImage));
    // }
  };
  
  // Utiliser onCancel passé en prop ou router.back par défaut
  const handleCancelClick = onCancel || (() => router.back());
  
  if (loading && !user) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }
  
  // Gérer le cas où l'utilisateur n'est pas trouvé après chargement
  // (Peut arriver si fetchProfile échoue ou renvoie null)
  if (!loading && !user) {
      return (
          <View style={styles.centeredContainer}>
              <Ionicons name="warning-outline" size={40} color={colors.error} />
              <Text style={styles.errorText}>Impossible de charger les données du profil.</Text>
              <Button title="Retour" onPress={() => router.back()} />
          </View>
      );
  }
  
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        {/* <ImagePicker 
          image={profileImage} 
          onImageSelected={setProfileImage} 
          style={styles.profileImagePicker}
        /> */}
        <Text style={styles.title}>Modifier le profil</Text>
      </View>
      
      {/* Afficher l'erreur venant du slice Redux */}
      {error && <Text style={styles.errorText}>{typeof error === 'string' ? error : JSON.stringify(error)}</Text>}
      
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        
        {/* Afficher Prénom/Nom OU Nom Société basé sur userType ou données */}
        {effectiveUserType === 'host' || effectiveUserType === 'cleaner' /* ou !formData.companyName */ ? (
          <>
            <Input
              label="Prénom"
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              placeholder="Votre prénom"
              style={styles.input}
            />
            <Input
              label="Nom"
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              placeholder="Votre nom"
              style={styles.input}
           />
          </>
        ) : (
          <Input
            label="Nom de la société" // Logique à affiner : quand afficher société?
            value={formData.companyName}
            onChangeText={(value) => handleChange('companyName', value)}
            placeholder="Nom de votre société"
            style={styles.input}
         />
        )}
        
        <Input
          label="Email"
          value={user?.email || ''} // Afficher l'email actuel
          placeholder="Votre email"
          editable={false} // Non modifiable
          style={[styles.input, styles.disabledInput]}
        />
        
        <Input
          label="Téléphone"
          value={formData.phone}
          onChangeText={(value) => handleChange('phone', value)}
          placeholder="Votre numéro de téléphone"
          keyboardType="phone-pad"
          style={styles.input}
       />
        
        <Input
          label="Localisation (Ville)" // Préciser ce qui est attendu
          value={formData.location}
          onChangeText={(value) => handleChange('location', value)}
          placeholder="Votre ville"
          style={styles.input}
       />
      </Card>
      
      {/* Section IBAN retirée de cet écran commun */}
      {/* 
      {effectiveUserType === 'cleaner' && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Informations bancaires</Text>
          <Input
            label="IBAN"
            value={formData.iban}
            onChangeText={(value) => handleChange('iban', value)}
            placeholder="FR76..."
          />
        </Card>
      )}
      */}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Annuler" 
          onPress={handleCancelClick} 
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
          outline // Assurez-vous que ce style existe dans votre composant Button
        />
        <Button 
          title="Enregistrer" 
          onPress={handleSubmit} 
          loading={loading} // Utiliser l'état de chargement du slice
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
};

// Styles (avec fallback et ajout de styles manquants)
let styles = {};
try {
    styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background || '#f8f9fa' },
      centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md || 20 },
      header: { alignItems: 'center', paddingVertical: spacing.lg || 20, borderBottomWidth: 1, borderBottomColor: colors.border || '#eee' },
      profileImagePicker: { width: 100, height: 100, borderRadius: 50, marginBottom: spacing.md || 15, backgroundColor: colors.border || '#ccc' },
      title: { ...typography.h2, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm || 10 },
      loadingText: { marginTop: spacing.md || 15, ...typography.body, color: colors.textSecondary },
      errorText: { color: colors.error || 'red', padding: spacing.md || 15, textAlign: 'center', fontWeight:'500' },
      section: { marginHorizontal: spacing.md || 15, marginTop: spacing.lg || 20, padding: spacing.md || 15, borderRadius: 8, backgroundColor:'white' },
      sectionTitle: { ...typography.h3, fontWeight: 'bold', marginBottom: spacing.md || 15, color: colors.text },
      input: { marginBottom: spacing.md || 15 }, // Ajouter marge pour espacer les inputs
      disabledInput: { backgroundColor: colors.backgroundDisabled || '#e9ecef', color: colors.textDisabled || '#6c757d' },
      buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.lg || 20, marginHorizontal: spacing.md || 15 },
      cancelButton: { flex: 1, marginRight: spacing.sm || 10, backgroundColor: 'white', borderColor: colors.primary || 'blue' },
      cancelButtonText: { color: colors.primary || 'blue' },
      saveButton: { flex: 1, marginLeft: spacing.sm || 10 },
    });
} catch (themeError) {
     console.error("Erreur style EditProfileScreen:", themeError);
     styles = StyleSheet.create({ container: {flex:1}, centeredContainer:{flex:1, alignItems:'center', justifyContent:'center'}, header:{alignItems:'center', padding:20}, profileImagePicker:{width:100, height:100, borderRadius:50, marginBottom:15}, title:{fontSize:20, fontWeight:'bold'}, loadingText:{}, errorText:{color:'red'}, section:{margin:15, padding:15}, sectionTitle:{fontSize:18, fontWeight:'bold', marginBottom:15}, input:{marginBottom:15}, disabledInput:{backgroundColor:'#eee'}, buttonContainer:{flexDirection:'row', margin:15}, cancelButton:{flex:1, marginRight:10}, cancelButtonText:{}, saveButton:{flex:1, marginLeft:10} });
}

export default EditProfileScreen;
