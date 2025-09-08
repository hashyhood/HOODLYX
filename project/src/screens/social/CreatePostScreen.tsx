import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { HoodlyLayout } from '../../../components/ui/HoodlyLayout';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { getColor, getSpacing, getRadius } from '../../../lib/theme';

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something to post');
      return;
    }

    setIsLoading(true);
    // TODO: Implement post creation
    setTimeout(() => {
      setIsLoading(false);
      navigation.goBack();
    }, 1000);
  };

  return (
    <HoodlyLayout>
      <GradientBackground />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={24} color={getColor('textPrimary')} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <GlassCard style={styles.postCard}>
          <TextInput
            style={styles.contentInput}
            placeholder="What's on your mind?"
            placeholderTextColor={getColor('textTertiary')}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
          />
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="image-outline" size={24} color={getColor('textSecondary')} />
              <Text style={styles.actionText}>Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="location-outline" size={24} color={getColor('textSecondary')} />
              <Text style={styles.actionText}>Location</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Button
          title={isLoading ? 'Posting...' : 'Post'}
          onPress={handlePost}
          disabled={isLoading || !content.trim()}
          style={styles.postButton}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing('lg'),
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
  postCard: {
    flex: 1,
    padding: getSpacing('lg'),
    marginBottom: getSpacing('lg'),
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: getColor('textPrimary'),
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    paddingTop: getSpacing('lg'),
    borderTopWidth: 1,
    borderTopColor: getColor('divider'),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: getSpacing('lg'),
  },
  actionText: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginLeft: getSpacing('xs'),
  },
  postButton: {
    marginBottom: getSpacing('xl'),
  },
});
