import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Platform, TextInput } from 'react-native';
// *** AJOUT: Importer Picker ***
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, typography } from '../../utils/theme';
import Input from '../common/Input';
import Button from '../common/Button';
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  try { DateTimePicker = require('../common/DateTimePicker').default; } catch (e) { console.warn("DateTimePicker failed to load."); }
}
import { validateForm } from '../../utils/errorHandler';
import { listingSchema } from '../../utils/validationSchemas';
import { calculateListingPrice, formatPrice as formatCurrency } from '../../utils/priceCalculator';

// Déplacer les constantes AVANT le composant
const ACCOMMODATION_TYPES = [ { value: 'apartment', label: 'Appartement' }, { value: 'house', label: 'Maison' },{ value: 'studio', label: 'Studio' }, { value: 'loft', label: 'Loft' },{ value: 'villa', label: 'Villa' }, { value: 'hotel_room', label: "Chambre d'hôtel" },{ value: 'other', label: 'Autre' } ];
const SERVICES = [ { value: 'dusting', label: 'Dépoussiérage' }, { value: 'floor_cleaning', label: 'Nettoyage des sols' }, { value: 'bathroom_cleaning', label: 'Nettoyage salle de bain' }, { value: 'kitchen_cleaning', label: 'Nettoyage cuisine' }, { value: 'bed_making', label: 'Changement des draps' }, { value: 'window_cleaning', label: 'Nettoyage des vitres' } ];
const EQUIPMENT = [ { value: 'vacuum', label: 'Aspirateur' }, { value: 'mop', label: 'Serpillière' }, { value: 'products', label: 'Produits ménagers' }, { value: 'dishwasher', label: 'Lave-vaisselle' }, { value: 'washer', label: 'Lave-linge' } ];

const ListingForm = ({ initialValues = {}, onSubmit, isLoading = false, onCancel }) => {
  // ... (useState, useEffect, handlers inchangés) ...
  console.log('[ListingForm] Rendering with initialValues:', initialValues);

  const [form, setForm] = useState(() => {
    console.log('[ListingForm] Initializing state function entered...');
    try {
        const defaultStartTime = new Date();
        defaultStartTime.setHours(9, 0, 0, 0);
        const defaultEndTime = new Date(defaultStartTime);
        defaultEndTime.setHours(defaultStartTime.getHours() + 2);

        const initialServices = {};
        SERVICES.forEach(service => {
            const isInitiallyChecked = Array.isArray(initialValues.services)
                ? initialValues.services.includes(service.value) || initialValues.services.includes(service.label) // Handle both formats
                : !!initialValues.services?.[service.label];
            initialServices[service.label] = isInitiallyChecked;
        });
        const initialEquipment = {};
        EQUIPMENT.forEach(equipment => {
            const isInitiallyChecked = Array.isArray(initialValues.equipment)
                ? initialValues.equipment.includes(equipment.value) || initialValues.equipment.includes(equipment.label) // Handle both formats
                : !!initialValues.equipment?.[equipment.label];
            initialEquipment[equipment.label] = isInitiallyChecked;
        });

        const initialData = {
            title: initialValues.title || '',
            // *** ASSURER que la valeur initiale correspond bien à une 'value' de ACCOMMODATION_TYPES ***
            accommodationType: initialValues.accommodationType || ACCOMMODATION_TYPES?.[0]?.value || 'other',
            address: initialValues.address || '',
            city: initialValues.city || initialValues.location?.city || '',
            postalCode: initialValues.postalCode || initialValues.location?.postalCode || '',
            peopleNeeded: String(initialValues.personCount || initialValues.peopleNeeded || '1'),
            date: initialValues.dateRequired?.startDate || initialValues.date || new Date().toISOString().split('T')[0],
            startTime: initialValues.dateRequired?.startTime || initialValues.startTime || defaultStartTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            endTime: initialValues.dateRequired?.endTime || initialValues.endTime || defaultEndTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            area: String(initialValues.squareMeters || initialValues.area || ''),
            services: initialServices,
            equipment: initialEquipment,
            notes: initialValues.notes || '',
        };
        console.log('[ListingForm] Initial state calculated:', initialData);
        return initialData;
    } catch (initError) {
        console.error("[ListingForm] CRITICAL ERROR during useState initialization:", initError);
        return { title:'', accommodationType:'other', address:'', city:'', postalCode:'', peopleNeeded:'1', date:'', startTime:'', endTime:'', area:'', services:{}, equipment:{}, notes:'' };
    }
  });

  const [errors, setErrors] = useState({});
  const [priceData, setPriceData] = useState(null);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (form.startTime && form.endTime && form.area) {
      const dataForCalc = {
        startTime: form.startTime,
        endTime: form.endTime,
        area: form.area,
        services: form.services
      };
      try {
        const calculatedPrice = calculateListingPrice(dataForCalc);
        setPriceData(calculatedPrice);
        console.log('[ListingForm] Price recalculated:', calculatedPrice);
      } catch (calcError) {
          console.error("[ListingForm] Error calculating price:", calcError);
          setPriceData(null);
      }
    } else {
        setPriceData(null);
    }
  }, [form.startTime, form.endTime, form.area, form.services]);

  const markAsTouched = (field) => { setTouched(prev => ({...prev, [field]: true})) };
  const handleInputChange = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); markAsTouched(field); if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  const handleServiceToggle = (serviceLabel) => { setForm(prev => ({ ...prev, services: { ...prev.services, [serviceLabel]: !prev.services[serviceLabel] } })); markAsTouched('services'); if (errors.services) setErrors(prev => ({ ...prev, services: null })); };
  const handleEquipmentToggle = (equipmentLabel) => { setForm(prev => ({ ...prev, equipment: { ...prev.equipment, [equipmentLabel]: !prev.equipment[equipmentLabel] } })); markAsTouched('equipment'); };

  const validateFormData = () => {
    const newErrors = {};
    if (!form.title) newErrors.title = 'Le titre est requis';
    if (!form.address) newErrors.address = 'L\'adresse est requise';
    if (!form.city) newErrors.city = 'La ville est requise';
    if (!form.postalCode) newErrors.postalCode = 'Le code postal est requis';
     // Validation Type Hébergement
    if (!form.accommodationType) newErrors.accommodationType = 'Le type d\'hébergement est requis';
    if (!form.area || isNaN(parseFloat(form.area)) || parseFloat(form.area) <= 0) newErrors.area = 'La superficie est invalide';
    if (!form.date) newErrors.date = 'La date est requise';
    if (!form.startTime) newErrors.startTime = 'L\'heure de début est requise';
    if (!form.endTime) newErrors.endTime = 'L\'heure de fin est requise';
    const selectedServices = Object.values(form.services).filter(Boolean).length;
    if (selectedServices === 0) newErrors.services = 'Veuillez sélectionner au moins un service';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateFormData()) {
      if (priceData) {
        const servicesForBackend = Object.entries(form.services)
            .filter(([_, value]) => value === true)
            .map(([label]) => SERVICES.find(s => s.label === label)?.value)
            .filter(Boolean);
        const equipmentForBackend = Object.entries(form.equipment)
            .filter(([_, value]) => value === true)
            .map(([label]) => EQUIPMENT.find(e => e.label === label)?.value)
            .filter(Boolean);
        const dataToSubmit = {
          ...form,
          services: servicesForBackend,
          equipment: equipmentForBackend,
          squareMeters: parseFloat(form.area),
          price: priceData
        };
        onSubmit(dataToSubmit);
      } else {
        Alert.alert("Erreur de Prix", "Le prix n'a pas pu être calculé. Vérifiez les heures et la superficie.");
      }
    } else {
      Alert.alert("Erreurs de Formulaire", "Veuillez corriger les erreurs indiquées.");
    }
  };

  console.log('[ListingForm] Before rendering JSX. Form state:', form ? 'Defined Object' : form);
  if(!form) {
      return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Erreur critique: Impossible d'initialiser le formulaire.</Text></View>
  }


  return (
    <ScrollView style={styles.scrollViewContainer}>
        <View style={styles.container}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Infos Hébergement</Text>
            <Input label="Titre" value={form.title} onChangeText={v => handleInputChange('title', v)} error={errors.title} onBlur={() => markAsTouched('title')} style={styles.input}/>

            {/* *** AJOUT: Picker pour Accommodation Type *** */}
            <Text style={styles.label}>Type d'hébergement</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.accommodationType}
                onValueChange={(itemValue) => handleInputChange('accommodationType', itemValue)}
                style={styles.picker}
                prompt="Sélectionnez un type" // Pour Android
              >
                {ACCOMMODATION_TYPES.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
            {errors.accommodationType && <Text style={styles.errorText}>{errors.accommodationType}</Text>}
            {/* *** FIN AJOUT Picker *** */}

            <Input label="Adresse" value={form.address} onChangeText={v => handleInputChange('address', v)} error={errors.address} onBlur={() => markAsTouched('address')} style={styles.input}/>
            <Input label="Ville" value={form.city} onChangeText={v => handleInputChange('city', v)} error={errors.city} onBlur={() => markAsTouched('city')} style={styles.input}/>
            <Input label="Code Postal" value={form.postalCode} onChangeText={v => handleInputChange('postalCode', v)} error={errors.postalCode} onBlur={() => markAsTouched('postalCode')} style={styles.input}/>
            <Input label="Superficie (m²)" value={form.area} onChangeText={v => handleInputChange('area', v)} keyboardType="numeric" error={errors.area} onBlur={() => markAsTouched('area')} style={styles.input}/>
            <Input label="Personnes nécessaires" value={form.peopleNeeded} onChangeText={v => handleInputChange('peopleNeeded', v)} keyboardType="numeric" error={errors.peopleNeeded} onBlur={() => markAsTouched('peopleNeeded')} style={styles.input}/>
          </View>

          {/* ... (Autres sections : Date/Heure, Services, Equipements, Notes) ... */}
           <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date et horaires</Text>
                {Platform.OS !== 'web' && DateTimePicker ? (
                    <>
                        <DateTimePicker label="Date" value={new Date(form.date || Date.now())} onChange={d => { handleInputChange('date', d.toISOString().split('T')[0]); markAsTouched('date'); }} mode="date" error={errors.date} />
                        <DateTimePicker label="Début" value={new Date(`1970-01-01T${form.startTime || '09:00'}:00`)} onChange={d => { handleInputChange('startTime', d.toLocaleTimeString('fr-FR',{hour:'2-digit', minute:'2-digit'})); markAsTouched('startTime'); }} mode="time" error={errors.startTime} />
                        <DateTimePicker label="Fin" value={new Date(`1970-01-01T${form.endTime || '11:00'}:00`)} onChange={d => { handleInputChange('endTime', d.toLocaleTimeString('fr-FR',{hour:'2-digit', minute:'2-digit'})); markAsTouched('endTime'); }} mode="time" error={errors.endTime} />
                    </>
                ) : (
                    <>
                        <Input label="Date (YYYY-MM-DD)" value={form.date} onChangeText={v => handleInputChange('date', v)} placeholder="YYYY-MM-DD" error={errors.date} onBlur={() => markAsTouched('date')} style={styles.input}/>
                        <Input label="Début (HH:MM)" value={form.startTime} onChangeText={v => handleInputChange('startTime', v)} placeholder="HH:MM" error={errors.startTime} onBlur={() => markAsTouched('startTime')} style={styles.input}/>
                        <Input label="Fin (HH:MM)" value={form.endTime} onChangeText={v => handleInputChange('endTime', v)} placeholder="HH:MM" error={errors.endTime} onBlur={() => markAsTouched('endTime')} style={styles.input}/>
                    </>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                {errors?.services && <Text style={styles.errorText}>{errors.services}</Text>}
                {SERVICES.map(service => (
                <View key={service.value} style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>{service.label}</Text>
                    <Switch value={form.services[service.label] || false} onValueChange={() => handleServiceToggle(service.label)} trackColor={{ false: colors?.lightGray || '#ccc', true: colors?.primary || '#007bff' }} thumbColor={form.services[service.label] ? (colors?.secondary || '#ffc107') : (colors?.gray || '#f4f3f4')}/>
                </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Équipements Fournis</Text>
                {EQUIPMENT.map(equipment => (
                <View key={equipment.value} style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>{equipment.label}</Text>
                    <Switch value={form.equipment[equipment.label] || false} onValueChange={() => handleEquipmentToggle(equipment.label)} trackColor={{ false: colors?.lightGray || '#ccc', true: colors?.primary || '#007bff' }} thumbColor={form.equipment[equipment.label] ? (colors?.secondary || '#ffc107') : (colors?.gray || '#f4f3f4')}/>
                </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Input multiline numberOfLines={4} value={form.notes} onChangeText={v => handleInputChange('notes', v)} placeholder="Instructions spécifiques..." style={styles.textArea}/>
            </View>

          {/* Section Prix */}
          {priceData && (
            <View style={styles.priceSection}>
              <Text style={styles.sectionTitle}>Estimation du Prix</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix de base (HT):</Text>
                <Text style={styles.priceValue}>{formatCurrency(priceData.baseAmount)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Commission CleanConnect (15%):</Text>
                <Text style={styles.priceValue}>{formatCurrency(priceData.commission)}</Text>
              </View>
              <View style={[styles.priceRow, styles.priceTotalRow]}>
                <Text style={styles.priceTotalLabel}>Total Estimé (TTC):</Text>
                <Text style={styles.priceTotalValue}>{formatCurrency(priceData.totalAmount)}</Text>
              </View>
            </View>
          )}

          {/* Boutons */}
          <View style={styles.formButtons}>
              {onCancel && <Button title="Annuler" onPress={onCancel} type="outline" style={styles.cancelButton}/>}<Button title="Vérifier et Publier" onPress={handleSubmit} loading={isLoading} style={styles.submitButton}/>
          </View>
        </View>
    </ScrollView>
  );
};

// Styles (ajout style pour Picker)
let styles = {};
try {
    styles = StyleSheet.create({
      scrollViewContainer: { flex: 1 },
      container: { padding: spacing.md },
      section: { marginBottom: spacing.lg },
      sectionTitle: { fontSize: typography.h3.fontSize, fontWeight: 'bold', marginBottom: spacing.md, color: colors?.text || '#111' },
      label: { // Style générique pour les labels (utilisé par Picker)
        fontSize: typography.bodySmall.fontSize,
        fontWeight: 'bold',
        marginBottom: spacing.xs,
        color: colors?.text || '#111',
      },
      input: { marginBottom: spacing.md },
      textArea: { height: 100, textAlignVertical: 'top', marginBottom: spacing.md },
      // *** AJOUT: Styles pour Picker ***
      pickerContainer: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        marginBottom: spacing.md, // Consistant avec Input
        backgroundColor: colors.background, // Fond blanc comme Input
         minHeight: 50, // Hauteur minimale comme Input
         justifyContent: 'center', // Centrer le picker verticalement
      },
      picker: {
        // Style spécifique au picker si nécessaire (peut différer web/native)
        // Sur le web, cela peut nécessiter des styles différents ou une lib custom
        // Sur native, on peut ajuster la hauteur, couleur, etc.
         height: 50, // Assurer une hauteur suffisante
      },
      // *** FIN AJOUT Styles Picker ***
      toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors?.border || '#eee' },
      toggleLabel: { fontSize: typography.body.fontSize, color: colors?.text || '#111' },
      priceSection: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors?.card || '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: colors?.border || '#eee' },
      priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
      priceLabel: { fontSize: typography.body.fontSize, color: colors?.textSecondary || '#6c757d' },
      priceValue: { fontSize: typography.body.fontSize, color: colors?.text || '#111', fontWeight: '500' },
      priceTotalRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors?.border || '#eee' },
      priceTotalLabel: { fontSize: typography.h4.fontSize, fontWeight: 'bold', color: colors?.text || '#111' },
      priceTotalValue: { fontSize: typography.h4.fontSize, fontWeight: 'bold', color: colors?.primary || '#4E7AF0' },
      formButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, gap: spacing.md },
      submitButton: { flex: 1 },
      cancelButton: { flex: 1 },
      errorText: { color: colors?.error || 'red', fontSize: typography.bodySmall.fontSize, marginBottom: spacing.sm, marginTop: -spacing.sm + spacing.xs } // Ajuster marge top pour erreur picker
    });
} catch(e) {
     console.error("Style error ListingForm:", e);
     styles = { scrollViewContainer:{}, container:{}, section:{}, sectionTitle:{}, label:{}, input:{}, textArea:{}, pickerContainer:{}, picker:{}, toggleRow:{}, toggleLabel:{}, priceSection:{}, priceRow:{}, priceLabel:{}, priceValue:{}, priceTotalRow:{}, priceTotalLabel:{}, priceTotalValue:{}, formButtons:{}, submitButton:{}, cancelButton:{}, errorText:{} };
}

export default ListingForm;
