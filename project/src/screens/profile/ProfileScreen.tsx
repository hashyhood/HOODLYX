import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { getColor, getSpacing, getRadius } from '../../../lib/theme';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { MainStackParamList } from '../../navigation/MainNavigator';

type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface UserStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, profile, signOut } = useAuth();
  
  const [stats, setStats] = useState<UserStats>({
    posts_count: 0,
    followers_count: 0,
    following_count: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get user stats from profile or calculate them
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('posts_count, followers_count, following_count')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setStats({
        posts_count: profileData.posts_count || 0,
        followers_count: profileData.followers_count || 0,
        following_count: profileData.following_count || 0,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadUserStats();
    setIsRefreshing(false);
  }, [loadUserStats]);

  const handleEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  const handleSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const handleFriends = useCallback(() => {
    navigation.navigate('Friends');
  }, [navigation]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  }, [signOut]);

  return (
    <HoodlyLayout>
      <GradientBackground />
      
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={getColor('textPrimary')}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <GlassCard style={styles.profileHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={handleSettings}
            >
              <Icon name="settings-outline" size={24} color={getColor('textPrimary')} />
            </TouchableOpacity>
          </View>

          {/* Avatar and Basic Info */}
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={40} color={getColor('textSecondary')} />
                </View>
              )}
            </View>

            <Text style={styles.fullName}>{profile?.full_name || 'Unknown User'}</Text>
            
            {profile?.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}

            {Boolean((profile as any)?.location) && (
              <View style={styles.locationContainer}>
                <Icon name="location-outline" size={16} color={getColor('textSecondary')} />
                <Text style={styles.location}>{(profile as any).location}</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.posts_count}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem} onPress={handleFriends}>
              <Text style={styles.statNumber}>{stats.followers_count}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem} onPress={handleFriends}>
              <Text style={styles.statNumber}>{stats.following_count}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Edit Profile"
              onPress={handleEditProfile}
              variant="secondary"
              style={styles.editButton}
            />
          </View>
        </GlassCard>

        {/* Interests */}
        {Array.isArray((profile as any)?.interests) && (profile as any).interests.length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interests}>
              {(profile as any).interests.map((interest: string, index: number) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Quick Actions */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleFriends}>
            <Icon name="people-outline" size={24} color={getColor('textPrimary')} />
            <Text style={styles.actionText}>Friends</Text>
            <Icon name="chevron-forward" size={20} color={getColor('textSecondary')} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="bookmark-outline" size={24} color={getColor('textPrimary')} />
            <Text style={styles.actionText}>Saved Posts</Text>
            <Icon name="chevron-forward" size={20} color={getColor('textSecondary')} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="time-outline" size={24} color={getColor('textPrimary')} />
            <Text style={styles.actionText}>Activity</Text>
            <Icon name="chevron-forward" size={20} color={getColor('textSecondary')} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="shield-outline" size={24} color={getColor('textPrimary')} />
            <Text style={styles.actionText}>Privacy</Text>
            <Icon name="chevron-forward" size={20} color={getColor('textSecondary')} />
          </TouchableOpacity>
        </GlassCard>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </HoodlyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: getSpacing('md'),
    paddingBottom: 100,
  },
  profileHeader: {
    padding: getSpacing('lg'),
    marginBottom: getSpacing('lg'),
    alignItems: 'center',
  },
  headerTop: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    marginBottom: getSpacing('lg'),
  },
  settingsButton: {
    padding: getSpacing('xs'),
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: getSpacing('lg'),
  },
  avatarContainer: {
    marginBottom: getSpacing('md'),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: getColor('muted'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullName: {
    fontSize: 24,
    fontWeight: '700',
    color: getColor('textPrimary'),
    textAlign: 'center',
    marginBottom: getSpacing('xs'),
  },
  bio: {
    fontSize: 16,
    color: getColor('textSecondary'),
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: getSpacing('sm'),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginLeft: getSpacing('xs'),
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    marginBottom: getSpacing('lg'),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: getColor('textPrimary'),
  },
  statLabel: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginTop: getSpacing('xs'),
  },
  actionButtons: {
    alignSelf: 'stretch',
  },
  editButton: {
    marginBottom: getSpacing('sm'),
  },
  section: {
    padding: getSpacing('lg'),
    marginBottom: getSpacing('lg'),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: getColor('textPrimary'),
    marginBottom: getSpacing('md'),
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
    fontSize: 12,
    color: getColor('textSecondary'),
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: getColor('divider'),
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: getColor('textPrimary'),
    marginLeft: getSpacing('md'),
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: getSpacing('lg'),
    marginTop: getSpacing('lg'),
  },
  signOutText: {
    fontSize: 16,
    color: getColor('error'),
    fontWeight: '500',
  },
});
