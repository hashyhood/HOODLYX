import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Gradient } from './Gradient';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface EmptyStateProps {
  emoji?: string;
  icon?: string;
  title: string;
  subtitle?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  cta?: {
    text: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  icon,
  title,
  subtitle,
  description,
  actionText,
  onAction,
  cta
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : icon ? (
          <View style={styles.iconContainer}>
            <Icon name={icon} size={48} color={getColor('textSecondary')} />
          </View>
        ) : null}
        
        <Text style={styles.title}>{title}</Text>
        {(subtitle || description) && (
          <Text style={styles.subtitle}>{subtitle || description}</Text>
        )}
        
        {(cta || (actionText && onAction)) && (
          <TouchableOpacity 
            onPress={cta ? cta.onPress : onAction} 
            style={styles.ctaContainer}
          >
            <Gradient type="primary" style={styles.ctaButton}>
              <Text style={styles.ctaText}>{cta ? cta.text : actionText}</Text>
            </Gradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getSpacing('xl'),
  },
  content: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emoji: {
    fontSize: 64,
    marginBottom: getSpacing('lg'),
  },
  iconContainer: {
    marginBottom: getSpacing('lg'),
    padding: getSpacing('md'),
    backgroundColor: getColor('surface'),
    borderRadius: getRadius('xl'),
  },
  title: {
    fontSize: theme.typography.title.size,
    fontWeight: theme.typography.title.weight as any,
    color: getColor('textPrimary'),
    lineHeight: theme.typography.title.lineHeight,
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
  },
  subtitle: {
    fontSize: theme.typography.body.size,
    color: getColor('textSecondary'),
    lineHeight: theme.typography.body.lineHeight,
    textAlign: 'center',
    marginBottom: getSpacing('xl'),
  },
  ctaContainer: {
    marginTop: getSpacing('lg'),
  },
  ctaButton: {
    paddingHorizontal: getSpacing('xl'),
    paddingVertical: getSpacing('md'),
    borderRadius: getRadius('pill'),
  },
  ctaText: {
    fontSize: theme.typography.body.size,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
});
