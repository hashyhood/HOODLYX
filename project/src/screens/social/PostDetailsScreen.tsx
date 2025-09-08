import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { getSpacing, getColor } from '../../../lib/theme';

export default function PostDetailsScreen() {
  const route = useRoute();
  const { postId } = route.params as { postId: string };

  return (
    <HoodlyLayout>
      <GradientBackground />
      <View style={styles.container}>
        <Text style={styles.title}>Post Details</Text>
        <Text style={styles.subtitle}>Post ID: {postId}</Text>
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
