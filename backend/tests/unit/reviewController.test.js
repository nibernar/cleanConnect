const reviewController = require('../../src/controllers/review.controller');
const Review = require('../../src/models/Review');
const User = require('../../src/models/User');
const Booking = require('../../src/models/Booking');
const errorResponse = require('../../src/utils/errorResponse');

// Mock dependencies
jest.mock('../../src/models/Review');
jest.mock('../../src/models/User');
jest.mock('../../src/models/Booking');
jest.mock('../../src/utils/errorResponse');

describe('Review Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReviews', () => {
    it('should return reviews with status 200', async () => {
      // Setup
      const mockReviews = [
        { 
          _id: 'review1', 
          booking: 'booking123',
          reviewer: 'host123',
          reviewee: 'cleaner123',
          reviewType: 'host-to-cleaner',
          rating: 4,
          comment: 'Great service!'
        },
        { 
          _id: 'review2', 
          booking: 'booking456',
          reviewer: 'cleaner456',
          reviewee: 'host456',
          reviewType: 'cleaner-to-host',
          rating: 5,
          comment: 'Excellent host!'
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
      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReviews)
      });

      // Execute
      await reviewController.getReviews(mockReq, mockRes, mockNext);

      // Assert
      expect(Review.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockReviews.length,
        data: mockReviews
      });
    });

    it('should filter reviews by user ID if provided', async () => {
      // Setup
      const mockReviews = [
        { 
          _id: 'review1', 
          booking: 'booking123',
          reviewer: 'host123',
          reviewee: 'cleaner123',
          reviewType: 'host-to-cleaner',
          rating: 4,
          comment: 'Great service!'
        }
      ];
      const mockReq = {
        query: {
          reviewee: 'cleaner123'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReviews)
      });

      // Execute
      await reviewController.getReviews(mockReq, mockRes, mockNext);

      // Assert
      expect(Review.find).toHaveBeenCalledWith({ reviewee: 'cleaner123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockReviews.length,
        data: mockReviews
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
      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(mockError)
      });

      // Execute
      await reviewController.getReviews(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getReview', () => {
    it('should return a specific review by ID with status 200', async () => {
      // Setup
      const mockReview = { 
        _id: 'review123', 
        booking: 'booking123',
        reviewer: 'host123',
        reviewee: 'cleaner123',
        reviewType: 'host-to-cleaner',
        rating: 4,
        comment: 'Great service!'
      };
      const mockReq = {
        params: { id: 'review123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Review.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReview)
      });

      // Execute
      await reviewController.getReview(mockReq, mockRes, mockNext);

      // Assert
      expect(Review.findById).toHaveBeenCalledWith('review123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockReview
      });
    });

    it('should return 404 if review not found', async () => {
      // Setup
      const mockReq = {
        params: { id: 'nonexistent' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Review.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await reviewController.getReview(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Review not found', 404);
    });
  });

  describe('createReview', () => {
    it('should create a review and return status 201', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        status: 'completed'
      };
      const mockReview = {
        _id: 'review123',
        booking: 'booking123',
        reviewer: 'host123',
        reviewee: 'cleaner123',
        reviewType: 'host-to-cleaner',
        rating: 4,
        comment: 'Great service!'
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          booking: 'booking123',
          reviewType: 'host-to-cleaner',
          rating: 4,
          comment: 'Great service!'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });
      Review.findOne.mockResolvedValue(null);
      Review.create.mockResolvedValue(mockReview);

      // Execute
      await reviewController.createReview(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Booking.findById).toHaveBeenCalledWith('booking123');
      expect(Review.findOne).toHaveBeenCalledWith({
        booking: 'booking123',
        reviewer: 'host123',
        reviewType: 'host-to-cleaner'
      });
      expect(Review.create).toHaveBeenCalledWith({
        booking: 'booking123',
        reviewer: 'host123',
        reviewee: 'cleaner123',
        reviewType: 'host-to-cleaner',
        rating: 4,
        comment: 'Great service!'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockReview
      });
    });

    it('should return 400 if booking is not completed', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        status: 'confirmed' // Not completed
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          booking: 'booking123',
          reviewType: 'host-to-cleaner',
          rating: 4,
          comment: 'Great service!'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
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
      await reviewController.createReview(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Booking must be completed before reviewing', 400);
    });

    it('should return 400 if review already exists for this booking and type', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        role: 'host'
      };
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        status: 'completed'
      };
      const existingReview = {
        _id: 'review123',
        booking: 'booking123',
        reviewer: 'host123',
        reviewType: 'host-to-cleaner'
      };
      const mockReq = {
        user: { id: 'user123' },
        body: {
          booking: 'booking123',
          reviewType: 'host-to-cleaner',
          rating: 4,
          comment: 'Great service!'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking)
      });
      Review.findOne.mockResolvedValue(existingReview);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await reviewController.createReview(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('You have already reviewed this booking', 400);
    });
  });

  describe('updateReview', () => {
    it('should update a review and return status 200', async () => {
      // Setup
      const mockReview = {
        _id: 'review123',
        booking: 'booking123',
        reviewer: 'host123',
        reviewee: 'cleaner123',
        reviewType: 'host-to-cleaner',
        rating: 4,
        comment: 'Good service',
        save: jest.fn().mockResolvedValue({
          _id: 'review123',
          booking: 'booking123',
          reviewer: 'host123',
          reviewee: 'cleaner123',
          reviewType: 'host-to-cleaner',
          rating: 5, // Updated rating
          comment: 'Great service!' // Updated comment
        })
      };
      const mockReq = {
        user: { id: 'user123' },
        params: { id: 'review123' },
        body: {
          rating: 5,
          comment: 'Great service!'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Review.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReview)
      });

      // Execute
      await reviewController.updateReview(mockReq, mockRes, mockNext);

      // Assert
      expect(Review.findById).toHaveBeenCalledWith('review123');
      expect(mockReview.rating).toBe(5);
      expect(mockReview.comment).toBe('Great service!');
      expect(mockReview.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'review123',
          rating: 5,
          comment: 'Great service!'
        })
      });
    });

    it('should return 404 if review not found', async () => {
      // Setup
      const mockReq = {
        user: { id: 'user123' },
        params: { id: 'nonexistent' },
        body: {
          rating: 5,
          comment: 'Great service!'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Review.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await reviewController.updateReview(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Review not found', 404);
    });

    it('should return 403 if user is not the reviewer', async () => {
      // Setup
      const mockReview = {
        _id: 'review123',
        booking: 'booking123',
        reviewer: 'host456', // Different from authenticated user
        reviewee: 'cleaner123',
        reviewType: 'host-to-cleaner',
        rating: 4,
        comment: 'Good service'
      };
      const mockReq = {
        user: { id: 'user123' },
        params: { id: 'review123' },
        body: {
          rating: 5,
          comment: 'Great service!'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Review.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReview)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await reviewController.updateReview(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Not authorized to update this review', 403);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review and return status 200', async () => {
      // Setup
      const mockReview = {
        _id: 'review123',
        booking: 'booking123',
        reviewer: 'host123',
        reviewee: 'cleaner123',
        reviewType: 'host-to-cleaner',
        rating: 4,
        comment: 'Good service',
        remove: jest.fn().mockResolvedValue({})
      };
      const mockReq = {
        user: { id: 'user123' },
        params: { id: 'review123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Review.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReview)
      });

      // Execute
      await reviewController.deleteReview(mockReq, mockRes, mockNext);

      // Assert
      expect(Review.findById).toHaveBeenCalledWith('review123');
      expect(mockReview.remove).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });

    it('should return 404 if review not found', async () => {
      // Setup
      const mockReq = {
        user: { id: 'user123' },
        params: { id: 'nonexistent' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Review.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await reviewController.deleteReview(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Review not found', 404);
    });

    it('should return 403 if user is not the reviewer', async () => {
      // Setup
      const mockReview = {
        _id: 'review123',
        booking: 'booking123',
        reviewer: 'host456', // Different from authenticated user
        reviewee: 'cleaner123',
        reviewType: 'host-to-cleaner',
        rating: 4,
        comment: 'Good service'
      };
      const mockReq = {
        user: { id: 'user123' },
        params: { id: 'review123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Review.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReview)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await reviewController.deleteReview(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Not authorized to delete this review', 403);
    });
  });
});