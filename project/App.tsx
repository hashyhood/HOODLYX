import React from 'react';
import { StatusBar, StatusBarStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

// Initialize Sentry
Sentry.init({ 
  dsn: process.env.SENTRY_DSN || undefined, 
  environment: process.env.APP_ENVIRONMENT || 'development',
  release: process.env.APP_VERSION || '1.0.0',
  debug: process.env.APP_ENVIRONMENT === 'development',
  tracesSampleRate: 1.0,
});

// Import providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocialProvider } from './contexts/SocialContext';

// Import navigation
import { RootNavigator } from './src/navigation/RootNavigator';
import { linking } from './src/navigation/linking';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <SocialProvider>
            <NavigationContainer linking={linking}>
              <RootNavigator />
              <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
            </NavigationContainer>
          </SocialProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
