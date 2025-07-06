import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScriptStore } from '../store/scriptStore';
import { RootStackParamList } from '../types';

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

export default function SignUpScreen() {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { signUp, authState } = useScriptStore();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      displayName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    
    if (!formData.displayName.trim()) {
      newErrors['displayName'] = 'Display name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors['email'] = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors['email'] = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors['password'] = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors['password'] = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors['confirmPassword'] = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors['confirmPassword'] = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    try {
      await signUp(formData.email.trim(), formData.password, formData.displayName.trim());
      // Navigation will be handled by auth state listener
    } catch (error) {
      Alert.alert(
        'Sign Up Failed',
        error instanceof Error ? error.message : 'Please try again',
        [{ text: 'OK' }]
      );
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Surface style={styles.surface} elevation={2}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Text variant="headlineSmall" style={styles.title}>
              Create Account
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Join SpeakSync to sync your scripts across all devices
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Display Name"
              value={formData.displayName}
              onChangeText={(text) => updateFormData('displayName', text)}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              autoComplete="name"
              error={!!errors.displayName}
            />
            {errors.displayName && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.displayName}
              </Text>
            )}

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={!!errors.email}
            />
            {errors.email && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.email}
              </Text>
            )}

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              error={!!errors.password}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            {errors.password && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.password}
              </Text>
            )}

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              error={!!errors.confirmPassword}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />
            {errors.confirmPassword && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.confirmPassword}
              </Text>
            )}

            {authState.error && (
              <Text variant="bodySmall" style={styles.errorText}>
                {authState.error}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleSignUp}
              style={styles.signUpButton}
              loading={authState.isLoading}
              disabled={authState.isLoading}
            >
              {authState.isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <View style={styles.footer}>
              <Text variant="bodyMedium" style={styles.footerText}>
                Already have an account?{' '}
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('SignIn')}
                compact
                labelStyle={styles.linkText}
              >
                Sign In
              </Button>
            </View>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    margin: 0,
  },
  title: {
    color: '#1f2937',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#ef4444',
    marginTop: -12,
    marginBottom: 4,
  },
  signUpButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#6b7280',
  },
  linkText: {
    color: '#6366f1',
    fontWeight: '600',
  },
});
