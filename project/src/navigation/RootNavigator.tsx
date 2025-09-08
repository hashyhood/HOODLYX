import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';

// Import navigators
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// Import screens
import { LoadingScreen } from '../../components/LoadingScreen';

// Root navigator types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Loading: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade_from_bottom',
        gestureEnabled: true,
      }}
    >
      {user ? (
        <RootStack.Screen 
          name="Main" 
          component={MainNavigator}
          options={{
            animationTypeForReplace: user ? 'push' : 'pop',
          }}
        />
      ) : (
        <RootStack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            animationTypeForReplace: user ? 'push' : 'pop',
          }}
        />
      )}
    </RootStack.Navigator>
  );
};
