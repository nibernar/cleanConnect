const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { protect, authorize } = require('../../src/middleware/auth');
const User = require('../../src/models/User');

describe('Auth Middleware Tests', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('protect middleware', () => {
    it('should call next() if valid token provided in headers', async () => {
      // Mock user
      const userId = new mongoose.Types.ObjectId();
      const user = {
        _id: userId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'host'
      };

      // Mock request with authorization header
      const req = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };

      // Mock response and next
      const res = {};
      const next = sinon.spy();

      // Stub jwt.verify to return decoded token
      sinon.stub(jwt, 'verify').returns({ id: userId });

      // Stub User.findById to return the user
      sinon.stub(User, 'findById').resolves(user);

      // Call middleware
      await protect(req, res, next);

      // Assertions
      expect(jwt.verify.calledOnce).to.be.true;
      expect(User.findById.calledWith(userId)).to.be.true;
      expect(req.user).to.deep.equal(user);
      expect(next.calledOnce).to.be.true;
      expect(next.args[0]).to.be.empty; // next called without error
    });

    it('should call next() if valid token provided in cookies', async () => {
      // Mock user
      const userId = new mongoose.Types.ObjectId();
      const user = {
        _id: userId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'host'
      };

      // Mock request with cookie
      const req = {
        headers: {},
        cookies: {
          token: 'valid-token'
        }
      };

      // Mock response and next
      const res = {};
      const next = sinon.spy();

      // Stub jwt.verify to return decoded token
      sinon.stub(jwt, 'verify').returns({ id: userId });

      // Stub User.findById to return the user
      sinon.stub(User, 'findById').resolves(user);

      // Call middleware
      await protect(req, res, next);

      // Assertions
      expect(jwt.verify.calledOnce).to.be.true;
      expect(User.findById.calledWith(userId)).to.be.true;
      expect(req.user).to.deep.equal(user);
      expect(next.calledOnce).to.be.true;
    });

    it('should return 401 if no token is provided', async () => {
      // Mock request without token
      const req = {
        headers: {},
        cookies: {}
      };

      // Mock response
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      // Mock next
      const next = sinon.spy();

      // Call middleware
      await protect(req, res, next);

      // Assertions
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Not authorized to access this route');
      expect(next.called).to.be.false;
    });

    it('should return 401 if token is invalid', async () => {
      // Mock request with invalid token
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };

      // Mock response
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      // Mock next
      const next = sinon.spy();

      // Stub jwt.verify to throw error
      sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));

      // Call middleware
      await protect(req, res, next);

      // Assertions
      expect(jwt.verify.calledOnce).to.be.true;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Not authorized to access this route');
      expect(next.called).to.be.false;
    });

    it('should return 401 if user not found', async () => {
      // Mock request with valid token
      const req = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };

      // Mock response
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      // Mock next
      const next = sinon.spy();

      // Stub jwt.verify to return decoded token
      const userId = new mongoose.Types.ObjectId();
      sinon.stub(jwt, 'verify').returns({ id: userId });

      // Stub User.findById to return null (user not found)
      sinon.stub(User, 'findById').resolves(null);

      // Call middleware
      await protect(req, res, next);

      // Assertions
      expect(jwt.verify.calledOnce).to.be.true;
      expect(User.findById.calledWith(userId)).to.be.true;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Not authorized to access this route');
      expect(next.called).to.be.false;
    });
  });

  describe('authorize middleware', () => {
    it('should call next() if user has authorized role', () => {
      // Create middleware function for specific roles
      const middleware = authorize('host', 'admin');

      // Mock request with user having authorized role
      const req = {
        user: {
          role: 'host'
        }
      };

      // Mock response
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      // Mock next
      const next = sinon.spy();

      // Call middleware
      middleware(req, res, next);

      // Assertions
      expect(next.calledOnce).to.be.true;
      expect(next.args[0]).to.be.empty; // next called without error
    });

    it('should return 403 if user does not have authorized role', () => {
      // Create middleware function for specific roles
      const middleware = authorize('host', 'admin', 'cleaner');

      // Mock request with user having unauthorized role
      const req = {
        user: {
          role: 'cleaner'
        }
      };

      // Mock response
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      // Mock next
      const next = sinon.spy();

      // Call middleware
      middleware(req, res, next);

      // Assertions
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Not authorized to access this route');
      expect(next.called).to.be.false;
    });
  });
});