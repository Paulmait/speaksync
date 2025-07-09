import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock expo modules
jest.mock('expo-font');
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(),
  preventAutoHideAsync: jest.fn(),
}));
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ children }: { children: React.ReactNode }) => children,
  }),
}));

// Mock React Native Paper
jest.mock('react-native-paper', () => ({
  PaperProvider: ({ children }: { children: React.ReactNode }) => children,
  DefaultTheme: {},
}));

// Mock Firebase
jest.mock('../src/services/firebase', () => ({
  auth: {},
  firestore: {},
}));

// Mock zustand store
jest.mock('../src/store/useScriptStore', () => ({
  __esModule: true,
  default: () => ({
    scripts: [],
    currentScript: null,
    addScript: jest.fn(),
    updateScript: jest.fn(),
    deleteScript: jest.fn(),
    setCurrentScript: jest.fn(),
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Just test that the app renders without throwing
    expect(true).toBe(true);
  });
});
