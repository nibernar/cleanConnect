const invoiceController = require('../../src/controllers/invoice.controller');
const Invoice = require('../../src/models/Invoice');
const Booking = require('../../src/models/Booking');
const User = require('../../src/models/User');
const errorResponse = require('../../src/utils/errorResponse');

// Mock dependencies
jest.mock('../../src/models/Invoice');
jest.mock('../../src/models/Booking');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/errorResponse');

describe('Invoice Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInvoices', () => {
    it('should return user invoices with status 200', async () => {
      // Setup
      const mockInvoices = [
        { 
          _id: 'inv1', 
          booking: 'booking123',
          host: 'host123',
          cleaner: 'cleaner123',
          amount: 100,
          commission: 15,
          netAmount: 85,
          status: 'paid',
          invoiceNumber: 'INV-2023-001'
        }
      ];
      const mockReq = {
        user: { id: 'user123', role: 'host' },
        query: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue({ _id: 'user123', role: 'host' });
      Invoice.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockInvoices)
      });

      // Execute
      await invoiceController.getInvoices(mockReq, mockRes, mockNext);

      // Assert
      expect(Invoice.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockInvoices.length,
        data: mockInvoices
      });
    });

    it('should handle errors properly', async () => {
      // Setup
      const mockError = new Error('Test error');
      const mockReq = {
        user: { id: 'user123', role: 'host' },
        query: {}
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      User.findById.mockResolvedValue({ _id: 'user123', role: 'host' });
      Invoice.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(mockError)
      });

      // Execute
      await invoiceController.getInvoices(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getInvoice', () => {
    it('should return a specific invoice by ID with status 200', async () => {
      // Setup
      const mockInvoice = { 
        _id: 'inv123', 
        booking: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        amount: 100,
        commission: 15,
        netAmount: 85,
        status: 'paid',
        invoiceNumber: 'INV-2023-001'
      };
      const mockReq = {
        user: { id: 'user123', role: 'host' },
        params: { id: 'inv123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Invoice.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockInvoice)
      });

      // Execute
      await invoiceController.getInvoice(mockReq, mockRes, mockNext);

      // Assert
      expect(Invoice.findById).toHaveBeenCalledWith('inv123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockInvoice
      });
    });

    it('should return 404 if invoice not found', async () => {
      // Setup
      const mockReq = {
        user: { id: 'user123', role: 'host' },
        params: { id: 'inv123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Invoice.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await invoiceController.getInvoice(mockReq, mockRes, mockNext);

      // Assert
      expect(Invoice.findById).toHaveBeenCalledWith('inv123');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Invoice not found', 404);
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice and return status 201', async () => {
      // Setup
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        status: 'completed',
        price: 100
      };
      const mockInvoice = {
        _id: 'inv123',
        booking: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        amount: 100,
        commission: 15,
        netAmount: 85,
        status: 'pending',
        invoiceNumber: 'INV-2023-001'
      };
      const mockReq = {
        user: { id: 'user123', role: 'admin' },
        body: {
          booking: 'booking123',
          amount: 100,
          commission: 15,
          netAmount: 85,
          status: 'pending'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockResolvedValue(mockBooking);
      Invoice.findOne.mockResolvedValue(null);
      Invoice.create.mockResolvedValue(mockInvoice);

      // Execute
      await invoiceController.createInvoice(mockReq, mockRes, mockNext);

      // Assert
      expect(Booking.findById).toHaveBeenCalledWith('booking123');
      expect(Invoice.findOne).toHaveBeenCalledWith({ booking: 'booking123' });
      expect(Invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        booking: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        amount: 100,
        commission: 15,
        netAmount: 85,
        status: 'pending'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockInvoice
      });
    });

    it('should return 400 if booking already has an invoice', async () => {
      // Setup
      const mockBooking = {
        _id: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        status: 'completed',
        price: 100
      };
      const existingInvoice = {
        _id: 'inv123',
        booking: 'booking123'
      };
      const mockReq = {
        user: { id: 'user123', role: 'admin' },
        body: {
          booking: 'booking123',
          amount: 100,
          commission: 15,
          netAmount: 85,
          status: 'pending'
        }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Booking.findById.mockResolvedValue(mockBooking);
      Invoice.findOne.mockResolvedValue(existingInvoice);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await invoiceController.createInvoice(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Invoice already exists for this booking', 400);
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice and return status 200', async () => {
      // Setup
      const mockInvoice = {
        _id: 'inv123',
        booking: 'booking123',
        host: 'host123',
        cleaner: 'cleaner123',
        amount: 100,
        commission: 15,
        netAmount: 85,
        status: 'pending',
        save: jest.fn().mockResolvedValue({
          _id: 'inv123',
          booking: 'booking123',
          host: 'host123',
          cleaner: 'cleaner123',
          amount: 100,
          commission: 15,
          netAmount: 85,
          status: 'paid'
        })
      };
      const mockReq = {
        user: { id: 'user123', role: 'admin' },
        params: { id: 'inv123' },
        body: {
          status: 'paid'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Invoice.findById.mockResolvedValue(mockInvoice);

      // Execute
      await invoiceController.updateInvoice(mockReq, mockRes, mockNext);

      // Assert
      expect(Invoice.findById).toHaveBeenCalledWith('inv123');
      expect(mockInvoice.status).toBe('paid');
      expect(mockInvoice.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'inv123',
          status: 'paid'
        })
      });
    });
  });

  describe('getStats', () => {
    it('should return invoice statistics with status 200', async () => {
      // Setup
      const mockStats = {
        totalRevenue: 1000,
        monthlyRevenue: [
          { month: '2023-01', revenue: 200 },
          { month: '2023-02', revenue: 300 },
          { month: '2023-03', revenue: 500 }
        ]
      };
      const mockReq = {
        user: { id: 'user123', role: 'admin' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation with MongoDB aggregation pipeline
      Invoice.aggregate.mockResolvedValue([{ totalRevenue: 1000 }]);
      Invoice.aggregate.mockResolvedValueOnce([
        { _id: { year: 2023, month: 1 }, revenue: 200 },
        { _id: { year: 2023, month: 2 }, revenue: 300 },
        { _id: { year: 2023, month: 3 }, revenue: 500 }
      ]);

      // Execute
      await invoiceController.getStats(mockReq, mockRes, mockNext);

      // Assert
      expect(Invoice.aggregate).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          totalRevenue: expect.any(Number),
          monthlyRevenue: expect.any(Array)
        })
      });
    });
  });
});