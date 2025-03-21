const { expect } = require('chai');
const sinon = require('sinon');
const PaymentService = require('../../src/services/PaymentService');
const Booking = require('../../src/models/Booking');
const stripe = require('stripe');

describe('Payment Service Tests', () => {
  let paymentService;
  let stripeStub;
  
  beforeEach(() => {
    // Create stubs for Stripe API calls
    stripeStub = {
      paymentIntents: {
        create: sinon.stub(),
        retrieve: sinon.stub(),
        update: sinon.stub(),
        cancel: sinon.stub()
      },
      transfers: {
        create: sinon.stub()
      },
      refunds: {
        create: sinon.stub()
      }
    };
    
    // Create instance of payment service with stubbed stripe
    paymentService = new PaymentService();
    paymentService.stripe = stripeStub;
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('createPaymentIntent', () => {
    it('should create a payment intent for a booking', async () => {
      // Setup test booking
      const booking = {
        _id: '60a6c3c3e4b0c21234567890',
        totalPrice: 100.50,
        cleanerPay: 85.43,
        serviceFee: 15.07,
        host: {
          email: 'host@example.com'
        }
      };
      
      // Mock the Stripe response
      const mockPaymentIntent = {
        id: 'pi_test123456',
        client_secret: 'pi_test123456_secret_87654321',
        amount: 10050,
        status: 'requires_payment_method'
      };
      
      stripeStub.paymentIntents.create.resolves(mockPaymentIntent);
      
      // Execute the method
      const result = await paymentService.createPaymentIntent(booking);
      
      // Verify result
      expect(result).to.have.property('paymentIntentId', 'pi_test123456');
      expect(result).to.have.property('clientSecret', 'pi_test123456_secret_87654321');
      
      // Verify stripe was called with correct parameters
      expect(stripeStub.paymentIntents.create.calledOnce).to.be.true;
      const createArgs = stripeStub.paymentIntents.create.firstCall.args[0];
      expect(createArgs.amount).to.equal(10050); // 100.50 converted to cents
      expect(createArgs.currency).to.equal('eur');
      expect(createArgs.metadata.bookingId).to.equal('60a6c3c3e4b0c21234567890');
    });
    
    it('should handle errors when creating payment intent', async () => {
      // Setup test booking
      const booking = {
        _id: '60a6c3c3e4b0c21234567890',
        totalPrice: 100.50,
        host: {
          email: 'host@example.com'
        }
      };
      
      // Simulate Stripe error
      const stripeError = new Error('Stripe API error');
      stripeStub.paymentIntents.create.rejects(stripeError);
      
      // Execute and verify error handling
      try {
        await paymentService.createPaymentIntent(booking);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Payment processing failed');
      }
    });
  });
  
  describe('processCleanerPayment', () => {
    it('should transfer payment to cleaner when booking is completed', async () => {
      // Setup booking with completed status
      const booking = {
        _id: '60a6c3c3e4b0c21234567890',
        status: 'completed',
        paymentIntentId: 'pi_test123456',
        cleanerPay: 85.43,
        cleaner: {
          stripeAccountId: 'acct_cleaner123',
          email: 'cleaner@example.com'
        }
      };
      
      // Mock Stripe responses
      stripeStub.paymentIntents.retrieve.resolves({
        id: 'pi_test123456',
        status: 'succeeded',
        amount: 10050
      });
      
      stripeStub.transfers.create.resolves({
        id: 'tr_test123456',
        amount: 8543,
        destination: 'acct_cleaner123'
      });
      
      // Execute the method
      const result = await paymentService.processCleanerPayment(booking);
      
      // Verify result
      expect(result).to.have.property('success', true);
      expect(result).to.have.property('transferId', 'tr_test123456');
      
      // Verify stripe was called correctly
      expect(stripeStub.transfers.create.calledOnce).to.be.true;
      const transferArgs = stripeStub.transfers.create.firstCall.args[0];
      expect(transferArgs.amount).to.equal(8543); // 85.43 converted to cents
      expect(transferArgs.currency).to.equal('eur');
      expect(transferArgs.destination).to.equal('acct_cleaner123');
      expect(transferArgs.metadata.bookingId).to.equal('60a6c3c3e4b0c21234567890');
    });
    
    it('should not process payment if booking is not completed', async () => {
      // Setup booking with non-completed status
      const booking = {
        _id: '60a6c3c3e4b0c21234567890',
        status: 'in_progress',
        paymentIntentId: 'pi_test123456',
        cleanerPay: 85.43,
        cleaner: {
          stripeAccountId: 'acct_cleaner123'
        }
      };
      
      // Execute and verify error handling
      try {
        await paymentService.processCleanerPayment(booking);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Booking is not completed');
        expect(stripeStub.transfers.create.called).to.be.false;
      }
    });
  });
  
  describe('refundHost', () => {
    it('should process refund for host when booking is cancelled', async () => {
      // Setup cancelled booking
      const booking = {
        _id: '60a6c3c3e4b0c21234567890',
        status: 'cancelled',
        paymentIntentId: 'pi_test123456',
        totalPrice: 100.50,
        host: {
          email: 'host@example.com'
        }
      };
      
      // Mock Stripe responses
      stripeStub.paymentIntents.retrieve.resolves({
        id: 'pi_test123456',
        status: 'succeeded',
        amount: 10050
      });
      
      stripeStub.refunds.create.resolves({
        id: 're_test123456',
        amount: 10050,
        status: 'succeeded'
      });
      
      // Execute the method
      const result = await paymentService.refundHost(booking);
      
      // Verify result
      expect(result).to.have.property('success', true);
      expect(result).to.have.property('refundId', 're_test123456');
      
      // Verify stripe was called correctly
      expect(stripeStub.refunds.create.calledOnce).to.be.true;
      const refundArgs = stripeStub.refunds.create.firstCall.args[0];
      expect(refundArgs.payment_intent).to.equal('pi_test123456');
      expect(refundArgs.metadata.bookingId).to.equal('60a6c3c3e4b0c21234567890');
    });
    
    it('should not refund if booking is not cancelled', async () => {
      // Setup non-cancelled booking
      const booking = {
        _id: '60a6c3c3e4b0c21234567890',
        status: 'completed',
        paymentIntentId: 'pi_test123456',
        totalPrice: 100.50
      };
      
      // Execute and verify error handling
      try {
        await paymentService.refundHost(booking);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Booking is not cancelled');
        expect(stripeStub.refunds.create.called).to.be.false;
      }
    });
  });
});