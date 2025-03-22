import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile, logout } from '../../redux/slices/userSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ImagePicker from '../../components/common/ImagePicker';
import colors from '../../utils/colors';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.user);
  const { token, isAuthenticated, user: authUser } = useSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
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
    // Log debug information
    console.log('ProfileScreen - Auth state:', { isAuthenticated, hasToken: !!token });
    console.log('ProfileScreen - Current user state:', { hasUser: !!user });
    
    // Fetch profile data if authenticated but no user data
    if (isAuthenticated && token && (!user || Object.keys(user).length === 0)) {
      console.log('ProfileScreen - Fetching user profile data');
      dispatch(fetchProfile());
    }
  }, [dispatch, isAuthenticated, token, user]);
  
  useEffect(() => {
    // When user data changes, update the form data
    if (user) {
      console.log('ProfileScreen - Updating form with user data:', user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyName: user.companyName || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location?.city || '',
        iban: user.iban || '',
      });
      setProfileImage(user.profileImage || null);
    }
  }, [user]);
  
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = () => {
    const updateData = {
      ...formData,
      profileImage,
    };
    console.log('ProfileScreen - Submitting profile update:', updateData);
    dispatch(updateProfile(updateData));
    setIsEditing(false);
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Déconnexion", onPress: () => dispatch(logout()) }
      ]
    );
  };
  
  const refreshProfile = () => {
    console.log('ProfileScreen - Manually refreshing profile data');
    dispatch(fetchProfile());
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
        <Button title="Réessayer" onPress={refreshProfile} style={styles.retryButton} />
      </View>
    );
  }
  
  // Determine user type from either user data or auth data
  const userType = user?.role || authUser?.role || 'host';
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {isEditing ? (
          <ImagePicker 
            image={profileImage} 
            onImageSelected={setProfileImage} 
            style={styles.profileImagePicker}
          />
        ) : (
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {formData.firstName.charAt(0) || formData.companyName.charAt(0) || 'U'}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <Text style={styles.name}>
          {formData.companyName || `${formData.firstName} ${formData.lastName}`}
        </Text>
        <Text style={styles.userType}>
          {userType === 'host' ? 'Hébergeur' : 'Professionnel de ménage'}
        </Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons 
            name={isEditing ? "close-outline" : "pencil-outline"} 
            size={24} 
            color={colors.primary} 
          />
          <Text style={styles.editButtonText}>
            {isEditing ? 'Annuler' : 'Modifier'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        {isEditing ? (
          <>
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
          </>
        ) : (
          <>
            {!formData.companyName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom complet:</Text>
                <Text style={styles.infoValue}>{`${formData.firstName} ${formData.lastName}`}</Text>
              </View>
            )}
            {formData.companyName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Société:</Text>
                <Text style={styles.infoValue}>{formData.companyName}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{formData.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Téléphone:</Text>
              <Text style={styles.infoValue}>{formData.phone || 'Non renseigné'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Localisation:</Text>
              <Text style={styles.infoValue}>{formData.location || 'Non renseignée'}</Text>
            </View>
          </>
        )}
      </Card>
      
      {userType === 'cleaner' && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Informations bancaires</Text>
          {isEditing ? (
            <Input
              label="IBAN"
              value={formData.iban}
              onChangeText={(value) => handleChange('iban', value)}
              placeholder="FR76..."
            />
          ) : (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>IBAN:</Text>
              <Text style={styles.infoValue}>{formData.iban ? '••••••••' + formData.iban.slice(-4) : 'Non renseigné'}</Text>
            </View>
          )}
        </Card>
      )}
      
      {isEditing && (
        <Button 
          title="Enregistrer les modifications" 
          onPress={handleSubmit} 
          loading={loading}
          style={styles.saveButton}
        />
      )}
      
      <View style={styles.navigationSection}>
        <TouchableOpacity 
          style={styles.navigationButton}
          onPress={() => router.push('InvoicesScreen')}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.text} />
          <Text style={styles.navigationButtonText}>Mes factures</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navigationButton}
          onPress={() => router.push('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
          <Text style={styles.navigationButtonText}>Paramètres</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
        </TouchableOpacity>
        
        {userType === 'cleaner' && (
          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={() => router.push('PreferencesScreen')}
          >
            <Ionicons name="options-outline" size={24} color={colors.text} />
            <Text style={styles.navigationButtonText}>Préférences de travail</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.navigationButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={[styles.navigationButtonText, styles.logoutText]}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
      
      {/* Debug button - only visible in development mode */}
      {__DEV__ && (
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={refreshProfile}
        >
          <Text style={styles.debugButtonText}>Rafraîchir profil</Text>
        </TouchableOpacity>
      )}
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
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    color: 'white',
  },
  profileImagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text,
  },
  userType: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.primary,
    marginLeft: 5,
    fontWeight: '500',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  saveButton: {
    margin: 15,
  },
  navigationSection: {
    margin: 15,
    marginTop: 5,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navigationButtonText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginLeft: 10,
  },
  logoutButton: {
    marginTop: 20,
  },
  logoutText: {
    color: colors.error,
  },
  retryButton: {
    marginTop: 20,
  },
  debugButton: {
    margin: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
  },
  debugButtonText: {
    color: colors.textLight,
  }
});

export default ProfileScreen;