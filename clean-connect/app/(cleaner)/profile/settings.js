import React from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../../src/redux/slices/authSlice';
import { updateSettings } from '../../../src/redux/slices/userSlice';
import colors from '../../../src/utils/colors';

export default function CleanerSettings() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { settings } = useSelector(state => state.user);
  
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    settings?.notificationsEnabled ?? true
  );
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(
    settings?.emailNotificationsEnabled ?? true
  );
  const [locationEnabled, setLocationEnabled] = React.useState(
    settings?.locationEnabled ?? true
  );
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(
    settings?.darkModeEnabled ?? false
  );
  
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
  
  const handleLogout = () => {
    dispatch(logout());
    router.replace('/(auth)/');
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Notifications" />
        <Card.Content>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Notifications push</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: "#767577", true: colors.primary }}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Notifications par email</Text>
            <Switch
              value={emailNotificationsEnabled}
              onValueChange={handleToggleEmailNotifications}
              trackColor={{ false: "#767577", true: colors.primary }}
            />
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Localisation" />
        <Card.Content>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Activer la géolocalisation</Text>
            <Switch
              value={locationEnabled}
              onValueChange={handleToggleLocation}
              trackColor={{ false: "#767577", true: colors.primary }}
            />
          </View>
          <Text style={styles.settingDescription}>
            La géolocalisation est utilisée pour vérifier votre présence sur le lieu de mission
          </Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Apparence" />
        <Card.Content>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Mode sombre</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: "#767577", true: colors.primary }}
            />
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Préférences bancaires" />
        <Card.Content>
          <></>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Confidentialité et sécurité" />
        <Card.Content>
          <></>
        </Card.Content>
      </Card>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: -5,
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 10,
    flex: 1,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: colors.error,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});