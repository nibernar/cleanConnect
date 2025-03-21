import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Text
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getMessages, sendMessage } from '../../redux/slices/messagesSlice';
import MessageBubble from '../../components/messaging/MessageBubble';
import ChatInput from '../../components/messaging/ChatInput';
import colors from '../../utils/colors';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, recipientName } = route.params;
  const dispatch = useDispatch();
  const { currentConversation, loading, error } = useSelector(state => state.messages);
  const { user } = useSelector(state => state.user);
  
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef();
  
  useEffect(() => {
    navigation.setOptions({
      title: recipientName || 'Discussion',
    });
    
    dispatch(getMessages(conversationId));
    
    // Set up interval to poll for new messages
    const interval = setInterval(() => {
      if (!loading) {
        dispatch(getMessages(conversationId));
      }
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [dispatch, conversationId, recipientName, navigation]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (currentConversation?.messages?.length && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentConversation?.messages]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(getMessages(conversationId)).finally(() => setRefreshing(false));
  };
  
  const handleSend = (message) => {
    if (message.trim().length > 0) {
      dispatch(sendMessage({ 
        conversationId, 
        content: message 
      }));
    }
  };
  
  const renderItem = ({ item }) => (
    <MessageBubble
      message={item}
      isOwnMessage={item.sender._id === user._id}
    />
  );
  
  if (loading && !refreshing && (!currentConversation || !currentConversation.messages)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={currentConversation?.messages || []}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        inverted={false}
      />
      
      <ChatInput onSend={handleSend} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 10,
    backgroundColor: colors.errorBackground,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
  },
  messageList: {
    padding: 10,
  },
});

export default ChatScreen;