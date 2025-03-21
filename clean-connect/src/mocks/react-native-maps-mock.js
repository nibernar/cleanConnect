/**
 * React Native Maps mock for web platform
 * 
 * This provides compatible component substitutes when running on web
 * where native map components aren't available.
 */

import React from 'react';
import { View, Text } from 'react-native';

// Mock MapView component
const MapView = ({ style, children, ...props }) => (
  <View 
    style={[
      { 
        backgroundColor: '#e0e0e0', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: 8,
        overflow: 'hidden',
      }, 
      style
    ]}
    {...props}
  >
    <Text style={{ fontWeight: 'bold', padding: 16 }}>Map View</Text>
    <Text style={{ padding: 8 }}>Maps are not available in web preview</Text>
    {children}
  </View>
);

// Mock Marker component
const Marker = ({ style, ...props }) => (
  <View 
    style={[{ width: 10, height: 10, backgroundColor: 'red', borderRadius: 5 }, style]}
    {...props}
  />
);

// Mock other components
const Callout = ({ children, ...props }) => (
  <View style={{ padding: 8, backgroundColor: 'white', borderRadius: 4 }} {...props}>
    {children}
  </View>
);

// Export all the mock components
export default MapView;
export { MapView, Marker, Callout };

// Add any other components or constants needed
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

// Add AnimatedRegion
export const AnimatedRegion = class {
  constructor(region) {
    this.region = region;
  }
  
  timing() {
    return { start: (callback) => callback && callback() };
  }
};

// Provide any other exports the real package would have
export const MAP_TYPES = {
  STANDARD: 'standard',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
  NONE: 'none',
};