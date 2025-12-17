import 'dotenv/config';

export default {
  expo: {
    name: "SpeakSync",
    slug: "SpeakSyncMobile",
    version: "1.0.0",
    orientation: "default",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    // Splash screen configuration
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1a1a2e"
    },

    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.speaksync.mobile",
      buildNumber: "1",
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        // Microphone - Required for speech recognition
        NSMicrophoneUsageDescription: "SpeakSync needs microphone access for real-time speech recognition, karaoke-style word highlighting, and speaking pace analysis during your teleprompter sessions.",

        // Camera - Required for video recording
        NSCameraUsageDescription: "SpeakSync needs camera access to record video of your practice sessions for review and improvement.",

        // Speech Recognition - Required for adaptive scrolling
        NSSpeechRecognitionUsageDescription: "SpeakSync uses speech recognition to provide real-time word highlighting, adaptive scrolling, and speaking analysis during your teleprompter sessions.",

        // Bluetooth - Required for BLE remote control
        NSBluetoothAlwaysUsageDescription: "SpeakSync uses Bluetooth to connect to presentation remotes and clickers for hands-free teleprompter control.",
        NSBluetoothPeripheralUsageDescription: "SpeakSync uses Bluetooth to connect to presentation remotes for hands-free control.",

        // Photo Library - For saving recordings
        NSPhotoLibraryUsageDescription: "SpeakSync needs photo library access to save your recorded practice sessions.",
        NSPhotoLibraryAddUsageDescription: "SpeakSync needs permission to save recorded videos to your photo library.",

        // Background modes for audio
        UIBackgroundModes: ["audio"],

        // App Transport Security - Enforce TLS 1.2+ with Forward Secrecy
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSAllowsLocalNetworking: false,
          NSExceptionDomains: {
            "firebaseio.com": {
              NSIncludesSubdomains: true,
              NSExceptionRequiresForwardSecrecy: true,
              NSExceptionMinimumTLSVersion: "TLSv1.2"
            },
            "googleapis.com": {
              NSIncludesSubdomains: true,
              NSExceptionRequiresForwardSecrecy: true,
              NSExceptionMinimumTLSVersion: "TLSv1.2"
            }
          }
        },

        // Privacy tracking - Required for iOS 14.5+
        NSUserTrackingUsageDescription: "SpeakSync uses this to provide personalized speaking analytics and improvement suggestions."
      },

      // Privacy Manifests - Required for iOS 17+ App Store submission
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1"]
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
            NSPrivacyAccessedAPITypeReasons: ["35F9.1"]
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
            NSPrivacyAccessedAPITypeReasons: ["C617.1"]
          }
        ],
        NSPrivacyCollectedDataTypes: [
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeAudioData",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePerformanceData",
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAnalytics"]
          }
        ],
        NSPrivacyTracking: false
      }
    },

    // Android Configuration
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a1a2e"
      },
      package: "com.speaksync.mobile",
      versionCode: 1,
      edgeToEdgeEnabled: true,

      // Security settings
      allowBackup: false, // Prevent backup of sensitive data
      usesCleartextTraffic: false, // Force HTTPS only

      // Required permissions
      permissions: [
        "android.permission.INTERNET",
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
        "android.permission.FOREGROUND_SERVICE"
      ],

      // Block dangerous permissions we don't need
      blockedPermissions: [
        "android.permission.READ_CONTACTS",
        "android.permission.WRITE_CONTACTS",
        "android.permission.READ_CALL_LOG",
        "android.permission.WRITE_CALL_LOG",
        "android.permission.READ_SMS",
        "android.permission.SEND_SMS",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION"
      ]
    },

    // Web Configuration (for development)
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },

    // Plugins
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "SpeakSync needs camera access to record your practice sessions."
        }
      ],
      [
        "expo-av",
        {
          microphonePermission: "SpeakSync needs microphone access for speech recognition."
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "SpeakSync needs access to save your recorded sessions.",
          savePhotosPermission: "SpeakSync needs permission to save recordings.",
          isAccessMediaLocationEnabled: true
        }
      ],
      "expo-localization",
      "expo-secure-store"
    ],

    // Updates configuration
    updates: {
      enabled: true,
      fallbackToCacheTimeout: 30000,
      url: "https://u.expo.dev/4728c611-fe9a-42b7-90d4-54d9ebef1c73"
    },

    // Runtime version policy
    runtimeVersion: {
      policy: "appVersion"
    },

    // Asset bundle patterns
    assetBundlePatterns: [
      "assets/**/*",
      "legal-content/**/*"
    ],

    // Extra configuration
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

      // AI Services
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      humeApiKey: process.env.EXPO_PUBLIC_HUME_API_KEY,
      humeSecretKey: process.env.EXPO_PUBLIC_HUME_SECRET_KEY,

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

      // EAS Configuration
      eas: {
        projectId: "4728c611-fe9a-42b7-90d4-54d9ebef1c73"
      }
    },

    // Owner for EAS
    owner: "guampaul"
  }
};
