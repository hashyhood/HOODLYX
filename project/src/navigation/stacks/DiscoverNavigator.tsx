import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import screens
import DiscoverScreen from '../../screens/discover/DiscoverScreen';
import SearchScreen from '../../screens/search/SearchScreen';
import MapScreen from '../../screens/map/MapScreen';
import GroupsScreen from '../../screens/groups/GroupsScreen';
import EventsScreen from '../../screens/events/EventsScreen';
import MarketplaceScreen from '../../screens/marketplace/MarketplaceScreen';

export type DiscoverStackParamList = {
  DiscoverHome: undefined;
  Search: { query?: string };
  Map: undefined;
  GroupDetails: { groupId: string };
  EventDetails: { eventId: string };
  MarketplaceItem: { itemId: string };
};

const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>();
const TopTab = createMaterialTopTabNavigator();

// Discover top tabs for different discovery types
const DiscoverTopTabs: React.FC = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#7DE1DA',
          height: 3,
          borderRadius: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          textTransform: 'none',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: 80 },
      }}
    >
      <TopTab.Screen 
        name="People" 
        component={DiscoverScreen}
        initialParams={{ discoverType: 'people' }}
      />
      <TopTab.Screen 
        name="Groups" 
        component={GroupsScreen}
      />
      <TopTab.Screen 
        name="Events" 
        component={EventsScreen}
      />
      <TopTab.Screen 
        name="Market" 
        component={MarketplaceScreen}
      />
      <TopTab.Screen 
        name="Map" 
        component={MapScreen}
      />
    </TopTab.Navigator>
  );
};

export const DiscoverNavigator: React.FC = () => {
  return (
    <DiscoverStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <DiscoverStack.Screen 
        name="DiscoverHome" 
        component={DiscoverTopTabs}
      />
      <DiscoverStack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          animation: 'fade_from_bottom'
        }}
      />
    </DiscoverStack.Navigator>
  );
};
