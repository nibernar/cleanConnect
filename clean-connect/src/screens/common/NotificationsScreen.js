import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead } from '../../redux/slices/notificationsSlice';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { notifications, loading, error } = useSelector(state => state.notifications);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchNotifications()).finally(() => setRefreshing(false));
  };

  const handleNotificationPress = (notification) => {
    // Mark as read
    if (!notification.read) {
      dispatch(markAsRead(notification._id));
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'NEW_APPLICATION':
        router.push('ApplicationsScreen', { listingId: notification.data.listingId });
        break;
      case 'APPLICATION_ACCEPTED':
        router.push('BookingDetailScreen', { bookingId: notification.data.bookingId });
        break;
      case 'BOOKING_CONFIRMED':
        router.push('BookingDetailScreen', { bookingId: notification.data.bookingId });
        break;
      case 'PAYMENT_RECEIVED':
        router.push('InvoicesScreen');
        break;
      case 'TASK_COMPLETED':
        router.push('BookingDetailScreen', { bookingId: notification.data.bookingId });
        break;
      case 'NEW_REVIEW':
        router.push('ProfileScreen', { tab: 'reviews' });
        break;
      case 'NEW_MESSAGE':
        router.push('ChatScreen', { 
          conversationId: notification.data.conversationId,
          recipientName: notification.data.senderName
        });
        break;
      default:
        // Default navigation
        router.push('DashboardScreen');
    }
  };

  const renderNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_APPLICATION':
        return <Ionicons name="person-add-outline" size={24} color={colors.primary} />;
      case 'APPLICATION_ACCEPTED':
        return <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />;
      case 'BOOKING_CONFIRMED':
        return <Ionicons name="calendar-outline" size={24} color={colors.primary} />;
      case 'PAYMENT_RECEIVED':
        return <Ionicons name="cash-outline" size={24} color={colors.success} />;
      case 'TASK_COMPLETED':
        return <Ionicons name="checkmark-done-outline" size={24} color={colors.success} />;
      case 'NEW_REVIEW':
        return <Ionicons name="star-outline" size={24} color={colors.warning} />;
      case 'NEW_MESSAGE':
        return <Ionicons name="chatbubble-outline" size={24} color={colors.info} />;
      default:
        return <Ionicons name="notifications-outline" size={24} color={colors.primary} />;
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={70} color={colors.textLight} />
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyText}>
        Vous n'avez pas de notifications pour le moment.
      </Text>
    </View>
  );

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        {renderNotificationIcon(item.type)}
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={renderNotification}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={notifications.length === 0 ? styles.listEmptyContent : styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: colors.errorBackground,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: 10,
  },
  retryButton: {
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  listContent: {
    paddingTop: 5,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: colors.unreadBackground,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textLight,
    alignSelf: 'flex-end',
  },
});

export default NotificationsScreen;