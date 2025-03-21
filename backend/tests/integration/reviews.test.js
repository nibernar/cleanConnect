const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/server');
const Review = require('../../src/models/Review');
const User = require('../../src/models/User');
const Host = require('../../src/models/Host');
const Cleaner = require('../../src/models/Cleaner');
const Booking = require('../../src/models/Booking');

describe('Review API Integration Tests', () => {
  let hostToken, cleanerToken, testHost, testCleaner, testBooking, testReview;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST);

    // Create test users
    const hostUser = await User.create({
      name: 'Test Host',
      email: 'testhost@example.com',
      password: 'password123',
      role: 'host'
    });

    const cleanerUser = await User.create({
      name: 'Test Cleaner',
      email: 'testcleaner@example.com',
      password: 'password123',
      role: 'cleaner'
    });

    // Create host and cleaner profiles
    testHost = await Host.create({
      user: hostUser._id,
      businessName: 'Test Host Business',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566],
        address: 'Paris, France'
      }
    });

    testCleaner = await Cleaner.create({
      user: cleanerUser._id,
      businessName: 'Test Cleaner Business',
      siret: '12345678901234',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566],
        address: 'Paris, France'
      },
      bankInfo: {
        iban: 'FR1420041010050500013M02606',
        holderName: 'Test Cleaner'
      }
    });

    // Create test booking
    testBooking = await Booking.create({
      host: testHost._id,
      cleaner: testCleaner._id,
      listing: mongoose.Types.ObjectId(),
      date: new Date(),
      status: 'completed',
      price: 50,
      tasks: ['dusting', 'vacuuming']
    });

    // Get tokens
    const hostLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testhost@example.com',
        password: 'password123'
      });

    const cleanerLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testcleaner@example.com',
        password: 'password123'
      });

    hostToken = hostLoginRes.body.token;
    cleanerToken = cleanerLoginRes.body.token;
  });

  afterAll(async () => {
    // Clean up database
    await User.deleteMany({});
    await Host.deleteMany({});
    await Cleaner.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    
    // Disconnect from database
    await mongoose.disconnect();
  });

  describe('POST /api/v1/reviews', () => {
    it('should create a new review from host to cleaner', async () => {
      const reviewData = {
        booking: testBooking._id.toString(),
        rating: 4,
        comment: 'Great service, very thorough cleaning.',
        reviewType: 'host-to-cleaner'
      };

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(reviewData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('rating', 4);
      expect(res.body.data).toHaveProperty('comment', 'Great service, very thorough cleaning.');
      expect(res.body.data).toHaveProperty('reviewer');
      expect(res.body.data).toHaveProperty('reviewee');

      testReview = res.body.data;
    });

    it('should create a new review from cleaner to host', async () => {
      const reviewData = {
        booking: testBooking._id.toString(),
        rating: 5,
        comment: 'Excellent host, clear instructions and friendly.',
        reviewType: 'cleaner-to-host'
      };

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${cleanerToken}`)
        .send(reviewData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('rating', 5);
      expect(res.body.data).toHaveProperty('comment', 'Excellent host, clear instructions and friendly.');
    });

    it('should not allow review creation without a booking', async () => {
      const reviewData = {
        rating: 3,
        comment: 'No booking reference',
        reviewType: 'host-to-cleaner'
      };

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(reviewData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not allow duplicate reviews', async () => {
      const reviewData = {
        booking: testBooking._id.toString(),
        rating: 3,
        comment: 'This is a duplicate review',
        reviewType: 'host-to-cleaner'
      };

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(reviewData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('already reviewed');
    });
  });

  describe('GET /api/v1/reviews', () => {
    it('should get all reviews', async () => {
      const res = await request(app)
        .get('/api/v1/reviews')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter reviews by user', async () => {
      const res = await request(app)
        .get(`/api/v1/reviews?reviewee=${testCleaner._id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].reviewee.toString()).toEqual(testCleaner._id.toString());
    });
  });

  describe('GET /api/v1/reviews/:id', () => {
    it('should get a specific review by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', testReview._id);
      expect(res.body.data).toHaveProperty('rating', testReview.rating);
      expect(res.body.data).toHaveProperty('comment', testReview.comment);
    });

    it('should return 404 for non-existent review ID', async () => {
      const fakeId = mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/reviews/:id', () => {
    it('should not allow deletion by unauthorized user', async () => {
      const res = await request(app)
        .delete(`/api/v1/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${cleanerToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should delete a review', async () => {
      const res = await request(app)
        .delete(`/api/v1/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toEqual({});

      // Verify deletion
      const checkRes = await request(app)
        .get(`/api/v1/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(checkRes.statusCode).toEqual(404);
    });
  });
});