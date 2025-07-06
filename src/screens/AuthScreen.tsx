import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { BRAND_ASSETS, BRAND_COLORS } from '../constants/branding';

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export default function AuthScreen() {
  const navigation = useNavigation<AuthScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <Surface style={styles.surface} elevation={2}>
        <View style={styles.logoContainer}>
          <Image
            source={BRAND_ASSETS.LOGO.FULL}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="titleMedium" style={styles.tagline}>
            Your Professional Teleprompter
          </Text>
        </View>

        <View style={styles.contentContainer}>
          <Text variant="bodyLarge" style={styles.description}>
            Create, edit, and present your scripts with confidence. 
            Sync across all your devices with cloud backup.
          </Text>

          <View style={styles.featureList}>
            <Text variant="bodyMedium" style={styles.feature}>
              ✨ Cloud synchronization across devices
            </Text>
            <Text variant="bodyMedium" style={styles.feature}>
              📝 Rich text editing capabilities
            </Text>
            <Text variant="bodyMedium" style={styles.feature}>
              🎬 Professional teleprompter view
            </Text>
            <Text variant="bodyMedium" style={styles.feature}>
              📱 Works offline with auto-sync
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('SignUp')}
            style={[styles.button, styles.primaryButton]}
            labelStyle={styles.buttonLabel}
          >
            Get Started
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('SignIn')}
            style={[styles.button, styles.secondaryButton]}
            labelStyle={styles.secondaryButtonLabel}
          >
            Already have an account? Sign In
          </Button>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.GRAY_LIGHT,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    padding: 32,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.WHITE,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 180,
    height: 120,
    marginBottom: 8,
  },
  tagline: {
    color: BRAND_COLORS.GRAY_DARK,
    textAlign: 'center',
  },
  contentContainer: {
    marginBottom: 32,
  },
  description: {
    color: BRAND_COLORS.BLACK,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featureList: {
    gap: 8,
  },
  feature: {
    color: BRAND_COLORS.GRAY_DARK,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 8,
  },
  primaryButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: BRAND_COLORS.PRIMARY_BLUE,
  },
  secondaryButtonLabel: {
    color: BRAND_COLORS.PRIMARY_BLUE,
    fontSize: 14,
  },
});
