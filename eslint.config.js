import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import security from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  {
    ignores: [
      'src/services/speechRecognitionService.ts',
      'src/services/errorHandlingService.ts',
      'src/services/monitoringService.ts',
      'src/services/aiEthicsService.ts',
      'src/services/onboardingService.ts',
      'src/services/adaptiveScrollService.ts',
      'src/components/onboarding/OnboardingProvider.tsx',
      'src/components/accessibility/AccessibilityProvider.tsx',
      'src/types/external-modules.d.ts',
      'e2e/**',
      'speaksync-web/**',
      '**/*.d.ts'
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        __DEV__: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        self: 'readonly',
        chrome: 'readonly',
        NodeJS: 'readonly',
        RequestInit: 'readonly',
        Response: 'readonly',
        IntersectionObserver: 'readonly',
        IntersectionObserverEntry: 'readonly',
        MutationObserver: 'readonly',
        Worker: 'readonly',
        AudioContext: 'readonly',
        AudioBuffer: 'readonly',
        PerformanceObserver: 'readonly',
        HTMLInputElement: 'readonly',
        SVGSVGElement: 'readonly',
        ErrorUtils: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      'security': security
    },
    rules: {
      // Security rules
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
      
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // React specific
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General best practices
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': 'error',
      'curly': 'error'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      '*.d.ts',
      'metro.config.js',
      'babel.config.js',
      'eslint.config.js'
    ]
  }
];
