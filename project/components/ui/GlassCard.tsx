import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
// Using View instead of BlurView for React Native CLI compatibility
import { getColor } from '../../lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 20,
  borderRadius = 16,
  padding = 16,
}) => {
  return (
    <View
     
      style={[
        styles.container,
        {
          borderRadius,
          padding,
          backgroundColor: getColor('surface'),
          borderColor: getColor('divider'),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
}); 