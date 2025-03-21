const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Host = require('../../src/models/Host');
const Cleaner = require('../../src/models/Cleaner');
const AuthController = require('../../src/controllers/authController');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Auth Controller Tests', () => {
  beforeEach(() => {
    // Restore all stubs and spies
    sinon.restore();
  });

  describe('register', () => {
    it('should register a new host user', async () => {
      // Mock request and response
      const req = {
        body: {
          firstName: 'Test',
          lastName: 'Host',
          email: 'testhost@example.com',
          password: 'Password123!',
          role: 'host',
          phone: '0123456789',
          address: '123 Test Street',
          city: 'Test City',
          zipCode: '75001'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Stub User.findOne to return null (no existing user)
      sinon.stub(User, 'findOne').resolves(null);
      
      // Stub User.create to return a fake user with _id
      const fakeUserId = new mongoose.Types.ObjectId();
      const fakeUser = {
        _id: fakeUserId,
        ...req.body,
        role: 'host',
        getSignedJwtToken: () => 'fake-token'
      };
      sinon.stub(User, 'create').resolves(fakeUser);
      
      // Stub Host.create to return a fake host
      const fakeHost = {
        _id: new mongoose.Types.ObjectId(),
        user: fakeUserId,
        companyName: null
      };
      sinon.stub(Host, 'create').resolves(fakeHost);
      
      // Call the controller method
      await AuthController.register(req, res);
      
      // Verify response
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseArg = res.json.firstCall.args[0];
      expect(responseArg).to.have.property('success', true);
      expect(responseArg).to.have.property('token', 'fake-token');
      expect(responseArg.data).to.have.property('role', 'host');
    });
    
    it('should register a new cleaner user', async () => {
      // Mock request and response
      const req = {
        body: {
          firstName: 'Test',
          lastName: 'Cleaner',
          email: 'testcleaner@example.com',
          password: 'Password123!',
          role: 'cleaner',
          phone: '0123456789',
          address: '123 Test Street',
          city: 'Test City',
          zipCode: '75001',
          siret: '12345678901234'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Stub User.findOne to return null (no existing user)
      sinon.stub(User, 'findOne').resolves(null);
      
      // Stub User.create to return a fake user with _id
      const fakeUserId = new mongoose.Types.ObjectId();
      const fakeUser = {
        _id: fakeUserId,
        ...req.body,
        role: 'cleaner',
        getSignedJwtToken: () => 'fake-token'
      };
      sinon.stub(User, 'create').resolves(fakeUser);
      
      // Stub Cleaner.create to return a fake cleaner
      const fakeCleaner = {
        _id: new mongoose.Types.ObjectId(),
        user: fakeUserId,
        siret: '12345678901234',
        companyName: null,
        iban: null,
        verified: false
      };
      sinon.stub(Cleaner, 'create').resolves(fakeCleaner);
      
      // Call the controller method
      await AuthController.register(req, res);
      
      // Verify response
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseArg = res.json.firstCall.args[0];
      expect(responseArg).to.have.property('success', true);
      expect(responseArg).to.have.property('token', 'fake-token');
      expect(responseArg.data).to.have.property('role', 'cleaner');
    });
    
    it('should return 400 if user already exists', async () => {
      // Mock request and response
      const req = {
        body: {
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          password: 'Password123!',
          role: 'host'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Stub User.findOne to return an existing user
      sinon.stub(User, 'findOne').resolves({
        email: 'testuser@example.com'
      });
      
      // Call the controller method
      await AuthController.register(req, res);
      
      // Verify response
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseArg = res.json.firstCall.args[0];
      expect(responseArg).to.have.property('success', false);
      expect(responseArg).to.have.property('error', 'User already exists');
    });
  });
  
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock request and response
      const req = {
        body: {
          email: 'testuser@example.com',
          password: 'Password123!'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
        cookie: sinon.spy()
      };
      
      // Create a fake user with password methods
      const fakeUser = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        role: 'host',
        matchPassword: sinon.stub().resolves(true),
        getSignedJwtToken: () => 'fake-token'
      };
      
      // Stub User.findOne to return the fake user
      sinon.stub(User, 'findOne').resolves(fakeUser);
      
      // Call the controller method
      await AuthController.login(req, res);
      
      // Verify response
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseArg = res.json.firstCall.args[0];
      expect(responseArg).to.have.property('success', true);
      expect(responseArg).to.have.property('token', 'fake-token');
      expect(responseArg.data).to.deep.include({
        _id: fakeUser._id.toString(),
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        role: 'host'
      });
    });
    
    it('should return 401 if email is not found', async () => {
      // Mock request and response
      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'Password123!'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Stub User.findOne to return null (no user found)
      sinon.stub(User, 'findOne').resolves(null);
      
      // Call the controller method
      await AuthController.login(req, res);
      
      // Verify response
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseArg = res.json.firstCall.args[0];
      expect(responseArg).to.have.property('success', false);
      expect(responseArg).to.have.property('error', 'Invalid credentials');
    });
    
    it('should return 401 if password is incorrect', async () => {
      // Mock request and response
      const req = {
        body: {
          email: 'testuser@example.com',
          password: 'WrongPassword!'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Create a fake user where password doesn't match
      const fakeUser = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        role: 'host',
        matchPassword: sinon.stub().resolves(false) // Password doesn't match
      };
      
      // Stub User.findOne to return the fake user
      sinon.stub(User, 'findOne').resolves(fakeUser);
      
      // Call the controller method
      await AuthController.login(req, res);
      
      // Verify response
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseArg = res.json.firstCall.args[0];
      expect(responseArg).to.have.property('success', false);
      expect(responseArg).to.have.property('error', 'Invalid credentials');
    });
  });
  
  describe('me', () => {
    it('should return the current user', async () => {
      // Mock request with authenticated user
      const fakeUser = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        role: 'host',
        toObject: () => ({
          _id: fakeUser._id,
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          role: 'host'
        })
      };
      
      const req = {
        user: fakeUser
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Call the controller method
      await AuthController.me(req, res);
      
      // Verify response
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseArg = res.json.firstCall.args[0];
      expect(responseArg).to.have.property('success', true);
      expect(responseArg.data).to.deep.include({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        role: 'host'
      });
    });
  });
  
  describe('logout', () => {
    it('should clear the token cookie', async () => {
      // Mock request and response
      const req = {};
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
        cookie: sinon.spy()
      };
      
      // Call the controller method
      await AuthController.logout(req, res);
      
      // Verify response
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.cookie.calledWith('token', 'none', {
        expires: sinon.match.instanceOf(Date),
        httpOnly: true
      })).to.be.true;
      
      const responseArg = res.json.firstCall.args[0];
      expect(responseArg).to.have.property('success', true);
      expect(responseArg).to.have.property('message', 'User logged out successfully');
    });
  });
});