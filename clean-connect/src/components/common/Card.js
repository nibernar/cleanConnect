import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, spacing } from '../../utils/theme';

/**
 * Card component with optional press handler
 * @param {ReactNode} children - Card content
 * @param {function} onPress - Function to execute on press
 * @param {Object} style - Additional styles
 * @param {boolean} noShadow - Disable shadow
 */
const Card = ({ 
  children, 
  onPress, 
  style, 
  noShadow = false,
  ...props 
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={[
        styles.card,
        !noShadow && shadows.small,
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default Card;