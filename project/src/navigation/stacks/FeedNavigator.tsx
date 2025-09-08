import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import screens
import FeedScreen from '../../screens/feed/FeedScreen';
import StoriesScreen from '../../screens/stories/StoriesScreen';

export type FeedStackParamList = {
  FeedHome: undefined;
  Stories: undefined;
};

const FeedStack = createNativeStackNavigator<FeedStackParamList>();
const TopTab = createMaterialTopTabNavigator();

// Feed top tabs for different feed types
const FeedTopTabs: React.FC = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#FF6AA2',
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
        name="Trending" 
        component={FeedScreen}
        initialParams={{ feedType: 'trending' }}
      />
      <TopTab.Screen 
        name="Following" 
        component={FeedScreen}
        initialParams={{ feedType: 'following' }}
      />
      <TopTab.Screen 
        name="Nearby" 
        component={FeedScreen}
        initialParams={{ feedType: 'nearby' }}
      />
    </TopTab.Navigator>
  );
};

export const FeedNavigator: React.FC = () => {
  return (
    <FeedStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade'
      }}
    >
      <FeedStack.Screen 
        name="FeedHome" 
        component={FeedTopTabs}
      />
      <FeedStack.Screen 
        name="Stories" 
        component={StoriesScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal'
        }}
      />
    </FeedStack.Navigator>
  );
};
