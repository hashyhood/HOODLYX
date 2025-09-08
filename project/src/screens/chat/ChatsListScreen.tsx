import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../lib/logger';
import { getColor, getSpacing, getRadius } from '../../../lib/theme';
import { GlassCard } from '../../../components/ui/GlassCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { ChatStackParamList } from '../../navigation/stacks/ChatNavigator';

type ChatsListScreenNavigationProp = NativeStackNavigationProp<ChatStackParamList>;
type ChatsListScreenRouteProp = RouteProp<any, any>;

interface Chat {
  id: string;
  type: 'private' | 'group';
  name: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  is_online?: boolean;
  participants?: any[];
}

export default function ChatsListScreen() {
  const navigation = useNavigation<ChatsListScreenNavigationProp>();
  const route = useRoute<ChatsListScreenRouteProp>();
  const { user } = useAuth();
  
  const chatType = route.params?.chatType || 'private';
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      if (chatType === 'private') {
        // Load private conversations
        const { data, error } = await supabase
          .from('private_messages')
          .select(`
            *,
            sender:profiles!private_messages_sender_id_fkey(id, full_name, avatar_url),
            receiver:profiles!private_messages_receiver_id_fkey(id, full_name, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group messages by conversation and get latest
        const conversations = new Map();
        data?.forEach(message => {
          const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
          const otherUser = message.sender_id === user.id ? message.receiver : message.sender;
          
          if (!conversations.has(otherUserId) || 
              new Date(message.created_at) > new Date(conversations.get(otherUserId).last_message_time)) {
            conversations.set(otherUserId, {
              id: otherUserId,
              type: 'private',
              name: otherUser.full_name,
              avatar_url: otherUser.avatar_url,
              last_message: message.content,
              last_message_time: message.created_at,
              unread_count: 0, // TODO: Calculate unread count
              is_online: false, // TODO: Get online status
            });
          }
        });

        setChats(Array.from(conversations.values()));
      } else if (chatType === 'groups') {
        // Load group conversations
        const { data, error } = await supabase
          .from('room_members')
          .select(`
            room_id,
            rooms!inner(
              id,
              name,
              description,
              is_private,
              member_count,
              created_at
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        const groupChats = (data as any[])?.map((member: any) => ({
          id: member.room_id,
          type: 'group' as const,
          name: member.rooms.name,
          avatar_url: undefined, // TODO: Add group avatars
          last_message: '', // TODO: Get last message
          last_message_time: member.rooms.created_at,
          unread_count: 0, // TODO: Calculate unread count
          participants: [], // TODO: Get participants
        })) || [];

        setChats(groupChats);
      } else if (chatType === 'requests') {
        // Load friend requests that can become chats
        const { data, error } = await supabase
          .from('friend_requests')
          .select(`
            *,
            sender:profiles!friend_requests_sender_id_fkey(id, full_name, avatar_url),
            receiver:profiles!friend_requests_receiver_id_fkey(id, full_name, avatar_url)
          `)
          .eq('receiver_id', user.id)
          .eq('status', 'pending');

        if (error) throw error;

        const requests = data?.map(request => ({
          id: request.id,
          type: 'private' as const,
          name: request.sender.full_name,
          avatar_url: request.sender.avatar_url,
          last_message: 'Friend request',
          last_message_time: request.created_at,
          unread_count: 1,
          is_online: false,
        })) || [];

        setChats(requests);
      }
    } catch (error) {
      logger.error('Error loading chats:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, chatType]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadChats();
    setIsRefreshing(false);
  }, [loadChats]);

  const handleChatPress = useCallback((chat: Chat) => {
    if (chat.type === 'private') {
      navigation.navigate('PrivateChat', {
        friendId: chat.id,
        friendName: chat.name
      });
    } else {
      navigation.navigate('GroupChat', {
        roomId: chat.id,
        roomName: chat.name
      });
    }
  }, [navigation]);

  const handleCreateChat = useCallback(() => {
    navigation.navigate('CreateChat', { type: chatType === 'groups' ? 'group' : 'private' });
  }, [navigation, chatType]);

  const renderChatItem = ({ item: chat }: { item: Chat }) => (
    <TouchableOpacity
      onPress={() => handleChatPress(chat)}
      activeOpacity={0.7}
    >
      <GlassCard style={styles.chatItem}>
        <View style={styles.chatContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {chat.avatar_url ? (
              <Image source={{ uri: chat.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon 
                  name={chat.type === 'group' ? 'people' : 'person'} 
                  size={24} 
                  color={getColor('textSecondary')} 
                />
              </View>
            )}
            {chat.is_online && <View style={styles.onlineIndicator} />}
          </View>

          {/* Chat Info */}
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName} numberOfLines={1}>
                {chat.name}
              </Text>
              <Text style={styles.chatTime}>
                {chat.last_message_time ? 
                  new Date(chat.last_message_time).toLocaleDateString() : 
                  ''
                }
              </Text>
            </View>
            
            <View style={styles.chatDetails}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {chat.last_message || 'No messages yet'}
              </Text>
              {chat.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {chat.unread_count > 99 ? '99+' : chat.unread_count}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.moreButton}>
            <Icon name="ellipsis-vertical" size={16} color={getColor('textSecondary')} />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  if (isLoading && chats.length === 0) {
    return (
      <HoodlyLayout>
        <SkeletonList count={8} />
      </HoodlyLayout>
    );
  }

  return (
    <HoodlyLayout>
      <GradientBackground />
      
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={getColor('textPrimary')}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={chatType === 'groups' ? 'people-outline' : 'chatbubbles-outline'}
            title={`No ${chatType} yet`}
            description={`Start a conversation with your ${chatType === 'groups' ? 'community' : 'friends'}!`}
            actionText={`Start ${chatType === 'groups' ? 'Group' : 'Chat'}`}
            onAction={handleCreateChat}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </HoodlyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: getSpacing('md'),
    paddingBottom: 100,
  },
  chatItem: {
    marginBottom: getSpacing('sm'),
    padding: getSpacing('md'),
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: getSpacing('md'),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: getColor('muted'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: getColor('success'),
    borderWidth: 2,
    borderColor: getColor('bg'),
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('textPrimary'),
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: getColor('textSecondary'),
  },
  chatDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: getColor('textSecondary'),
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: getColor('error'),
    borderRadius: getRadius('pill'),
    paddingHorizontal: getSpacing('xs'),
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
  moreButton: {
    padding: getSpacing('xs'),
    marginLeft: getSpacing('sm'),
  },
});
