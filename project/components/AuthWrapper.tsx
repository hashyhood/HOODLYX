import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { registerPushToken } from '../lib/push';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Register push token when user is authenticated (best-effort)
      registerPushToken().catch(error => {
        console.warn('Failed to register push token:', error);
      });
    }
  }, [isAuthenticated]);

  return <>{children}</>;
} 