const userController = require('../../src/controllers/user.controller');
const User = require('../../src/models/User');
const Host = require('../../src/models/Host');
const Cleaner = require('../../src/models/Cleaner');
const errorResponse = require('../../src/utils/errorResponse');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/models/Host');
jest.mock('../../src/models/Cleaner');
jest.mock('../../src/utils/errorResponse');

describe('User Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return current user with status 200', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'host'
      };
      const mockReq = {
        user: { id: 'user123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Execute
      await userController.getMe(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
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
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(mockError)
      });

      // Execute
      await userController.getMe(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateDetails', () => {
    it('should update user details and return status 200', async () => {
      // Setup
      const mockUpdatedUser = {
        _id: 'user123',
        name: 'Updated Name',
        email: 'updated@example.com'
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          name: 'Updated Name',
          email: 'updated@example.com'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      // Execute
      await userController.updateDetails(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { name: 'Updated Name', email: 'updated@example.com' },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser
      });
    });

    it('should not allow updating of role or password through this method', async () => {
      // Setup
      const mockReq = {
        user: { id: 'user123' },
        body: {
          name: 'Updated Name',
          email: 'updated@example.com',
          role: 'admin', // Should be ignored
          password: 'newpassword' // Should be ignored
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findByIdAndUpdate.mockResolvedValue({
        _id: 'user123',
        name: 'Updated Name',
        email: 'updated@example.com'
      });

      // Execute
      await userController.updateDetails(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        expect.not.objectContaining({
          role: 'admin',
          password: 'newpassword'
        }),
        { new: true, runValidators: true }
      );
    });
  });

  describe('updatePassword', () => {
    it('should update user password and return status 200', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        password: 'currenthashed',
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue()
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          currentPassword: 'current123',
          newPassword: 'new123'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);

      // Execute
      await userController.updatePassword(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.matchPassword).toHaveBeenCalledWith('current123');
      expect(mockUser.password).toBe('new123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password updated'
      });
    });

    it('should return 401 if current password is incorrect', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        matchPassword: jest.fn().mockResolvedValue(false)
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          currentPassword: 'wrongpassword',
          newPassword: 'new123'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await userController.updatePassword(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.matchPassword).toHaveBeenCalledWith('wrongpassword');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Current password is incorrect', 401);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and profile data, then return status 200', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host',
        remove: jest.fn().mockResolvedValue()
      };
      const mockReq = {
        user: { id: 'user123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue({ remove: jest.fn().mockResolvedValue() });

      // Execute
      await userController.deleteUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockUser.remove).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });

    it('should delete cleaner profile if user is a cleaner', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'cleaner',
        remove: jest.fn().mockResolvedValue()
      };
      const mockReq = {
        user: { id: 'user123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Cleaner.findOne.mockResolvedValue({ remove: jest.fn().mockResolvedValue() });

      // Execute
      await userController.deleteUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockUser.remove).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getUser', () => {
    it('should return user by ID with status 200', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'host'
      };
      const mockReq = {
        params: { id: 'user123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Execute
      await userController.getUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should return 404 if user not found', async () => {
      // Setup
      const mockReq = {
        params: { id: 'nonexistent' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await userController.getUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('User not found', 404);
    });
  });
});