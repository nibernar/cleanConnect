import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import colors from '../../utils/colors';

/**
 * Loading screen shown during authentication state verification
 * Displays a loading spinner and message
 */
const AuthLoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  }
});

export default AuthLoadingScreen;