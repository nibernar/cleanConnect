import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile } from '../../redux/slices/userSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ImagePicker from '../../components/common/ImagePicker';
import colors from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; // Importer router

const EditProfileScreen = ({ route }) => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.user);
  const { userType } = useSelector((state) => state.auth);
  
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    location: '',
    iban: '',
  });
  
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);
  
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyName: user.companyName || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        iban: user.iban || '',
      });
      setProfileImage(user.profileImage || null);
    }
  }, [user]);
  
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = () => {
    dispatch(updateProfile({ 
      ...formData,
      profileImage
    }));
    router.back(); // Utiliser router pour revenir en arrière
  };
  
  const handleCancel = () => {
    router.back(); // Utiliser router pour revenir en arrière
  };
  
  if (loading && !user) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }
  
  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Erreur lors du chargement du profil.</Text>
        <Button title="Réessayer" onPress={() => dispatch(fetchProfile())} />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ImagePicker 
          image={profileImage} 
          onImageSelected={setProfileImage} 
          style={styles.profileImagePicker}
        />
        
        <Text style={styles.title}>Modifier votre profil</Text>
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        
        {!formData.companyName && (
          <>
            <Input
              label="Prénom"
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              placeholder="Votre prénom"
            />
            <Input
              label="Nom"
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              placeholder="Votre nom"
            />
          </>
        )}
        
        {formData.companyName && (
          <Input
            label="Nom de la société"
            value={formData.companyName}
            onChangeText={(value) => handleChange('companyName', value)}
            placeholder="Nom de votre société"
          />
        )}
        
        <Input
          label="Email"
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="Votre email"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false} // Email shouldn't be editable for security
        />
        
        <Input
          label="Téléphone"
          value={formData.phone}
          onChangeText={(value) => handleChange('phone', value)}
          placeholder="Votre numéro de téléphone"
          keyboardType="phone-pad"
        />
        
        <Input
          label="Localisation"
          value={formData.location}
          onChangeText={(value) => handleChange('location', value)}
          placeholder="Votre ville"
        />
      </Card>
      
      {userType === 'cleaner' && (
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
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Annuler" 
          onPress={handleCancel} 
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
          outline
        />
        <Button 
          title="Enregistrer" 
          onPress={handleSubmit} 
          loading={loading}
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileImagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    padding: 15,
    textAlign: 'center',
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: 'white',
    borderColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.primary,
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
  },
});

export default EditProfileScreen;
