import type { Config } from 'tailwindcss';
import { BRAND_COLORS } from './src/constants/branding';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        'brand-primary': BRAND_COLORS.PRIMARY_BLUE,
        'brand-secondary': BRAND_COLORS.SECONDARY_GREEN,
        'brand-blue-light': BRAND_COLORS.BLUE_LIGHT,
        'brand-blue-medium': BRAND_COLORS.BLUE_MEDIUM,
        'brand-blue-dark': BRAND_COLORS.BLUE_DARK,
        'brand-green-light': BRAND_COLORS.GREEN_LIGHT,
        'brand-green-medium': BRAND_COLORS.GREEN_MEDIUM,
        'brand-green-dark': BRAND_COLORS.GREEN_DARK,
        
        // Override default blue and green with brand colors
        blue: {
          50: BRAND_COLORS.BLUE_LIGHT,
          100: '#E3EDFF',
          200: '#C7DBFF',
          300: '#ABC9FF',
          400: '#8FB7FF',
          500: BRAND_COLORS.PRIMARY_BLUE,
          600: BRAND_COLORS.BLUE_DARK,
          700: '#1F3FBF',
          800: '#0F1F9F',
          900: '#0A177F',
        },
        green: {
          50: BRAND_COLORS.GREEN_LIGHT,
          100: '#E8F5E0',
          200: '#D1EBC1',
          300: '#BAE1A2',
          400: '#A3D783',
          500: BRAND_COLORS.SECONDARY_GREEN,
          600: BRAND_COLORS.GREEN_DARK,
          700: '#4F8A2C',
          800: '#3F6A1C',
          900: '#2F4A0C',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-brand': `linear-gradient(135deg, ${BRAND_COLORS.PRIMARY_BLUE} 0%, ${BRAND_COLORS.SECONDARY_GREEN} 100%)`,
        'gradient-subtle': `linear-gradient(135deg, ${BRAND_COLORS.BLUE_LIGHT} 0%, ${BRAND_COLORS.GREEN_LIGHT} 100%)`,
      },
    },
  },
  plugins: [],
};

export default config;
