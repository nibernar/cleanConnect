import React from 'react';
import { View, Modal as RNModal, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors, shadows, spacing, typography } from '../../utils/theme';
import Button from './Button';

/**
 * Custom modal component
 * @param {boolean} visible - Whether modal is visible
 * @param {function} onClose - Function to close modal
 * @param {string} title - Modal title
 * @param {ReactNode} children - Modal content
 * @param {string} confirmText - Text for confirm button
 * @param {function} onConfirm - Function for confirm action
 * @param {string} cancelText - Text for cancel button
 * @param {boolean} showButtons - Whether to show action buttons
 */
const Modal = ({
  visible,
  onClose,
  title,
  children,
  confirmText = 'Confirmer',
  onConfirm,
  cancelText = 'Annuler',
  showButtons = true,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View 
          style={styles.container} 
          onStartShouldSetResponder={() => true}
          onTouchEnd={e => e.stopPropagation()}
        >
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={styles.content}>{children}</View>
          
          {showButtons && (
            <View style={styles.buttonContainer}>
              <Button 
                title={cancelText} 
                onPress={onClose} 
                type="outline"
                style={styles.cancelButton}
              />
              <Button 
                title={confirmText} 
                onPress={onConfirm} 
                style={styles.confirmButton}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 500,
    ...shadows.medium,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  content: {
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});

export default Modal;