import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Platform, TextInput } from 'react-native';
import { colors, spacing, typography } from '../../utils/theme';
import Input from '../common/Input';
import Button from '../common/Button';
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  try { DateTimePicker = require('../common/DateTimePicker').default; } catch (e) { console.warn("DateTimePicker failed to load."); }
}
import { validateForm } from '../../utils/errorHandler';
import { listingSchema } from '../../utils/validationSchemas';
import { calculateListingPrice } from '../../utils/priceCalculator';
import { formatCurrency } from '../../utils/formatters';

const ACCOMMODATION_TYPES = [ { value: 'apartment', label: 'Appartement' }, { value: 'house', label: 'Maison' },{ value: 'studio', label: 'Studio' }, { value: 'loft', label: 'Loft' },{ value: 'villa', label: 'Villa' }, { value: 'hotel_room', label: "Chambre d'hôtel" },{ value: 'other', label: 'Autre' } ];
// Correction: S'assurer que les 'value' sont uniques si possible pour la logique de transformation
const SERVICES = [
    { value: 'dusting', label: 'Dépoussiérage' }, 
    { value: 'floor_cleaning', label: 'Nettoyage des sols' }, 
    { value: 'bathroom_cleaning', label: 'Nettoyage salle de bain' }, 
    { value: 'kitchen_cleaning', label: 'Nettoyage cuisine' }, 
    { value: 'bed_making', label: 'Changement des draps' }, 
    { value: 'window_cleaning', label: 'Nettoyage des vitres' }
];
const EQUIPMENT = [ { value: 'vacuum', label: 'Aspirateur' }, { value: 'mop', label: 'Serpillière' }, { value: 'products', label: 'Produits ménagers' }, { value: 'dishwasher', label: 'Lave-vaisselle' }, { value: 'washer', label: 'Lave-linge' } ];

const ListingForm = ({ initialValues = {}, onSubmit, isLoading = false, onCancel }) => {
  console.log('[ListingForm] Rendering with initialValues:', initialValues);

  const [form, setForm] = useState(() => {
    console.log('[ListingForm] Initializing state function entered...');
    try {
        const defaultStartTime = new Date();
        defaultStartTime.setHours(9, 0, 0, 0); // Défaut 9h00
        const defaultEndTime = new Date(defaultStartTime);
        defaultEndTime.setHours(defaultStartTime.getHours() + 2); // Défaut 11h00

        // Initialiser services/equipment basé sur les constantes et initialValues
        const initialServices = {};
        SERVICES.forEach(service => {
             // Si initialValues.services est un tableau (backend format), vérifier la présence de service.value
             // Si initialValues.services est un objet (format state), vérifier la clé service.label
            const isInitiallyChecked = Array.isArray(initialValues.services) 
                ? initialValues.services.includes(service.value) 
                : !!initialValues.services?.[service.label];
            initialServices[service.label] = isInitiallyChecked;
        });
        const initialEquipment = {};
        EQUIPMENT.forEach(equipment => {
            const isInitiallyChecked = Array.isArray(initialValues.equipment)
                ? initialValues.equipment.includes(equipment.value)
                : !!initialValues.equipment?.[equipment.label];
            initialEquipment[equipment.label] = isInitiallyChecked;
        });

        // Construire l'état initial
        const initialData = {
            title: initialValues.title || '', 
            accommodationType: initialValues.accommodationType || ACCOMMODATION_TYPES?.[0]?.value || 'other', 
            address: initialValues.address || '',
            // Pré-remplir la localisation si disponible dans initialValues
            city: initialValues.city || initialValues.location?.city || '',
            postalCode: initialValues.postalCode || initialValues.location?.postalCode || '',
            peopleNeeded: String(initialValues.personCount || initialValues.peopleNeeded || '1'),
            // Gérer les formats de date/heure (string ou Date)
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
        // Retourner un état de base pour éviter le crash complet
        return { title:'', accommodationType:'Autre', address:'', peopleNeeded:'1', date:'', startTime:'', endTime:'', area:'', services:{}, equipment:{}, notes:'' };
    }
  });

  const [errors, setErrors] = useState({});
  const [priceData, setPriceData] = useState({ baseAmount: 0, commission: 0, totalAmount: 0 });
  const [touched, setTouched] = useState({});

  // useEffect pour calcul de prix (toujours commenté)
  /* useEffect(() => { ... }, [form?.area, ...]); */

  const markAsTouched = (field) => { /* ... */ };
  const handleInputChange = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); markAsTouched(field); if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  const handleServiceToggle = (serviceLabel) => { setForm(prev => ({ ...prev, services: { ...prev.services, [serviceLabel]: !prev.services[serviceLabel] } })); markAsTouched('services'); if (errors.services) setErrors(prev => ({ ...prev, services: null })); };
  const handleEquipmentToggle = (equipmentLabel) => { setForm(prev => ({ ...prev, equipment: { ...prev.equipment, [equipmentLabel]: !prev.equipment[equipmentLabel] } })); markAsTouched('equipment'); };
  const validateFormData = () => { /* ... */ return true; }; 
  const handleSubmit = () => { /* ... */ };

  console.log('[ListingForm] Before rendering JSX. Form state:', form ? 'Defined Object' : form);
  if(!form) {
      // Si form est toujours null/undefined ici, c'est très grave
      return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Erreur critique: Impossible d'initialiser le formulaire.</Text></View>
  }

  // --- JSX Complet Restauré --- 
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Infos Hébergement</Text>
        <Input label="Titre" value={form.title} onChangeText={v => handleInputChange('title', v)} error={errors.title} style={styles.input}/>
        {/* Utiliser un Picker/Select pour accommodationType */}
        {/* <Input label="Type" value={form.accommodationType} ... /> */}
        <Input label="Adresse" value={form.address} onChangeText={v => handleInputChange('address', v)} error={errors.address} style={styles.input}/>
        {/* Ajouter City & Postal Code? */}
        <Input label="Superficie (m²)" value={form.area} onChangeText={v => handleInputChange('area', v)} keyboardType="numeric" error={errors.area} style={styles.input}/>
        <Input label="Personnes" value={form.peopleNeeded} onChangeText={v => handleInputChange('peopleNeeded', v)} keyboardType="numeric" error={errors.personCount} style={styles.input}/>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date et horaires</Text>
        {Platform.OS !== 'web' && DateTimePicker ? (
            <>
                <DateTimePicker label="Date" value={new Date(form.date)} onChange={d => handleInputChange('date', d.toISOString().split('T')[0])} mode="date" error={errors.date} />
                <DateTimePicker label="Début" value={new Date(`1970-01-01T${form.startTime || '09:00'}:00`)} onChange={d => handleInputChange('startTime', d.toLocaleTimeString('fr-FR',{hour:'2-digit', minute:'2-digit'}))} mode="time" error={errors.startTime} />
                <DateTimePicker label="Fin" value={new Date(`1970-01-01T${form.endTime || '11:00'}:00`)} onChange={d => handleInputChange('endTime', d.toLocaleTimeString('fr-FR',{hour:'2-digit', minute:'2-digit'}))} mode="time" error={errors.endTime} />
            </>
        ) : (
            <>
                <Input label="Date (YYYY-MM-DD)" value={form.date} onChangeText={v => handleInputChange('date', v)} placeholder="YYYY-MM-DD" error={errors.date} style={styles.input}/>
                <Input label="Début (HH:MM)" value={form.startTime} onChangeText={v => handleInputChange('startTime', v)} placeholder="HH:MM" error={errors.startTime} style={styles.input}/>
                <Input label="Fin (HH:MM)" value={form.endTime} onChangeText={v => handleInputChange('endTime', v)} placeholder="HH:MM" error={errors.endTime} style={styles.input}/>
            </>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services</Text>
        {errors?.services && <Text style={styles.errorText}>{errors.services}</Text>}
        {SERVICES.map(service => (
          <View key={service.value} style={styles.toggleRow}> {/* Utiliser value pour key */} 
            <Text style={styles.toggleLabel}>{service.label}</Text>
            <Switch value={form.services[service.label] || false} onValueChange={() => handleServiceToggle(service.label)} trackColor={{ false: colors?.lightGray, true: colors?.primary }} thumbColor={form.services[service.label] ? colors?.secondary : colors?.gray}/>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Équipements</Text>
        {EQUIPMENT.map(equipment => (
          <View key={equipment.value} style={styles.toggleRow}> {/* Utiliser value pour key */} 
            <Text style={styles.toggleLabel}>{equipment.label}</Text>
            <Switch value={form.equipment[equipment.label] || false} onValueChange={() => handleEquipmentToggle(equipment.label)} trackColor={{ false: colors?.lightGray, true: colors?.primary }} thumbColor={form.equipment[equipment.label] ? colors?.secondary : colors?.gray}/>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Input multiline numberOfLines={4} value={form.notes} onChangeText={v => handleInputChange('notes', v)} placeholder="Instructions..." style={styles.textArea}/>
      </View>
      
      <View style={styles.formButtons}>
          {onCancel && <Button title="Annuler" onPress={onCancel} type="outline" style={styles.cancelButton}/>}
          <Button title="Publier" onPress={handleSubmit} loading={isLoading} style={styles.submitButton}/>
      </View>
    </View>
  );
};

// Styles
let styles = {};
try {
    styles = StyleSheet.create({ /* ... styles ... */ });
} catch(e) {
     console.error("Style error ListingForm:", e);
     styles = StyleSheet.create({ /* fallback */ });
}

export default ListingForm;
