import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import screens
import ChatsListScreen from '../../screens/chat/ChatsListScreen';
import PrivateChatScreen from '../../screens/chat/PrivateChatScreen';
import GroupChatScreen from '../../screens/chat/GroupChatScreen';
import CreateChatScreen from '../../screens/chat/CreateChatScreen';

export type ChatStackParamList = {
  ChatsList: undefined;
  PrivateChat: { friendId: string; friendName: string };
  GroupChat: { roomId: string; roomName: string };
  CreateChat: { type: 'private' | 'group' };
};

const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const TopTab = createMaterialTopTabNavigator();

// Chat top tabs for different chat types
const ChatTopTabs: React.FC = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#FF71B8',
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
        name="Messages" 
        component={ChatsListScreen}
        initialParams={{ chatType: 'private' }}
      />
      <TopTab.Screen 
        name="Groups" 
        component={ChatsListScreen}
        initialParams={{ chatType: 'groups' }}
      />
      <TopTab.Screen 
        name="Requests" 
        component={ChatsListScreen}
        initialParams={{ chatType: 'requests' }}
      />
    </TopTab.Navigator>
  );
};

export const ChatNavigator: React.FC = () => {
  return (
    <ChatStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <ChatStack.Screen 
        name="ChatsList" 
        component={ChatTopTabs}
      />
      <ChatStack.Screen 
        name="PrivateChat" 
        component={PrivateChatScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true
        }}
      />
      <ChatStack.Screen 
        name="GroupChat" 
        component={GroupChatScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true
        }}
      />
      <ChatStack.Screen 
        name="CreateChat" 
        component={CreateChatScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal'
        }}
      />
    </ChatStack.Navigator>
  );
};
