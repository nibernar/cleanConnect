// Contenu pour : src/screens/cleaner/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux'; 
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { selectUser } from '../../redux/slices/userSlice';
// Correction: Utiliser selectUserRole pour vérifier le rôle admin
import { selectAuthUser, logout, selectUserRole } from '../../redux/slices/authSlice'; 

import { colors, spacing, typography, shadows } from '../../../src/utils/theme';

const ProfileScreen = () => {
  const dispatch = useDispatch(); 
  const userDetails = useSelector(selectUser);
  const authUser = useSelector(selectAuthUser);
  const userRole = useSelector(selectUserRole); // Récupérer le rôle
  const isLoading = useSelector(state => state.user?.loading || state.auth?.loading || false); 
  const user = userDetails || authUser;

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      dispatch(logout()); 
      router.replace('/(auth)/login');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      Alert.alert("Erreur", "Impossible de se déconnecter. Veuillez réessayer.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
        <Text style={styles.errorText}>Impossible de charger les informations utilisateur.</Text>
         <TouchableOpacity onPress={handleLogout} style={styles.logoutButtonOnError}>
           <Text style={styles.logoutButtonText}>Se déconnecter</Text>
         </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const displayName = user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
           <Ionicons name="person-circle-outline" size={80} color={colors.primary} style={styles.avatar} />
           <Text style={styles.nameText}>{displayName || 'Utilisateur'}</Text>
           <Text style={styles.emailText}>{user.email || 'Email non disponible'}</Text>
        </View>

        <View style={styles.actionsSection}>
          {/* Liens Communs */}
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(cleaner)/profile/edit')}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Modifier infos personnelles</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          
          {/* Liens Spécifiques Cleaner */}
          {userRole === 'cleaner' && (
            <>
              <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(cleaner)/profile/edit-details')}>
                <Ionicons name="business-outline" size={24} color={colors.primary} />
                <Text style={styles.actionText}>Modifier infos professionnelles</Text>
                <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
              {/* Préférences commentées 
              <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(cleaner)/preferences')}>
                 <Ionicons name="options-outline" size={24} color={colors.primary} />
                 <Text style={styles.actionText}>Préférences de travail</Text>
                 <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
               </TouchableOpacity> 
               */}
              {/* Facturation commentées
               <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(cleaner)/invoices')}>
                 <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                 <Text style={styles.actionText}>Facturation</Text>
                  <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
               </TouchableOpacity>
              */}
            </>
          )}

          {/* Liens Communs */}
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(cleaner)/profile/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Paramètres & Sécurité</Text> 
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => console.log("Naviguer vers Aide/Support")}>
             <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
             <Text style={styles.actionText}>Aide et Support</Text>
             <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
           </TouchableOpacity>

          {/* LIEN ADMIN CONDITIONNEL */}
          {userRole === 'admin' && (
            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(admin)/manage-cleaners')}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
              <Text style={styles.actionText}>Admin: Gérer Cleaners</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

           <TouchableOpacity style={[styles.actionItem, styles.logoutItem]} onPress={handleLogout}>
             <Ionicons name="log-out-outline" size={24} color={colors.error} />
             <Text style={[styles.actionText, styles.logoutText]}>Déconnexion</Text>
           </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

let styles = {};
try {
    styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background || '#f8f9fa' },
      scrollContent: { paddingBottom: spacing.lg },
      centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md },
      headerSection: { alignItems: 'center', paddingVertical: spacing.lg, backgroundColor: colors.primaryLight || '#e0eaff', borderBottomWidth: 1, borderBottomColor: colors.border || '#eee' },
      avatar: { marginBottom: spacing.md, color: colors.primaryDark || colors.primary },
      nameText: { ...typography.h2, fontWeight: 'bold', color: colors.primaryDark || colors.text, marginBottom: spacing.xs, textAlign: 'center' },
      emailText: { ...typography.body, color: colors.textSecondary },
      actionsSection: { marginTop: spacing.lg, backgroundColor: 'white', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border || '#eee' },
      actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md + 2, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border || '#eee' },
      actionText: { ...typography.body, flex: 1, marginLeft: spacing.md, color: colors.text, fontSize: 16 },
      logoutItem: { borderBottomWidth: 0, marginTop: spacing.md },
      logoutText: { color: colors.error, fontWeight: 'bold' },
      errorText: { marginTop: spacing.md, color: colors.error || 'red', textAlign: 'center', paddingHorizontal: spacing.lg, ...typography.body },
      logoutButtonOnError: { marginTop: spacing.xl, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.error, borderRadius: 8 },
      logoutButtonText: { ...typography.button, color: 'white' }
    });
} catch (themeError) {
     console.error("Erreur style ProfileScreen:", themeError);
     styles = StyleSheet.create({ container: { flex: 1 }, centered:{ flex:1, alignItems:'center', justifyContent:'center' }, errorText:{color:'red'}, scrollContent:{}, headerSection:{}, avatar:{}, nameText:{fontWeight:'bold', fontSize:18}, emailText:{}, actionsSection:{marginTop: 20}, actionItem:{flexDirection:'row', padding:15, borderBottomWidth:1}, actionText:{flex:1, marginLeft:10}, logoutItem:{}, logoutText:{color:'red'}, logoutButtonOnError:{marginTop:20, padding:10}, logoutButtonText:{color:'white'} });
}


export default ProfileScreen;
