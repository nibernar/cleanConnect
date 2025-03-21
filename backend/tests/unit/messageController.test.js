const messageController = require('../../src/controllers/message.controller');
const Message = require('../../src/models/Message');
const Conversation = require('../../src/models/Conversation');
const User = require('../../src/models/User');
const errorResponse = require('../../src/utils/errorResponse');

// Mock dependencies
jest.mock('../../src/models/Message');
jest.mock('../../src/models/Conversation');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/errorResponse');
jest.mock('../../src/services/notifications');

describe('Message Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('should return all messages for a conversation with status 200', async () => {
      // Setup
      const mockMessages = [
        { 
          _id: 'msg1', 
          conversation: 'conv123', 
          sender: 'user1', 
          content: 'Hello',
          createdAt: new Date()
        }
      ];
      const mockConversation = {
        _id: 'conv123',
        participants: ['user1', 'user2']
      };
      const mockReq = {
        user: { id: 'user1' },
        params: { conversationId: 'conv123' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Conversation.findById.mockResolvedValue(mockConversation);
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMessages)
      });

      // Execute
      await messageController.getMessages(mockReq, mockRes, mockNext);

      // Assert
      expect(Conversation.findById).toHaveBeenCalledWith('conv123');
      expect(Message.find).toHaveBeenCalledWith({ conversation: 'conv123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: mockMessages.length,
        data: mockMessages
      });
    });

    it('should return 404 if conversation not found', async () => {
      // Setup
      const mockReq = {
        user: { id: 'user1' },
        params: { conversationId: 'conv123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Conversation.findById.mockResolvedValue(null);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await messageController.getMessages(mockReq, mockRes, mockNext);

      // Assert
      expect(Conversation.findById).toHaveBeenCalledWith('conv123');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Conversation not found', 404);
    });

    it('should return 403 if user is not a participant in the conversation', async () => {
      // Setup
      const mockConversation = {
        _id: 'conv123',
        participants: ['user2', 'user3']
      };
      const mockReq = {
        user: { id: 'user1' },
        params: { conversationId: 'conv123' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Mock implementation
      Conversation.findById.mockResolvedValue(mockConversation);
      errorResponse.mockImplementation((message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
      });

      // Execute
      await messageController.getMessages(mockReq, mockRes, mockNext);

      // Assert
      expect(Conversation.findById).toHaveBeenCalledWith('conv123');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(errorResponse).toHaveBeenCalledWith('Not authorized to access this conversation', 403);
    });
  });

  describe('sendMessage', () => {
    it('should create and send a message with status 201', async () => {
      // Setup
      const mockConversation = {
        _id: 'conv123',
        participants: ['user1', 'user2']
      };
      const mockMessage = {
        _id: 'msg1',
        conversation: 'conv123',
        sender: 'user1',
        content: 'Hello',
        createdAt: new Date()
      };
      const mockReq = {
        user: { id: 'user1' },
        params: { conversationId: 'conv123' },
        body: { content: 'Hello' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Mock implementation
      Conversation.findById.mockResolvedValue(mockConversation);
      Message.create.mockResolvedValue(mockMessage);

      // Execute
      await messageController.sendMessage(mockReq, mockRes, mockNext);

      // Assert
      expect(Conversation.findById).toHaveBeenCalledWith('conv123');
      expect(Message.create).toHaveBeenCalledWith({
        conversation: 'conv123',
        sender: 'user1',
        content: 'Hello'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockMessage
      });
    });

    // Other test cases for error handling would follow similar patterns
  });
});