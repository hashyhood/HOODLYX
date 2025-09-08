import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';

// Import modal screens
import PostDetailsScreen from '../screens/social/PostDetailsScreen';
import UserProfileScreen from '../screens/social/UserProfileScreen';
import CreatePostScreen from '../screens/social/CreatePostScreen';
import CameraScreen from '../screens/camera/CameraScreen';
import StoryViewScreen from '../screens/stories/StoryViewScreen';
import CreateStoryScreen from '../screens/stories/CreateStoryScreen';
import LiveStreamScreen from '../screens/live/LiveStreamScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import FriendsScreen from '../screens/social/FriendsScreen';
import FriendRequestsScreen from '../screens/social/FriendRequestsScreen';

export type MainStackParamList = {
  TabNavigator: undefined;
  PostDetails: { postId: string };
  UserProfile: { userId: string };
  CreatePost: undefined;
  Camera: { mode?: 'post' | 'story' | 'live' };
  StoryView: { storyId: string; userId: string };
  CreateStory: { imageUri?: string; videoUri?: string };
  LiveStream: { streamId?: string };
  Settings: undefined;
  EditProfile: undefined;
  Friends: undefined;
  FriendRequests: undefined;
};

const MainStack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <MainStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      {/* Main tab navigator */}
      <MainStack.Screen 
        name="TabNavigator" 
        component={TabNavigator}
        options={{ animation: 'fade' }}
      />
      
      {/* Modal screens */}
      <MainStack.Group screenOptions={{ presentation: 'modal' }}>
        <MainStack.Screen 
          name="CreatePost" 
          component={CreatePostScreen}
          options={{ 
            animation: 'slide_from_bottom',
            gestureDirection: 'vertical'
          }}
        />
        <MainStack.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{ 
            animation: 'slide_from_bottom',
            gestureDirection: 'vertical'
          }}
        />
        <MainStack.Screen 
          name="CreateStory" 
          component={CreateStoryScreen}
          options={{ 
            animation: 'slide_from_bottom',
            gestureDirection: 'vertical'
          }}
        />
        <MainStack.Screen 
          name="LiveStream" 
          component={LiveStreamScreen}
          options={{ 
            animation: 'slide_from_bottom',
            gestureDirection: 'vertical'
          }}
        />
      </MainStack.Group>
      
      {/* Fullscreen modal screens */}
      <MainStack.Group screenOptions={{ 
        presentation: 'fullScreenModal',
        animation: 'fade_from_bottom'
      }}>
        <MainStack.Screen 
          name="StoryView" 
          component={StoryViewScreen}
        />
      </MainStack.Group>
      
      {/* Regular stack screens */}
      <MainStack.Screen 
        name="PostDetails" 
        component={PostDetailsScreen}
      />
      <MainStack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
      />
      <MainStack.Screen 
        name="Settings" 
        component={SettingsScreen}
      />
      <MainStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
      />
      <MainStack.Screen 
        name="Friends" 
        component={FriendsScreen}
      />
      <MainStack.Screen 
        name="FriendRequests" 
        component={FriendRequestsScreen}
      />
    </MainStack.Navigator>
  );
};
