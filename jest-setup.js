import { jest } from '@jest/globals';

// Setup globals first
global.window = global.window || {};
global.document = global.document || {};

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        deepgramApiKey: 'test-api-key',
      },
    },
  },
}));

jest.mock('expo-av', () => ({
  Audio: {
    Recording: jest.fn(() => ({
      prepareToRecordAsync: jest.fn(),
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn(() => 'mock-uri'),
    })),
    RecordingOptions: {},
    AndroidOutputFormat: { MPEG_4: 'mpeg4' },
    AndroidAudioEncoder: { AAC: 'aac' },
    IOSAudioQuality: { HIGH: 'high', MEDIUM: 'medium' },
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  },
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn(date => ({ toDate: () => date })),
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock React Native Paper
jest.mock('react-native-paper', () => ({
  Text: 'Text',
  Button: 'Button',
  Surface: 'Surface',
  Card: 'Card',
  ProgressBar: 'ProgressBar',
  Provider: ({ children }) => children,
}));

// Mock audio and speech
jest.mock('expo-av', () => ({
  Audio: {
    Recording: jest.fn(),
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  },
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock chart kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
  PieChart: 'PieChart',
}));

// Mock date picker
jest.mock('react-native-date-picker', () => 'DatePicker');

// Mock Deepgram SDK
jest.mock('@deepgram/sdk', () => ({
  createClient: jest.fn(() => ({
    listen: {
      live: jest.fn(() => ({
        start: jest.fn(),
        finish: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
      })),
    },
  })),
}));

// Increase timeout for async operations
jest.setTimeout(10000);
