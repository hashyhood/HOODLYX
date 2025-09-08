import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getSpacing } from '../../../lib/theme';

export default function StoriesScreen() {
  return (
    <HoodlyLayout>
      <GradientBackground />
      <View style={styles.container}>
        <EmptyState
          icon="camera-outline"
          title="Stories"
          description="Stories from your community will appear here"
        />
      </View>
    </HoodlyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getSpacing('md'),
  },
});
