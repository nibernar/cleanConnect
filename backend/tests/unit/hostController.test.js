const hostController = require('../../src/controllers/host.controller');
const Host = require('../../src/models/Host');
const User = require('../../src/models/User');
const errorResponse = require('../../src/utils/errorResponse');

// Mock dependencies
jest.mock('../../src/models/Host');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/errorResponse');

describe('Host Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHosts', () => {
    it('should return all hosts with status 200', async () => {
      // Setup
      const mockHosts = [
        { 
          _id: 'host1', 
          user: 'user123',
          businessName: 'Host Business 1',
          location: {
            type: 'Point',
            coordinates: [1, 1],
            address: 'Test Address 1'
          }
        },
        { 
          _id: 'host2', 
          user: 'user456',
          businessName: 'Host Business 2',
          location: {
            type: 'Point',
            coordinates: [2, 2],
            address: 'Test Address 2'
          }
        }
      ];
      const mockReq = {
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Host.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockHosts)
      });

      // Execute
      await hostController.getHosts(mockReq, mockRes, mockNext);

      // Assert
      expect(Host.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockHosts.length,
        data: mockHosts
      });
    });

    it('should handle errors properly', async () => {
      // Setup
      const mockError = new Error('Test error');
      const mockReq = {
        query: {}
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Host.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(mockError)
      });

      // Execute
      await hostController.getHosts(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getHost', () => {
    it('should return a specific host by ID with status 200', async () => {
      // Setup
      const mockHost = { 
        _id: 'host123', 
        user: 'user123',
        businessName: 'Test Host Business',
        location: {
          type: 'Point',
          coordinates: [1, 1],
          address: 'Test Address'
        }
      };
      const mockReq = {
        params: { id: 'host123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Host.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockHost)
      });

      // Execute
      await hostController.getHost(mockReq, mockRes, mockNext);

      // Assert
      expect(Host.findById).toHaveBeenCalledWith('host123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHost
      });
    });

    it('should return 404 if host not found', async () => {
      // Setup
      const mockReq = {
        params: { id: 'nonexistent' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Host.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await hostController.getHost(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Host not found', 404);
    });
  });

  describe('createHost', () => {
    it('should create a host profile and return status 201', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'user'
      };
      const mockHost = {
        _id: 'host123',
        user: 'user123',
        businessName: 'New Host Business',
        location: {
          type: 'Point',
          coordinates: [1, 1],
          address: '123 Test St'
        }
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          businessName: 'New Host Business',
          location: {
            coordinates: [1, 1],
            address: '123 Test St'
          }
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue(null);
      Host.create.mockResolvedValue(mockHost);

      // Execute
      await hostController.createHost(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(Host.create).toHaveBeenCalledWith({
        user: 'user123',
        businessName: 'New Host Business',
        location: {
          type: 'Point',
          coordinates: [1, 1],
          address: '123 Test St'
        }
      });
      expect(mockUser.role).toBe('host');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHost
      });
    });

    it('should return 400 if user already has a host profile', async () => {
      // Setup
      const mockExistingHost = {
        _id: 'host123',
        user: 'user123'
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          businessName: 'New Host Business'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Host.findOne.mockResolvedValue(mockExistingHost);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await hostController.createHost(mockReq, mockRes, mockNext);

      // Assert
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('User already has a host profile', 400);
    });
  });

  describe('updateHost', () => {
    it('should update host profile and return status 200', async () => {
      // Setup
      const mockHost = {
        _id: 'host123',
        user: 'user123',
        businessName: 'Old Business Name',
        location: {
          type: 'Point',
          coordinates: [1, 1],
          address: 'Old Address'
        }
      };
      const mockUpdatedHost = {
        _id: 'host123',
        user: 'user123',
        businessName: 'Updated Business Name',
        location: {
          type: 'Point',
          coordinates: [2, 2],
          address: 'Updated Address'
        }
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          businessName: 'Updated Business Name',
          location: {
            coordinates: [2, 2],
            address: 'Updated Address'
          }
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Host.findOne.mockResolvedValue(mockHost);
      Host.findOneAndUpdate.mockResolvedValue(mockUpdatedHost);

      // Execute
      await hostController.updateHost(mockReq, mockRes, mockNext);

      // Assert
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(Host.findOneAndUpdate).toHaveBeenCalledWith(
        { user: 'user123' },
        {
          businessName: 'Updated Business Name',
          location: {
            type: 'Point',
            coordinates: [2, 2],
            address: 'Updated Address'
          }
        },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedHost
      });
    });

    it('should return 404 if host profile not found', async () => {
      // Setup
      const mockReq = {
        user: { id: 'user123' },
        body: {
          businessName: 'Updated Business Name'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Host.findOne.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await hostController.updateHost(mockReq, mockRes, mockNext);

      // Assert
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Host profile not found', 404);
    });
  });

  describe('deleteHost', () => {
    it('should delete host profile and update user role, then return status 200', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host',
        save: jest.fn().mockResolvedValue()
      };
      const mockHost = {
        _id: 'host123',
        user: 'user123',
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
      Host.findOne.mockResolvedValue(mockHost);

      // Execute
      await hostController.deleteHost(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockHost.remove).toHaveBeenCalled();
      expect(mockUser.role).toBe('user');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });

    it('should return 404 if host profile not found', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockReq = {
        user: { id: 'user123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await hostController.deleteHost(mockReq, mockRes, mockNext);

      // Assert
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Host profile not found', 404);
    });
  });
});