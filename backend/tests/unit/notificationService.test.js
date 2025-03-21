const notificationService = require('../../src/services/notifications');
const Notification = require('../../src/models/Notification');
const User = require('../../src/models/User');

// Mock Firebase admin
jest.mock('firebase-admin', () => ({
  messaging: () => ({
    send: jest.fn().mockResolvedValue('message-id'),
    sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 })
  })
}));

// Mock models
jest.mock('../../src/models/Notification');
jest.mock('../../src/models/User');

describe('Notification Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification in the database', async () => {
      // Setup
      const notificationData = {
        user: 'user123',
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'test'
      };
      const mockNotification = {
        _id: 'notif123',
        ...notificationData,
        read: false,
        createdAt: new Date()
      };

      // Mock implementation
      Notification.create.mockResolvedValue(mockNotification);

      // Execute
      const result = await notificationService.createNotification(notificationData);

      // Assert
      expect(Notification.create).toHaveBeenCalledWith(notificationData);
      expect(result).toEqual(mockNotification);
    });

    it('should handle errors when creating notification', async () => {
      // Setup
      const notificationData = {
        user: 'user123',
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'test'
      };
      const mockError = new Error('Database error');

      // Mock implementation
      Notification.create.mockRejectedValue(mockError);

      // Execute and Assert
      await expect(
        notificationService.createNotification(notificationData)
      ).rejects.toThrow('Database error');
    });
  });

  describe('sendPushNotification', () => {
    it('should send push notification to a single user with FCM token', async () => {
      // Setup
      const userId = 'user123';
      const notification = {
        title: 'Test Push',
        body: 'This is a test push notification'
      };
      const data = {
        type: 'test',
        additionalInfo: 'Some extra data'
      };

      // Mock implementation
      User.findById.mockResolvedValue({
        _id: userId,
        fcmToken: 'user-fcm-token'
      });

      // Execute
      const result = await notificationService.sendPushNotification(userId, notification, data);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(require('firebase-admin').messaging().send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'user-fcm-token',
          notification,
          data: expect.any(Object)
        })
      );
      expect(result).toBe('message-id');
    });

    it('should not send push notification if user has no FCM token', async () => {
      // Setup
      const userId = 'user123';
      const notification = {
        title: 'Test Push',
        body: 'This is a test push notification'
      };

      // Mock implementation
      User.findById.mockResolvedValue({
        _id: userId,
        fcmToken: null // No FCM token
      });

      // Execute
      const result = await notificationService.sendPushNotification(userId, notification);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(require('firebase-admin').messaging().send).not.toHaveBeenCalled();
      expect(result).toBe(null);
    });

    it('should handle errors when sending push notification', async () => {
      // Setup
      const userId = 'user123';
      const notification = {
        title: 'Test Push',
        body: 'This is a test push notification'
      };

      // Mock implementation
      User.findById.mockResolvedValue({
        _id: userId,
        fcmToken: 'user-fcm-token'
      });
      require('firebase-admin').messaging().send.mockRejectedValue(
        new Error('FCM error')
      );

      // Execute and Assert
      await expect(
        notificationService.sendPushNotification(userId, notification)
      ).rejects.toThrow('FCM error');
    });
  });

  describe('sendMulticastNotification', () => {
    it('should send push notifications to multiple users', async () => {
      // Setup
      const userIds = ['user1', 'user2', 'user3'];
      const notification = {
        title: 'Multicast Test',
        body: 'This is a multicast notification'
      };
      const data = { type: 'multicast' };

      // Mock implementation
      User.find.mockResolvedValue([
        { _id: 'user1', fcmToken: 'token1' },
        { _id: 'user2', fcmToken: 'token2' },
        { _id: 'user3', fcmToken: null } // One user without token
      ]);

      // Execute
      const result = await notificationService.sendMulticastNotification(userIds, notification, data);

      // Assert
      expect(User.find).toHaveBeenCalledWith({ _id: { $in: userIds } });
      expect(require('firebase-admin').messaging().sendMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['token1', 'token2'], // Only users with tokens
          notification,
          data: expect.any(Object)
        })
      );
      expect(result).toEqual({ successCount: 1, failureCount: 0 });
    });

    it('should not call Firebase if no users have FCM tokens', async () => {
      // Setup
      const userIds = ['user1', 'user2'];
      const notification = {
        title: 'Multicast Test',
        body: 'This is a multicast notification'
      };

      // Mock implementation - no users have tokens
      User.find.mockResolvedValue([
        { _id: 'user1', fcmToken: null },
        { _id: 'user2', fcmToken: null }
      ]);

      // Execute
      const result = await notificationService.sendMulticastNotification(userIds, notification);

      // Assert
      expect(User.find).toHaveBeenCalledWith({ _id: { $in: userIds } });
      expect(require('firebase-admin').messaging().sendMulticast).not.toHaveBeenCalled();
      expect(result).toBe(null);
    });
  });

  describe('createAndSendNotification', () => {
    it('should create database notification and send push notification', async () => {
      // Setup
      const notificationData = {
        user: 'user123',
        title: 'Combined Notification',
        message: 'This is a combined notification',
        type: 'combined'
      };
      const mockNotification = {
        _id: 'notif123',
        ...notificationData,
        read: false,
        createdAt: new Date()
      };

      // Mock implementation
      Notification.create.mockResolvedValue(mockNotification);
      User.findById.mockResolvedValue({
        _id: 'user123',
        fcmToken: 'user-fcm-token'
      });

      // Execute
      const result = await notificationService.createAndSendNotification(notificationData);

      // Assert
      expect(Notification.create).toHaveBeenCalledWith(notificationData);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(require('firebase-admin').messaging().send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'user-fcm-token',
          notification: {
            title: 'Combined Notification',
            body: 'This is a combined notification'
          },
          data: expect.objectContaining({
            type: 'combined',
            notificationId: 'notif123'
          })
        })
      );
      expect(result).toEqual({
        dbNotification: mockNotification,
        pushResult: 'message-id'
      });
    });

    it('should work even if push notification fails', async () => {
      // Setup
      const notificationData = {
        user: 'user123',
        title: 'Partial Failure',
        message: 'This notification should be created even if push fails',
        type: 'partial'
      };
      const mockNotification = {
        _id: 'notif123',
        ...notificationData,
        read: false,
        createdAt: new Date()
      };

      // Mock implementation
      Notification.create.mockResolvedValue(mockNotification);
      User.findById.mockResolvedValue({
        _id: 'user123',
        fcmToken: 'user-fcm-token'
      });
      require('firebase-admin').messaging().send.mockRejectedValue(
        new Error('FCM error')
      );

      // Execute
      const result = await notificationService.createAndSendNotification(notificationData);

      // Assert
      expect(Notification.create).toHaveBeenCalledWith(notificationData);
      expect(result).toEqual({
        dbNotification: mockNotification,
        pushResult: null
      });
    });
  });
});