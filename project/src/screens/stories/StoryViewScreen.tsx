import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getSpacing } from '../../../lib/theme';

export default function StoryViewScreen() {
  return (
    <HoodlyLayout>
      <GradientBackground />
      <View style={styles.container}>
        <EmptyState
          icon="play-outline"
          title="Story Viewer"
          description="Story viewing functionality will be here"
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
