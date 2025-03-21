import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getConversations } from '../../redux/slices/messagesSlice';
import ConversationItem from '../../components/messaging/ConversationItem';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../utils/colors';

const MessagesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { conversations, loading, error } = useSelector(state => state.messages);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(getConversations());
  }, [dispatch]);

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(getConversations()).finally(() => setRefreshing(false));
  };

  const handleConversationPress = (conversationId, recipientName) => {
    navigation.navigate('ChatScreen', { 
      conversationId, 
      recipientName 
    });
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={70} color={colors.textLight} />
      <Text style={styles.emptyTitle}>Aucune conversation</Text>
      <Text style={styles.emptyText}>
        Vos conversations avec les hébergeurs et professionnels apparaîtront ici.
      </Text>
    </View>
  );

  if (loading && !refreshing && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() => handleConversationPress(item.id, item.recipient.name)}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={conversations.length === 0 ? styles.listEmptyContent : styles.listContent}
      />
    </View>
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
    padding: 20,
    backgroundColor: colors.errorBackground,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: 10,
  },
  retryButton: {
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  listContent: {
    paddingTop: 5,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

export default MessagesScreen;