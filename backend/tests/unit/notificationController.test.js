const notificationController = require('../../src/controllers/notification.controller');
const Notification = require('../../src/models/Notification');
const User = require('../../src/models/User');
const errorResponse = require('../../src/utils/errorResponse');

// Mock dependencies
jest.mock('../../src/models/Notification');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/errorResponse');

describe('Notification Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return user notifications with status 200', async () => {
      // Setup
      const mockNotifications = [
        { 
          _id: 'notif1', 
          user: 'user123', 
          title: 'New Booking', 
          message: 'You have a new booking request', 
          type: 'booking',
          read: false,
          createdAt: new Date()
        }
      ];
      const mockReq = {
        user: { id: 'user123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockNotifications)
      });

      // Execute
      await notificationController.getNotifications(mockReq, mockRes, mockNext);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockNotifications.length,
        data: mockNotifications
      });
    });

    it('should handle errors properly', async () => {
      // Setup
      const mockError = new Error('Test error');
      const mockReq = {
        user: { id: 'user123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(mockError)
      });

      // Execute
      await notificationController.getNotifications(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read and return 200', async () => {
      // Setup
      const mockNotification = {
        _id: 'notif123',
        user: 'user123',
        read: false,
        save: jest.fn().mockResolvedValue({
          _id: 'notif123',
          user: 'user123',
          read: true
        })
      };
      const mockReq = {
        user: { id: 'user123' },
        params: { id: 'notif123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Notification.findById.mockResolvedValue(mockNotification);

      // Execute
      await notificationController.markAsRead(mockReq, mockRes, mockNext);

      // Assert
      expect(Notification.findById).toHaveBeenCalledWith('notif123');
      expect(mockNotification.read).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'notif123',
          read: true
        })
      });
    });

    it('should return 404 if notification not found', async () => {
      // Setup
      const mockReq = {
        user: { id: 'user123' },
        params: { id: 'notif123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Notification.findById.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await notificationController.markAsRead(mockReq, mockRes, mockNext);

      // Assert
      expect(Notification.findById).toHaveBeenCalledWith('notif123');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Notification not found', 404);
    });

    it('should return 403 if user does not own the notification', async () => {
      // Setup
      const mockNotification = {
        _id: 'notif123',
        user: 'otherUser456'
      };
      const mockReq = {
        user: { id: 'user123' },
        params: { id: 'notif123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Notification.findById.mockResolvedValue(mockNotification);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await notificationController.markAsRead(mockReq, mockRes, mockNext);

      // Assert
      expect(Notification.findById).toHaveBeenCalledWith('notif123');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Not authorized to access this notification', 403);
    });
  });

  // Tests for other methods would follow the same pattern
});