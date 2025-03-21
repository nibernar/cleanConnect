import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import RegisterCleanerScreen from '../../src/screens/auth/RegisterCleanerScreen';
import colors from '../../src/utils/colors';

export default function CleanerRegistration() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Inscription Agent de nettoyage',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <RegisterCleanerScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});