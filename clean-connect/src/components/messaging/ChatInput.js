import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../../utils/theme';

/**
 * Input component for sending chat messages
 * @param {function} onSend - Function called when message is sent
 * @param {boolean} isLoading - Loading state
 */
const ChatInput = ({ onSend, isLoading = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim().length === 0 || isLoading) return;
    
    onSend(message.trim());
    setMessage('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Écrivez votre message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
          autoCapitalize="sentences"
        />
      </View>
      
      <TouchableOpacity 
        style={[
          styles.sendButton,
          (message.trim().length === 0 || isLoading) && styles.sendButtonDisabled
        ]}
        onPress={handleSend}
        disabled={message.trim().length === 0 || isLoading}
      >
        {isLoading ? (
          <Ionicons name="hourglass-outline" size={24} color={colors.background} />
        ) : (
          <Ionicons name="send" size={24} color={colors.background} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.small,
  },
  inputContainer: {
    flex: 1,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingTop: 10,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray,
  },
});

export default ChatInput;