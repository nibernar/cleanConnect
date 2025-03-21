import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import messageService from '../../services/messageService';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messageService.getConversations();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération des conversations'
      );
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await messageService.getMessages(conversationId);
      return { conversationId, messages: response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de récupération des messages'
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, text }, { rejectWithValue }) => {
    try {
      const response = await messageService.sendMessage(conversationId, text);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec d\'envoi du message'
      );
    }
  }
);

export const startConversation = createAsyncThunk(
  'messages/startConversation',
  async ({ recipientId, initialMessage, listingId }, { rejectWithValue }) => {
    try {
      const response = await messageService.startConversation(recipientId, initialMessage, listingId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de création de la conversation'
      );
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await messageService.markConversationAsRead(conversationId);
      return { conversationId, conversation: response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Échec de marquage comme lu'
      );
    }
  }
);

// Initial state
const initialState = {
  conversations: [],
  messages: {},
  currentConversation: null,
  isLoading: false,
  error: null,
  unreadCount: 0,
};

// Slice
const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearMessagesError: (state) => {
      state.error = null;
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
    },
    // Handle real-time message received via socket
    receiveMessage: (state, action) => {
      const { message } = action.payload;
      const conversationId = message.conversation;
      
      // Add message to messages
      if (state.messages[conversationId]) {
        state.messages[conversationId].push(message);
      } else {
        state.messages[conversationId] = [message];
      }
      
      // Update conversation in the list
      const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        state.conversations[conversationIndex].unreadCount += 1;
        
        // Move conversation to top of list
        const conversation = state.conversations[conversationIndex];
        state.conversations.splice(conversationIndex, 1);
        state.conversations.unshift(conversation);
      }
      
      // Increment total unread count
      state.unreadCount += 1;
    },
    // Handle conversation status updates via socket
    updateConversationStatus: (state, action) => {
      const { conversationId, isOnline } = action.payload;
      const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
      
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].participant.isOnline = isOnline;
      }
      
      if (state.currentConversation && state.currentConversation._id === conversationId) {
        state.currentConversation.participant.isOnline = isOnline;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
        
        // Calculate total unread count
        state.unreadCount = action.payload.reduce((count, conversation) => {
          return count + (conversation.unreadCount || 0);
        }, 0);
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, messages } = action.payload;
        state.messages[conversationId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const message = action.payload;
        const conversationId = message.conversation;
        
        // Add message to existing conversation messages
        if (state.messages[conversationId]) {
          state.messages[conversationId].push(message);
        } else {
          state.messages[conversationId] = [message];
        }
        
        // Update conversation in the list
        const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].lastMessage = message;
          
          // Move conversation to top of list
          const conversation = state.conversations[conversationIndex];
          state.conversations.splice(conversationIndex, 1);
          state.conversations.unshift(conversation);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Start conversation
      .addCase(startConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        const conversation = action.payload.conversation;
        const message = action.payload.message;
        
        // Add conversation to list
        state.conversations.unshift(conversation);
        
        // Add message to conversation
        state.messages[conversation._id] = [message];
        
        // Set as current conversation
        state.currentConversation = conversation;
      })
      .addCase(startConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Mark conversation as read
      .addCase(markConversationAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, conversation } = action.payload;
        
        // Update conversation in list
        const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
        if (conversationIndex !== -1) {
          const oldUnreadCount = state.conversations[conversationIndex].unreadCount || 0;
          state.conversations[conversationIndex] = conversation;
          
          // Update total unread count
          state.unreadCount = Math.max(0, state.unreadCount - oldUnreadCount);
        }
        
        // Update current conversation if it's the same
        if (state.currentConversation && state.currentConversation._id === conversationId) {
          state.currentConversation = conversation;
        }
      })
      .addCase(markConversationAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearMessagesError, 
  setCurrentConversation, 
  clearCurrentConversation,
  receiveMessage,
  updateConversationStatus
} = messagesSlice.actions;

export default messagesSlice.reducer;