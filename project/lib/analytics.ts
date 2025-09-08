import { Platform } from 'react-native';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
}

interface AnalyticsUser {
  id: string;
  properties?: Record<string, any>;
}

interface AnalyticsState {
  isInitialized: boolean;
  userId: string | null;
  sessionId: string | null;
  queue: AnalyticsEvent[];
}

// Create analytics state
const state: AnalyticsState = {
  isInitialized: false,
  userId: null,
  sessionId: null,
  queue: [],
};

// Helper functions
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

const generateEventId = (): string => {
  return `event_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

const sendEvent = async (event: AnalyticsEvent): Promise<void> => {
  // Implementation depends on your analytics service
  // For now, we'll just log the event
  console.log('Analytics event:', JSON.stringify(event, null, 2));
  
  // You can integrate with services like:
  // - Firebase Analytics
  // - Mixpanel
  // - Amplitude
  // - Segment
  // - Custom analytics service
};

const sendUserData = async (userData: AnalyticsUser): Promise<void> => {
  // Implementation depends on your analytics service
  console.log('User data:', JSON.stringify(userData, null, 2));
};

const processQueue = async (): Promise<void> => {
  if (state.queue.length === 0) return;

  const events = [...state.queue];
  state.queue = [];

  for (const event of events) {
    await trackEvent(event.event, event.properties);
  }
};

// Analytics functions
const initialize = async (): Promise<void> => {
  if (state.isInitialized) return;

  try {
    // Initialize analytics service
    console.log('Analytics initialized');
    state.isInitialized = true;
    state.sessionId = generateSessionId();
    
    // Process any queued events
    await processQueue();
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
};

const trackEvent = async (event: string, properties?: Record<string, any>): Promise<void> => {
  const analyticsEvent: AnalyticsEvent = {
    event,
    properties: {
      ...properties,
      platform: Platform.OS,
      sessionId: state.sessionId,
      timestamp: Date.now(),
    },
    userId: state.userId || undefined,
  };

  if (!state.isInitialized) {
    state.queue.push(analyticsEvent);
    return;
  }

  try {
    // Send to analytics service
    await sendEvent(analyticsEvent);
    console.log('Analytics event tracked:', event, properties);
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    // Re-queue failed events
    state.queue.push(analyticsEvent);
  }
};

const identifyUser = async (userId: string, properties?: Record<string, any>): Promise<void> => {
  state.userId = userId;
  
  const userData: AnalyticsUser = {
    id: userId,
    properties: {
      ...properties,
      platform: Platform.OS,
      sessionId: state.sessionId,
      identifiedAt: Date.now(),
    },
  };

  try {
    await sendUserData(userData);
    console.log('User identified:', userId);
  } catch (error) {
    console.error('Failed to identify user:', error);
  }
};

const trackScreen = async (screenName: string, properties?: Record<string, any>): Promise<void> => {
  await trackEvent('screen_view', {
    screen_name: screenName,
    ...properties,
  });
};

const trackUserAction = async (action: string, properties?: Record<string, any>): Promise<void> => {
  await trackEvent('user_action', {
    action,
    ...properties,
  });
};

const trackError = async (error: Error, context?: string): Promise<void> => {
  await trackEvent('error', {
    error_message: error.message,
    error_stack: error.stack,
    context,
  });
};

const trackPerformance = async (metric: string, value: number, properties?: Record<string, any>): Promise<void> => {
  await trackEvent('performance', {
    metric,
    value,
    ...properties,
  });
};

// Social features tracking
const trackFriendRequest = async (sent: boolean, properties?: Record<string, any>): Promise<void> => {
  await trackEvent('friend_request', {
    action: sent ? 'sent' : 'received',
    ...properties,
  });
};

const trackPostCreated = async (properties?: Record<string, any>): Promise<void> => {
  await trackEvent('post_created', properties);
};

const trackPostLiked = async (properties?: Record<string, any>): Promise<void> => {
  await trackEvent('post_liked', properties);
};

const trackCommentAdded = async (properties?: Record<string, any>): Promise<void> => {
  await trackEvent('comment_added', properties);
};

const trackMessageSent = async (properties?: Record<string, any>): Promise<void> => {
  await trackEvent('message_sent', properties);
};

const trackGroupJoined = async (properties?: Record<string, any>): Promise<void> => {
  await trackEvent('group_joined', properties);
};

const trackEventCreated = async (properties?: Record<string, any>): Promise<void> => {
  await trackEvent('event_created', properties);
};

const trackEventJoined = async (properties?: Record<string, any>): Promise<void> => {
  await trackEvent('event_joined', properties);
};

// Location features tracking
const trackLocationShared = async (properties?: Record<string, any>): Promise<void> => {
  await trackEvent('location_shared', properties);
};

const trackNearbyUsersFound = async (count: number, properties?: Record<string, any>): Promise<void> => {
  await trackEvent('nearby_users_found', {
    count,
    ...properties,
  });
};

// Notification tracking
const trackNotificationReceived = async (type: string, properties?: Record<string, any>): Promise<void> => {
  await trackEvent('notification_received', {
    notification_type: type,
    ...properties,
  });
};

const trackNotificationOpened = async (type: string, properties?: Record<string, any>): Promise<void> => {
  await trackEvent('notification_opened', {
    notification_type: type,
    ...properties,
  });
};

// App usage tracking
const trackAppOpen = async (): Promise<void> => {
  await trackEvent('app_open');
};

const trackAppClose = async (): Promise<void> => {
  await trackEvent('app_close');
};

const trackFeatureUsed = async (feature: string, properties?: Record<string, any>): Promise<void> => {
  await trackEvent('feature_used', {
    feature,
    ...properties,
  });
};

// User engagement tracking
const trackSessionStart = async (): Promise<void> => {
  await trackEvent('session_start');
};

const trackSessionEnd = async (duration: number): Promise<void> => {
  await trackEvent('session_end', {
    duration_seconds: duration,
  });
};

const trackUserEngagement = async (engagementType: string, properties?: Record<string, any>): Promise<void> => {
  await trackEvent('user_engagement', {
    engagement_type: engagementType,
    ...properties,
  });
};

// Privacy and settings tracking
const trackPrivacySettingChanged = async (setting: string, value: any): Promise<void> => {
  await trackEvent('privacy_setting_changed', {
    setting,
    value,
  });
};

const trackNotificationSettingChanged = async (setting: string, enabled: boolean): Promise<void> => {
  await trackEvent('notification_setting_changed', {
    setting,
    enabled,
  });
};

// Error and crash tracking
const trackCrash = async (error: Error, stackTrace?: string): Promise<void> => {
  await trackEvent('crash', {
    error_message: error.message,
    stack_trace: stackTrace || error.stack,
  });
};

const trackApiError = async (endpoint: string, statusCode: number, error: string): Promise<void> => {
  await trackEvent('api_error', {
    endpoint,
    status_code: statusCode,
    error,
  });
};

// Utility methods
const setUserId = (userId: string): void => {
  state.userId = userId;
};

const getUserId = (): string | null => {
  return state.userId;
};

const getSessionId = (): string | null => {
  return state.sessionId;
};

const clearUser = (): void => {
  state.userId = null;
};

const flush = async (): Promise<void> => {
  await processQueue();
};

// Export analytics functions
export const analytics = {
  initialize,
  trackEvent,
  identifyUser,
  trackScreen,
  trackUserAction,
  trackError,
  trackPerformance,
  trackFriendRequest,
  trackPostCreated,
  trackPostLiked,
  trackCommentAdded,
  trackMessageSent,
  trackGroupJoined,
  trackEventCreated,
  trackEventJoined,
  trackLocationShared,
  trackNearbyUsersFound,
  trackNotificationReceived,
  trackNotificationOpened,
  trackAppOpen,
  trackAppClose,
  trackFeatureUsed,
  trackSessionStart,
  trackSessionEnd,
  trackUserEngagement,
  trackPrivacySettingChanged,
  trackNotificationSettingChanged,
  trackCrash,
  trackApiError,
  setUserId,
  getUserId,
  getSessionId,
  clearUser,
  flush,
};

// Initialize analytics on import
initialize().catch(console.error);