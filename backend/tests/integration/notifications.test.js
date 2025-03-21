const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/server');
const User = require('../../src/models/User');
const Notification = require('../../src/models/Notification');

describe('Notifications API Integration Tests', () => {
  let userToken, testNotification;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST);

    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'testnotifications@example.com',
      password: 'password123',
      role: 'host'
    });

    // Create test notifications
    await Notification.create([
      {
        user: user._id,
        title: 'New Booking Request',
        message: 'You have a new booking request from a cleaner',
        type: 'booking',
        read: false
      },
      {
        user: user._id,
        title: 'Payment Confirmation',
        message: 'Your payment has been processed successfully',
        type: 'payment',
        read: false
      }
    ]);

    // Login to get token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testnotifications@example.com',
        password: 'password123'
      });

    userToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Clean up database
    await User.deleteMany({});
    await Notification.deleteMany({});
    
    // Disconnect from database
    await mongoose.disconnect();
  });

  describe('GET /api/v1/notifications', () => {
    it('should get all notifications for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Save a notification for later tests
      testNotification = res.body.data[0];
    });

    it('should allow filtering by read status', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?read=false')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      
      // All returned notifications should be unread
      expect(res.body.data.every(notification => notification.read === false)).toBe(true);
    });

    it('should allow filtering by notification type', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?type=booking')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      
      // All returned notifications should be of type booking
      expect(res.body.data.every(notification => notification.type === 'booking')).toBe(true);
    });
  });

  describe('GET /api/v1/notifications/count', () => {
    it('should get the count of unread notifications', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('unreadCount');
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PUT /api/v1/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const res = await request(app)
        .put(`/api/v1/notifications/${testNotification._id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('read', true);

      // Verify the notification is marked as read
      const checkRes = await request(app)
        .get(`/api/v1/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(checkRes.statusCode).toEqual(200);
      expect(checkRes.body.data).toHaveProperty('read', true);
    });

    it('should return 404 for non-existent notification ID', async () => {
      const fakeId = mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/v1/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .put('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('modifiedCount');
      expect(res.body.data.modifiedCount).toBeGreaterThanOrEqual(1);

      // Verify all notifications are marked as read
      const checkRes = await request(app)
        .get('/api/v1/notifications?read=false')
        .set('Authorization', `Bearer ${userToken}`);

      expect(checkRes.statusCode).toEqual(200);
      expect(checkRes.body.data).toHaveLength(0);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete a notification', async () => {
      const res = await request(app)
        .delete(`/api/v1/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toEqual({});

      // Verify notification is deleted
      const checkRes = await request(app)
        .get(`/api/v1/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(checkRes.statusCode).toEqual(404);
    });
  });
});