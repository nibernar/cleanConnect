// Enhanced platform-specific module handling
import { Platform } from 'react-native';

// Export appropriate modules based on platform
export const getModules = () => {
  if (Platform.OS === 'web') {
    // Web-specific implementations
    return {
      Notifications: require('../mocks/expo-notifications'),
      MapView: require('../mocks/react-native-maps-mock').MapView,
      MapMarker: require('../mocks/react-native-maps-mock').Marker,
      // Add other platform-specific modules here
    };
  } else {
    // Native implementations
    return {
      Notifications: require('expo-notifications'),
      MapView: require('react-native-maps').default,
      MapMarker: require('react-native-maps').Marker,
      // Add other platform-specific modules here
    };
  }
};

// Helper function to get individual modules
export const getModule = (moduleName) => {
  const modules = getModules();
  return modules[moduleName];
};

// Convenience exports for common modules
export const MapView = getModule('MapView');
export const MapMarker = getModule('MapMarker');

export default getModules;