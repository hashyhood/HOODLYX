import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Import stack navigators for each tab
import { FeedNavigator } from './stacks/FeedNavigator';
import { DiscoverNavigator } from './stacks/DiscoverNavigator';
import { ChatNavigator } from './stacks/ChatNavigator';
import { NotificationsNavigator } from './stacks/NotificationsNavigator';
import { ProfileNavigator } from './stacks/ProfileNavigator';

// Import custom tab bar  
import { CustomTabBar } from '../components/ui/CustomTabBar';

export type TabParamList = {
  FeedStack: undefined;
  DiscoverStack: undefined;
  CreateStack: undefined;
  ChatStack: undefined;
  NotificationsStack: undefined;
  ProfileStack: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'FeedStack':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'DiscoverStack':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'CreateStack':
              iconName = 'add-circle';
              break;
            case 'ChatStack':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'NotificationsStack':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'ProfileStack':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6AA2',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 86,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill} />
        ),
      })}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="FeedStack" 
        component={FeedNavigator}
        options={{ 
          tabBarLabel: 'Home',
          tabBarButton: (props) => <View {...props} />
        }}
      />
      <Tab.Screen 
        name="DiscoverStack" 
        component={DiscoverNavigator}
        options={{ 
          tabBarLabel: 'Discover'
        }}
      />
      <Tab.Screen 
        name="CreateStack"
        component={View} // Placeholder, will be handled by custom tab bar
        options={{ 
          tabBarLabel: 'Create',
          tabBarButton: () => null, // Hide default button, we'll use custom FAB
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // @ts-ignore
            navigation.navigate('CreatePost');
          },
        })}
      />
      <Tab.Screen 
        name="ChatStack" 
        component={ChatNavigator}
        options={{ 
          tabBarLabel: 'Chat'
        }}
      />
      <Tab.Screen 
        name="NotificationsStack" 
        component={NotificationsNavigator}
        options={{ 
          tabBarLabel: 'Alerts'
        }}
      />
      <Tab.Screen 
        name="ProfileStack" 
        component={ProfileNavigator}
        options={{ 
          tabBarLabel: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
};
