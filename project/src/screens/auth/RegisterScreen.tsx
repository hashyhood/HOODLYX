import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { getColor, getSpacing, getRadius, theme } from '../../../lib/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { CONFIG } from '../../../lib/config';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width, height } = Dimensions.get('window');

const INTERESTS = [
  'Technology', 'Gaming', 'Music', 'Sports', 'Food', 'Travel',
  'Fitness', 'Art', 'Books', 'Movies', 'Photography', 'Cooking',
  'Programming', 'Design', 'Business', 'Education', 'Health',
  'Fashion', 'Nature', 'Science', 'History', 'Politics'
];

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    personalName: '',
    email: '',
    password: '',
    bio: '',
    location: '',
    interests: [] as string[],
  });
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=hashir',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=developer',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=social',
  ];

  // Generate username based on personal name
  useEffect(() => {
    if (formData.personalName) {
      const cleanName = formData.personalName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomNum = Math.floor(Math.random() * 999);
      setGeneratedUsername(`${cleanName}${randomNum}`);
    }
  }, [formData.personalName]);

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.personalName || !formData.email || !formData.password) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (formData.interests.length === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest.');
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        full_name: formData.personalName,
        username: generatedUsername,
        bio: formData.bio,
        location: formData.location,
        interests: formData.interests,
        avatar_url: avatars[selectedAvatar],
      };

      const { data, error } = await signUp(formData.email, formData.password, userData);

      if (error) {
        Alert.alert('Registration Failed', error.message || 'Failed to create account.');
        return;
      }

      if (data?.user) {
        Alert.alert(
          'Success!', 
          'Your account has been created. Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Registration Error', error.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0B0F14', '#1A2330']}
        style={styles.background}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={getColor('textPrimary')} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join your neighborhood community</Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {/* Avatar Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Choose Avatar</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.avatarScroll}
                  >
                    {avatars.map((avatar, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.avatarOption,
                          selectedAvatar === index && styles.selectedAvatar
                        ]}
                        onPress={() => setSelectedAvatar(index)}
                      >
                        <View style={styles.avatarPlaceholder}>
                          <Icon name="person" size={32} color="#7DE1DA" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                  
                  <View style={styles.inputContainer}>
                    <Icon name="person-outline" size={20} color="#7DE1DA" />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name *"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formData.personalName}
                      onChangeText={(text) => setFormData({ ...formData, personalName: text })}
                      autoCapitalize="words"
                    />
                  </View>

                  {generatedUsername && (
                    <View style={styles.usernamePreview}>
                      <Text style={styles.usernameText}>@{generatedUsername}</Text>
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <Icon name="mail-outline" size={20} color="#7DE1DA" />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address *"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Icon name="lock-closed-outline" size={20} color="#7DE1DA" />
                    <TextInput
                      style={styles.input}
                      placeholder="Password (6+ characters) *"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Bio and Location */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About You</Text>
                  
                  <View style={styles.inputContainer}>
                    <Icon name="chatbubble-outline" size={20} color="#7DE1DA" />
                    <TextInput
                      style={[styles.input, styles.bioInput]}
                      placeholder="Tell us about yourself..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formData.bio}
                      onChangeText={(text) => setFormData({ ...formData, bio: text })}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Icon name="location-outline" size={20} color="#7DE1DA" />
                    <TextInput
                      style={styles.input}
                      placeholder="Your Location (City, State)"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formData.location}
                      onChangeText={(text) => setFormData({ ...formData, location: text })}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Interests */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Interests *</Text>
                  <Text style={styles.sectionSubtitle}>Select topics you're interested in</Text>
                  
                  <View style={styles.interestsGrid}>
                    {INTERESTS.map((interest) => (
                      <TouchableOpacity
                        key={interest}
                        style={[
                          styles.interestChip,
                          formData.interests.includes(interest) && styles.selectedInterest
                        ]}
                        onPress={() => handleInterestToggle(interest)}
                      >
                        <Text style={[
                          styles.interestText,
                          formData.interests.includes(interest) && styles.selectedInterestText
                        ]}>
                          {interest}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Register Button */}
                <TouchableOpacity 
                  style={styles.registerButton}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#FF6AA2', '#7DE1DA']}
                    style={styles.registerButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.registerButtonText}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Sign In Link */}
                <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.signInLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: getSpacing('lg'),
    paddingTop: getSpacing('lg'),
    paddingBottom: getSpacing('md'),
  },
  backButton: {
    position: 'absolute',
    left: getSpacing('lg'),
    top: getSpacing('lg'),
    padding: getSpacing('sm'),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: getColor('textPrimary'),
    marginBottom: getSpacing('xs'),
  },
  subtitle: {
    fontSize: 14,
    color: getColor('textSecondary'),
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getSpacing('lg'),
    paddingBottom: getSpacing('xl'),
  },
  formContainer: {
    borderRadius: getRadius('xl'),
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  form: {
    padding: getSpacing('lg'),
  },
  section: {
    marginBottom: getSpacing('xl'),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: getColor('textPrimary'),
    marginBottom: getSpacing('sm'),
  },
  sectionSubtitle: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginBottom: getSpacing('md'),
  },
  avatarScroll: {
    marginHorizontal: -getSpacing('sm'),
  },
  avatarOption: {
    marginHorizontal: getSpacing('sm'),
    borderRadius: getRadius('md'),
    padding: getSpacing('xs'),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatar: {
    borderColor: '#7DE1DA',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: getRadius('lg'),
    paddingHorizontal: getSpacing('lg'),
    paddingVertical: getSpacing('md'),
    marginBottom: getSpacing('md'),
    minHeight: 56,
  },
  input: {
    flex: 1,
    marginLeft: getSpacing('sm'),
    fontSize: 16,
    color: getColor('textPrimary'),
  },
  bioInput: {
    paddingTop: getSpacing('sm'),
    minHeight: 80,
  },
  usernamePreview: {
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: getRadius('sm'),
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('xs'),
    alignSelf: 'flex-start',
    marginBottom: getSpacing('md'),
  },
  usernameText: {
    fontSize: 14,
    color: '#7DE1DA',
    fontWeight: '500',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing('sm'),
  },
  interestChip: {
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderRadius: getRadius('pill'),
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedInterest: {
    backgroundColor: 'rgba(125, 225, 218, 0.2)',
    borderColor: '#7DE1DA',
  },
  interestText: {
    fontSize: 14,
    color: getColor('textSecondary'),
  },
  selectedInterestText: {
    color: '#7DE1DA',
    fontWeight: '500',
  },
  registerButton: {
    marginTop: getSpacing('lg'),
    marginBottom: getSpacing('lg'),
  },
  registerButtonGradient: {
    height: 56,
    borderRadius: getRadius('lg'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: getColor('textSecondary'),
  },
  signInLink: {
    fontSize: 14,
    color: '#7DE1DA',
    fontWeight: '600',
  },
});
