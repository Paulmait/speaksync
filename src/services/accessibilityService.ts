/**
 * Accessibility Service for SpeakSync
 * Provides comprehensive accessibility features and WCAG 2.2 compliance
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';
import { 
  AccessibilitySettings, 
  AccessibilityAuditResult, 
  AccessibilityIssue,
  AccessibilityAction,
  HighContrastSettings,
  TextScalingSettings,
  KeyboardNavigationSettings,
  ScreenReaderSettings,
  ColorSettings
} from '../types/accessibilityTypes';
import { ErrorCategory, ErrorSeverity } from '../types/errorTypes';
import { errorHandlingService } from './errorHandlingService';

const STORAGE_KEYS = {
  ACCESSIBILITY_SETTINGS: '@speaksync/accessibility_settings',
  ACCESSIBILITY_AUDIT: '@speaksync/accessibility_audit',
  USER_PREFERENCES: '@speaksync/accessibility_preferences'
};

const DEFAULT_SETTINGS: AccessibilitySettings = {
  enableHighContrast: false,
  enableDynamicTextScaling: true,
  enableScreenReader: false,
  enableKeyboardNavigation: true,
  enableFocusIndicators: true,
  enableReducedMotion: false,
  enableVoiceAnnouncements: true,
  textScaling: {
    scale: 1.0,
    minScale: 0.8,
    maxScale: 2.0,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  highContrast: {
    backgroundColor: '#000000',
    textColor: '#ffffff',
    linkColor: '#87ceeb',
    buttonColor: '#ffff00',
    borderColor: '#ffffff',
    errorColor: '#ff6b6b',
    successColor: '#51cf66',
    warningColor: '#ffd43b'
  },
  colors: {
    primary: '#2196f3',
    secondary: '#ff9800',
    accent: '#4caf50',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#212121',
    disabled: '#bdbdbd',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)'
  },
  screenReader: {
    enableHints: true,
    enableRoleDescriptions: true,
    enableValueDescriptions: true,
    enableLiveRegions: true,
    announcementDelay: 100,
    readingSpeed: 1.0
  },
  keyboardNavigation: {
    enableTabNavigation: true,
    enableArrowKeyNavigation: true,
    enableEscapeKey: true,
    enableEnterKey: true,
    focusRingColor: '#2196f3',
    focusRingWidth: 2,
    skipToContent: true
  },
  touchTargets: {
    minimumSize: 44,
    spacing: 8,
    padding: 12
  },
  animations: {
    enableAnimations: true,
    enableTransitions: true,
    duration: 300,
    easing: 'ease-in-out'
  },
  voiceControl: {
    enableVoiceCommands: false,
    enableVoiceNavigation: false,
    commandTimeout: 3000,
    confidenceThreshold: 0.8
  }
};

export class AccessibilityService {
  private static instance: AccessibilityService;
  private settings: AccessibilitySettings;
  private auditResults: AccessibilityAuditResult[] = [];
  private isInitialized = false;
  private settingsListeners: Array<(settings: AccessibilitySettings) => void> = [];
  private screenReaderEnabled = false;
  private reducedMotionEnabled = false;

  private constructor() {
    this.settings = DEFAULT_SETTINGS;
    this.initializeAccessibility().catch((error) => {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.ACCESSIBILITY,
        severity: ErrorSeverity.HIGH,
        context: { source: 'accessibility_service_init' }
      });
    });
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  private async initializeAccessibility(): Promise<void> {
    try {
      // Load saved settings
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.ACCESSIBILITY_SETTINGS);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }

      // Check system accessibility settings
      await this.checkSystemAccessibilitySettings();

      // Set up accessibility listeners
      this.setupAccessibilityListeners();

      // Apply initial settings
      await this.applySettings(this.settings);

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize accessibility service: ${(error as Error).message}`);
    }
  }

  private async checkSystemAccessibilitySettings(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        // Check if screen reader is enabled
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        this.screenReaderEnabled = screenReaderEnabled;
        
        // Check if reduced motion is enabled
        const reducedMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        this.reducedMotionEnabled = reducedMotionEnabled;

        // Update settings based on system preferences
        if (screenReaderEnabled) {
          this.settings.enableScreenReader = true;
          this.settings.enableVoiceAnnouncements = true;
        }

        if (reducedMotionEnabled) {
          this.settings.enableReducedMotion = true;
          this.settings.animations.enableAnimations = false;
          this.settings.animations.enableTransitions = false;
        }
      }
    } catch (error) {
      // Handle gracefully - system accessibility checks might fail
      console.warn('Could not check system accessibility settings:', error);
    }
  }

  private setupAccessibilityListeners(): void {
    if (Platform.OS !== 'web') {
      // Listen for screen reader changes
      const screenReaderChangeListener = (isEnabled: boolean) => {
        this.screenReaderEnabled = isEnabled;
        this.updateSettings({
          enableScreenReader: isEnabled,
          enableVoiceAnnouncements: isEnabled
        });
      };

      // Listen for reduced motion changes
      const reducedMotionChangeListener = (isEnabled: boolean) => {
        this.reducedMotionEnabled = isEnabled;
        this.updateSettings({
          enableReducedMotion: isEnabled,
          animations: {
            ...this.settings.animations,
            enableAnimations: !isEnabled,
            enableTransitions: !isEnabled
          }
        });
      };

      AccessibilityInfo.addEventListener('screenReaderChanged', screenReaderChangeListener);
      AccessibilityInfo.addEventListener('reduceMotionChanged', reducedMotionChangeListener);
    }
  }

  public async updateSettings(partialSettings: Partial<AccessibilitySettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...partialSettings };
      await this.saveSettings();
      await this.applySettings(this.settings);
      this.notifySettingsListeners();
    } catch (error) {
      throw new Error(`Failed to update accessibility settings: ${(error as Error).message}`);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESSIBILITY_SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      throw new Error(`Failed to save accessibility settings: ${(error as Error).message}`);
    }
  }

  private async applySettings(settings: AccessibilitySettings): Promise<void> {
    try {
      // Apply high contrast mode
      if (settings.enableHighContrast) {
        await this.applyHighContrastMode(settings.highContrast);
      }

      // Apply text scaling
      if (settings.enableDynamicTextScaling) {
        await this.applyTextScaling(settings.textScaling);
      }

      // Apply keyboard navigation
      if (settings.enableKeyboardNavigation) {
        await this.applyKeyboardNavigation(settings.keyboardNavigation);
      }

      // Apply screen reader settings
      if (settings.enableScreenReader) {
        await this.applyScreenReaderSettings(settings.screenReader);
      }

      // Apply color settings
      await this.applyColorSettings(settings.colors);

      // Apply animation settings
      await this.applyAnimationSettings(settings.animations);
    } catch (error) {
      throw new Error(`Failed to apply accessibility settings: ${(error as Error).message}`);
    }
  }

  private async applyHighContrastMode(highContrast: HighContrastSettings): Promise<void> {
    // Apply high contrast colors to the app
    // This would typically involve updating the theme provider
    if (Platform.OS === 'web') {
      document.documentElement.style.setProperty('--high-contrast-bg', highContrast.backgroundColor);
      document.documentElement.style.setProperty('--high-contrast-text', highContrast.textColor);
      document.documentElement.style.setProperty('--high-contrast-link', highContrast.linkColor);
      document.documentElement.style.setProperty('--high-contrast-button', highContrast.buttonColor);
      document.documentElement.style.setProperty('--high-contrast-border', highContrast.borderColor);
      document.documentElement.style.setProperty('--high-contrast-error', highContrast.errorColor);
      document.documentElement.style.setProperty('--high-contrast-success', highContrast.successColor);
      document.documentElement.style.setProperty('--high-contrast-warning', highContrast.warningColor);
    }
  }

  private async applyTextScaling(textScaling: TextScalingSettings): Promise<void> {
    // Apply text scaling
    if (Platform.OS === 'web') {
      document.documentElement.style.setProperty('--text-scale', textScaling.scale.toString());
      document.documentElement.style.setProperty('--line-height', textScaling.lineHeight.toString());
      document.documentElement.style.setProperty('--letter-spacing', `${textScaling.letterSpacing}px`);
    }
  }

  private async applyKeyboardNavigation(keyboardNav: KeyboardNavigationSettings): Promise<void> {
    // Apply keyboard navigation settings
    if (Platform.OS === 'web') {
      document.documentElement.style.setProperty('--focus-ring-color', keyboardNav.focusRingColor);
      document.documentElement.style.setProperty('--focus-ring-width', `${keyboardNav.focusRingWidth}px`);
      
      // Add keyboard navigation styles
      const style = document.createElement('style');
      style.textContent = `
        *:focus-visible {
          outline: ${keyboardNav.focusRingWidth}px solid ${keyboardNav.focusRingColor};
          outline-offset: 2px;
        }
        
        .keyboard-navigation-active *:focus {
          outline: ${keyboardNav.focusRingWidth}px solid ${keyboardNav.focusRingColor};
          outline-offset: 2px;
        }
        
        .skip-to-content {
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
        
        .skip-to-content:focus {
          position: static;
          width: auto;
          height: auto;
          padding: 8px;
          background: ${keyboardNav.focusRingColor};
          color: white;
          text-decoration: none;
          border-radius: 4px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private async applyScreenReaderSettings(screenReader: ScreenReaderSettings): Promise<void> {
    // Apply screen reader settings
    if (Platform.OS === 'web') {
      // Set ARIA live regions
      if (screenReader.enableLiveRegions) {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'accessibility-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        document.body.appendChild(liveRegion);
      }
    }
  }

  private async applyColorSettings(colors: ColorSettings): Promise<void> {
    // Apply color settings
    if (Platform.OS === 'web') {
      document.documentElement.style.setProperty('--color-primary', colors.primary);
      document.documentElement.style.setProperty('--color-secondary', colors.secondary);
      document.documentElement.style.setProperty('--color-accent', colors.accent);
      document.documentElement.style.setProperty('--color-background', colors.background);
      document.documentElement.style.setProperty('--color-surface', colors.surface);
      document.documentElement.style.setProperty('--color-text', colors.text);
      document.documentElement.style.setProperty('--color-disabled', colors.disabled);
      document.documentElement.style.setProperty('--color-placeholder', colors.placeholder);
      document.documentElement.style.setProperty('--color-backdrop', colors.backdrop);
    }
  }

  private async applyAnimationSettings(animations: any): Promise<void> {
    // Apply animation settings
    if (Platform.OS === 'web') {
      if (!animations.enableAnimations) {
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }

  public async auditAccessibility(component: any): Promise<AccessibilityAuditResult> {
    const issues: AccessibilityIssue[] = [];
    const actions: AccessibilityAction[] = [];

    try {
      // Check for missing accessibility labels
      if (!component.accessibilityLabel && !component.accessibilityHint) {
        issues.push({
          type: 'missing_label',
          severity: 'high',
          element: component.displayName || 'Unknown',
          message: 'Interactive element is missing accessibility label',
          wcagCriterion: '4.1.2',
          wcagLevel: 'A',
          recommendation: 'Add accessibilityLabel or accessibilityHint prop'
        });
        
        actions.push({
          type: 'fix',
          description: 'Add accessibility label',
          autoFixable: false,
          code: `accessibilityLabel="Describe what this element does"`
        });
      }

      // Check for low contrast (simplified check)
      if (component.style?.color && component.style?.backgroundColor) {
        const contrastRatio = this.calculateContrastRatio(component.style.color, component.style.backgroundColor);
        if (contrastRatio < 4.5) {
          issues.push({
            type: 'low_contrast',
            severity: 'high',
            element: component.displayName || 'Unknown',
            message: `Color contrast ratio (${contrastRatio.toFixed(2)}) does not meet WCAG AA standards`,
            wcagCriterion: '1.4.3',
            wcagLevel: 'AA',
            recommendation: 'Increase color contrast to at least 4.5:1'
          });
          
          actions.push({
            type: 'fix',
            description: 'Improve color contrast',
            autoFixable: true,
            code: `// Suggested high contrast colors\ncolor: '${this.settings.highContrast.textColor}'\nbackgroundColor: '${this.settings.highContrast.backgroundColor}'`
          });
        }
      }

      // Check for small touch targets
      if (component.style?.width && component.style?.height) {
        const width = parseInt(component.style.width);
        const height = parseInt(component.style.height);
        if (width < this.settings.touchTargets.minimumSize || height < this.settings.touchTargets.minimumSize) {
          issues.push({
            type: 'small_touch_target',
            severity: 'medium',
            element: component.displayName || 'Unknown',
            message: `Touch target size (${width}x${height}) is smaller than recommended minimum (${this.settings.touchTargets.minimumSize}x${this.settings.touchTargets.minimumSize})`,
            wcagCriterion: '2.5.5',
            wcagLevel: 'AAA',
            recommendation: `Increase touch target size to at least ${this.settings.touchTargets.minimumSize}x${this.settings.touchTargets.minimumSize} pixels`
          });
          
          actions.push({
            type: 'fix',
            description: 'Increase touch target size',
            autoFixable: true,
            code: `minWidth: ${this.settings.touchTargets.minimumSize}\nminHeight: ${this.settings.touchTargets.minimumSize}\npadding: ${this.settings.touchTargets.padding}`
          });
        }
      }

      const result: AccessibilityAuditResult = {
        id: this.generateAuditId(),
        timestamp: Date.now(),
        component: component.displayName || 'Unknown',
        issues,
        actions,
        score: this.calculateAccessibilityScore(issues),
        passed: issues.length === 0,
        wcagLevel: this.determineWCAGLevel(issues)
      };

      this.auditResults.push(result);
      await this.saveAuditResults();

      return result;
    } catch (error) {
      throw new Error(`Failed to audit accessibility: ${(error as Error).message}`);
    }
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd use a proper color contrast library
    return 4.5; // Placeholder
  }

  private calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
    let score = 100;
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    return Math.max(0, score);
  }

  private determineWCAGLevel(issues: AccessibilityIssue[]): 'A' | 'AA' | 'AAA' {
    const hasAAAIssues = issues.some(issue => issue.wcagLevel === 'AAA');
    const hasAAIssues = issues.some(issue => issue.wcagLevel === 'AA');
    const hasAIssues = issues.some(issue => issue.wcagLevel === 'A');

    if (hasAIssues) return 'A';
    if (hasAAIssues) return 'AA';
    if (hasAAAIssues) return 'AAA';
    return 'AAA';
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveAuditResults(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESSIBILITY_AUDIT, JSON.stringify(this.auditResults));
    } catch (error) {
      throw new Error(`Failed to save audit results: ${(error as Error).message}`);
    }
  }

  public announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    try {
      if (Platform.OS === 'web') {
        const liveRegion = document.getElementById('accessibility-live-region');
        if (liveRegion) {
          liveRegion.setAttribute('aria-live', priority);
          liveRegion.textContent = message;
          
          // Clear after announcement
          setTimeout(() => {
            liveRegion.textContent = '';
          }, this.settings.screenReader.announcementDelay);
        }
      } else {
        // For React Native, use AccessibilityInfo
        AccessibilityInfo.announceForAccessibility(message);
      }
    } catch (error) {
      console.warn('Failed to announce to screen reader:', error);
    }
  }

  public focusElement(elementId: string): void {
    try {
      if (Platform.OS === 'web') {
        const element = document.getElementById(elementId);
        if (element) {
          element.focus();
        }
      }
    } catch (error) {
      console.warn('Failed to focus element:', error);
    }
  }

  public getSettings(): AccessibilitySettings {
    return this.settings;
  }

  public isScreenReaderEnabled(): boolean {
    return this.screenReaderEnabled;
  }

  public isReducedMotionEnabled(): boolean {
    return this.reducedMotionEnabled;
  }

  public async getAuditResults(): Promise<AccessibilityAuditResult[]> {
    return this.auditResults;
  }

  public async clearAuditResults(): Promise<void> {
    this.auditResults = [];
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESSIBILITY_AUDIT);
  }

  public onSettingsChange(listener: (settings: AccessibilitySettings) => void): () => void {
    this.settingsListeners.push(listener);
    return () => {
      const index = this.settingsListeners.indexOf(listener);
      if (index > -1) {
        this.settingsListeners.splice(index, 1);
      }
    };
  }

  private notifySettingsListeners(): void {
    this.settingsListeners.forEach(listener => {
      try {
        listener(this.settings);
      } catch (error) {
        console.warn('Error in accessibility settings listener:', error);
      }
    });
  }

  public async resetToDefaults(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings();
    await this.applySettings(this.settings);
    this.notifySettingsListeners();
  }
}

export const accessibilityService = AccessibilityService.getInstance();
