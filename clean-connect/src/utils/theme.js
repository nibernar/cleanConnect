/**
 * Application theme and styling constants
 */

export const colors = {
  primary: '#4E7AF0',     // Main brand color
  secondary: '#30C9B0',   // Secondary brand color
  background: '#FFFFFF',  // App background
  card: '#F8F9FA',        // Card background
  text: '#1A1A1A',        // Main text color
  textSecondary: '#6C757D', // Secondary text color
  border: '#E1E4E8',      // Border color
  error: '#E53935',       // Error/danger color
  success: '#4CAF50',     // Success color
  warning: '#FF9800',     // Warning color
  info: '#2196F3',        // Info color
  gray: '#BDBDBD',        // Gray color
  lightGray: '#E0E0E0',   // Light gray color
  darkGray: '#757575',    // Dark gray color
};

export const fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  h4: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 14,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    color: colors.textSecondary,
  },
};