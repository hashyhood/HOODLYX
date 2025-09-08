import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getSpacing } from '../../../lib/theme';

export default function FriendRequestsScreen() {
  return (
    <HoodlyLayout>
      <GradientBackground />
      <View style={styles.container}>
        <EmptyState
          icon="person-add-outline"
          title="Friend Requests"
          description="New friend requests will appear here"
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
