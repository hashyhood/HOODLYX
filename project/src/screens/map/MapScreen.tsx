import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getSpacing } from '../../../lib/theme';

export default function MapScreen() {
  return (
    <HoodlyLayout>
      <GradientBackground />
      <View style={styles.container}>
        <EmptyState
          icon="map-outline"
          title="Map"
          description="Interactive neighborhood map will be here"
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
