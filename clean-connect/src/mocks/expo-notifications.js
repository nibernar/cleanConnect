// Mock implementation of expo-notifications for web platform
// This provides no-op implementations of methods used in the app

// Default notification settings
const defaultSettings = {
  allowsAlert: true,
  allowsBadge: true,
  allowsSound: true,
  allowsAnnouncements: false,
};

// Permission statuses
export const AndroidImportance = {
  DEFAULT: 3,
  MIN: 1,
  LOW: 2,
  HIGH: 4,
  MAX: 5,
};

export const NotificationBehavior = {
  DEFAULT: 'default',
  PERSISTENT: 'persistent',
};

// Permission functions
export async function getPermissionsAsync() {
  return {
    status: 'granted',
    granted: true,
    expires: 'never',
    canAskAgain: true,
    ios: { ...defaultSettings },
  };
}

export async function requestPermissionsAsync() {
  console.log('[Mock] Requesting notification permissions');
  return getPermissionsAsync();
}

// Notification handling
export async function getDevicePushTokenAsync() {
  return {
    type: 'web',
    data: 'web-mock-token',
  };
}

export async function getExpoPushTokenAsync(options = {}) {
  return {
    type: 'expo',
    data: 'ExponentPushToken[mock-token]',
  };
}

export async function presentNotificationAsync(content) {
  console.log('[Mock] Presenting notification:', content);
  return 'mock-notification-id';
}

export async function scheduleNotificationAsync({ content, trigger }) {
  console.log('[Mock] Scheduling notification:', { content, trigger });
  return 'mock-scheduled-notification-id';
}

export async function dismissNotificationAsync(identifier) {
  console.log('[Mock] Dismissing notification:', identifier);
}

export async function dismissAllNotificationsAsync() {
  console.log('[Mock] Dismissing all notifications');
}

export async function cancelScheduledNotificationAsync(identifier) {
  console.log('[Mock] Canceling scheduled notification:', identifier);
}

export async function cancelAllScheduledNotificationsAsync() {
  console.log('[Mock] Canceling all scheduled notifications');
}

export function addNotificationReceivedListener(listener) {
  console.log('[Mock] Adding notification received listener');
  return { remove: () => console.log('[Mock] Removing notification received listener') };
}

export function addNotificationResponseReceivedListener(listener) {
  console.log('[Mock] Adding notification response received listener');
  return { remove: () => console.log('[Mock] Removing notification response received listener') };
}

export function removeNotificationSubscription(subscription) {
  console.log('[Mock] Removing notification subscription');
}

export function setNotificationHandler(handler) {
  console.log('[Mock] Setting notification handler');
}

export function setNotificationChannelAsync(channelId, channel) {
  console.log('[Mock] Setting notification channel:', channelId);
  return true;
}

export async function getNotificationChannelsAsync() {
  return [];
}

export default {
  getPermissionsAsync,
  requestPermissionsAsync,
  getDevicePushTokenAsync,
  getExpoPushTokenAsync,
  presentNotificationAsync,
  scheduleNotificationAsync,
  dismissNotificationAsync,
  dismissAllNotificationsAsync,
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
  setNotificationHandler,
  setNotificationChannelAsync,
  getNotificationChannelsAsync,
  AndroidImportance,
  NotificationBehavior,
};