import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { getColor, getSpacing, getRadius } from '../../../lib/theme';
import { GlassCard } from '../../../components/ui/GlassCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { DiscoverStackParamList } from '../../navigation/stacks/DiscoverNavigator';

type DiscoverScreenNavigationProp = NativeStackNavigationProp<DiscoverStackParamList>;
type DiscoverScreenRouteProp = RouteProp<any, any>;

interface User {
  id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  is_following?: boolean;
  mutual_friends?: number;
  distance?: number;
}

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverScreenNavigationProp>();
  const route = useRoute<DiscoverScreenRouteProp>();
  const { user } = useAuth();
  
  const discoverType = route.params?.discoverType || 'people';
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Load users to discover
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  }, [loadUsers]);

  const handleUserPress = useCallback((userId: string) => {
    // navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const renderUserItem = ({ item: discoveredUser }: { item: User }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(discoveredUser.id)}
      activeOpacity={0.7}
    >
      <GlassCard style={styles.userCard}>
        <View style={styles.userContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {discoveredUser.avatar_url ? (
              <Image source={{ uri: discoveredUser.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="person" size={32} color={getColor('textSecondary')} />
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{discoveredUser.full_name}</Text>
            {discoveredUser.username && (
              <Text style={styles.username}>@{discoveredUser.username}</Text>
            )}
            {discoveredUser.bio && (
              <Text style={styles.userBio} numberOfLines={2}>
                {discoveredUser.bio}
              </Text>
            )}
            
            {/* User Stats */}
            <View style={styles.userStats}>
              {discoveredUser.location && (
                <View style={styles.statItem}>
                  <Icon name="location-outline" size={14} color={getColor('textSecondary')} />
                  <Text style={styles.statText}>{discoveredUser.location}</Text>
                </View>
              )}
              {discoveredUser.mutual_friends && (
                <View style={styles.statItem}>
                  <Icon name="people-outline" size={14} color={getColor('textSecondary')} />
                  <Text style={styles.statText}>{discoveredUser.mutual_friends} mutual</Text>
                </View>
              )}
            </View>

            {/* Interests */}
            {discoveredUser.interests && discoveredUser.interests.length > 0 && (
              <View style={styles.interests}>
                {discoveredUser.interests.slice(0, 3).map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
                {discoveredUser.interests.length > 3 && (
                  <View style={styles.interestTag}>
                    <Text style={styles.interestText}>
                      +{discoveredUser.interests.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.followButton}>
            <Icon name="person-add-outline" size={20} color={getColor('textPrimary')} />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  if (isLoading && users.length === 0) {
    return (
      <HoodlyLayout>
        <SkeletonList count={6} />
      </HoodlyLayout>
    );
  }

  return (
    <HoodlyLayout>
      <GradientBackground />
      
      <FlatList
        data={users}
        renderItem={renderUserItem}
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
            icon="people-outline"
            title="No people nearby"
            description="Check back later or expand your search radius"
            actionText="Refresh"
            onAction={onRefresh}
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
  userCard: {
    marginBottom: getSpacing('md'),
    padding: getSpacing('lg'),
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: getSpacing('md'),
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: getColor('muted'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('textPrimary'),
    marginBottom: getSpacing('xs'),
  },
  username: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginBottom: getSpacing('xs'),
  },
  userBio: {
    fontSize: 14,
    color: getColor('textSecondary'),
    lineHeight: 20,
    marginBottom: getSpacing('sm'),
  },
  userStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: getSpacing('sm'),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: getSpacing('md'),
    marginBottom: getSpacing('xs'),
  },
  statText: {
    fontSize: 12,
    color: getColor('textSecondary'),
    marginLeft: getSpacing('xs'),
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: getColor('muted'),
    borderRadius: getRadius('sm'),
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    marginRight: getSpacing('xs'),
    marginBottom: getSpacing('xs'),
  },
  interestText: {
    fontSize: 11,
    color: getColor('textSecondary'),
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: getColor('surface'),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: getSpacing('sm'),
  },
});
