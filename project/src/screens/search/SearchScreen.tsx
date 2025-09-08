import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { getColor, getSpacing, getRadius } from '../../../lib/theme';

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <HoodlyLayout>
      <GradientBackground />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={getColor('textSecondary')} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people, groups, posts..."
            placeholderTextColor={getColor('textTertiary')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Start typing to search</Text>
        </View>
      </View>
    </HoodlyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getSpacing('md'),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getColor('surface'),
    borderRadius: getRadius('lg'),
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    marginBottom: getSpacing('lg'),
  },
  searchInput: {
    flex: 1,
    marginLeft: getSpacing('sm'),
    fontSize: 16,
    color: getColor('textPrimary'),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: getColor('textSecondary'),
  },
});
