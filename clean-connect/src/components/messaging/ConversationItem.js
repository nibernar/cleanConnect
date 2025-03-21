import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, typography } from '../../utils/theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * List item for conversations in messages list
 * @param {Object} conversation - Conversation data with lastMessage
 * @param {function} onPress - Function to execute on press
 */
const ConversationItem = ({ conversation, onPress }) => {
  const { participant, lastMessage, unreadCount } = conversation;
  
  // Format timestamp of last message
  const formatTimestamp = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    
    // If message was today, show time
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'HH:mm', { locale: fr });
    }
    
    // If message was within the last 7 days, show weekday
    const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return format(messageDate, 'EEEE', { locale: fr });
    }
    
    // Otherwise show date
    return format(messageDate, 'dd/MM/yyyy', { locale: fr });
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={
            participant.profileImage 
              ? { uri: participant.profileImage } 
              : require('../../assets/default-avatar.png')
          }
          style={styles.avatar}
        />
        {participant.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {participant.firstName} {participant.lastName}
          </Text>
          <Text style={styles.timestamp}>
            {lastMessage ? formatTimestamp(lastMessage.createdAt) : ''}
          </Text>
        </View>
        
        <View style={styles.messageRow}>
          {lastMessage?.listing && (
            <View style={styles.listingBadge}>
              <Text style={styles.listingText}>Mission</Text>
            </View>
          )}
          
          <Text style={[
            styles.messagePreview,
            unreadCount > 0 && styles.unreadMessage
          ]} numberOfLines={1}>
            {lastMessage ? lastMessage.text : 'Pas de messages'}
          </Text>
          
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.body,
    fontWeight: 'bold',
    flex: 1,
    marginRight: spacing.sm,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  listingText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
  messagePreview: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  unreadMessage: {
    color: colors.text,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  unreadCount: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});

export default ConversationItem;