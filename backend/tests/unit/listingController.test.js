const listingController = require('../../src/controllers/listing.controller');
const Listing = require('../../src/models/Listing');
const Host = require('../../src/models/Host');
const errorResponse = require('../../src/utils/errorResponse');

// Mock dependencies
jest.mock('../../src/models/Listing');
jest.mock('../../src/models/Host');
jest.mock('../../src/utils/errorResponse');

describe('Listing Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getListings', () => {
    it('should return all listings with status 200', async () => {
      // Setup
      const mockListings = [{ title: 'Test Listing' }];
      const mockReq = {
        user: { id: 'user123' },
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Listing.find.mockResolvedValue(mockListings);

      // Execute
      await listingController.getListings(mockReq, mockRes, mockNext);

      // Assert
      expect(Listing.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockListings.length,
        data: mockListings
      });
    });

    it('should handle errors properly', async () => {
      // Setup
      const mockError = new Error('Test error');
      const mockReq = {
        user: { id: 'user123' },
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Listing.find.mockRejectedValue(mockError);

      // Execute
      await listingController.getListings(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('createListing', () => {
    it('should create a listing and return status 201', async () => {
      // Setup
      const mockListing = {
        _id: 'listing123',
        host: 'host123',
        title: 'Test Listing',
        save: jest.fn().mockResolvedValue({ _id: 'listing123', host: 'host123', title: 'Test Listing' })
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          title: 'Test Listing',
          type: 'apartment',
          address: '123 Test St',
          numberOfPeople: 2,
          dates: ['2023-06-01', '2023-06-02'],
          times: ['09:00', '12:00'],
          area: 80,
          services: ['cleaning', 'laundry'],
          equipment: ['vacuum', 'mop'],
          notes: 'Test notes'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Host.findOne.mockResolvedValue({ _id: 'host123', user: 'user123' });
      Listing.create.mockResolvedValue(mockListing);

      // Execute
      await listingController.createListing(mockReq, mockRes, mockNext);

      // Assert
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(Listing.create).toHaveBeenCalledWith(expect.objectContaining({
        host: 'host123',
        title: 'Test Listing'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockListing
      });
    });

    it('should return 404 if host not found', async () => {
      // Setup
      const mockReq = {
        user: { id: 'user123' },
        body: { title: 'Test Listing' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Host.findOne.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await listingController.createListing(mockReq, mockRes, mockNext);

      // Assert
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Host profile not found', 404);
    });
  });

  // Tests for other methods would follow the same pattern
});