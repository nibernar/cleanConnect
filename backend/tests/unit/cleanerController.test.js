const cleanerController = require('../../src/controllers/cleaner.controller');
const Cleaner = require('../../src/models/Cleaner');
const User = require('../../src/models/User');
const errorResponse = require('../../src/utils/errorResponse');
const siretVerification = require('../../src/services/siretVerification');

// Mock dependencies
jest.mock('../../src/models/Cleaner');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/errorResponse');
jest.mock('../../src/services/siretVerification');

describe('Cleaner Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCleaners', () => {
    it('should return all cleaners with status 200', async () => {
      // Setup
      const mockCleaners = [
        { 
          _id: 'cleaner1', 
          user: 'user123',
          businessName: 'Cleaner Business 1',
          siret: '12345678901234',
          location: {
            type: 'Point',
            coordinates: [1, 1],
            address: 'Test Address 1'
          },
          bankInfo: {
            iban: 'FR1420041010050500013M02606',
            holderName: 'Cleaner 1'
          }
        },
        { 
          _id: 'cleaner2', 
          user: 'user456',
          businessName: 'Cleaner Business 2',
          siret: '98765432109876',
          location: {
            type: 'Point',
            coordinates: [2, 2],
            address: 'Test Address 2'
          },
          bankInfo: {
            iban: 'FR1420041010050500013M02607',
            holderName: 'Cleaner 2'
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
      Cleaner.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCleaners)
      });

      // Execute
      await cleanerController.getCleaners(mockReq, mockRes, mockNext);

      // Assert
      expect(Cleaner.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockCleaners.length,
        data: mockCleaners
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
      Cleaner.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(mockError)
      });

      // Execute
      await cleanerController.getCleaners(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getCleaner', () => {
    it('should return a specific cleaner by ID with status 200', async () => {
      // Setup
      const mockCleaner = { 
        _id: 'cleaner123', 
        user: 'user123',
        businessName: 'Test Cleaner Business',
        siret: '12345678901234',
        location: {
          type: 'Point',
          coordinates: [1, 1],
          address: 'Test Address'
        },
        bankInfo: {
          iban: 'FR1420041010050500013M02606',
          holderName: 'Test Cleaner'
        }
      };
      const mockReq = {
        params: { id: 'cleaner123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Cleaner.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCleaner)
      });

      // Execute
      await cleanerController.getCleaner(mockReq, mockRes, mockNext);

      // Assert
      expect(Cleaner.findById).toHaveBeenCalledWith('cleaner123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCleaner
      });
    });

    it('should return 404 if cleaner not found', async () => {
      // Setup
      const mockReq = {
        params: { id: 'nonexistent' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Cleaner.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await cleanerController.getCleaner(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Cleaner not found', 404);
    });
  });

  describe('createCleaner', () => {
    it('should create a cleaner profile with valid SIRET and return status 201', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'user',
        save: jest.fn().mockResolvedValue()
      };
      const mockCleaner = {
        _id: 'cleaner123',
        user: 'user123',
        businessName: 'New Cleaner Business',
        siret: '12345678901234',
        location: {
          type: 'Point',
          coordinates: [1, 1],
          address: '123 Test St'
        },
        bankInfo: {
          iban: 'FR1420041010050500013M02606',
          holderName: 'Test Cleaner'
        }
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          businessName: 'New Cleaner Business',
          siret: '12345678901234',
          location: {
            coordinates: [1, 1],
            address: '123 Test St'
          },
          bankInfo: {
            iban: 'FR1420041010050500013M02606',
            holderName: 'Test Cleaner'
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
      Cleaner.findOne.mockResolvedValue(null);
      siretVerification.verifySiret.mockResolvedValue({
        isValid: true,
        companyInfo: {
          name: 'New Cleaner Business',
          siret: '12345678901234',
          status: 'active',
          address: '123 Test St'
        }
      });
      Cleaner.create.mockResolvedValue(mockCleaner);

      // Execute
      await cleanerController.createCleaner(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(siretVerification.verifySiret).toHaveBeenCalledWith('12345678901234');
      expect(Cleaner.create).toHaveBeenCalledWith({
        user: 'user123',
        businessName: 'New Cleaner Business',
        siret: '12345678901234',
        location: {
          type: 'Point',
          coordinates: [1, 1],
          address: '123 Test St'
        },
        bankInfo: {
          iban: 'FR1420041010050500013M02606',
          holderName: 'Test Cleaner'
        }
      });
      expect(mockUser.role).toBe('cleaner');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCleaner
      });
    });

    it('should return 400 if SIRET is invalid', async () => {
      // Setup
      const mockReq = {
        user: { id: 'user123' },
        body: {
          businessName: 'New Cleaner Business',
          siret: '12345678901234', // Valid format but invalid SIRET
          location: {
            coordinates: [1, 1],
            address: '123 Test St'
          },
          bankInfo: {
            iban: 'FR1420041010050500013M02606',
            holderName: 'Test Cleaner'
          }
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Cleaner.findOne.mockResolvedValue(null);
      siretVerification.verifySiret.mockResolvedValue({
        isValid: false,
        error: 'SIRET not found in database'
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await cleanerController.createCleaner(mockReq, mockRes, mockNext);

      // Assert
      expect(siretVerification.verifySiret).toHaveBeenCalledWith('12345678901234');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Invalid SIRET: SIRET not found in database', 400);
    });

    it('should return 400 if user already has a cleaner profile', async () => {
      // Setup
      const mockExistingCleaner = {
        _id: 'cleaner123',
        user: 'user123'
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          businessName: 'New Cleaner Business',
          siret: '12345678901234'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Cleaner.findOne.mockResolvedValue(mockExistingCleaner);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await cleanerController.createCleaner(mockReq, mockRes, mockNext);

      // Assert
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('User already has a cleaner profile', 400);
    });
  });

  describe('updateCleaner', () => {
    it('should update cleaner profile and return status 200', async () => {
      // Setup
      const mockCleaner = {
        _id: 'cleaner123',
        user: 'user123',
        businessName: 'Old Business Name',
        siret: '12345678901234',
        location: {
          type: 'Point',
          coordinates: [1, 1],
          address: 'Old Address'
        },
        bankInfo: {
          iban: 'FR1420041010050500013M02606',
          holderName: 'Old Name'
        }
      };
      const mockUpdatedCleaner = {
        _id: 'cleaner123',
        user: 'user123',
        businessName: 'Updated Business Name',
        siret: '12345678901234', // SIRET shouldn't change
        location: {
          type: 'Point',
          coordinates: [2, 2],
          address: 'Updated Address'
        },
        bankInfo: {
          iban: 'FR1420041010050500013M02607',
          holderName: 'Updated Name'
        }
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          businessName: 'Updated Business Name',
          location: {
            coordinates: [2, 2],
            address: 'Updated Address'
          },
          bankInfo: {
            iban: 'FR1420041010050500013M02607',
            holderName: 'Updated Name'
          }
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Cleaner.findOne.mockResolvedValue(mockCleaner);
      Cleaner.findOneAndUpdate.mockResolvedValue(mockUpdatedCleaner);

      // Execute
      await cleanerController.updateCleaner(mockReq, mockRes, mockNext);

      // Assert
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(Cleaner.findOneAndUpdate).toHaveBeenCalledWith(
        { user: 'user123' },
        {
          businessName: 'Updated Business Name',
          location: {
            type: 'Point',
            coordinates: [2, 2],
            address: 'Updated Address'
          },
          bankInfo: {
            iban: 'FR1420041010050500013M02607',
            holderName: 'Updated Name'
          }
        },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedCleaner
      });
    });

    it('should return 404 if cleaner profile not found', async () => {
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
      Cleaner.findOne.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await cleanerController.updateCleaner(mockReq, mockRes, mockNext);

      // Assert
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Cleaner profile not found', 404);
    });
  });

  describe('deleteCleaner', () => {
    it('should delete cleaner profile and update user role, then return status 200', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'cleaner',
        save: jest.fn().mockResolvedValue()
      };
      const mockCleaner = {
        _id: 'cleaner123',
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
      Cleaner.findOne.mockResolvedValue(mockCleaner);

      // Execute
      await cleanerController.deleteCleaner(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockCleaner.remove).toHaveBeenCalled();
      expect(mockUser.role).toBe('user');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });

    it('should return 404 if cleaner profile not found', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'cleaner'
      };
      const mockReq = {
        user: { id: 'user123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Cleaner.findOne.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await cleanerController.deleteCleaner(mockReq, mockRes, mockNext);

      // Assert
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Cleaner profile not found', 404);
    });
  });

  describe('getCleanerByUserId', () => {
    it('should return cleaner profile for a user ID with status 200', async () => {
      // Setup
      const mockCleaner = {
        _id: 'cleaner123',
        user: 'user123',
        businessName: 'Test Cleaner Business'
      };
      const mockReq = {
        params: { userId: 'user123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Cleaner.findOne.mockResolvedValue(mockCleaner);

      // Execute
      await cleanerController.getCleanerByUserId(mockReq, mockRes, mockNext);

      // Assert
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCleaner
      });
    });

    it('should return 404 if no cleaner profile found for the user', async () => {
      // Setup
      const mockReq = {
        params: { userId: 'user123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Cleaner.findOne.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await cleanerController.getCleanerByUserId(mockReq, mockRes, mockNext);

      // Assert
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('No cleaner profile found for this user', 404);
    });
  });
});