const bookingController = require('../../src/controllers/booking.controller');
const Booking = require('../../src/models/Booking');
const Listing = require('../../src/models/Listing');
const User = require('../../src/models/User');
const Host = require('../../src/models/Host');
const Cleaner = require('../../src/models/Cleaner');
const paymentService = require('../../src/services/payment');
const errorResponse = require('../../src/utils/errorResponse');

// Mock dependencies
jest.mock('../../src/models/Booking');
jest.mock('../../src/models/Listing');
jest.mock('../../src/models/User');
jest.mock('../../src/models/Host');
jest.mock('../../src/models/Cleaner');
jest.mock('../../src/services/payment');
jest.mock('../../src/utils/errorResponse');

describe('Booking Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBookings', () => {
    it('should return all bookings for a host with status 200', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockHost = {
        _id: 'host123',
        user: 'user123'
      };
      const mockBookings = [
        { 
          _id: 'booking1', 
          host: 'host123',
          cleaner: 'cleaner123',
          listing: 'listing123',
          date: new Date(),
          status: 'confirmed',
          price: 100
        },
        { 
          _id: 'booking2', 
          host: 'host123',
          cleaner: 'cleaner456',
          listing: 'listing456',
          date: new Date(),
          status: 'pending',
          price: 150
        }
      ];
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
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue(mockHost);
      Booking.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBookings)
      });

      // Execute
      await bookingController.getBookings(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(Booking.find).toHaveBeenCalledWith({ host: 'host123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockBookings.length,
        data: mockBookings
      });
    });

    it('should return all bookings for a cleaner with status 200', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'cleaner'
      };
      const mockCleaner = {
        _id: 'cleaner123',
        user: 'user123'
      };
      const mockBookings = [
        { 
          _id: 'booking1', 
          host: 'host123',
          cleaner: 'cleaner123',
          listing: 'listing123',
          date: new Date(),
          status: 'confirmed',
          price: 100
        }
      ];
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
      User.findById.mockResolvedValue(mockUser);
      Cleaner.findOne.mockResolvedValue(mockCleaner);
      Booking.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBookings)
      });

      // Execute
      await bookingController.getBookings(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Cleaner.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(Booking.find).toHaveBeenCalledWith({ cleaner: 'cleaner123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockBookings.length,
        data: mockBookings
      });
    });

    it('should filter bookings by status if provided', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockHost = {
        _id: 'host123',
        user: 'user123'
      };
      const mockBookings = [
        { 
          _id: 'booking1', 
          host: 'host123',
          cleaner: 'cleaner123',
          listing: 'listing123',
          date: new Date(),
          status: 'confirmed',
          price: 100
        }
      ];
      const mockReq = {
        user: { id: 'user123' },
        query: {
          status: 'confirmed'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue(mockHost);
      Booking.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBookings)
      });

      // Execute
      await bookingController.getBookings(mockReq, mockRes, mockNext);

      // Assert
      expect(Booking.find).toHaveBeenCalledWith({ 
        host: 'host123',
        status: 'confirmed'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors properly', async () => {
      // Setup
      const mockError = new Error('Test error');
      const mockReq = {
        user: { id: 'user123' },
        query: {}
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockRejectedValue(mockError);

      // Execute
      await bookingController.getBookings(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getBooking', () => {
    it('should return a specific booking by ID with status 200', async () => {
      // Setup
      const mockBooking = { 
        _id: 'booking123', 
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        date: new Date(),
        status: 'confirmed',
        price: 100
      };
      const mockReq = {
        params: { id: 'booking123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });

      // Execute
      await bookingController.getBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(Booking.findById).toHaveBeenCalledWith('booking123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockBooking
      });
    });

    it('should return 404 if booking not found', async () => {
      // Setup
      const mockReq = {
        params: { id: 'nonexistent' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.getBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Booking not found', 404);
    });
  });

  describe('createBooking', () => {
    it('should create a booking with payment and return status 201', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockHost = {
        _id: 'host123',
        user: 'user123'
      };
      const mockListing = {
        _id: 'listing123',
        host: 'host123',
        price: 100,
        status: 'active'
      };
      const mockCleaner = {
        _id: 'cleaner123'
      };
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        date: new Date(),
        status: 'confirmed',
        price: 100
      };
      const mockPayment = {
        id: 'payment123',
        amount: 100,
        status: 'succeeded'
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          listing: 'listing123',
          cleaner: 'cleaner123',
          date: '2023-06-01',
          paymentMethod: 'pm_123'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue(mockHost);
      Listing.findById.mockResolvedValue(mockListing);
      Cleaner.findById.mockResolvedValue(mockCleaner);
      paymentService.processPayment.mockResolvedValue(mockPayment);
      Booking.create.mockResolvedValue(mockBooking);

      // Execute
      await bookingController.createBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Host.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(Listing.findById).toHaveBeenCalledWith('listing123');
      expect(Cleaner.findById).toHaveBeenCalledWith('cleaner123');
      expect(paymentService.processPayment).toHaveBeenCalledWith('pm_123', 100, 'Booking for cleaning service');
      expect(Booking.create).toHaveBeenCalledWith(expect.objectContaining({
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        payment: 'payment123',
        price: 100,
        status: 'confirmed'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockBooking
      });
    });

    it('should return 404 if listing not found', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockHost = {
        _id: 'host123',
        user: 'user123'
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          listing: 'nonexistent',
          cleaner: 'cleaner123',
          date: '2023-06-01',
          paymentMethod: 'pm_123'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue(mockHost);
      Listing.findById.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.createBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Listing not found', 404);
    });

    it('should return 404 if cleaner not found', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockHost = {
        _id: 'host123',
        user: 'user123'
      };
      const mockListing = {
        _id: 'listing123',
        host: 'host123',
        price: 100,
        status: 'active'
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          listing: 'listing123',
          cleaner: 'nonexistent',
          date: '2023-06-01',
          paymentMethod: 'pm_123'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue(mockHost);
      Listing.findById.mockResolvedValue(mockListing);
      Cleaner.findById.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.createBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Cleaner not found', 404);
    });

    it('should return 403 if user is not the owner of the listing', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockHost = {
        _id: 'host123',
        user: 'user123'
      };
      const mockListing = {
        _id: 'listing123',
        host: 'differentHost', // Different host
        price: 100,
        status: 'active'
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          listing: 'listing123',
          cleaner: 'cleaner123',
          date: '2023-06-01',
          paymentMethod: 'pm_123'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue(mockHost);
      Listing.findById.mockResolvedValue(mockListing);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.createBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Not authorized to book this listing', 403);
    });

    it('should return 400 if listing is not active', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockHost = {
        _id: 'host123',
        user: 'user123'
      };
      const mockListing = {
        _id: 'listing123',
        host: 'host123',
        price: 100,
        status: 'inactive' // Inactive listing
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          listing: 'listing123',
          cleaner: 'cleaner123',
          date: '2023-06-01',
          paymentMethod: 'pm_123'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Host.findOne.mockResolvedValue(mockHost);
      Listing.findById.mockResolvedValue(mockListing);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.createBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('This listing is not active', 400);
    });
  });

  describe('updateBooking', () => {
    it('should update booking status and return status 200', async () => {
      // Setup
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        date: new Date(),
        status: 'confirmed',
        price: 100,
        save: jest.fn().mockResolvedValue({
          _id: 'booking123',
          host: 'host123',
          cleaner: 'cleaner123',
          listing: 'listing123',
          date: new Date(),
          status: 'completed', // Updated status
          price: 100
        })
      };
      const mockReq = {
        params: { id: 'booking123' },
        body: {
          status: 'completed'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });

      // Execute
      await bookingController.updateBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(Booking.findById).toHaveBeenCalledWith('booking123');
      expect(mockBooking.status).toBe('completed');
      expect(mockBooking.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'booking123',
          status: 'completed'
        })
      });
    });

    it('should return 404 if booking not found', async () => {
      // Setup
      const mockReq = {
        params: { id: 'nonexistent' },
        body: {
          status: 'completed'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.updateBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Booking not found', 404);
    });
  });

  describe('completeTaskList', () => {
    it('should update tasks and status, then return status 200', async () => {
      // Setup
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        date: new Date(),
        status: 'in-progress',
        price: 100,
        tasks: [
          { id: 'task1', name: 'Dusting', completed: false },
          { id: 'task2', name: 'Vacuuming', completed: false }
        ],
        save: jest.fn().mockResolvedValue({
          _id: 'booking123',
          host: 'host123',
          cleaner: 'cleaner123',
          listing: 'listing123',
          date: new Date(),
          status: 'completed',
          price: 100,
          tasks: [
            { id: 'task1', name: 'Dusting', completed: true },
            { id: 'task2', name: 'Vacuuming', completed: true }
          ]
        })
      };
      const mockReq = {
        params: { id: 'booking123' },
        body: {
          tasks: [
            { id: 'task1', completed: true },
            { id: 'task2', completed: true }
          ]
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });

      // Execute
      await bookingController.completeTaskList(mockReq, mockRes, mockNext);

      // Assert
      expect(Booking.findById).toHaveBeenCalledWith('booking123');
      expect(mockBooking.tasks[0].completed).toBe(true);
      expect(mockBooking.tasks[1].completed).toBe(true);
      expect(mockBooking.status).toBe('completed');
      expect(mockBooking.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'booking123',
          status: 'completed',
          tasks: expect.arrayContaining([
            expect.objectContaining({ id: 'task1', completed: true }),
            expect.objectContaining({ id: 'task2', completed: true })
          ])
        })
      });
    });

    it('should return 404 if booking not found', async () => {
      // Setup
      const mockReq = {
        params: { id: 'nonexistent' },
        body: {
          tasks: [
            { id: 'task1', completed: true },
            { id: 'task2', completed: true }
          ]
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.completeTaskList(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Booking not found', 404);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking and refund payment, then return status 200', async () => {
      // Setup
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        date: new Date(),
        status: 'confirmed',
        price: 100,
        payment: 'payment123',
        save: jest.fn().mockResolvedValue({
          _id: 'booking123',
          host: 'host123',
          cleaner: 'cleaner123',
          listing: 'listing123',
          date: new Date(),
          status: 'cancelled',
          price: 100,
          payment: 'payment123'
        })
      };
      const mockReq = {
        params: { id: 'booking123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });
      paymentService.refundPayment.mockResolvedValue({
        id: 'refund123',
        payment_intent: 'payment123',
        amount: 100,
        status: 'succeeded'
      });

      // Execute
      await bookingController.cancelBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(Booking.findById).toHaveBeenCalledWith('booking123');
      expect(paymentService.refundPayment).toHaveBeenCalledWith('payment123');
      expect(mockBooking.status).toBe('cancelled');
      expect(mockBooking.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'booking123',
          status: 'cancelled'
        })
      });
    });

    it('should return 404 if booking not found', async () => {
      // Setup
      const mockReq = {
        params: { id: 'nonexistent' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.cancelBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Booking not found', 404);
    });

    it('should handle payment refund error', async () => {
      // Setup
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        date: new Date(),
        status: 'confirmed',
        price: 100,
        payment: 'payment123'
      };
      const mockReq = {
        params: { id: 'booking123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();
      const refundError = new Error('Refund failed');

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });
      paymentService.refundPayment.mockRejectedValue(refundError);

      // Execute
      await bookingController.cancelBooking(mockReq, mockRes, mockNext);

      // Assert
      expect(Booking.findById).toHaveBeenCalledWith('booking123');
      expect(paymentService.refundPayment).toHaveBeenCalledWith('payment123');
      expect(mockNext).toHaveBeenCalledWith(refundError);
    });
  });

  describe('submitClaim', () => {
    it('should add claim to booking and return status 200', async () => {
      // Setup
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        date: new Date(),
        status: 'completed',
        price: 100,
        claim: null,
        hasClaim: false,
        save: jest.fn().mockResolvedValue({
          _id: 'booking123',
          host: 'host123',
          cleaner: 'cleaner123',
          listing: 'listing123',
          date: new Date(),
          status: 'disputed',
          price: 100,
          claim: {
            reason: 'Incomplete cleaning',
            photos: ['photo1.jpg', 'photo2.jpg'],
            date: expect.any(Date)
          },
          hasClaim: true
        })
      };
      const mockReq = {
        params: { id: 'booking123' },
        body: {
          reason: 'Incomplete cleaning',
          photos: ['photo1.jpg', 'photo2.jpg']
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });

      // Execute
      await bookingController.submitClaim(mockReq, mockRes, mockNext);

      // Assert
      expect(Booking.findById).toHaveBeenCalledWith('booking123');
      expect(mockBooking.claim).toEqual({
        reason: 'Incomplete cleaning',
        photos: ['photo1.jpg', 'photo2.jpg'],
        date: expect.any(Date)
      });
      expect(mockBooking.hasClaim).toBe(true);
      expect(mockBooking.status).toBe('disputed');
      expect(mockBooking.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'booking123',
          status: 'disputed',
          hasClaim: true,
          claim: expect.objectContaining({
            reason: 'Incomplete cleaning',
            photos: ['photo1.jpg', 'photo2.jpg']
          })
        })
      });
    });

    it('should return 404 if booking not found', async () => {
      // Setup
      const mockReq = {
        params: { id: 'nonexistent' },
        body: {
          reason: 'Incomplete cleaning',
          photos: ['photo1.jpg', 'photo2.jpg']
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.submitClaim(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Booking not found', 404);
    });

    it('should return 400 if booking already has a claim', async () => {
      // Setup
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        date: new Date(),
        status: 'disputed',
        price: 100,
        claim: {
          reason: 'Existing claim',
          photos: ['existing.jpg'],
          date: new Date()
        },
        hasClaim: true
      };
      const mockReq = {
        params: { id: 'booking123' },
        body: {
          reason: 'New claim attempt',
          photos: ['new.jpg']
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.submitClaim(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('This booking already has a claim', 400);
    });

    it('should return 400 if claim is submitted too late', async () => {
      // Setup
      // Create a date that's more than 7 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        listing: 'listing123',
        date: oldDate, // Past the claim window
        status: 'completed',
        price: 100,
        claim: null,
        hasClaim: false
      };
      const mockReq = {
        params: { id: 'booking123' },
        body: {
          reason: 'Incomplete cleaning',
          photos: ['photo1.jpg', 'photo2.jpg']
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await bookingController.submitClaim(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Claims must be submitted within 7 days of the booking date', 400);
    });
  });
});