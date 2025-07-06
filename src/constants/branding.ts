/**
 * SpeakSync Brand Constants
 * Centralized branding configuration for consistent UI
 */

// Brand Assets
export const BRAND_ASSETS = {
  LOGO: {
    ICON: require('../../assets/branding/logo-icon.png'),
    FULL: require('../../assets/branding/logo-full.png'),
  },
} as const;

// Brand Colors
export const BRAND_COLORS = {
  // Primary Brand Colors
  PRIMARY_BLUE: '#4F7FFF', // Main blue from logo
  SECONDARY_GREEN: '#7FCC5C', // Wave green from logo
  
  // Extended Palette
  BLUE_LIGHT: '#E3EDFF',
  BLUE_MEDIUM: '#B3CFFF',
  BLUE_DARK: '#2F5FDF',
  
  GREEN_LIGHT: '#E8F5E0',
  GREEN_MEDIUM: '#C4E8B0',
  GREEN_DARK: '#5FAA3C',
  
  // UI Colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_LIGHT: '#F5F5F5',
  GRAY_MEDIUM: '#CCCCCC',
  GRAY_DARK: '#666666',
  
  // Semantic Colors
  SUCCESS: '#7FCC5C',
  WARNING: '#FFA500',
  ERROR: '#FF4444',
  INFO: '#4F7FFF',
} as const;

// Typography
export const BRAND_FONTS = {
  PRIMARY: 'System', // iOS: SF Pro, Android: Roboto
  SECONDARY: 'System',
  WEIGHT: {
    LIGHT: '300',
    REGULAR: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },
  SIZE: {
    SMALL: 12,
    MEDIUM: 14,
    LARGE: 16,
    XLARGE: 18,
    XXLARGE: 20,
    TITLE: 24,
    HERO: 32,
  },
} as const;

// Brand Dimensions
export const BRAND_SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

export const BRAND_RADIUS = {
  SMALL: 4,
  MEDIUM: 8,
  LARGE: 12,
  XLARGE: 16,
  PILL: 999,
} as const;

// Brand Logo Configuration
export const BRAND_LOGO = {
  ICON_SIZE: {
    SMALL: 24,
    MEDIUM: 32,
    LARGE: 48,
    XLARGE: 64,
  },
  LOGO_SIZE: {
    SMALL: { width: 100, height: 30 },
    MEDIUM: { width: 150, height: 45 },
    LARGE: { width: 200, height: 60 },
  },
} as const;

// Brand Gradients
export const BRAND_GRADIENTS = {
  PRIMARY: ['#4F7FFF', '#7FCC5C'],
  SECONDARY: ['#E3EDFF', '#E8F5E0'],
  WAVE: ['#7FCC5C', '#5FAA3C'],
  BLUE_FADE: ['#4F7FFF', '#B3CFFF'],
} as const;

// Animation Durations
export const BRAND_ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Shadow Styles
export const BRAND_SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
