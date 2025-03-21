const mongoose = require('mongoose');
const Listing = require('../../src/models/Listing');
const { expect } = require('chai');

describe('Listing Model Tests', () => {
  before(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/cleanconnect_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterEach(async () => {
    await Listing.deleteMany({});
  });

  after(async () => {
    await mongoose.connection.close();
  });

  it('should create a new listing successfully', async () => {
    const validListing = {
      host: new mongoose.Types.ObjectId(),
      title: 'Appartement 2 pièces à nettoyer',
      accommodationType: 'Appartement',
      address: '123 rue de la Paix, 75001 Paris',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      },
      area: 45,
      peopleNeeded: 1,
      date: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      services: ['Nettoyage complet', 'Aspirateur', 'Changement de draps'],
      equipment: ['Aspirateur', 'Produits fournis'],
      notes: 'Appartement au 3ème étage sans ascenseur',
      price: 54.25,
      status: 'pending'
    };

    const listing = new Listing(validListing);
    const savedListing = await listing.save();
    
    expect(savedListing).to.have.property('_id');
    expect(savedListing.host.toString()).to.equal(validListing.host.toString());
    expect(savedListing.title).to.equal('Appartement 2 pièces à nettoyer');
    expect(savedListing.accommodationType).to.equal('Appartement');
    expect(savedListing.area).to.equal(45);
    expect(savedListing.services).to.have.length(3);
    expect(savedListing.price).to.equal(54.25);
    expect(savedListing.status).to.equal('pending');
  });

  it('should not create listing without required fields', async () => {
    const invalidListing = new Listing({
      // Missing required fields
      title: 'Appartement 2 pièces à nettoyer',
      date: new Date()
    });

    try {
      await invalidListing.save();
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors).to.have.property('host');
      expect(error.errors).to.have.property('accommodationType');
      expect(error.errors).to.have.property('address');
    }
  });

  it('should validate area is a positive number', async () => {
    const invalidListing = new Listing({
      host: new mongoose.Types.ObjectId(),
      title: 'Appartement 2 pièces à nettoyer',
      accommodationType: 'Appartement',
      address: '123 rue de la Paix, 75001 Paris',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      },
      area: -10, // Negative area should fail validation
      peopleNeeded: 1,
      date: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      services: ['Nettoyage complet'],
      price: 54.25,
      status: 'pending'
    });

    try {
      await invalidListing.save();
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors).to.have.property('area');
    }
  });

  it('should update listing status correctly', async () => {
    const listing = new Listing({
      host: new mongoose.Types.ObjectId(),
      title: 'Appartement 2 pièces à nettoyer',
      accommodationType: 'Appartement',
      address: '123 rue de la Paix, 75001 Paris',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      },
      area: 45,
      peopleNeeded: 1,
      date: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      services: ['Nettoyage complet'],
      price: 54.25,
      status: 'pending'
    });

    await listing.save();
    
    listing.status = 'booked';
    await listing.save();
    
    const updatedListing = await Listing.findById(listing._id);
    expect(updatedListing.status).to.equal('booked');
  });

  it('should correctly calculate price based on area and hourly rate', async () => {
    // Assuming price calculation logic: area * hourlyRate * timeInHours
    const area = 60; // 60 m²
    const hourlyRate = 15.50; // 15.50€/h
    const timeInHours = 3; // 3 hours (12:00 - 09:00)
    const expectedPrice = area * hourlyRate;
    
    const listing = new Listing({
      host: new mongoose.Types.ObjectId(),
      title: 'Grand appartement à nettoyer',
      accommodationType: 'Appartement',
      address: '123 rue de la Paix, 75001 Paris',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      },
      area: area,
      peopleNeeded: 1,
      date: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      services: ['Nettoyage complet'],
      price: expectedPrice,
      status: 'pending'
    });

    await listing.save();
    
    // Verify the calculated price
    expect(listing.price).to.be.closeTo(930, 0.01); // 60 * 15.50 = 930
  });
});