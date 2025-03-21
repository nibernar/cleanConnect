const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/server');
const User = require('../../src/models/User');
const Conversation = require('../../src/models/Conversation');
const Message = require('../../src/models/Message');

describe('Messages API Integration Tests', () => {
  let user1Token, user2Token, testConversation;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST);

    // Create test users
    const user1 = await User.create({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
      role: 'host'
    });

    const user2 = await User.create({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
      role: 'cleaner'
    });

    // Create test conversation
    testConversation = await Conversation.create({
      participants: [user1._id, user2._id],
      lastMessage: null
    });

    // Login to get tokens
    const user1LoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user1@example.com',
        password: 'password123'
      });

    const user2LoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user2@example.com',
        password: 'password123'
      });

    user1Token = user1LoginRes.body.token;
    user2Token = user2LoginRes.body.token;
  });

  afterAll(async () => {
    // Clean up database
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    
    // Disconnect from database
    await mongoose.disconnect();
  });

  describe('GET /api/v1/conversations', () => {
    it('should get all conversations for a user', async () => {
      const res = await request(app)
        .get('/api/v1/conversations')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/conversations/:id', () => {
    it('should get a specific conversation by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${testConversation._id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', testConversation._id.toString());
    });

    it('should return 404 for non-existent conversation ID', async () => {
      const fakeId = mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not allow unauthorized access to conversation', async () => {
      // Create a new user without access to the conversation
      const unauthorizedUser = await User.create({
        name: 'Unauthorized User',
        email: 'unauthorized@example.com',
        password: 'password123',
        role: 'host'
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unauthorized@example.com',
          password: 'password123'
        });

      const unauthorizedToken = loginRes.body.token;

      const res = await request(app)
        .get(`/api/v1/conversations/${testConversation._id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/conversations/:id/messages', () => {
    it('should send a message in a conversation', async () => {
      const messageData = {
        content: 'Hello, this is a test message.'
      };

      const res = await request(app)
        .post(`/api/v1/conversations/${testConversation._id}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(messageData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('content', 'Hello, this is a test message.');
      expect(res.body.data).toHaveProperty('sender');
      expect(res.body.data).toHaveProperty('conversation', testConversation._id.toString());
    });

    it('should not allow sending empty messages', async () => {
      const emptyMessageData = {
        content: ''
      };

      const res = await request(app)
        .post(`/api/v1/conversations/${testConversation._id}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(emptyMessageData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/conversations/:id/messages', () => {
    it('should get all messages in a conversation', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${testConversation._id}/messages`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('content');
      expect(res.body.data[0]).toHaveProperty('sender');
    });

    it('should return messages in chronological order', async () => {
      // Send a second message
      await request(app)
        .post(`/api/v1/conversations/${testConversation._id}/messages`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'This is a reply to your message.' });

      const res = await request(app)
        .get(`/api/v1/conversations/${testConversation._id}/messages`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Check timestamps are in ascending order
      const timestamps = res.body.data.map(msg => new Date(msg.createdAt).getTime());
      const isSorted = timestamps.every((val, i, arr) => !i || val >= arr[i - 1]);
      expect(isSorted).toBe(true);
    });
  });

  describe('POST /api/v1/conversations', () => {
    it('should create a new conversation', async () => {
      // Create a new user to start a conversation with
      const newUser = await User.create({
        name: 'New Conversation User',
        email: 'newconvo@example.com',
        password: 'password123',
        role: 'host'
      });

      const conversationData = {
        participants: [newUser._id.toString()],
        initialMessage: 'Hi, I would like to discuss a cleaning job.'
      };

      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(conversationData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('conversation');
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data.conversation.participants).toHaveLength(2);
      expect(res.body.data.message.content).toEqual('Hi, I would like to discuss a cleaning job.');
    });

    it('should not create a conversation without participants', async () => {
      const invalidData = {
        initialMessage: 'This should fail'
      };

      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});