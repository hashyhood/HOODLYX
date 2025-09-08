import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { getSpacing, getColor } from '../../../lib/theme';

export default function UserProfileScreen() {
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  return (
    <HoodlyLayout>
      <GradientBackground />
      <View style={styles.container}>
        <Text style={styles.title}>User Profile</Text>
        <Text style={styles.subtitle}>User ID: {userId}</Text>
      </View>
    </HoodlyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getSpacing('md'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: getColor('textPrimary'),
    marginBottom: getSpacing('sm'),
  },
  subtitle: {
    fontSize: 16,
    color: getColor('textSecondary'),
  },
});
