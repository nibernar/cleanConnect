import React from 'react';
import { SafeAreaView } from 'react-native';
import DiagnosticTool from '../../src/components/dev/DiagnosticTool';

/**
 * Screen that provides diagnostic tools for developers
 * This screen helps debug authentication and API issues
 */
export default function DiagnosticScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DiagnosticTool />
    </SafeAreaView>
  );
}