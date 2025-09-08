import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
  Dimensions,
  ScrollView,
  Animated,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocial } from '../../../contexts/SocialContext';
import { postsApi } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../lib/logger';
import { getColor, getSpacing, getRadius, theme } from '../../../lib/theme';
import { CreatePostModal } from '../../../components/ui/CreatePostModal';
import { CommentsModal } from '../../../components/ui/CommentsModal';
import { useLocationPermission } from '../../../hooks/useLocationPermission';
import LinearGradient from 'react-native-linear-gradient';
import ImagePicker from 'react-native-image-picker';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { Button } from '../../../components/ui/Button';
import { GlassCard } from '../../../components/ui/GlassCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientFAB } from '../../../components/ui/GradientFAB';
import { StoryRing } from '../../../components/ui/StoryRing';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { Spinner } from '../../../components/ui/Spinner';
import { Card } from '../../../components/ui/Card';
import { Easing } from 'react-native';
import { formatDistanceToNow } from 'date-fns';

// Import navigation types
import { MainStackParamList } from '../../navigation/MainNavigator';

const { width, height } = Dimensions.get('window');

type FeedScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type FeedScreenRouteProp = RouteProp<any, any>;

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  media_type: 'text' | 'image' | 'video' | 'mixed';
  location?: string;
  visibility: 'public' | 'friends' | 'private';
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  is_liked?: boolean;
  created_at: string;
  user?: any;
  views_count?: number | null;
  reach_count?: number | null;
}

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  views_count: number | null;
  is_viewed?: boolean;
  created_at: string;
  expires_at: string;
  user?: any;
}

interface FeedComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user?: any;
}

export default function FeedScreen() {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const route = useRoute<FeedScreenRouteProp>();
  const { user } = useAuth();
  const { posts, stories, isLoadingPosts, refreshPosts, refreshStories } = useSocial();
  
  const feedType = route.params?.feedType || 'trending';
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageFrom, setPageFrom] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'trending' | 'nearby' | 'following'>(feedType);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const storyProgressAnim = useRef(new Animated.Value(0)).current;

  // Get location permission on mount
  const { hasPermission, requestPermission } = useLocationPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // Filter posts based on active tab
  useEffect(() => {
    if (!posts || posts.length === 0) {
      setFilteredPosts([]);
      return;
    }

    let filtered = [...posts];
    
    switch (activeTab) {
      case 'trending':
        // Sort by engagement and recency
        filtered.sort((a, b) => {
          const aScore = (a.likes_count || 0) + (a.comments_count || 0) * 2;
          const bScore = (b.likes_count || 0) + (b.comments_count || 0) * 2;
          return bScore - aScore;
        });
        break;
      case 'following':
        // Filter to only show posts from followed users
        // TODO: Implement following logic
        break;
      case 'nearby':
        // Filter by location proximity
        // TODO: Implement location-based filtering
        break;
    }
    
    setFilteredPosts(filtered);
  }, [posts, activeTab]);

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshPosts(),
        refreshStories(),
      ]);
    } catch (error) {
      logger.error('Error refreshing feed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshPosts, refreshStories]);

  const handlePostPress = useCallback((post: Post) => {
    navigation.navigate('PostDetails', { postId: post.id });
  }, [navigation]);

  const handleUserPress = useCallback((userId: string) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handleCommentPress = useCallback(async (post: Post) => {
    setSelectedPost(post);
    setShowCommentModal(true);
    setIsLoadingComments(true);
    
    try {
      // Load comments for this post
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data as any) || []);
    } catch (error) {
      logger.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const handleLikePost = useCallback(async (post: Post) => {
    try {
      const { error } = await supabase.rpc('toggle_post_like', {
        p_post_id: post.id,
        p_user_id: user?.id
      });

      if (error) throw error;
      
      // Refresh posts to get updated like count
      refreshPosts();
    } catch (error) {
      logger.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  }, [user?.id, refreshPosts]);

  const handleStoryPress = useCallback((story: Story) => {
    navigation.navigate('StoryView', { storyId: story.id, userId: story.user_id });
  }, [navigation]);

  const handleCreatePost = useCallback(() => {
    navigation.navigate('CreatePost');
  }, [navigation]);

  const renderStoryItem = ({ item: story }: { item: Story }) => (
    <TouchableOpacity 
      style={styles.storyItem}
      onPress={() => handleStoryPress(story)}
      activeOpacity={0.8}
    >
      <StoryRing 
        isViewed={viewedStories.has(story.id)}
        size={60}
      >
        <Image 
          source={{ uri: story.media_url || story.user?.avatar_url }} 
          style={styles.storyImage}
        />
      </StoryRing>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {story.user?.full_name || 'Unknown'}
      </Text>
    </TouchableOpacity>
  );

  const renderPostItem = useCallback(({ item: post, index }: { item: Post; index: number }) => (
    <Animated.View
      style={[
        styles.postContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <GlassCard style={styles.postCard}>
        {/* Post Header */}
        <TouchableOpacity 
          style={styles.postHeader as any}
          onPress={() => handleUserPress(post.user_id)}
          activeOpacity={0.7}
        >
          <View style={styles.userInfo}>
            <StoryRing
              isViewed={false}
              size={40}
            >
              <Image
                source={{ uri: post.user?.avatar_url || 'https://via.placeholder.com/40' }}
                style={styles.avatar}
              />
            </StoryRing>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{post.user?.full_name || 'Unknown User'}</Text>
              <Text style={styles.postTime}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Icon name="ellipsis-horizontal" size={20} color={getColor('textSecondary')} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Post Content */}
        <View style={styles.postContent}>
          <Text style={styles.postText}>{post.content}</Text>
          
          {/* Media Display */}
          {post.media_urls && post.media_urls.length > 0 && (
            <View style={styles.mediaContainer}>
              {post.media_urls.map((url, mediaIndex) => (
                <Image
                  key={mediaIndex}
                  source={{ uri: url }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
          
          {/* Location */}
          {post.location && (
            <View style={styles.locationContainer}>
              <Icon name="location-outline" size={16} color={getColor('textSecondary')} />
              <Text style={styles.locationText}>{post.location}</Text>
            </View>
          )}
        </View>

        {/* Post Actions */}
        <View style={styles.postActions as any}>
          <TouchableOpacity 
            style={styles.actionButton as any} 
            onPress={() => handleLikePost(post)}
          >
            <Icon 
              name={post.is_liked ? "heart" : "heart-outline"} 
              size={24} 
              color={post.is_liked ? "#ff4757" : getColor('textSecondary')} 
            />
            <Text style={styles.actionText}>
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton as any} onPress={() => handleCommentPress(post)}>
            <Icon name="chatbubble-outline" size={24} color={getColor('textSecondary')} />
            <Text style={styles.actionText}>{post.comments_count || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton as any}>
            <Icon name="share-outline" size={24} color={getColor('textSecondary')} />
            <Text style={styles.actionText}>{post.shares_count || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, { marginLeft: 'auto' } as any]}>
            <Icon name="bookmark-outline" size={24} color={getColor('textSecondary')} />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  ), [handleUserPress, handleLikePost, handleCommentPress, fadeAnim, slideAnim]);

  const renderHeader = () => (
    <View style={styles.header as any}>
      {/* Stories Section */}
      {stories && stories.length > 0 && (
        <View style={styles.storiesSection}>
          <FlatList
            data={stories}
            renderItem={renderStoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
          />
        </View>
      )}
    </View>
  );

  if (isLoadingPosts && filteredPosts.length === 0) {
    return (
      <HoodlyLayout>
        <SkeletonList count={5} />
      </HoodlyLayout>
    );
  }

  return (
    <HoodlyLayout>
      <GradientBackground />
      
      <FlatList
        data={filteredPosts}
        renderItem={renderPostItem}
        keyExtractor={useCallback((item: Post) => item.id, [])}
        ListHeaderComponent={renderHeader}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={3}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={getColor('textPrimary')}
            colors={[getColor('textPrimary')]}
          />
        }
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="home-outline"
            title="No posts yet"
            description="Be the first to share something with your community!"
            actionText="Create Post"
            onAction={handleCreatePost}
          />
        }
      />

      {/* Floating Action Button */}
      <GradientFAB
        icon="add"
        onPress={handleCreatePost}
        style={styles.fab}
      />

      {/* Comments Modal */}
      {selectedPost && (
        <CommentsModal
          visible={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          post={selectedPost}
          comments={comments.map((c) => ({
            id: c.id,
            post_id: c.post_id,
            user_id: c.user_id,
            text: (c as any).text ?? c.content,
            created_at: c.created_at,
            user: {
              id: c.user?.id ?? '',
              personalName: c.user?.full_name ?? c.user?.personalName ?? '',
              username: c.user?.username ?? '',
              avatar: c.user?.avatar_url ?? c.user?.avatar ?? '',
            },
          })) as any}
          isLoading={isLoadingComments}
          onCommentAdded={(comment: any) => setComments((prev: FeedComment[]) => [...prev, comment as FeedComment])}
        />
      )}
    </HoodlyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 100, // Account for tab bar
  },
  header: {
    paddingTop: getSpacing('lg'),
  },
  storiesSection: {
    marginBottom: getSpacing('lg'),
  },
  storiesList: {
    paddingHorizontal: getSpacing('md'),
  },
  storyItem: {
    alignItems: 'center',
    marginRight: getSpacing('md'),
    width: 70,
  },
  storyImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  storyUsername: {
    fontSize: 12,
    color: getColor('textSecondary'),
    marginTop: getSpacing('xs'),
    textAlign: 'center',
  },
  postContainer: {
    marginHorizontal: getSpacing('md'),
    marginBottom: getSpacing('lg'),
  },
  postCard: {
    padding: getSpacing('lg'),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: getSpacing('sm'),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
  postTime: {
    fontSize: 12,
    color: getColor('textSecondary'),
    marginTop: 2,
  },
  moreButton: {
    padding: getSpacing('xs'),
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: getColor('textPrimary'),
    marginBottom: getSpacing('md'),
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: getRadius('md'),
    marginBottom: getSpacing('md'),
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: getSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: getColor('divider'),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: getSpacing('lg'),
  },
  actionCount: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginLeft: getSpacing('xs'),
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: getSpacing('lg'),
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    marginLeft: getSpacing('sm'),
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: getColor('textPrimary'),
  },
  mediaContainer: {
    flexDirection: 'row',
    marginTop: getSpacing('sm'),
    marginBottom: getSpacing('sm'),
  },
  mediaImage: {
    width: (width - getSpacing('lg') * 2 - getSpacing('md')) / 2,
    height: 150,
    borderRadius: getRadius('sm'),
    marginRight: getSpacing('sm'),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getSpacing('sm'),
  },
  locationText: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginLeft: getSpacing('xs'),
  },
  actionText: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginLeft: getSpacing('xs'),
  },
  likedButton: {
    color: '#ff4757',
  },
  likedText: {
    color: '#ff4757',
  },
});
