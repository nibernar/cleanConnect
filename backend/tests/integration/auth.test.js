const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');

describe('Auth API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cleanconnect_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new host user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Host User',
          email: 'host@example.com',
          password: 'password123',
          role: 'host',
          location: {
            address: '123 Main St',
            city: 'Paris',
            postalCode: '75001',
            country: 'France'
          }
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('role', 'host');
    });

    it('should register a new cleaner user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Cleaner User',
          email: 'cleaner@example.com',
          password: 'password123',
          role: 'cleaner',
          location: {
            address: '456 Cleaning St',
            city: 'Lyon',
            postalCode: '69001',
            country: 'France'
          },
          siret: '12345678901234'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('role', 'cleaner');
    });

    it('should not register a user with existing email', async () => {
      // Create initial user
      await User.create({
        name: 'Existing User',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'host'
      });

      // Try to register with the same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: 'duplicate@example.com',
          password: 'password123',
          role: 'host'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      // Create a user
      const user = await User.create({
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'password123',
        role: 'host'
      });

      // Login with created user
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
    });

    it('should not login with invalid password', async () => {
      // Create a user
      const user = await User.create({
        name: 'Failed Login User',
        email: 'failedlogin@example.com',
        password: 'password123',
        role: 'host'
      });

      // Try to login with wrong password
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'failedlogin@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user when authenticated', async () => {
      // Create a user
      const user = await User.create({
        name: 'Current User',
        email: 'current@example.com',
        password: 'password123',
        role: 'cleaner'
      });

      // Login to get token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'current@example.com',
          password: 'password123'
        });

      const token = loginRes.body.token;

      // Get current user with token
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('name', 'Current User');
      expect(res.body.data).toHaveProperty('email', 'current@example.com');
    });

    it('should not allow access without token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/forgotpassword', () => {
    it('should send reset token when email exists', async () => {
      // Create a user
      const user = await User.create({
        name: 'Reset Password User',
        email: 'reset@example.com',
        password: 'password123',
        role: 'host'
      });

      // Mock email sending function
      const originalSendEmail = require('../../utils/sendEmail');
      require('../../utils/sendEmail').sendEmail = jest.fn().mockResolvedValue(true);

      // Request password reset
      const res = await request(app)
        .post('/api/v1/auth/forgotpassword')
        .send({
          email: 'reset@example.com'
        });

      // Restore original function
      require('../../utils/sendEmail').sendEmail = originalSendEmail;

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data', 'Email sent');
    });

    it('should return error for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgotpassword')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });
});