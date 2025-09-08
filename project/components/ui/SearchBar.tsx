import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
// BlurView replaced with View for React Native CLI compatibility;
import Icon from 'react-native-vector-icons/Ionicons';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  withMic?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  withMic = false
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.blurContainer}>
        <View style={styles.inputContainer}>
          <Icon 
            name="search" 
            size={20} 
            color={getColor('textSecondary')} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={theme.components.input.placeholder}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
          />
          {withMic && (
            <TouchableOpacity style={styles.micButton}>
              <Icon 
                name="mic" 
                size={20} 
                color={getColor('textSecondary')} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: getSpacing('lg'),
    marginBottom: getSpacing('md'),
  },
  blurContainer: {
    borderRadius: getRadius('md'),
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.components.input.height,
    paddingHorizontal: getSpacing('md'),
    backgroundColor: theme.components.input.bg,
  },
  searchIcon: {
    marginRight: getSpacing('sm'),
  },
  input: {
    flex: 1,
    fontSize: theme.typography.body.size,
    color: getColor('textPrimary'),
    height: '100%',
  },
  micButton: {
    padding: getSpacing('xs'),
    marginLeft: getSpacing('sm'),
  },
}); 