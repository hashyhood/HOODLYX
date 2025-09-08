import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { getColor, getSpacing, getRadius, theme } from '../../../lib/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signIn, signInWithOAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Missing Information', 'Please fill in your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        Alert.alert('Login Failed', error.message || 'Invalid email or password.');
        return;
      }

      if (data?.user) {
        // Navigation will be handled by AuthWrapper automatically
        console.log('Login successful:', data.user.email);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'github') => {
    setIsLoading(true);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        Alert.alert('OAuth Error', error.message || `${provider} sign in failed`);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Icon name="mail-outline" size={20} color="#7DE1DA" />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Icon name="lock-closed-outline" size={20} color="#7DE1DA" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Icon 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#FF6AA2', '#7DE1DA']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot your password?</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialButtons}>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleOAuthSignIn('google')}
                  disabled={isLoading}
                >
                  <Icon name="logo-google" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleOAuthSignIn('apple')}
                  disabled={isLoading}
                >
                  <Icon name="logo-apple" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleOAuthSignIn('github')}
                  disabled={isLoading}
                >
                  <Icon name="logo-github" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
    justifyContent: 'center',
    paddingHorizontal: getSpacing('lg'),
  },
  header: {
    alignItems: 'center',
    marginBottom: getSpacing('xxl'),
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: getSpacing('sm'),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: getColor('textPrimary'),
    marginBottom: getSpacing('xs'),
  },
  subtitle: {
    fontSize: 16,
    color: getColor('textSecondary'),
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: getRadius('xl'),
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  form: {
    padding: getSpacing('xl'),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: getRadius('lg'),
    paddingHorizontal: getSpacing('lg'),
    marginBottom: getSpacing('lg'),
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: getSpacing('sm'),
    fontSize: 16,
    color: getColor('textPrimary'),
  },
  passwordToggle: {
    padding: getSpacing('xs'),
  },
  loginButton: {
    marginTop: getSpacing('lg'),
    marginBottom: getSpacing('lg'),
  },
  loginButtonGradient: {
    height: 56,
    borderRadius: getRadius('lg'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
  forgotButton: {
    alignItems: 'center',
    marginBottom: getSpacing('xl'),
  },
  forgotText: {
    fontSize: 14,
    color: getColor('textSecondary'),
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: getSpacing('xl'),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: getColor('divider'),
  },
  dividerText: {
    fontSize: 12,
    color: getColor('textTertiary'),
    marginHorizontal: getSpacing('lg'),
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: getSpacing('lg'),
    marginBottom: getSpacing('xl'),
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: getRadius('lg'),
    backgroundColor: theme.colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: getColor('textSecondary'),
  },
  signUpLink: {
    fontSize: 14,
    color: '#7DE1DA',
    fontWeight: '600',
  },
});
