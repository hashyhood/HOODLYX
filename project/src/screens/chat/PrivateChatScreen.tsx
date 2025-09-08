import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, createRealtimeSubscription } from '../../../lib/supabase';
import { logger } from '../../../lib/logger';
import { getColor, getSpacing, getRadius } from '../../../lib/theme';
// Import will be created inline
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { ChatStackParamList } from '../../navigation/stacks/ChatNavigator';

type PrivateChatScreenNavigationProp = NativeStackNavigationProp<ChatStackParamList>;
type PrivateChatScreenRouteProp = RouteProp<ChatStackParamList, 'PrivateChat'>;

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  media_url?: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export default function PrivateChatScreen() {
  const navigation = useNavigation<PrivateChatScreenNavigationProp>();
  const route = useRoute<PrivateChatScreenRouteProp>();
  const { user } = useAuth();
  
  const { friendId, friendName } = route.params;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const realtimeChannel = useRef<any>(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:profiles!private_messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      logger.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, friendId]);

  // Setup realtime subscription
  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const channelName = `private-chat-${[user?.id, friendId].sort().join('-')}`;
    realtimeChannel.current = createRealtimeSubscription(channelName, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      if (realtimeChannel.current) {
        realtimeChannel.current.unsubscribe();
      }
    };
  }, [loadMessages, user?.id, friendId]);

  // Mark messages as read when screen is focused
  useEffect(() => {
    const markAsRead = async () => {
      if (!user?.id) return;

      try {
        await supabase
          .from('private_messages')
          .update({ is_read: true })
          .eq('sender_id', friendId)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
      } catch (error) {
        logger.error('Error marking messages as read:', error);
      }
    };

    markAsRead();
  }, [user?.id, friendId]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user?.id || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: messageContent,
          message_type: 'text',
          is_read: false,
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  }, [newMessage, user?.id, friendId, isSending]);

  const renderMessage = ({ item: message, index }: { item: Message; index: number }) => {
    const isOwnMessage = message.sender_id === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isOwnMessage && (!prevMessage || prevMessage.sender_id !== message.sender_id);

    return (
      <View style={[
        styles.messageBubble,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && showAvatar && (
          <View style={styles.messageAvatar}>
            <Icon name="person" size={16} color={getColor('textSecondary')} />
          </View>
        )}
        <View style={[
          styles.messageContent,
          isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={getColor('textPrimary')} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => {
          // Navigate to user profile
          // navigation.navigate('UserProfile', { userId: friendId });
        }}
      >
        <View style={styles.avatar}>
          <Icon name="person" size={20} color={getColor('textSecondary')} />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{friendName}</Text>
          <Text style={styles.userStatus}>Online</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="videocam-outline" size={24} color={getColor('textSecondary')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="call-outline" size={24} color={getColor('textSecondary')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="ellipsis-vertical" size={24} color={getColor('textSecondary')} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      
      {renderHeader()}
      
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="add" size={24} color={getColor('textSecondary')} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor={getColor('textTertiary')}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            <Icon 
              name={isSending ? "hourglass-outline" : "send"} 
              size={20} 
              color={getColor('textPrimary')} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: getColor('divider'),
    backgroundColor: 'rgba(11, 15, 20, 0.9)',
  },
  backButton: {
    padding: getSpacing('xs'),
    marginRight: getSpacing('sm'),
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: getColor('muted'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing('sm'),
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
  userStatus: {
    fontSize: 12,
    color: getColor('success'),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: getSpacing('xs'),
    marginLeft: getSpacing('sm'),
  },
  content: {
    flex: 1,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    backgroundColor: 'rgba(11, 15, 20, 0.9)',
    borderTopWidth: 1,
    borderTopColor: getColor('divider'),
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: getColor('surface'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing('sm'),
  },
  messageInput: {
    flex: 1,
    backgroundColor: getColor('surface'),
    borderRadius: getRadius('lg'),
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    fontSize: 16,
    color: getColor('textPrimary'),
    maxHeight: 100,
    marginRight: getSpacing('sm'),
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: getColor('surface'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    flexDirection: 'row',
    marginVertical: getSpacing('xs'),
    paddingHorizontal: getSpacing('md'),
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: getColor('surface'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing('xs'),
  },
  messageContent: {
    maxWidth: '80%',
    padding: getSpacing('sm'),
    borderRadius: getRadius('md'),
  },
  ownMessageContent: {
    backgroundColor: '#FF6AA2',
    borderBottomRightRadius: 4,
  },
  otherMessageContent: {
    backgroundColor: getColor('surface'),
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: getColor('textPrimary'),
  },
  messageTime: {
    fontSize: 11,
    marginTop: getSpacing('xs'),
    opacity: 0.7,
  },
});
