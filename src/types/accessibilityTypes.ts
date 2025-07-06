/**
 * Accessibility type definitions for SpeakSync
 */

export interface AccessibilitySettings {
  enableHighContrast: boolean;
  enableDynamicTextScaling: boolean;
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableFocusIndicators: boolean;
  enableReducedMotion: boolean;
  enableVoiceAnnouncements: boolean;
  textScaling: TextScalingSettings;
  highContrast: HighContrastSettings;
  colors: ColorSettings;
  screenReader: ScreenReaderSettings;
  keyboardNavigation: KeyboardNavigationSettings;
  touchTargets: TouchTargetSettings;
  animations: AnimationSettings;
  voiceControl: VoiceControlSettings;
}

export interface TextScalingSettings {
  scale: number;
  minScale: number;
  maxScale: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface HighContrastSettings {
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  buttonColor: string;
  borderColor: string;
  errorColor: string;
  successColor: string;
  warningColor: string;
}

export interface ColorSettings {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  disabled: string;
  placeholder: string;
  backdrop: string;
}

export interface ScreenReaderSettings {
  enableHints: boolean;
  enableRoleDescriptions: boolean;
  enableValueDescriptions: boolean;
  enableLiveRegions: boolean;
  announcementDelay: number;
  readingSpeed: number;
}

export interface KeyboardNavigationSettings {
  enableTabNavigation: boolean;
  enableArrowKeyNavigation: boolean;
  enableEscapeKey: boolean;
  enableEnterKey: boolean;
  focusRingColor: string;
  focusRingWidth: number;
  skipToContent: boolean;
}

export interface TouchTargetSettings {
  minimumSize: number;
  spacing: number;
  padding: number;
}

export interface AnimationSettings {
  enableAnimations: boolean;
  enableTransitions: boolean;
  duration: number;
  easing: string;
}

export interface VoiceControlSettings {
  enableVoiceCommands: boolean;
  enableVoiceNavigation: boolean;
  commandTimeout: number;
  confidenceThreshold: number;
}

export interface AccessibilityAuditResult {
  id: string;
  timestamp: number;
  component: string;
  issues: AccessibilityIssue[];
  actions: AccessibilityAction[];
  score: number;
  passed: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityIssue {
  type: 'missing_label' | 'low_contrast' | 'small_touch_target' | 'keyboard_trap' | 'focus_issue' | 'heading_structure' | 'alt_text' | 'form_validation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  element: string;
  message: string;
  wcagCriterion: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  recommendation: string;
  xpath?: string;
  selector?: string;
}

export interface AccessibilityAction {
  type: 'fix' | 'enhance' | 'review';
  description: string;
  autoFixable: boolean;
  code?: string;
  documentation?: string;
}

export interface AccessibilityComponent {
  id: string;
  type: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: Array<{
    name: string;
    label: string;
  }>;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityElementsHidden?: boolean;
  accessibilityViewIsModal?: boolean;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  accessibilityIgnoresInvertColors?: boolean;
}

export interface AccessibilityAnnouncement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
  component?: string;
  context?: Record<string, unknown>;
}

export interface AccessibilityNavigation {
  currentFocus: string | null;
  focusHistory: string[];
  navigationMode: 'touch' | 'keyboard' | 'voice' | 'switch';
  shortcuts: Record<string, string>;
  landmarks: Array<{
    id: string;
    label: string;
    type: 'navigation' | 'main' | 'banner' | 'contentinfo' | 'search' | 'complementary';
  }>;
}

export interface AccessibilityPreferences {
  preferredNavigationMode: 'touch' | 'keyboard' | 'voice' | 'switch';
  preferredAnnouncementStyle: 'brief' | 'detailed' | 'minimal';
  preferredColorScheme: 'light' | 'dark' | 'high-contrast' | 'custom';
  preferredTextSize: 'small' | 'medium' | 'large' | 'extra-large';
  preferredAnimationSpeed: 'slow' | 'normal' | 'fast' | 'none';
  enableHapticFeedback: boolean;
  enableAudioFeedback: boolean;
  enableVisualFeedback: boolean;
}

export interface AccessibilityTestCase {
  id: string;
  name: string;
  description: string;
  component: string;
  testType: 'automated' | 'manual' | 'user-testing';
  wcagCriteria: string[];
  steps: Array<{
    action: string;
    expectedResult: string;
    actualResult?: string;
    passed?: boolean;
  }>;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  lastRun?: number;
  evidence?: Array<{
    type: 'screenshot' | 'video' | 'audio' | 'log';
    data: string;
    timestamp: number;
  }>;
}

export interface AccessibilityReport {
  id: string;
  timestamp: number;
  appVersion: string;
  testResults: AccessibilityTestCase[];
  auditResults: AccessibilityAuditResult[];
  compliance: {
    levelA: {
      total: number;
      passed: number;
      failed: number;
      score: number;
    };
    levelAA: {
      total: number;
      passed: number;
      failed: number;
      score: number;
    };
    levelAAA: {
      total: number;
      passed: number;
      failed: number;
      score: number;
    };
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    issue: string;
    solution: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }>;
}

export interface AccessibilityMetrics {
  totalComponents: number;
  accessibleComponents: number;
  componentsWithLabels: number;
  componentsWithHints: number;
  componentsWithRoles: number;
  touchTargetsCompliant: number;
  colorContrastCompliant: number;
  keyboardNavigable: number;
  screenReaderFriendly: number;
  overallScore: number;
  wcagComplianceLevel: 'A' | 'AA' | 'AAA' | 'none';
}
