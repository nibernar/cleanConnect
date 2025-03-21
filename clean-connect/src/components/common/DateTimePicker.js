import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../utils/theme';
import { formatDate } from '../../utils/formatters';
import { fr } from 'date-fns/locale';

/**
 * Date and time picker component
 * @param {string} label - Input label
 * @param {Date} value - Selected date
 * @param {function} onChange - Function called when date changes
 * @param {string} mode - 'date', 'time', or 'datetime'
 * @param {string} format - Date format string
 * @param {string} placeholder - Placeholder text
 * @param {boolean} error - Error state
 * @param {string} errorText - Error message
 */
const DateTimePicker = ({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder = 'Sélectionner',
  error = false,
  errorText = '',
  style,
}) => {
  const [isPickerVisible, setPickerVisible] = useState(false);

  const showPicker = () => {
    setPickerVisible(true);
  };

  const hidePicker = () => {
    setPickerVisible(false);
  };

  const handleConfirm = (date) => {
    hidePicker();
    onChange(date);
  };

  const getFormattedValue = () => {
    if (!value) return '';

    switch (mode) {
      case 'time':
        return formatDate(value, 'HH:mm', { locale: fr });
      case 'datetime':
        return formatDate(value, 'dd MMMM yyyy à HH:mm', { locale: fr });
      default:
        return formatDate(value, 'dd MMMM yyyy', { locale: fr });
    }
  };

  const getPickerIcon = () => {
    switch (mode) {
      case 'time':
        return 'time-outline';
      default:
        return 'calendar-outline';
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={[
          styles.input,
          error && styles.inputError
        ]} 
        onPress={showPicker}
      >
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value ? getFormattedValue() : placeholder}
        </Text>
        <Ionicons name={getPickerIcon()} size={24} color={colors.primary} />
      </TouchableOpacity>
      
      {errorText && <Text style={styles.errorText}>{errorText}</Text>}
      
      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode={mode}
        date={value || new Date()}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
        locale="fr-FR"
        cancelTextIOS="Annuler"
        confirmTextIOS="Confirmer"
        headerTextIOS={label}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    ...typography.bodySmall,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  inputError: {
    borderColor: colors.error,
  },
  valueText: {
    ...typography.body,
    color: colors.text,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

export default DateTimePicker;