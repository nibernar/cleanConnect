/**
 * Colors for the application
 * This file extends colors from theme.js and adds additional color definitions
 * needed throughout the application
 */

import { colors as themeColors } from './theme';

// Extend the theme colors with additional colors used in components
const colors = {
  ...themeColors,
  
  // Additional colors not defined in theme.js
  textLight: '#A0A0A0',         // Light text color for secondary information
  lightText: '#A0A0A0',         // Alias for textLight (used in some components)
  textTertiary: '#CCCCCC',      // Third-level text color (less emphasis than textSecondary)
  
  // Background variations
  errorBackground: '#FFEBEE',   // Light background for error messages
  lightBackground: '#F5F5F5',   // Light background for cards/containers
  backgroundAlt: '#F0F0F0',     // Alternative background color
  unreadBackground: '#EBF5FF',  // Background for unread notifications
  
  // Lighter shades of primary colors (used for status indicators and backgrounds)
  primaryLight: '#E3F2FD',      // Lighter shade of primary color
  successLight: '#E8F5E9',      // Lighter shade of success color
  errorLight: '#FFEBEE',        // Lighter shade of error color
  infoLight: '#E1F5FE',         // Lighter shade of info color
  warningLight: '#FFF8E1',      // Lighter shade of warning color
};

export default colors;