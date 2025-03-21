const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

// Mocking bcrypt functions
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn()
}));

describe('User Model Test', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cleanconnect_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany();
    jest.clearAllMocks();
  });

  it('should create a new user with hashed password', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'host'
    };

    const user = new User(userData);
    await user.save();

    // Check if password is hashed
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
    expect(user.password).toBe('hashedPassword');
  });

  it('should not rehash password when saving user if password is not modified', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'host'
    };

    const user = new User(userData);
    await user.save();
    
    // Clear mock counts
    bcrypt.genSalt.mockClear();
    bcrypt.hash.mockClear();
    
    // Update a field other than password
    user.name = 'Updated Name';
    await user.save();
    
    // Ensure password hashing was not called again
    expect(bcrypt.genSalt).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('should correctly match a valid password', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'host'
    };

    bcrypt.compare.mockResolvedValueOnce(true);
    
    const user = new User(userData);
    await user.save();
    
    const isMatch = await user.matchPassword('password123');
    
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(isMatch).toBe(true);
  });

  it('should not match an invalid password', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'host'
    };

    bcrypt.compare.mockResolvedValueOnce(false);
    
    const user = new User(userData);
    await user.save();
    
    const isMatch = await user.matchPassword('wrongpassword');
    
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
    expect(isMatch).toBe(false);
  });

  it('should require email and password', async () => {
    const userWithoutEmail = new User({
      name: 'Test User',
      password: 'password123',
      role: 'host'
    });

    const userWithoutPassword = new User({
      name: 'Test User',
      email: 'test@example.com',
      role: 'host'
    });

    // Validate that it throws validation error without email
    let err;
    try {
      await userWithoutEmail.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();

    // Validate that it throws validation error without password
    err = undefined;
    try {
      await userWithoutPassword.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  it('should generate a reset password token', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'host'
    };

    const user = new User(userData);
    await user.save();
    
    // Mock crypto randomBytes
    const randomBytesMock = jest.fn().mockReturnValue(Buffer.from('1234567890abcdef'));
    const originalRandomBytes = require('crypto').randomBytes;
    require('crypto').randomBytes = randomBytesMock;
    
    const resetToken = user.getResetPasswordToken();
    
    // Restore original function
    require('crypto').randomBytes = originalRandomBytes;
    
    expect(randomBytesMock).toHaveBeenCalledWith(20);
    expect(resetToken).toBeDefined();
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordExpire).toBeDefined();
    
    // Check that the expiration is set 30 minutes in the future
    const expectedExpire = new Date(Date.now() + 30 * 60 * 1000);
    const actualExpire = new Date(user.resetPasswordExpire);
    
    // Allow 1 second tolerance for test execution time
    expect(Math.abs(expectedExpire - actualExpire)).toBeLessThan(1000);
  });
});