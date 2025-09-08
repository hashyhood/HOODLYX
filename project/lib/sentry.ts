import * as Sentry from '@sentry/react-native';

// Helper function to capture errors
export const captureError = (error: Error | string, context?: Record<string, any>) => {
  if (typeof error === 'string') {
    Sentry.captureMessage(error, 'error');
  } else {
    Sentry.captureException(error, {
      extra: context,
    });
  }
};

// Helper function to capture messages
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Helper function to set user context
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

// Helper function to clear user context
export const clearUser = () => {
  Sentry.setUser(null);
};

// Helper function to add breadcrumbs
export const addBreadcrumb = (
  message: string,
  category: string = 'app',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

// Helper function to set tags
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

// Helper function to set extra context
export const setExtra = (key: string, value: any) => {
  Sentry.setExtra(key, value);
};
