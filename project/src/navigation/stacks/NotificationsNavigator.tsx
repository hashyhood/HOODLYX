import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import screens
import NotificationsScreen from '../../screens/notifications/NotificationsScreen';

export type NotificationsStackParamList = {
  NotificationsHome: undefined;
};

const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
const TopTab = createMaterialTopTabNavigator();

// Notifications top tabs for different notification types
const NotificationsTopTabs: React.FC = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#4CC38A',
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
        name="All" 
        component={NotificationsScreen}
        initialParams={{ notificationType: 'all' }}
      />
      <TopTab.Screen 
        name="Social" 
        component={NotificationsScreen}
        initialParams={{ notificationType: 'social' }}
      />
      <TopTab.Screen 
        name="System" 
        component={NotificationsScreen}
        initialParams={{ notificationType: 'system' }}
      />
    </TopTab.Navigator>
  );
};

export const NotificationsNavigator: React.FC = () => {
  return (
    <NotificationsStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade'
      }}
    >
      <NotificationsStack.Screen 
        name="NotificationsHome" 
        component={NotificationsTopTabs}
      />
    </NotificationsStack.Navigator>
  );
};
