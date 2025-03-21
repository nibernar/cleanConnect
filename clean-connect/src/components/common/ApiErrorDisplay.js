import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';

/**
 * A reusable component to display API errors with retry functionality
 * 
 * @param {Object} props Component props
 * @param {Object} props.error The error object to display
 * @param {Function} props.onRetry Function to call when retry is pressed
 * @param {string} props.message Custom message to display instead of the error message
 * @param {Object} props.style Additional styles to apply to the container
 */
const ApiErrorDisplay = ({ error, onRetry, message, style }) => {
  const errorMessage = message || (error?.message || 'Une erreur est survenue lors du chargement des données');
  
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="alert-circle" size={40} color={colors.error} />
      <Text style={styles.errorText}>{errorMessage}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
    borderRadius: 8,
    margin: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 10,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default ApiErrorDisplay;