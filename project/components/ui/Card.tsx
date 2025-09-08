import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
// BlurView replaced with View for React Native CLI compatibility;
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'post' | 'room' | 'notification';
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  onPress
}) => {
  const cardStyle = [
    styles.card,
    styles[variant],
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={cardStyle}>
          {children}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.components.card.bg,
    borderRadius: theme.components.card.radius,
    padding: theme.components.card.pad,
    marginBottom: getSpacing('md'),
    marginHorizontal: getSpacing('lg'),
  },
  default: {
    // Base card styles
  },
  post: {
    // Post-specific styles
  },
  room: {
    // Room-specific styles
  },
  notification: {
    // Notification-specific styles
  },
}); 