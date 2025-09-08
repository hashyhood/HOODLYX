import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type AuthScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export default function AuthScreen() {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, resetPassword } = useAuth();

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !fullName)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, { full_name: fullName });
        if (error) throw new Error(error.message || 'Sign up failed');
        Alert.alert('Success', 'Account created! Please verify your email.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw new Error(error.message || 'Sign in failed');
        // Navigation handled by AuthWrapper upon isAuthenticated
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email first');
      return;
    }

    const { error } = await resetPassword(email);
    if (error) {
      Alert.alert('Error', error.message || 'Reset failed');
    } else {
      Alert.alert('Success', 'Password reset email sent!');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await (useAuth().signInWithOAuth('google'));
      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google sign in failed');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0B0F14', '#1A2330']}
        style={styles.background}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to Hoodly</Text>
              <Text style={styles.subtitle}>
                Connect with your neighborhood
              </Text>
            </View>

            {/* Auth Form */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {isSignUp && (
                  <View style={styles.inputContainer}>
                    <Icon name="person-outline" size={20} color="#7DE1DA" />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Icon name="mail-outline" size={20} color="#7DE1DA" />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Icon name="lock-closed-outline" size={20} color="#7DE1DA" />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {/* Auth Button */}
                <TouchableOpacity 
                  style={styles.authButton}
                  onPress={handleAuth}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#FF6AA2', '#7DE1DA']}
                    style={styles.authButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.authButtonText}>
                      {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Toggle Auth Mode */}
                <TouchableOpacity 
                  style={styles.toggleButton}
                  onPress={() => setIsSignUp(!isSignUp)}
                >
                  <Text style={styles.toggleText}>
                    {isSignUp 
                      ? 'Already have an account? Sign In' 
                      : "Don't have an account? Sign Up"
                    }
                  </Text>
                </TouchableOpacity>

                {/* Forgot Password */}
                {!isSignUp && (
                  <TouchableOpacity 
                    style={styles.forgotButton}
                    onPress={handleForgotPassword}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login */}
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={handleGoogleSignIn}
                >
                  <Icon name="logo-google" size={20} color="#FFFFFF" />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Advanced Auth Options */}
                <View style={styles.advancedOptions}>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.advancedText}>Advanced Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.advancedText}>Detailed Registration</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  form: {
    padding: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  authButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  authButtonGradient: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleText: {
    fontSize: 14,
    color: '#7DE1DA',
  },
  forgotButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  advancedOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  advancedText: {
    fontSize: 12,
    color: '#FF6AA2',
  },
});
