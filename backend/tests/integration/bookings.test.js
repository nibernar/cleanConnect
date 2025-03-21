const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Booking = require('../../src/models/Booking');
const Listing = require('../../src/models/Listing');
const Host = require('../../src/models/Host');
const Cleaner = require('../../src/models/Cleaner');
const { generateToken } = require('../../src/utils/jwt');

describe('Bookings API Integration Tests', () => {
  let hostUser;
  let cleanerUser;
  let hostToken;
  let cleanerToken;
  let testListing;
  let testBooking;

  before(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/cleanconnect_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test users
    hostUser = new User({
      email: 'host_booking@test.com',
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

    cleanerUser = new User({
      email: 'cleaner_booking@test.com',
      password: 'Password123!',
      firstName: 'Cleaner',
      lastName: 'Test',
      role: 'cleaner',
      phone: '0123456789',
      address: '123 Test Street',
      city: 'Test City',
      zipCode: '75001',
    });
    await cleanerUser.save();

    // Create related profiles
    await Host.create({
      user: hostUser._id,
      companyName: 'Test Host Inc.'
    });

    await Cleaner.create({
      user: cleanerUser._id,
      siret: '12345678901234',
      iban: 'FR7612345987650123456789014',
      verified: true
    });

    // Generate tokens
    hostToken = generateToken(hostUser);
    cleanerToken = generateToken(cleanerUser);

    // Create test listing
    testListing = new Listing({
      host: hostUser._id,
      title: 'Test Listing for Booking',
      accommodationType: 'Appartement',
      address: '123 rue du Test, 75001 Paris',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      },
      area: 60,
      peopleNeeded: 1,
      date: new Date('2023-06-01'),
      startTime: '09:00',
      endTime: '12:00',
      services: ['Nettoyage complet', 'Aspirateur', 'Lavage de sols'],
      equipment: ['Aspirateur', 'Produits fournis'],
      notes: 'Appartement au 2ème étage avec ascenseur',
      price: 93,
      status: 'active'
    });
    await testListing.save();
  });

  beforeEach(async () => {
    // Clean bookings collection before each test
    await Booking.deleteMany({});

    // Create test booking
    testBooking = new Booking({
      listing: testListing._id,
      host: hostUser._id,
      cleaner: cleanerUser._id,
      date: new Date('2023-06-01'),
      startTime: '09:00',
      endTime: '12:00',
      totalPrice: 93,
      cleanerPay: 79.05, // 93 - 15% service fee
      serviceFee: 13.95,
      status: 'pending',
      tasks: [
        { title: 'Nettoyage complet', completed: false },
        { title: 'Aspirateur', completed: false },
        { title: 'Lavage de sols', completed: false }
      ]
    });
    await testBooking.save();
  });

  after(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Host.deleteMany({});
    await Cleaner.deleteMany({});
    await Listing.deleteMany({});
    await Booking.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/bookings', () => {
    it('should get all bookings for a host', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('count', 1);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.be.an('array');
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.data[0]).to.have.property('host', hostUser._id.toString());
    });

    it('should get all bookings for a cleaner', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${cleanerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('count', 1);
      expect(res.body.data[0]).to.have.property('cleaner', cleanerUser._id.toString());
    });

    it('should filter bookings by status', async () => {
      // Create another booking with different status
      const confirmedBooking = new Booking({
        listing: testListing._id,
        host: hostUser._id,
        cleaner: cleanerUser._id,
        date: new Date('2023-06-02'),
        startTime: '14:00',
        endTime: '17:00',
        totalPrice: 93,
        cleanerPay: 79.05,
        serviceFee: 13.95,
        status: 'confirmed'
      });
      await confirmedBooking.save();

      // Filter by status
      const res = await request(app)
        .get('/api/bookings?status=confirmed')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('count', 1);
      expect(res.body.data[0]).to.have.property('status', 'confirmed');
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should get a single booking by ID', async () => {
      const res = await request(app)
        .get(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('_id', testBooking._id.toString());
      expect(res.body.data).to.have.property('status', 'pending');
    });

    it('should return 404 for non-existent booking ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/bookings/${nonExistentId}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
    });

    it('should return 403 if booking does not belong to current user', async () => {
      // Create another user
      const otherUser = new User({
        email: 'other_booking@test.com',
        password: 'Password123!',
        firstName: 'Other',
        lastName: 'User',
        role: 'host',
      });
      await otherUser.save();
      const otherToken = generateToken(otherUser);

      // Try to access booking with other user
      const res = await request(app)
        .get(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
    });
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking for an active listing', async () => {
      // Create a new listing for this test
      const newListing = new Listing({
        host: hostUser._id,
        title: 'New Listing for Booking',
        accommodationType: 'Maison',
        address: '456 rue du Test, 75002 Paris',
        location: {
          type: 'Point',
          coordinates: [2.3522, 48.8566]
        },
        area: 80,
        peopleNeeded: 1,
        date: new Date('2023-06-05'),
        startTime: '10:00',
        endTime: '14:00',
        services: ['Nettoyage complet', 'Vitres'],
        price: 124,
        status: 'active'
      });
      await newListing.save();

      const newBooking = {
        listingId: newListing._id,
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${cleanerToken}`)
        .send(newBooking);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('listing', newListing._id.toString());
      expect(res.body.data).to.have.property('host', hostUser._id.toString());
      expect(res.body.data).to.have.property('cleaner', cleanerUser._id.toString());
      expect(res.body.data).to.have.property('status', 'pending');
      
      // Check price calculations
      expect(res.body.data).to.have.property('totalPrice', 124);
      expect(res.body.data.cleanerPay).to.be.closeTo(105.4, 0.1); // 124 - 15% service fee
      expect(res.body.data.serviceFee).to.be.closeTo(18.6, 0.1); // 15% of 124
    });

    it('should not allow booking if listing is not active', async () => {
      // Create inactive listing
      const inactiveListing = new Listing({
        host: hostUser._id,
        title: 'Inactive Listing',
        accommodationType: 'Studio',
        address: '789 rue du Test, 75003 Paris',
        location: {
          type: 'Point',
          coordinates: [2.3522, 48.8566]
        },
        area: 30,
        peopleNeeded: 1,
        date: new Date('2023-06-10'),
        startTime: '09:00',
        endTime: '11:00',
        services: ['Nettoyage simple'],
        price: 46.5,
        status: 'booked' // Already booked status
      });
      await inactiveListing.save();

      const newBooking = {
        listingId: inactiveListing._id,
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${cleanerToken}`)
        .send(newBooking);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.include('not available');
    });
  });

  describe('PUT /api/bookings/:id/status', () => {
    it('should allow host to confirm a pending booking', async () => {
      const updateData = {
        status: 'confirmed'
      };

      const res = await request(app)
        .put(`/api/bookings/${testBooking._id}/status`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('status', 'confirmed');
      
      // Check that related listing is updated
      const updatedListing = await Listing.findById(testListing._id);
      expect(updatedListing.status).to.equal('booked');
    });

    it('should allow cleaner to cancel their booking', async () => {
      const updateData = {
        status: 'cancelled',
        cancellationReason: 'Schedule conflict'
      };

      const res = await request(app)
        .put(`/api/bookings/${testBooking._id}/status`)
        .set('Authorization', `Bearer ${cleanerToken}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('status', 'cancelled');
      expect(res.body.data).to.have.property('cancellationReason', 'Schedule conflict');
      
      // Check that related listing is updated back to active
      const updatedListing = await Listing.findById(testListing._id);
      expect(updatedListing.status).to.equal('active');
    });

    it('should not allow invalid status transitions', async () => {
      // First confirm the booking
      await Booking.findByIdAndUpdate(testBooking._id, { status: 'confirmed' });
      
      // Try to set it back to pending
      const updateData = {
        status: 'pending'
      };

      const res = await request(app)
        .put(`/api/bookings/${testBooking._id}/status`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(updateData);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.include('Invalid status transition');
    });
  });

  describe('PUT /api/bookings/:id/complete', () => {
    it('should allow cleaner to mark tasks as completed', async () => {
      // First confirm the booking
      await Booking.findByIdAndUpdate(testBooking._id, { status: 'confirmed' });
      
      const completionData = {
        tasks: [
          { title: 'Nettoyage complet', completed: true },
          { title: 'Aspirateur', completed: true },
          { title: 'Lavage de sols', completed: true }
        ]
      };

      const res = await request(app)
        .put(`/api/bookings/${testBooking._id}/complete`)
        .set('Authorization', `Bearer ${cleanerToken}`)
        .send(completionData);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('status', 'completed');
      expect(res.body.data.tasks[0]).to.have.property('completed', true);
    });

    it('should not allow marking incomplete tasks as completed', async () => {
      // First confirm the booking
      await Booking.findByIdAndUpdate(testBooking._id, { status: 'confirmed' });
      
      const incompleteTasks = {
        tasks: [
          { title: 'Nettoyage complet', completed: true },
          { title: 'Aspirateur', completed: false }, // One task incomplete
          { title: 'Lavage de sols', completed: true }
        ]
      };

      const res = await request(app)
        .put(`/api/bookings/${testBooking._id}/complete`)
        .set('Authorization', `Bearer ${cleanerToken}`)
        .send(incompleteTasks);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.include('All tasks must be completed');
    });
  });

  describe('POST /api/bookings/:id/claim', () => {
    it('should allow host to file a claim for a completed booking', async () => {
      // Set booking to completed
      await Booking.findByIdAndUpdate(testBooking._id, { 
        status: 'completed',
        tasks: [
          { title: 'Nettoyage complet', completed: true },
          { title: 'Aspirateur', completed: true },
          { title: 'Lavage de sols', completed: true }
        ]
      });
      
      const claimData = {
        reason: 'Quality issues with cleaning',
        details: 'The floors were not properly cleaned.',
        photos: ['photo1.jpg', 'photo2.jpg']
      };

      const res = await request(app)
        .post(`/api/bookings/${testBooking._id}/claim`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(claimData);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('status', 'disputed');
      expect(res.body.data).to.have.property('claim');
      expect(res.body.data.claim).to.have.property('reason', 'Quality issues with cleaning');
      expect(res.body.data.claim.photos).to.have.lengthOf(2);
    });

    it('should not allow claiming after the claim period', async () => {
      // Set booking to completed with completion date more than 7 days ago
      const oldCompletionDate = new Date();
      oldCompletionDate.setDate(oldCompletionDate.getDate() - 8); // 8 days ago
      
      await Booking.findByIdAndUpdate(testBooking._id, { 
        status: 'completed',
        tasks: [
          { title: 'Nettoyage complet', completed: true },
          { title: 'Aspirateur', completed: true },
          { title: 'Lavage de sols', completed: true }
        ],
        completedAt: oldCompletionDate
      });
      
      const claimData = {
        reason: 'Late claim',
        details: 'This should not be allowed',
        photos: ['photo.jpg']
      };

      const res = await request(app)
        .post(`/api/bookings/${testBooking._id}/claim`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(claimData);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.include('claim period has expired');
    });
  });
});