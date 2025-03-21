import React from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import DiagnosticTool from '../../components/dev/DiagnosticTool';
import { colors } from '../../utils/theme';

/**
 * Screen for running diagnostic tests for developers
 * Only available in development mode
 */
const DiagnosticScreen = () => {
  // Check if we're in development mode
  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>
          This screen is only available in development mode.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <DiagnosticTool />
    </SafeAreaView>
  );
};

DiagnosticScreen.navigationOptions = {
  title: 'Developer Diagnostics',
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: '#fff',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default DiagnosticScreen;