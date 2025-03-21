import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import RegisterHostScreen from '../../src/screens/auth/RegisterHostScreen';
import colors from '../../src/utils/colors';

export default function HostRegistration() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Inscription Propriétaire',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <RegisterHostScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});