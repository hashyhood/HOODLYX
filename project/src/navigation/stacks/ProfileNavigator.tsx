import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import screens
import ProfileScreen from '../../screens/profile/ProfileScreen';
import MyPostsScreen from '../../screens/profile/MyPostsScreen';
import MyStoriesScreen from '../../screens/profile/MyStoriesScreen';
import SavedPostsScreen from '../../screens/profile/SavedPostsScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  MyPosts: undefined;
  MyStories: undefined;
  SavedPosts: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const TopTab = createMaterialTopTabNavigator();

// Profile top tabs for different profile sections
const ProfileTopTabs: React.FC = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#6B8BFF',
          height: 3,
          borderRadius: 2,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          textTransform: 'none',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
      }}
    >
      <TopTab.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
      <TopTab.Screen 
        name="Posts" 
        component={MyPostsScreen}
      />
      <TopTab.Screen 
        name="Stories" 
        component={MyStoriesScreen}
      />
      <TopTab.Screen 
        name="Saved" 
        component={SavedPostsScreen}
      />
    </TopTab.Navigator>
  );
};

export const ProfileNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade'
      }}
    >
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileTopTabs}
      />
    </ProfileStack.Navigator>
  );
};
