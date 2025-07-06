/**
 * Type definitions for error handling and monitoring
 */

export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum ErrorCategory {
  RUNTIME = 'runtime',
  NETWORK = 'network',
  PERMISSION = 'permission',
  STORAGE = 'storage',
  MEDIA = 'media',
  SYNC = 'sync',
  UI = 'ui',
  VALIDATION = 'validation',
  PROMISE_REJECTION = 'promise_rejection',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  ACCESSIBILITY = 'accessibility',
  AI_ETHICS = 'ai_ethics',
  SPEECH_RECOGNITION = 'speech_recognition',
  AUDIO = 'audio',
  SERVICE = 'service',
  SUBSCRIPTION = 'subscription'
}

export interface ErrorContext {
  platform?: string;
  version?: string | number;
  userAgent?: string;
  url?: string;
  breadcrumbs?: Array<{
    timestamp: number;
    message: string;
    category: string;
    data?: Record<string, unknown>;
  }>;
  userAction?: string;
  networkState?: {
    isConnected: boolean;
    type: string;
    isInternetReachable: boolean;
    details?: Record<string, unknown>;
  };
  deviceInfo?: {
    platform: string;
    version: string | number;
    isTV: boolean;
    constants?: Record<string, unknown>;
  };
  appState?: Record<string, unknown>;
  source?: string;
  rejectionId?: number;
  [key: string]: unknown;
}

export interface ErrorAction {
  id: string;
  label: string;
  action: string;
  isPrimary?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}

export interface ErrorInfo {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  isFatal: boolean;
  tags: Record<string, string>;
  actions: ErrorAction[];
  userMessage: string;
  isResolved: boolean;
  retryCount: number;
  userId?: string;
  sessionId?: string;
}

export interface CrashReport {
  id: string;
  timestamp: number;
  errorInfo: ErrorInfo;
  appVersion: string;
  deviceInfo: Record<string, unknown>;
  breadcrumbs: Array<{
    timestamp: number;
    message: string;
    category: string;
    data?: Record<string, unknown>;
  }>;
  memoryUsage?: Record<string, unknown>;
  reported?: boolean;
  isAutoSubmitted: boolean;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceMetrics {
  type: string;
  duration: number;
  name: string;
  timestamp: number;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface UserErrorReport {
  errorId?: string;
  userDescription: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  attachments?: Array<{
    type: string;
    data: string;
    filename: string;
  }>;
  contactInfo?: {
    email?: string;
    allowFollowUp: boolean;
  };
}

export interface ErrorHandlerConfig {
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  maxErrorLogs: number;
  maxCrashReports: number;
  autoSubmitCrashes: boolean;
  autoSubmitErrors: boolean;
  enableUserReporting: boolean;
  enableRealTimeAlerts: boolean;
  enableBreadcrumbs: boolean;
  enableContextCollection: boolean;
  enableStackTraceCollection: boolean;
  enableScreenshotCapture: boolean;
  enableNetworkErrorTracking: boolean;
  enablePerformanceThresholds?: {
    slowRenderWarning: number;
    slowAPIWarning: number;
    memoryUsageWarning: number;
    crashRecoveryTimeout: number;
  };
  thirdPartyServices?: {
    sentry?: {
      dsn: string;
      environment: string;
      enabled: boolean;
    };
    crashlytics?: {
      enabled: boolean;
    };
    datadog?: {
      applicationId: string;
      clientToken: string;
      enabled: boolean;
    };
  };
}

export interface ErrorRecoveryOptions {
  retryable: boolean;
  maxRetries: number;
  retryDelay: number;
  fallbackAction?: string;
  clearState?: boolean;
  resetToSafeState?: boolean;
}

export interface ErrorNotification {
  id: string;
  title: string;
  message: string;
  severity: ErrorSeverity;
  actions: ErrorAction[];
  autoHide?: boolean;
  duration?: number;
  persistent?: boolean;
}

export interface ErrorAnalytics {
  errorId: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  frequency: number;
  firstOccurrence: number;
  lastOccurrence: number;
  affectedUsers: number;
  resolutionRate: number;
  averageResolutionTime: number;
}

export interface ErrorPattern {
  id: string;
  pattern: string;
  category: ErrorCategory;
  confidence: number;
  suggestedAction: string;
  preventionTips: string[];
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  fallbackComponent?: React.ComponentType<Record<string, unknown>>;
  retryCount: number;
  maxRetries: number;
}

export interface PerformanceThresholds {
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  bundleSize: number;
  startupTime: number;
}

export interface AccessibilityErrorInfo extends ErrorInfo {
  accessibilityIssue: {
    type: 'missing_label' | 'low_contrast' | 'small_touch_target' | 'keyboard_trap' | 'focus_issue';
    element?: string;
    recommendation: string;
    wcagLevel: 'A' | 'AA' | 'AAA';
    wcagCriterion: string;
  };
}
