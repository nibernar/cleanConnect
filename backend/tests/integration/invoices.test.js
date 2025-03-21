const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/server');
const User = require('../../src/models/User');
const Host = require('../../src/models/Host');
const Cleaner = require('../../src/models/Cleaner');
const Booking = require('../../src/models/Booking');
const Invoice = require('../../src/models/Invoice');
const Listing = require('../../src/models/Listing');

describe('Invoices API Integration Tests', () => {
  let hostToken, cleanerToken, testHost, testCleaner, testBooking, testInvoice;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST);

    // Create test users
    const hostUser = await User.create({
      name: 'Invoice Test Host',
      email: 'invoicehost@example.com',
      password: 'password123',
      role: 'host'
    });

    const cleanerUser = await User.create({
      name: 'Invoice Test Cleaner',
      email: 'invoicecleaner@example.com',
      password: 'password123',
      role: 'cleaner'
    });

    // Create host and cleaner profiles
    testHost = await Host.create({
      user: hostUser._id,
      businessName: 'Invoice Host Business',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566],
        address: 'Paris, France'
      }
    });

    testCleaner = await Cleaner.create({
      user: cleanerUser._id,
      businessName: 'Invoice Cleaner Business',
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

    // Create a test listing
    const testListing = await Listing.create({
      host: testHost._id,
      title: 'Invoice Test Listing',
      type: 'apartment',
      address: '123 Invoice Test St, Paris',
      numberOfPeople: 2,
      dates: [new Date('2023-06-01'), new Date('2023-06-02')],
      times: ['09:00', '12:00'],
      area: 80,
      services: ['cleaning', 'laundry'],
      equipment: ['vacuum', 'mop'],
      notes: 'Test notes',
      price: 100,
      status: 'active'
    });

    // Create a test booking
    testBooking = await Booking.create({
      host: testHost._id,
      cleaner: testCleaner._id,
      listing: testListing._id,
      date: new Date('2023-06-01'),
      status: 'completed',
      price: 100,
      commission: 15,
      tasks: ['cleaning', 'laundry']
    });

    // Get tokens
    const hostLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invoicehost@example.com',
        password: 'password123'
      });

    const cleanerLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invoicecleaner@example.com',
        password: 'password123'
      });

    hostToken = hostLoginRes.body.token;
    cleanerToken = cleanerLoginRes.body.token;

    // Create test invoice
    testInvoice = await Invoice.create({
      booking: testBooking._id,
      host: testHost._id,
      cleaner: testCleaner._id,
      amount: 100,
      commission: 15,
      netAmount: 85,
      status: 'paid',
      paymentDate: new Date(),
      invoiceNumber: 'INV-2023-001'
    });
  });

  afterAll(async () => {
    // Clean up database
    await User.deleteMany({});
    await Host.deleteMany({});
    await Cleaner.deleteMany({});
    await Booking.deleteMany({});
    await Invoice.deleteMany({});
    await Listing.deleteMany({});
    
    // Disconnect from database
    await mongoose.disconnect();
  });

  describe('GET /api/v1/invoices', () => {
    it('should get all invoices for host user', async () => {
      const res = await request(app)
        .get('/api/v1/invoices')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('invoiceNumber');
      expect(res.body.data[0]).toHaveProperty('amount');
    });

    it('should get all invoices for cleaner user', async () => {
      const res = await request(app)
        .get('/api/v1/invoices')
        .set('Authorization', `Bearer ${cleanerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter invoices by date range', async () => {
      const startDate = new Date('2023-01-01').toISOString();
      const endDate = new Date('2023-12-31').toISOString();
      
      const res = await request(app)
        .get(`/api/v1/invoices?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter invoices by status', async () => {
      const res = await request(app)
        .get('/api/v1/invoices?status=paid')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('status', 'paid');
    });
  });

  describe('GET /api/v1/invoices/:id', () => {
    it('should get a specific invoice by ID for host', async () => {
      const res = await request(app)
        .get(`/api/v1/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', testInvoice._id.toString());
      expect(res.body.data).toHaveProperty('amount', 100);
      expect(res.body.data).toHaveProperty('commission', 15);
      expect(res.body.data).toHaveProperty('invoiceNumber', 'INV-2023-001');
    });

    it('should get a specific invoice by ID for cleaner', async () => {
      const res = await request(app)
        .get(`/api/v1/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${cleanerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', testInvoice._id.toString());
    });

    it('should return 404 for non-existent invoice ID', async () => {
      const fakeId = mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/invoices/${fakeId}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/invoices/download/:id', () => {
    it('should generate a downloadable invoice PDF', async () => {
      const res = await request(app)
        .get(`/api/v1/invoices/download/${testInvoice._id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('INV-2023-001');
    });

    it('should return 404 for non-existent invoice ID', async () => {
      const fakeId = mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/invoices/download/${fakeId}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/invoices', () => {
    it('should create a new invoice', async () => {
      // Create a new booking for this test
      const newListing = await Listing.create({
        host: testHost._id,
        title: 'New Invoice Test Listing',
        type: 'apartment',
        address: '456 Invoice Test St, Paris',
        numberOfPeople: 1,
        dates: [new Date('2023-07-01')],
        times: ['14:00', '17:00'],
        area: 60,
        services: ['cleaning'],
        equipment: ['vacuum'],
        notes: 'New test notes',
        price: 75,
        status: 'active'
      });

      const newBooking = await Booking.create({
        host: testHost._id,
        cleaner: testCleaner._id,
        listing: newListing._id,
        date: new Date('2023-07-01'),
        status: 'completed',
        price: 75,
        commission: 11.25,
        tasks: ['cleaning']
      });

      const invoiceData = {
        booking: newBooking._id.toString(),
        amount: 75,
        commission: 11.25,
        netAmount: 63.75,
        status: 'pending'
      };

      const res = await request(app)
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(invoiceData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('booking', newBooking._id.toString());
      expect(res.body.data).toHaveProperty('amount', 75);
      expect(res.body.data).toHaveProperty('commission', 11.25);
      expect(res.body.data).toHaveProperty('netAmount', 63.75);
      expect(res.body.data).toHaveProperty('invoiceNumber');
    });

    it('should not allow creating an invoice for a booking that already has one', async () => {
      const invoiceData = {
        booking: testBooking._id.toString(),
        amount: 100,
        commission: 15,
        netAmount: 85,
        status: 'pending'
      };

      const res = await request(app)
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(invoiceData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('Invoice already exists');
    });
  });

  describe('PUT /api/v1/invoices/:id', () => {
    it('should update invoice status', async () => {
      const updateData = {
        status: 'refunded'
      };

      const res = await request(app)
        .put(`/api/v1/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('status', 'refunded');
    });
  });

  describe('GET /api/v1/invoices/stats', () => {
    it('should get revenue statistics', async () => {
      const res = await request(app)
        .get('/api/v1/invoices/stats')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('totalRevenue');
      expect(res.body.data).toHaveProperty('monthlyRevenue');
      expect(res.body.data.monthlyRevenue).toBeInstanceOf(Array);
    });
  });
});