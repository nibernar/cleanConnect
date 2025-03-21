const mongoose = require('mongoose');
const Review = require('../../src/models/Review');
const { expect } = require('chai');

describe('Review Model Tests', () => {
  before(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/cleanconnect_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterEach(async () => {
    await Review.deleteMany({});
  });

  after(async () => {
    await mongoose.connection.close();
  });

  it('should create a new review successfully', async () => {
    const validReview = {
      booking: new mongoose.Types.ObjectId(),
      fromUser: new mongoose.Types.ObjectId(),
      toUser: new mongoose.Types.ObjectId(),
      rating: 4,
      comment: 'Service très satisfaisant, nettoyage impeccable!',
      userType: 'host' // Review from host to cleaner
    };

    const review = new Review(validReview);
    const savedReview = await review.save();
    
    expect(savedReview).to.have.property('_id');
    expect(savedReview.booking.toString()).to.equal(validReview.booking.toString());
    expect(savedReview.fromUser.toString()).to.equal(validReview.fromUser.toString());
    expect(savedReview.toUser.toString()).to.equal(validReview.toUser.toString());
    expect(savedReview.rating).to.equal(4);
    expect(savedReview.comment).to.equal('Service très satisfaisant, nettoyage impeccable!');
    expect(savedReview.userType).to.equal('host');
  });

  it('should not create review without required fields', async () => {
    const invalidReview = new Review({
      // Missing required fields
      comment: 'Service très satisfaisant, nettoyage impeccable!'
    });

    try {
      await invalidReview.save();
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors).to.have.property('booking');
      expect(error.errors).to.have.property('fromUser');
      expect(error.errors).to.have.property('toUser');
      expect(error.errors).to.have.property('rating');
    }
  });

  it('should validate rating is between 1 and 5', async () => {
    // Test with rating below minimum
    let invalidRatingReview = new Review({
      booking: new mongoose.Types.ObjectId(),
      fromUser: new mongoose.Types.ObjectId(),
      toUser: new mongoose.Types.ObjectId(),
      rating: 0, // Invalid rating
      comment: 'Rating too low',
      userType: 'host'
    });

    try {
      await invalidRatingReview.save();
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors).to.have.property('rating');
    }

    // Test with rating above maximum
    invalidRatingReview = new Review({
      booking: new mongoose.Types.ObjectId(),
      fromUser: new mongoose.Types.ObjectId(),
      toUser: new mongoose.Types.ObjectId(),
      rating: 6, // Invalid rating
      comment: 'Rating too high',
      userType: 'host'
    });

    try {
      await invalidRatingReview.save();
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors).to.have.property('rating');
    }
  });

  it('should validate userType is either host or cleaner', async () => {
    const invalidUserTypeReview = new Review({
      booking: new mongoose.Types.ObjectId(),
      fromUser: new mongoose.Types.ObjectId(),
      toUser: new mongoose.Types.ObjectId(),
      rating: 4,
      comment: 'Invalid user type test',
      userType: 'invalid_type' // Invalid user type
    });

    try {
      await invalidUserTypeReview.save();
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors).to.have.property('userType');
    }
  });

  it('should set createdAt date automatically', async () => {
    const review = new Review({
      booking: new mongoose.Types.ObjectId(),
      fromUser: new mongoose.Types.ObjectId(),
      toUser: new mongoose.Types.ObjectId(),
      rating: 5,
      comment: 'Excellent service!',
      userType: 'cleaner' // Review from cleaner to host
    });

    const savedReview = await review.save();
    
    expect(savedReview.createdAt).to.be.instanceOf(Date);
    const now = new Date();
    expect(savedReview.createdAt.getTime()).to.be.closeTo(now.getTime(), 5000); // within 5 seconds
  });
});