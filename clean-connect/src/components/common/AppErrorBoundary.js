import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ErrorBoundary from './ErrorBoundary';
import colors from '../../utils/colors';
import { logError } from '../../utils/errorHandler';

/**
 * App-wide error boundary that provides a friendly UI when uncaught errors occur
 * Has additional app restart capabilities and error reporting
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Fatal application error caught by AppErrorBoundary:', error, errorInfo);
    
    // Log with our error handling system
    logError(error, 'Application Crash', { componentStack: errorInfo?.componentStack });
    
    this.setState({ errorInfo });
  }

  handleRestart = () => {
    // In a real application, this would use something like RNRestart to restart the app
    // For now, we'll just reset the error state
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // If a callback was provided, call it
    if (this.props.onRestart) {
      this.props.onRestart();
    }
  };

  handleReport = () => {
    // This would send a detailed error report to your backend in a real app
    if (this.props.onReportError) {
      this.props.onReportError(this.state.error, this.state.errorInfo);
    }
    
    alert('Thank you for reporting this issue. Our team has been notified.');
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={80} color={colors.error} />
            </View>
            
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            <Text style={styles.message}>
              The application encountered an unexpected error.
              This problem has been logged automatically.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.stackTrace}>{this.state.errorInfo.componentStack}</Text>
                )}
              </View>
            )}
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={this.handleRestart}
              >
                <Text style={styles.primaryButtonText}>Restart App</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={this.handleReport}
              >
                <Text style={styles.secondaryButtonText}>Report Problem</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  errorDetails: {
    width: '100%',
    padding: 15,
    backgroundColor: colors.errorBackground,
    borderRadius: 8,
    marginBottom: 30,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 10,
  },
  stackTrace: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
});

export default AppErrorBoundary;