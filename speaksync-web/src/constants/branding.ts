/**
 * SpeakSync Brand Constants for Web
 * Centralized branding configuration for consistent UI
 */

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

// Typography Scale
export const BRAND_TYPOGRAPHY = {
  FONT_FAMILY: {
    PRIMARY: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    MONO: '"SF Mono", Monaco, "Inconsolata", "Roboto Mono", monospace',
  },
  FONT_SIZE: {
    XS: '0.75rem',    // 12px
    SM: '0.875rem',   // 14px
    BASE: '1rem',     // 16px
    LG: '1.125rem',   // 18px
    XL: '1.25rem',    // 20px
    '2XL': '1.5rem',  // 24px
    '3XL': '1.875rem', // 30px
    '4XL': '2.25rem', // 36px
  },
  FONT_WEIGHT: {
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },
  LINE_HEIGHT: {
    TIGHT: '1.25',
    NORMAL: '1.5',
    RELAXED: '1.75',
  },
} as const;

// Spacing Scale
export const BRAND_SPACING = {
  '0': '0',
  '1': '0.25rem',   // 4px
  '2': '0.5rem',    // 8px
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '5': '1.25rem',   // 20px
  '6': '1.5rem',    // 24px
  '8': '2rem',      // 32px
  '10': '2.5rem',   // 40px
  '12': '3rem',     // 48px
  '16': '4rem',     // 64px
} as const;

// Border Radius
export const BRAND_RADIUS = {
  NONE: '0',
  SM: '0.25rem',    // 4px
  DEFAULT: '0.5rem', // 8px
  MD: '0.75rem',    // 12px
  LG: '1rem',       // 16px
  XL: '1.5rem',     // 24px
  FULL: '9999px',
} as const;

// Logo Configuration
export const BRAND_LOGO = {
  ICON_SIZE: {
    SM: '1.5rem',   // 24px
    MD: '2rem',     // 32px
    LG: '3rem',     // 48px
    XL: '4rem',     // 64px
  },
  LOGO_WIDTH: {
    SM: '6.25rem',  // 100px
    MD: '9.375rem', // 150px
    LG: '12.5rem',  // 200px
  },
} as const;

// CSS Custom Properties for Tailwind
export const BRAND_CSS_VARS = {
  '--color-brand-primary': BRAND_COLORS.PRIMARY_BLUE,
  '--color-brand-secondary': BRAND_COLORS.SECONDARY_GREEN,
  '--color-brand-blue-light': BRAND_COLORS.BLUE_LIGHT,
  '--color-brand-blue-medium': BRAND_COLORS.BLUE_MEDIUM,
  '--color-brand-blue-dark': BRAND_COLORS.BLUE_DARK,
  '--color-brand-green-light': BRAND_COLORS.GREEN_LIGHT,
  '--color-brand-green-medium': BRAND_COLORS.GREEN_MEDIUM,
  '--color-brand-green-dark': BRAND_COLORS.GREEN_DARK,
} as const;

// Tailwind CSS Classes
export const BRAND_CLASSES = {
  // Buttons
  BUTTON_PRIMARY: 'bg-brand-primary hover:bg-brand-blue-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors',
  BUTTON_SECONDARY: 'bg-brand-secondary hover:bg-brand-green-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors',
  BUTTON_OUTLINE: 'border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors',
  
  // Text
  TEXT_PRIMARY: 'text-brand-primary',
  TEXT_SECONDARY: 'text-brand-secondary',
  TEXT_GRADIENT: 'bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent',
  
  // Backgrounds
  BG_GRADIENT_PRIMARY: 'bg-gradient-to-r from-brand-primary to-brand-secondary',
  BG_GRADIENT_SUBTLE: 'bg-gradient-to-r from-brand-blue-light to-brand-green-light',
  
  // Cards
  CARD: 'bg-white rounded-lg shadow-lg border border-gray-200',
  CARD_HOVER: 'bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow',
} as const;

// Animation Configurations
export const BRAND_ANIMATIONS = {
  TRANSITION: {
    FAST: 'transition-all duration-150 ease-out',
    NORMAL: 'transition-all duration-300 ease-out',
    SLOW: 'transition-all duration-500 ease-out',
  },
  BOUNCE: 'animate-bounce',
  PULSE: 'animate-pulse',
  SPIN: 'animate-spin',
} as const;
