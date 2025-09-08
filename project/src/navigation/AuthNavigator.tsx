import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AuthScreen from '../screens/auth/AuthScreen';

export type AuthStackParamList = {
  AuthHome: undefined;
  Login: undefined;
  Register: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <AuthStack.Screen 
        name="AuthHome" 
        component={AuthScreen}
        options={{ animation: 'fade' }}
      />
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          animation: 'slide_from_bottom',
          presentation: 'modal'
        }}
      />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ 
          animation: 'slide_from_bottom',
          presentation: 'modal'
        }}
      />
    </AuthStack.Navigator>
  );
};
