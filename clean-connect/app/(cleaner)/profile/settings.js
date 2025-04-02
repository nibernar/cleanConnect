import React from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'; // Ajout Alert
import { useDispatch, useSelector } from 'react-redux';
import { Card } from 'react-native-paper'; // Utiliser Card de react-native-paper si c'est le cas
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Ajout AsyncStorage
import { logout } from '../../../src/redux/slices/authSlice'; 
import { updateSettings } from '../../../src/redux/slices/userSlice';
import { colors, spacing, typography } from '../../../src/utils/theme'; 

export default function CleanerSettings() {
  const router = useRouter();
  const dispatch = useDispatch();
  const settings = useSelector(state => state.user?.profile?.settings || state.user?.user?.settings || {}); 
  
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(settings?.notificationsEnabled ?? true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(settings?.emailNotificationsEnabled ?? true);
  const [locationEnabled, setLocationEnabled] = React.useState(settings?.locationEnabled ?? true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(settings?.darkModeEnabled ?? false);
  
  const handleToggleNotifications = (value) => {
    setNotificationsEnabled(value);
    dispatch(updateSettings({ notificationsEnabled: value }));
  };
  
  const handleToggleEmailNotifications = (value) => {
    setEmailNotificationsEnabled(value);
    dispatch(updateSettings({ emailNotificationsEnabled: value }));
  };
  
  const handleToggleLocation = (value) => {
    setLocationEnabled(value);
    dispatch(updateSettings({ locationEnabled: value }));
  };
  
  const handleToggleDarkMode = (value) => {
    setDarkModeEnabled(value);
    dispatch(updateSettings({ darkModeEnabled: value }));
  };
  
  const handleLogout = async () => {
      try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('refreshToken');
          dispatch(logout());
          router.replace('/(auth)/login');
      } catch (e) {
          console.error("Erreur lors de la déconnexion depuis Settings", e);
          Alert.alert("Erreur", "Impossible de se déconnecter.");
      }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Notifications" titleStyle={styles.cardTitle} />
        <Card.Content>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Notifications push</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: "#767577", true: colors.primary || 'blue' }}
              thumbColor={notificationsEnabled ? colors.primaryLight || 'lightblue' : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Notifications par email</Text>
            <Switch
              value={emailNotificationsEnabled}
              onValueChange={handleToggleEmailNotifications}
              trackColor={{ false: "#767577", true: colors.primary || 'blue' }}
               thumbColor={emailNotificationsEnabled ? colors.primaryLight || 'lightblue' : "#f4f3f4"}
           />
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Localisation" titleStyle={styles.cardTitle} />
        <Card.Content>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Activer la géolocalisation</Text>
            <Switch
              value={locationEnabled}
              onValueChange={handleToggleLocation}
              trackColor={{ false: "#767577", true: colors.primary || 'blue' }}
               thumbColor={locationEnabled ? colors.primaryLight || 'lightblue' : "#f4f3f4"}
           />
          </View>
          <Text style={styles.settingDescription}>
            La géolocalisation est utilisée pour vérifier votre présence sur le lieu de mission.
          </Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Apparence" titleStyle={styles.cardTitle} />
        <Card.Content>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Mode sombre</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: "#767577", true: colors.primary || 'blue' }}
               thumbColor={darkModeEnabled ? colors.primaryLight || 'lightblue' : "#f4f3f4"}
           />
          </View>
        </Card.Content>
      </Card>
      
      {/* Section Préférences bancaires - Commentée pour Debug */}
      {/* 
      <Card style={styles.card}>
        <Card.Title title="Préférences bancaires" titleStyle={styles.cardTitle} />
        <Card.Content>
           <Text style={styles.placeholderText}>Section bientôt disponible</Text>
        </Card.Content>
      </Card>
      */}
      
      {/* Section Confidentialité - Commentée pour Debug */}
      {/* 
      <Card style={styles.card}>
        <Card.Title title="Confidentialité et sécurité" titleStyle={styles.cardTitle} />
        <Card.Content>
           <Text style={styles.placeholderText}>Section bientôt disponible</Text>
        </Card.Content>
      </Card>
      */}
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles (avec fallback et ajout de styles manquants)
let styles = {};
try {
  styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background || '#f0f0f0' },
    card: { marginHorizontal: spacing.md || 15, marginTop: spacing.md || 15, borderRadius: 8, backgroundColor: 'white' },
    cardTitle: { ...typography.h3, fontWeight: 'bold' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm || 10, borderBottomWidth: 1, borderBottomColor: colors.border || '#eee' },
    settingText: { fontSize: 16, color: colors.text || 'black', flexShrink: 1, marginRight: spacing.sm || 10 },
    settingDescription: { fontSize: 13, color: colors.textSecondary || 'grey', marginTop: spacing.xs || 5, marginBottom: spacing.sm || 10 },
    linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md || 15 },
    linkText: { fontSize: 16, color: colors.text || 'black', marginLeft: spacing.md || 15, flex: 1 },
    placeholderText: { fontSize: 14, color: colors.textTertiary || 'grey', fontStyle: 'italic', paddingVertical: spacing.sm || 10 }, // Style pour le placeholder
    logoutButton: { margin: spacing.lg || 20, padding: spacing.md || 15, backgroundColor: colors.error || 'red', borderRadius: 8, alignItems: 'center' },
    logoutText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  });
} catch(themeError) {
    console.error("Erreur style SettingsScreen:", themeError);
    styles = StyleSheet.create({ container:{flex:1}, card:{margin:10}, cardTitle:{fontWeight:'bold'}, settingRow:{flexDirection:'row', paddingVertical:10}, settingText:{fontSize:16}, settingDescription:{fontSize:13, color:'grey'}, linkRow:{flexDirection:'row', paddingVertical:15}, linkText:{fontSize:16, marginLeft:10, flex:1}, placeholderText:{color:'grey', fontStyle:'italic', paddingVertical:10}, logoutButton:{margin:20, padding:15, backgroundColor:'red', alignItems:'center'}, logoutText:{color:'white'} });
}
