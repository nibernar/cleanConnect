import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { colors, spacing, typography } from '../../utils/theme';
import Input from '../common/Input';
import Button from '../common/Button';
import DateTimePicker from '../common/DateTimePicker';
import { validateForm } from '../../utils/errorHandler';
import { listingSchema } from '../../utils/validationSchemas';
import { calculateListingPrice } from '../../utils/priceCalculator';
import { formatCurrency } from '../../utils/formatters';

// Map backend accommodation types to frontend display strings
const ACCOMMODATION_TYPES = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'house', label: 'Maison' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
  { value: 'villa', label: 'Villa' },
  { value: 'hotel_room', label: "Chambre d'hôtel" },
  { value: 'other', label: 'Autre' }
];

// Map backend service types to frontend display strings
const SERVICES = [
  { value: 'regular_cleaning', label: 'Dépoussiérage' },
  { value: 'regular_cleaning', label: 'Nettoyage des sols' },
  { value: 'bathroom_cleaning', label: 'Nettoyage salle de bain' },
  { value: 'kitchen_cleaning', label: 'Nettoyage cuisine' },
  { value: 'bed_making', label: 'Changement des draps' },
  { value: 'window_cleaning', label: 'Nettoyage des vitres' }
];

// Map backend equipment types to frontend display strings
const EQUIPMENT = [
  { value: 'vacuum', label: 'Aspirateur' },
  { value: 'mop', label: 'Serpillière' },
  { value: 'products', label: 'Produits ménagers' },
  { value: 'dishwasher', label: 'Lave-vaisselle' },
  { value: 'washer', label: 'Lave-linge' }
];

/**
 * Form to create or edit a cleaning listing
 * @param {Object} initialValues - Initial form values for editing
 * @param {function} onSubmit - Function to handle form submission
 * @param {boolean} isLoading - Loading state
 */
const ListingForm = ({ initialValues = {}, onSubmit, isLoading = false }) => {
  const [form, setForm] = useState({
    title: '',
    accommodationType: ACCOMMODATION_TYPES[0].label,
    address: '',
    peopleNeeded: '1',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
    area: '',
    services: {},
    equipment: {},
    notes: '',
    ...initialValues,
  });

  const [errors, setErrors] = useState({});
  const [priceData, setPriceData] = useState({
    baseAmount: 0,
    commission: 0,
    totalAmount: 0
  });
  const [touched, setTouched] = useState({});

  // Initialize services and equipment objects
  useEffect(() => {
    if (!Object.keys(form.services).length) {
      const servicesObj = {};
      SERVICES.forEach(service => {
        servicesObj[service.label] = initialValues.services?.[service.label] || false;
      });
      setForm(prev => ({ ...prev, services: servicesObj }));
    }

    if (!Object.keys(form.equipment).length) {
      const equipmentObj = {};
      EQUIPMENT.forEach(equipment => {
        equipmentObj[equipment.label] = initialValues.equipment?.[equipment.label] || false;
      });
      setForm(prev => ({ ...prev, equipment: equipmentObj }));
    }
  }, []);

  // Calculate price based on area, services and time
  useEffect(() => {
    if (!form.area) return;

    // Data needed for price calculation
    const priceData = {
      squareMeters: parseFloat(form.area) || 0,
      startTime: form.startTime,
      endTime: form.endTime,
      services: []
    };
    
    // Convert services from object to array format for price calculation
    if (form.services) {
      Object.entries(form.services).forEach(([key, value]) => {
        if (value) {
          const serviceObj = SERVICES.find(s => s.label === key);
          if (serviceObj) {
            priceData.services.push(serviceObj.value);
          }
        }
      });
    }
    
    // Calculate the price
    const calculatedPrice = calculateListingPrice(priceData);
    setPriceData(calculatedPrice);
    
  }, [form.area, form.services, form.startTime, form.endTime]);

  // Mark field as touched when changed
  const markAsTouched = (field) => {
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  };

  // Form input change handler
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    markAsTouched(field);
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle toggle of services
  const handleServiceToggle = (service) => {
    setForm(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: !prev.services[service]
      }
    }));
    markAsTouched('services');
    
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: null }));
    }
  };

  // Handle toggle of equipment
  const handleEquipmentToggle = (equipment) => {
    setForm(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [equipment]: !prev.equipment[equipment]
      }
    }));
    markAsTouched('equipment');
  };

  // Validate the form using our schema
  const validateFormData = () => {
    // Prepare form data for validation
    const validationData = {
      ...form,
      // Validate both area and squareMeters fields since backend uses squareMeters
      squareMeters: form.area
    };
    
    // Use our validation utility with the listing schema
    const { isValid, errors: validationErrors } = validateForm(validationData, listingSchema);
    setErrors(validationErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = () => {
    // First validate the form
    if (validateFormData()) {
      // Transform form data to match backend expectations
      const transformedData = {
        ...form,
        
        // Convert services from object to array format
        services: Object.entries(form.services)
          .filter(([_, selected]) => selected)
          .map(([label]) => {
            const serviceObj = SERVICES.find(s => s.label === label);
            return serviceObj ? serviceObj.value : null;
          })
          .filter(Boolean), // Remove any null values
        
        // Convert equipment from object to array format
        equipment: Object.entries(form.equipment)
          .filter(([_, selected]) => selected)
          .map(([label]) => {
            const equipmentObj = EQUIPMENT.find(e => e.label === label);
            return equipmentObj ? equipmentObj.value : null;
          })
          .filter(Boolean), // Remove any null values
        
        // Rename peopleNeeded to personCount for backend compatibility
        personCount: parseInt(form.peopleNeeded, 10),
        
        // Rename area to squareMeters for backend compatibility
        squareMeters: parseFloat(form.area),
        
        // Include calculated price
        price: priceData
      };
      
      // Submit the transformed data
      onSubmit(transformedData);
    } else {
      // Mark all fields as touched to show all errors
      const allTouched = {};
      Object.keys(listingSchema).forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);
      
      // Show alert about validation errors
      Alert.alert(
        "Validation Error",
        "Please fix the highlighted errors before submitting."
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer une annonce de ménage</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations sur l'hébergement</Text>
        
        <Input
          label="Titre de l'annonce"
          value={form.title}
          onChangeText={(value) => handleInputChange('title', value)}
          placeholder="Ex: Nettoyage appartement 3 pièces"
          error={touched.title && errors.title}
          onBlur={() => markAsTouched('title')}
        />
        
        <Input
          label="Type d'hébergement"
          value={form.accommodationType}
          onChangeText={(value) => handleInputChange('accommodationType', value)}
          placeholder="Ex: Appartement, Maison, etc."
          error={touched.accommodationType && errors.accommodationType}
          onBlur={() => markAsTouched('accommodationType')}
        />
        
        <Input
          label="Adresse complète"
          value={form.address}
          onChangeText={(value) => handleInputChange('address', value)}
          placeholder="Adresse de l'hébergement"
          error={touched.address && errors.address}
          onBlur={() => markAsTouched('address')}
        />
        
        <Input
          label="Superficie (m²)"
          value={form.area.toString()}
          onChangeText={(value) => handleInputChange('area', value)}
          placeholder="Ex: 75"
          keyboardType="numeric"
          error={touched.area && errors.area}
          onBlur={() => markAsTouched('area')}
        />
        
        <Input
          label="Nombre de personnes nécessaires"
          value={form.peopleNeeded.toString()}
          onChangeText={(value) => handleInputChange('peopleNeeded', value)}
          placeholder="Ex: 1"
          keyboardType="numeric"
          error={touched.peopleNeeded && errors.personCount}
          onBlur={() => markAsTouched('peopleNeeded')}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date et horaires</Text>
        
        <DateTimePicker
          label="Date du ménage"
          value={new Date(form.date)}
          onChange={(value) => handleInputChange('date', value)}
          mode="date"
          error={touched.date && errors.date}
          onBlur={() => markAsTouched('date')}
        />
        
        <DateTimePicker
          label="Heure de début"
          value={new Date(form.startTime)}
          onChange={(value) => handleInputChange('startTime', value)}
          mode="time"
          error={touched.startTime && errors.startTime}
          onBlur={() => markAsTouched('startTime')}
        />
        
        <DateTimePicker
          label="Heure de fin"
          value={new Date(form.endTime)}
          onChange={(value) => handleInputChange('endTime', value)}
          mode="time"
          error={touched.endTime && errors.endTime}
          onBlur={() => markAsTouched('endTime')}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services à réaliser</Text>
        {touched.services && errors.services && (
          <Text style={styles.errorText}>{errors.services}</Text>
        )}
        
        {SERVICES.map(service => (
          <View key={service.label} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{service.label}</Text>
            <Switch
              value={form.services[service.label] || false}
              onValueChange={() => handleServiceToggle(service.label)}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={form.services[service.label] ? colors.secondary : colors.gray}
            />
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Équipements disponibles</Text>
        
        {EQUIPMENT.map(equipment => (
          <View key={equipment.label} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{equipment.label}</Text>
            <Switch
              value={form.equipment[equipment.label] || false}
              onValueChange={() => handleEquipmentToggle(equipment.label)}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={form.equipment[equipment.label] ? colors.secondary : colors.gray}
            />
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes supplémentaires</Text>
        
        <Input
          multiline
          numberOfLines={4}
          value={form.notes}
          onChangeText={(value) => handleInputChange('notes', value)}
          placeholder="Ajouter des instructions ou détails supplémentaires..."
          style={styles.textArea}
        />
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Prix estimé:</Text>
        <Text style={styles.priceValue}>{formatCurrency(priceData.totalAmount)}</Text>
        <View style={styles.priceDetails}>
          <Text style={styles.priceDetailText}>Prix de base: {formatCurrency(priceData.baseAmount)}</Text>
          <Text style={styles.priceDetailText}>Commission: {formatCurrency(priceData.commission)}</Text>
        </View>
        <Text style={styles.priceInfo}>
          (comprend une commission de 15% pour CleanConnect)
        </Text>
      </View>
      
      <Button
        title="Publier l'annonce"
        onPress={handleSubmit}
        loading={isLoading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
    color: colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    ...typography.body,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  priceContainer: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  priceLabel: {
    ...typography.body,
    fontWeight: 'bold',
  },
  priceValue: {
    ...typography.h2,
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  priceDetails: {
    marginVertical: spacing.xs,
  },
  priceDetailText: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: 2,
  },
  priceInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default ListingForm;