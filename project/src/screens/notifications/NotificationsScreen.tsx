import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getSpacing } from '../../../lib/theme';

export default function NotificationsScreen() {
  const route = useRoute();
  const notificationType = (route.params as any)?.notificationType || 'all';
  
  return (
    <HoodlyLayout>
      <GradientBackground />
      <View style={styles.container}>
        <EmptyState
          icon="notifications-outline"
          title={`No ${notificationType} notifications`}
          description="Stay tuned for updates from your community!"
        />
      </View>
    </HoodlyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getSpacing('md'),
    paddingBottom: 100,
  },
});
