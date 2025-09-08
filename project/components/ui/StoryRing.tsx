import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

interface StoryRingProps {
  label?: string;
  colors?: string[];
  children?: React.ReactNode;
  isViewed?: boolean;
  size?: number;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  label,
  colors,
  children,
  isViewed,
  size = 60,
}) => {
  const { colors: themeColors } = useTheme();
  const ringColors = (colors || themeColors.gradients.primary) as [string, string];
  return (
    <LinearGradient colors={[...ringColors] as string[]} style={[styles.ring, { width: size, height: size }]}>
      <View style={[styles.inner, { backgroundColor: themeColors.glass.primary }]}>
        {children || (
          <Text style={[styles.text, { color: themeColors.text.primary }]}>{label}</Text>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  ring: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 