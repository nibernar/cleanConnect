const mongoose = require('mongoose');
const Booking = require('../../src/models/Booking');
const { expect } = require('chai');

describe('Booking Model Tests', () => {
  before(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/cleanconnect_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterEach(async () => {
    await Booking.deleteMany({});
  });

  after(async () => {
    await mongoose.connection.close();
  });

  it('should create a new booking successfully', async () => {
    const validBooking = {
      listing: new mongoose.Types.ObjectId(),
      host: new mongoose.Types.ObjectId(),
      cleaner: new mongoose.Types.ObjectId(),
      date: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      status: 'pending',
      totalPrice: 54.25,
      cleanerPay: 46.11,
      serviceFee: 8.14,
      tasks: [
        { title: 'Nettoyage de la cuisine', completed: false },
        { title: 'Nettoyage des salles de bain', completed: false }
      ]
    };

    const booking = new Booking(validBooking);
    const savedBooking = await booking.save();
    
    expect(savedBooking).to.have.property('_id');
    expect(savedBooking.listing.toString()).to.equal(validBooking.listing.toString());
    expect(savedBooking.host.toString()).to.equal(validBooking.host.toString());
    expect(savedBooking.cleaner.toString()).to.equal(validBooking.cleaner.toString());
    expect(savedBooking.status).to.equal('pending');
    expect(savedBooking.totalPrice).to.equal(54.25);
    expect(savedBooking.tasks).to.have.length(2);
  });

  it('should not create booking without required fields', async () => {
    const invalidBooking = new Booking({
      // Missing required fields
      date: new Date(),
      startTime: '09:00'
    });

    try {
      await invalidBooking.save();
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors).to.have.property('listing');
      expect(error.errors).to.have.property('host');
      expect(error.errors).to.have.property('totalPrice');
    }
  });

  it('should update booking status correctly', async () => {
    const booking = new Booking({
      listing: new mongoose.Types.ObjectId(),
      host: new mongoose.Types.ObjectId(),
      cleaner: new mongoose.Types.ObjectId(),
      date: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      status: 'pending',
      totalPrice: 54.25,
      cleanerPay: 46.11,
      serviceFee: 8.14
    });

    await booking.save();
    
    booking.status = 'confirmed';
    await booking.save();
    
    const updatedBooking = await Booking.findById(booking._id);
    expect(updatedBooking.status).to.equal('confirmed');
  });

  it('should mark tasks as completed', async () => {
    const booking = new Booking({
      listing: new mongoose.Types.ObjectId(),
      host: new mongoose.Types.ObjectId(),
      cleaner: new mongoose.Types.ObjectId(),
      date: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      status: 'confirmed',
      totalPrice: 54.25,
      cleanerPay: 46.11,
      serviceFee: 8.14,
      tasks: [
        { title: 'Nettoyage de la cuisine', completed: false },
        { title: 'Nettoyage des salles de bain', completed: false }
      ]
    });

    await booking.save();
    
    booking.tasks[0].completed = true;
    booking.tasks[1].completed = true;
    booking.status = 'completed';
    
    await booking.save();
    
    const completedBooking = await Booking.findById(booking._id);
    expect(completedBooking.tasks[0].completed).to.be.true;
    expect(completedBooking.tasks[1].completed).to.be.true;
    expect(completedBooking.status).to.equal('completed');
  });

  it('should calculate the correct service fee and cleaner pay', async () => {
    const totalPrice = 100;
    const serviceFeePercent = 15;
    
    const booking = new Booking({
      listing: new mongoose.Types.ObjectId(),
      host: new mongoose.Types.ObjectId(),
      cleaner: new mongoose.Types.ObjectId(),
      date: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      status: 'pending',
      totalPrice: totalPrice,
      serviceFee: totalPrice * (serviceFeePercent / 100),
      cleanerPay: totalPrice * (1 - (serviceFeePercent / 100))
    });

    await booking.save();
    
    expect(booking.serviceFee).to.equal(15);
    expect(booking.cleanerPay).to.equal(85);
  });
});