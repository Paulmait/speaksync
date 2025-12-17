import 'dotenv/config';

export default {
  expo: {
    name: "SpeakSyncMobile",
    slug: "SpeakSyncMobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.speaksync.mobile",
      buildNumber: "1",
      infoPlist: {
        NSMicrophoneUsageDescription: "SpeakSync needs access to your microphone for speech recognition and analysis.",
        NSCameraUsageDescription: "SpeakSync needs camera access for video recording your practice sessions."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.speaksync.mobile",
      versionCode: 1,
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // Environment variables for the app
      deepgramApiKey: process.env.DEEPGRAM_API_KEY,
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      
      // RevenueCat Configuration
      revenueCatApiKeyIos: process.env.REVENUECAT_API_KEY_IOS,
      revenueCatApiKeyAndroid: process.env.REVENUECAT_API_KEY_ANDROID,
      
      // Feature Flags
      debugMode: process.env.DEBUG_MODE === 'true',
      enableSpeechLogging: process.env.ENABLE_SPEECH_LOGGING === 'true',
      enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
      enableCrashReporting: process.env.ENABLE_CRASH_REPORTING !== 'false',
      betaTestingMode: process.env.BETA_TESTING_MODE === 'true',
      enableFeatureFlags: process.env.ENABLE_FEATURE_FLAGS !== 'false',
      enableMockServices: process.env.ENABLE_MOCK_SERVICES === 'true',
      
      // Security Settings
      enableApiKeyValidation: process.env.ENABLE_API_KEY_VALIDATION !== 'false',
      enableEnvironmentCheck: process.env.ENABLE_ENVIRONMENT_CHECK !== 'false',
      
      eas: {
        projectId: "4728c611-fe9a-42b7-90d4-54d9ebef1c73"
      },
    }
  }
};
