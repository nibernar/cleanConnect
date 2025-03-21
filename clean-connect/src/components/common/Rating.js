import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../utils/theme';

/**
 * Star rating component
 * @param {number} value - Current rating value (0-5)
 * @param {function} onChange - Function called when rating changes
 * @param {number} size - Size of stars
 * @param {boolean} readonly - Whether rating can be changed
 */
const Rating = ({ 
  value = 0, 
  onChange, 
  size = 24, 
  readonly = false 
}) => {
  // Ensure value is between 0 and 5
  const safeValue = Math.min(5, Math.max(0, value));
  
  const handlePress = (rating) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <TouchableOpacity
          key={rating}
          onPress={() => handlePress(rating)}
          disabled={readonly}
          style={styles.starContainer}
        >
          <Ionicons
            name={rating <= safeValue ? 'star' : 'star-outline'}
            size={size}
            color={rating <= safeValue ? colors.warning : colors.gray}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: spacing.xs,
  },
});

export default Rating;