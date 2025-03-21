import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchCleanerPreferences, updateCleanerPreferences } from '../../redux/slices/userSlice';
import PreferencesForm from '../../components/cleaner/PreferencesForm';
import { colors, spacing, typography, shadows } from '../../utils/theme';

/**
 * Screen for managing cleaner's work preferences
 */
const PreferencesScreen = () => {
  const dispatch = useDispatch();
  const { preferences, loading } = useSelector(state => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch cleaner preferences on mount
  useEffect(() => {
    dispatch(fetchCleanerPreferences());
  }, [dispatch]);

  // Initialize form data when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      setFormData(preferences);
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRangeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    await dispatch(updateCleanerPreferences(formData));
    setIsEditing(false);
    setSuccessMessage('Vos préférences ont été mises à jour');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  if (loading || !formData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement de vos préférences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Préférences de travail</Text>
          <Text style={styles.subtitle}>
            Personnalisez vos préférences pour trouver des missions adaptées
          </Text>
        </View>

        {successMessage ? (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <View style={[styles.card, shadows.medium]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Vos critères de recherche</Text>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={handleEditToggle}
            >
              <Ionicons 
                name={isEditing ? "close" : "create-outline"} 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.editButtonText}>
                {isEditing ? "Annuler" : "Modifier"}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <PreferencesForm 
              data={formData}
              onChange={handleChange}
              onRangeChange={handleRangeChange}
              onSubmit={handleSubmit}
            />
          ) : (
            <View style={styles.preferencesDisplay}>
              <View style={styles.preferencesSection}>
                <View style={styles.preferenceItem}>
                  <Ionicons name="navigate-circle-outline" size={24} color={colors.primary} />
                  <View style={styles.preferenceTextContainer}>
                    <Text style={styles.preferenceLabel}>Périmètre de déplacement</Text>
                    <Text style={styles.preferenceValue}>{formData.radius} km</Text>
                  </View>
                </View>
                
                <View style={styles.preferenceItem}>
                  <Ionicons name="location-outline" size={24} color={colors.primary} />
                  <View style={styles.preferenceTextContainer}>
                    <Text style={styles.preferenceLabel}>Lieu de référence</Text>
                    <Text style={styles.preferenceValue}>{formData.location}</Text>
                  </View>
                </View>
                
                <View style={styles.preferenceItem}>
                  <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                  <View style={styles.preferenceTextContainer}>
                    <Text style={styles.preferenceLabel}>Période de disponibilité</Text>
                    <Text style={styles.preferenceValue}>
                      {new Date(formData.availabilityStart).toLocaleDateString('fr-FR')} - {' '}
                      {new Date(formData.availabilityEnd).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.preferenceItem}>
                  <Ionicons name="time-outline" size={24} color={colors.primary} />
                  <View style={styles.preferenceTextContainer}>
                    <Text style={styles.preferenceLabel}>Horaires préférés</Text>
                    <Text style={styles.preferenceValue}>
                      {formData.preferredHours?.start || '08:00'} - {formData.preferredHours?.end || '18:00'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.preferencesSection}>
                <Text style={styles.sectionTitle}>Jours disponibles</Text>
                <View style={styles.daysContainer}>
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, index) => (
                    <View 
                      key={day} 
                      style={[
                        styles.dayBadge, 
                        formData.availableDays?.includes(index) ? styles.dayBadgeActive : styles.dayBadgeInactive
                      ]}
                    >
                      <Text 
                        style={[
                          styles.dayText, 
                          formData.availableDays?.includes(index) ? styles.dayTextActive : styles.dayTextInactive
                        ]}
                      >
                        {day.substring(0, 3)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.preferencesSection}>
                <Text style={styles.sectionTitle}>Types d'hébergement préférés</Text>
                <View style={styles.accommodationTypesContainer}>
                  {formData.preferredAccommodationTypes?.map(type => (
                    <View key={type} style={styles.accommodationTypeBadge}>
                      <Text style={styles.accommodationTypeText}>{type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
        
        <View style={[styles.card, shadows.medium]}>
          <Text style={styles.cardTitle}>Conseils pour optimiser vos missions</Text>
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={22} color={colors.warning} />
            <Text style={styles.tipText}>
              Un rayon de recherche plus large vous donnera accès à plus d'opportunités
            </Text>
          </View>
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={22} color={colors.warning} />
            <Text style={styles.tipText}>
              Définir plusieurs types d'hébergement augmentera vos chances de trouver des missions
            </Text>
          </View>
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={22} color={colors.warning} />
            <Text style={styles.tipText}>
              Les week-ends sont généralement très demandés avec des tarifs plus avantageux
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    margin: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    ...typography.button,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  preferencesDisplay: {
    paddingVertical: spacing.sm,
  },
  preferencesSection: {
    marginBottom: spacing.md,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  preferenceTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  preferenceLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  preferenceValue: {
    ...typography.body,
    fontWeight: '500',
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  dayBadge: {
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    minWidth: 50,
    alignItems: 'center',
  },
  dayBadgeActive: {
    backgroundColor: colors.primary,
  },
  dayBadgeInactive: {
    backgroundColor: colors.backgroundAlt,
  },
  dayText: {
    ...typography.caption,
    fontWeight: '500',
  },
  dayTextActive: {
    color: colors.background,
  },
  dayTextInactive: {
    color: colors.textSecondary,
  },
  accommodationTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  accommodationTypeBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  accommodationTypeText: {
    ...typography.caption,
    color: colors.primary,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  tipText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 8,
  },
  successText: {
    ...typography.body,
    color: colors.success,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default PreferencesScreen;