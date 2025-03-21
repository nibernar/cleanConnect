const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Listing = require('../../src/models/Listing');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/jwt');

describe('Listings API Integration Tests', () => {
  let hostUser;
  let hostToken;
  let testListing;

  before(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/cleanconnect_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a test host user
    hostUser = new User({
      email: 'host@test.com',
      password: 'Password123!',
      firstName: 'Host',
      lastName: 'Test',
      role: 'host',
      phone: '0123456789',
      address: '123 Test Street',
      city: 'Test City',
      zipCode: '75001',
    });

    await hostUser.save();
    hostToken = generateToken(hostUser);
  });

  beforeEach(async () => {
    // Clean listings collection before each test
    await Listing.deleteMany({});

    // Create a test listing
    testListing = new Listing({
      host: hostUser._id,
      title: 'Test Listing',
      accommodationType: 'Appartement',
      address: '123 rue du Test, 75001 Paris',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      },
      area: 50,
      peopleNeeded: 1,
      date: new Date('2023-05-15'),
      startTime: '09:00',
      endTime: '12:00',
      services: ['Nettoyage complet', 'Aspirateur', 'Lavage de sols'],
      equipment: ['Aspirateur', 'Produits fournis'],
      notes: 'Appartement au 2ème étage avec ascenseur',
      price: 77.5,
      status: 'pending'
    });

    await testListing.save();
  });

  after(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Listing.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/listings', () => {
    it('should get all listings', async () => {
      const res = await request(app)
        .get('/api/listings')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('count', 1);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.be.an('array');
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.data[0]).to.have.property('title', 'Test Listing');
    });

    it('should filter listings by query parameters', async () => {
      // Add another listing with different accommodationType
      const otherListing = new Listing({
        host: hostUser._id,
        title: 'Other Listing',
        accommodationType: 'Maison',
        address: '456 rue du Test, 75002 Paris',
        location: {
          type: 'Point',
          coordinates: [2.3522, 48.8566]
        },
        area: 100,
        peopleNeeded: 2,
        date: new Date('2023-05-16'),
        startTime: '10:00',
        endTime: '14:00',
        services: ['Nettoyage complet', 'Vitres'],
        price: 155,
        status: 'pending'
      });
      await otherListing.save();

      // Filter by accommodationType
      const res = await request(app)
        .get('/api/listings?accommodationType=Appartement')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('count', 1);
      expect(res.body.data[0]).to.have.property('accommodationType', 'Appartement');
    });
  });

  describe('GET /api/listings/:id', () => {
    it('should get a single listing by ID', async () => {
      const res = await request(app)
        .get(`/api/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('_id', testListing._id.toString());
      expect(res.body.data).to.have.property('title', 'Test Listing');
    });

    it('should return 404 for non-existent listing ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/listings/${nonExistentId}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
    });
  });

  describe('POST /api/listings', () => {
    it('should create a new listing', async () => {
      const newListing = {
        title: 'New Test Listing',
        accommodationType: 'Studio',
        address: '789 rue du Test, 75003 Paris',
        area: 30,
        peopleNeeded: 1,
        date: '2023-06-01',
        startTime: '14:00',
        endTime: '16:00',
        services: ['Nettoyage simple', 'Poussière'],
        equipment: ['Aspirateur disponible'],
        notes: 'Petit studio facile à nettoyer',
      };

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(newListing);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('title', 'New Test Listing');
      expect(res.body.data).to.have.property('host', hostUser._id.toString());
      expect(res.body.data).to.have.property('status', 'pending');
      
      // Verify the price calculation logic
      expect(res.body.data).to.have.property('price');
      // Check that a price has been calculated (without checking exact value as it may depend on business logic)
      expect(res.body.data.price).to.be.a('number');
      expect(res.body.data.price).to.be.greaterThan(0);
    });

    it('should require authentication', async () => {
      const newListing = {
        title: 'New Test Listing',
        accommodationType: 'Studio',
        address: '789 rue du Test, 75003 Paris',
        area: 30,
      };

      const res = await request(app)
        .post('/api/listings')
        .send(newListing);

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should validate required fields', async () => {
      const invalidListing = {
        // Missing required fields
        title: 'Invalid Listing'
      };

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(invalidListing);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
      // Ensure validation catches missing fields
      expect(res.body.error).to.include('required');
    });
  });

  describe('PUT /api/listings/:id', () => {
    it('should update a listing', async () => {
      const updateData = {
        title: 'Updated Listing Title',
        notes: 'Updated notes information'
      };

      const res = await request(app)
        .put(`/api/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('title', 'Updated Listing Title');
      expect(res.body.data).to.have.property('notes', 'Updated notes information');
      // Ensure other fields remain unchanged
      expect(res.body.data).to.have.property('accommodationType', 'Appartement');
    });

    it('should not allow updating a listing owned by another user', async () => {
      // Create another user
      const otherUser = new User({
        email: 'other@test.com',
        password: 'Password123!',
        firstName: 'Other',
        lastName: 'User',
        role: 'host',
      });
      await otherUser.save();
      const otherToken = generateToken(otherUser);

      // Try to update with the other user's token
      const updateData = {
        title: 'Malicious Update'
      };

      const res = await request(app)
        .put(`/api/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData);

      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('DELETE /api/listings/:id', () => {
    it('should delete a listing', async () => {
      const res = await request(app)
        .delete(`/api/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);

      // Verify listing is actually deleted
      const deletedListing = await Listing.findById(testListing._id);
      expect(deletedListing).to.be.null;
    });

    it('should not allow deleting a listing owned by another user', async () => {
      // Create another user
      const otherUser = new User({
        email: 'other2@test.com',
        password: 'Password123!',
        firstName: 'Other',
        lastName: 'User2',
        role: 'host',
      });
      await otherUser.save();
      const otherToken = generateToken(otherUser);

      // Try to delete with the other user's token
      const res = await request(app)
        .delete(`/api/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('success', false);

      // Verify listing is not deleted
      const listing = await Listing.findById(testListing._id);
      expect(listing).to.not.be.null;
    });
  });

  describe('GET /api/listings/nearby', () => {
    it('should find listings within a certain radius', async () => {
      // Create a cleaner user for testing
      const cleanerUser = new User({
        email: 'cleaner@test.com',
        password: 'Password123!',
        firstName: 'Cleaner',
        lastName: 'Test',
        role: 'cleaner',
      });
      await cleanerUser.save();
      const cleanerToken = generateToken(cleanerUser);

      // Add additional listings with different locations
      const nearbyListing = new Listing({
        host: hostUser._id,
        title: 'Nearby Listing',
        accommodationType: 'Appartement',
        address: '123 rue Proche, 75001 Paris',
        location: {
          type: 'Point',
          coordinates: [2.3523, 48.8567] // Very close to the coordinates in the query
        },
        area: 40,
        peopleNeeded: 1,
        date: new Date('2023-05-20'),
        startTime: '10:00',
        endTime: '13:00',
        services: ['Nettoyage complet'],
        price: 62,
        status: 'pending'
      });
      await nearbyListing.save();

      const farListing = new Listing({
        host: hostUser._id,
        title: 'Far Listing',
        accommodationType: 'Maison',
        address: '123 rue Lointaine, 69000 Lyon',
        location: {
          type: 'Point',
          coordinates: [4.8357, 45.7640] // Lyon, far from Paris
        },
        area: 80,
        peopleNeeded: 1,
        date: new Date('2023-05-21'),
        startTime: '09:00',
        endTime: '15:00',
        services: ['Nettoyage complet'],
        price: 124,
        status: 'pending'
      });
      await farListing.save();

      // Query for nearby listings around Paris coordinates
      const res = await request(app)
        .get('/api/listings/nearby')
        .set('Authorization', `Bearer ${cleanerToken}`)
        .query({
          longitude: 2.3522,
          latitude: 48.8566,
          radius: 10 // 10km radius
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('count', 2); // Should find testListing and nearbyListing
      expect(res.body.data.some(listing => listing.title === 'Test Listing')).to.be.true;
      expect(res.body.data.some(listing => listing.title === 'Nearby Listing')).to.be.true;
      expect(res.body.data.some(listing => listing.title === 'Far Listing')).to.be.false;
    });
  });
});