import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../utils/theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Message bubble component for chat messages
 * @param {Object} message - Message data
 * @param {boolean} isOwn - Whether the message is from the current user
 */
const MessageBubble = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm', { locale: fr });
  };

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownContainer : styles.otherContainer
    ]}>
      <View style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownText : styles.otherText
        ]}>
          {message.text}
        </Text>
      </View>
      <Text style={[
        styles.timestamp,
        isOwn ? styles.ownTimestamp : styles.otherTimestamp
      ]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ownBubble: {
    backgroundColor: colors.primary,
  },
  otherBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    ...typography.body,
  },
  ownText: {
    color: colors.background,
  },
  otherText: {
    color: colors.text,
  },
  timestamp: {
    ...typography.caption,
    marginTop: 4,
  },
  ownTimestamp: {
    color: colors.textSecondary,
  },
  otherTimestamp: {
    color: colors.textSecondary,
  },
});

export default MessageBubble;