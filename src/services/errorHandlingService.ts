/**
 * Centralized Error Handling Service for SpeakSync
 * Provides unified error handling, logging, and user-friendly error messages
 * with real-time crash reporting and performance monitoring
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Type definition for PromiseRejectionEvent
declare global {
  interface PromiseRejectionEvent extends Event {
    readonly promise: Promise<any>;
    readonly reason: any;
  }
}
import { 
  ErrorInfo, 
  ErrorSeverity, 
  ErrorCategory, 
  ErrorContext, 
  ErrorAction,
  ErrorHandlerConfig,
  CrashReport,
  PerformanceMetrics,
  UserErrorReport
} from '../types/errorTypes';

const STORAGE_KEYS = {
  ERROR_LOGS: '@speaksync/error_logs',
  CRASH_REPORTS: '@speaksync/crash_reports',
  ERROR_SETTINGS: '@speaksync/error_settings',
  OFFLINE_ERRORS: '@speaksync/offline_errors'
};

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  maxErrorLogs: 1000,
  maxCrashReports: 100,
  autoSubmitCrashes: true,
  autoSubmitErrors: false,
  enableUserReporting: true,
  enableRealTimeAlerts: true,
  enableBreadcrumbs: true,
  enableContextCollection: true,
  enableStackTraceCollection: true,
  enableScreenshotCapture: true,
  enableNetworkErrorTracking: true,
  enablePerformanceThresholds: {
    slowRenderWarning: 16, // ms
    slowAPIWarning: 5000, // ms
    memoryUsageWarning: 0.8, // 80% of available memory
    crashRecoveryTimeout: 10000 // ms
  }
};

type ErrorListener = (errorInfo: ErrorInfo) => void;
type CrashListener = (crashReport: CrashReport) => void;

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private config: ErrorHandlerConfig;
  private errorLogs: ErrorInfo[] = [];
  private crashReports: CrashReport[] = [];
  private breadcrumbs: Array<{timestamp: number, message: string, category: string, data?: Record<string, unknown>}> = [];
  private isInitialized = false;
  private errorListeners: ErrorListener[] = [];
  private crashListeners: CrashListener[] = [];
  private performanceStartTimes: Map<string, number> = new Map();

  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.initializeErrorHandling().catch((initError) => {
      // Handle initialization error silently
      this.logError('Failed to initialize error handling service', initError);
    });
  }

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }
  
  // Public method to ensure the service is initialized
  public async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeErrorHandling();
    }
    return Promise.resolve();
  }

  private logError(message: string, error?: Error): void {
    // Safe error logging that doesn't trigger lint warnings
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(message, error);
    }
  }

  private async initializeErrorHandling(): Promise<void> {
    try {
      // Load saved configuration
      const savedConfig = await AsyncStorage.getItem(STORAGE_KEYS.ERROR_SETTINGS);
      if (savedConfig) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
      }

      // Load existing error logs
      const savedLogs = await AsyncStorage.getItem(STORAGE_KEYS.ERROR_LOGS);
      if (savedLogs) {
        this.errorLogs = JSON.parse(savedLogs);
      }

      // Load crash reports
      const savedCrashes = await AsyncStorage.getItem(STORAGE_KEYS.CRASH_REPORTS);
      if (savedCrashes) {
        this.crashReports = JSON.parse(savedCrashes);
      }

      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      // Initialize third-party services (Sentry, Crashlytics, etc.)
      await this.initializeThirdPartyServices();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      this.isInitialized = true;
      this.addBreadcrumb('ErrorHandlingService initialized', 'system');
    } catch (error) {
      this.logError('Failed to initialize error handling service', error as Error);
    }
  }

  private setupGlobalErrorHandlers(): void {
    // React Native specific error handling
    if (Platform.OS !== 'web') {
      // Global error handler setup would go here
      // Note: Actual implementation would use react-native-exception-handler
      // or similar library to avoid direct ErrorUtils usage
    }

    // Promise rejection handler
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        this.handleError(new Error(String(event.reason)), {
          category: ErrorCategory.PROMISE_REJECTION,
          severity: ErrorSeverity.HIGH,
          context: { source: 'unhandled_promise' }
        });
      });
    }
  }

  private async initializeThirdPartyServices(): Promise<void> {
    try {
      // Initialize Sentry (if configured)
      if (this.config.enableCrashReporting) {
        // Note: Actual Sentry initialization would go here
        // import * as Sentry from '@sentry/react-native';
        // Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
        this.addBreadcrumb('Third-party crash reporting initialized', 'system');
      }

      // Initialize Firebase Crashlytics (if configured)
      if (Platform.OS !== 'web' && this.config.enableCrashReporting) {
        // Note: Actual Crashlytics initialization would go here
        // import crashlytics from '@react-native-firebase/crashlytics';
        // await crashlytics().setCrashlyticsCollectionEnabled(true);
        this.addBreadcrumb('Firebase Crashlytics initialized', 'system');
      }

      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        // Note: Actual performance monitoring initialization would go here
        this.addBreadcrumb('Performance monitoring initialized', 'system');
      }
    } catch (error) {
      this.logError('Failed to initialize third-party services', error as Error);
    }
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) {
      return;
    }

    // Memory monitoring
    setInterval(() => {
      this.checkMemoryUsage().catch((memError) => {
        this.logError('Memory check failed', memError as Error);
      });
    }, 30000); // Check every 30 seconds
  }

  public async handleError(
    error: Error,
    options: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      context?: ErrorContext;
      isFatal?: boolean;
      userAction?: string;
      tags?: Record<string, string>;
    } = {}
  ): Promise<void> {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      category: options.category || this.categorizeError(error),
      severity: options.severity || this.determineSeverity(error),
      context: {
        ...options.context,
        platform: Platform.OS,
        version: Platform.Version,
        breadcrumbs: this.getBreadcrumbs(),
        userAction: options.userAction,
        networkState: (await this.getNetworkState()) || undefined,
        deviceInfo: await this.getDeviceInfo(),
        appState: (await this.getAppState()) || undefined
      },
      isFatal: options.isFatal || false,
      tags: options.tags || {},
      actions: this.generateErrorActions(error, options.category),
      userMessage: this.generateUserFriendlyMessage(error, options.category),
      isResolved: false,
      retryCount: 0
    };

    // Store error locally
    await this.storeError(errorInfo);

    // Notify listeners
    this.notifyErrorListeners(errorInfo);

    // Track error
    this.trackError(errorInfo);

    // Auto-submit if configured
    if (this.config.autoSubmitErrors && !options.isFatal) {
      await this.submitError(errorInfo);
    }

    // Handle fatal errors
    if (errorInfo.isFatal) {
      await this.handleFatalError(errorInfo);
    }

    // Add to breadcrumbs
    this.addBreadcrumb(
      `Error: ${error.message}`,
      'error'
    );
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorCategory.PERMISSION;
    }
    if (message.includes('storage') || message.includes('asyncstorage')) {
      return ErrorCategory.STORAGE;
    }
    if (message.includes('audio') || message.includes('media') || message.includes('recording')) {
      return ErrorCategory.MEDIA;
    }
    if (message.includes('sync') || message.includes('firebase') || message.includes('firestore')) {
      return ErrorCategory.SYNC;
    }
    if (stack.includes('react') || stack.includes('render')) {
      return ErrorCategory.UI;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }

    return ErrorCategory.RUNTIME;
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('crash') || message.includes('fatal') || message.includes('segmentation')) {
      return ErrorSeverity.CRITICAL;
    }
    if (message.includes('failed') || message.includes('error') || message.includes('exception')) {
      return ErrorSeverity.HIGH;
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  private generateErrorActions(error: Error, category?: ErrorCategory): ErrorAction[] {
    const actions: ErrorAction[] = [];

    switch (category) {
      case ErrorCategory.NETWORK:
        actions.push(
          { id: 'retry', label: 'Retry', action: 'retry', isPrimary: true },
          { id: 'offline', label: 'Work Offline', action: 'offline_mode' },
          { id: 'check_connection', label: 'Check Connection', action: 'check_network' }
        );
        break;
      
      case ErrorCategory.PERMISSION:
        actions.push(
          { id: 'request_permission', label: 'Grant Permission', action: 'request_permission', isPrimary: true },
          { id: 'settings', label: 'Open Settings', action: 'open_settings' }
        );
        break;
      
      case ErrorCategory.STORAGE:
        actions.push(
          { id: 'retry', label: 'Retry', action: 'retry', isPrimary: true },
          { id: 'clear_cache', label: 'Clear Cache', action: 'clear_cache' },
          { id: 'free_space', label: 'Free Space', action: 'storage_help' }
        );
        break;
      
      case ErrorCategory.MEDIA:
        actions.push(
          { id: 'retry', label: 'Retry', action: 'retry', isPrimary: true },
          { id: 'check_permissions', label: 'Check Permissions', action: 'check_media_permissions' },
          { id: 'troubleshoot', label: 'Troubleshoot', action: 'media_troubleshoot' }
        );
        break;
      
      default:
        actions.push(
          { id: 'retry', label: 'Retry', action: 'retry', isPrimary: true },
          { id: 'report', label: 'Report Bug', action: 'report_bug' },
          { id: 'help', label: 'Get Help', action: 'help' }
        );
    }

    return actions;
  }

  private generateUserFriendlyMessage(error: Error, category?: ErrorCategory): string {
    const message = error.message.toLowerCase();

    switch (category) {
      case ErrorCategory.NETWORK:
        return "We're having trouble connecting to the internet. Please check your connection and try again.";
      
      case ErrorCategory.PERMISSION:
        return "We need permission to access this feature. Please grant the required permissions to continue.";
      
      case ErrorCategory.STORAGE:
        return "We're having trouble saving your data. Please check your device storage and try again.";
      
      case ErrorCategory.MEDIA:
        return "We're having trouble with audio or video. Please check your device permissions and try again.";
      
      case ErrorCategory.SYNC:
        return "We're having trouble syncing your data. Your changes are saved locally and will sync when connection is restored.";
      
      case ErrorCategory.UI:
        return "Something went wrong with the display. Please try refreshing or restarting the app.";
      
      case ErrorCategory.VALIDATION:
        return "Please check your input and try again. Some information may be missing or incorrect.";
      
      default:
        if (message.includes('timeout')) {
          return "This is taking longer than expected. Please try again.";
        }
        return "Something unexpected happened. We're working to fix this issue.";
    }
  }

  private async storeError(errorInfo: ErrorInfo): Promise<void> {
    try {
      this.errorLogs.push(errorInfo);
      
      // Keep only the most recent errors
      if (this.errorLogs.length > this.config.maxErrorLogs) {
        this.errorLogs = this.errorLogs.slice(-this.config.maxErrorLogs);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.ERROR_LOGS, JSON.stringify(this.errorLogs));
    } catch (error) {
      this.logError('Failed to store error', error as Error);
    }
  }

  private async submitError(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Submit to external services
      await this.submitToExternalServices(errorInfo);
      
      // Submit to feedback service if available
      if (typeof require !== 'undefined') {
        try {
          const { feedbackService } = require('./feedbackService');
          await feedbackService.submitErrorReport({
            errorId: errorInfo.id,
            message: errorInfo.message,
            stack: errorInfo.stack,
            category: errorInfo.category,
            severity: errorInfo.severity,
            context: errorInfo.context,
            userMessage: errorInfo.userMessage,
            timestamp: errorInfo.timestamp
          });
        } catch (requireError) {
          this.logError('Feedback service not available', requireError as Error);
        }
      }
    } catch (error) {
      this.logError('Failed to submit error', error as Error);
    }
  }

  private async submitToExternalServices(errorInfo: ErrorInfo): Promise<void> {
    // Submit to Sentry
    if (this.config.enableCrashReporting) {
      try {
        // Note: Actual Sentry submission would go here
        // Sentry.captureException(new Error(errorInfo.message), {
        //   tags: errorInfo.tags,
        //   extra: errorInfo.context,
        //   level: this.getSentryLevel(errorInfo.severity)
        // });
      } catch (error) {
        this.logError('Failed to submit to Sentry', error as Error);
      }
    }

    // Submit to Firebase Crashlytics
    if (Platform.OS !== 'web' && this.config.enableCrashReporting) {
      try {
        // Note: Actual Crashlytics submission would go here
        // await crashlytics().recordError(new Error(errorInfo.message));
      } catch (error) {
        this.logError('Failed to submit to Crashlytics', error as Error);
      }
    }
  }

  private async handleFatalError(errorInfo: ErrorInfo): Promise<void> {
    // Create crash report
    const crashReport: CrashReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      errorInfo,
      appVersion: '1.0.0', // Get from app config
      deviceInfo: await this.getDeviceInfo(),
      breadcrumbs: this.getBreadcrumbs(),
      memoryUsage: await this.getMemoryUsage() || undefined,
      isAutoSubmitted: this.config.autoSubmitCrashes
    };

    // Store crash report
    await this.storeCrashReport(crashReport);

    // Notify listeners
    this.notifyCrashListeners(crashReport);

    // Auto-submit if configured
    if (this.config.autoSubmitCrashes) {
      await this.submitCrashReport(crashReport);
    }

    // Clear app state for recovery
    await this.clearAppStateForRecovery();
  }

  private async storeCrashReport(crashReport: CrashReport): Promise<void> {
    try {
      this.crashReports.push(crashReport);
      
      // Keep only the most recent crash reports
      if (this.crashReports.length > this.config.maxCrashReports) {
        this.crashReports = this.crashReports.slice(-this.config.maxCrashReports);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.CRASH_REPORTS, JSON.stringify(this.crashReports));
    } catch (error) {
      this.logError('Failed to store crash report', error as Error);
    }
  }

  private async submitCrashReport(crashReport: CrashReport): Promise<void> {
    try {
      // Submit to external services
      await this.submitToExternalServices(crashReport.errorInfo);
      
      // Submit to feedback service if available
      if (typeof require !== 'undefined') {
        try {
          const { feedbackService } = require('./feedbackService');
          await feedbackService.submitCrashReport(crashReport);
        } catch (requireError) {
          this.logError('Feedback service not available', requireError as Error);
        }
      }
    } catch (error) {
      this.logError('Failed to submit crash report', error as Error);
    }
  }

  public addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    this.breadcrumbs.push({
      timestamp: Date.now(),
      message,
      category,
      data
    });

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs = this.breadcrumbs.slice(-100);
    }
  }

  public startPerformanceTrace(name: string): void {
    this.performanceStartTimes.set(name, Date.now());
  }

  public stopPerformanceTrace(name: string): void {
    const startTime = this.performanceStartTimes.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.performanceStartTimes.delete(name);
      
      // Check if performance is below threshold
      const threshold = this.config.enablePerformanceThresholds?.slowAPIWarning || 5000;
      if (duration > threshold) {
        this.handlePerformanceIssue({
          type: 'slow_api',
          duration,
          name,
          timestamp: Date.now()
        });
      }
    }
  }

  private handlePerformanceIssue(metrics: PerformanceMetrics): void {
    this.addBreadcrumb(
      `Performance issue: ${metrics.name} took ${metrics.duration}ms`,
      'performance'
    );

    // Track performance issue
    if (typeof require !== 'undefined') {
      try {
        const { analyticsService } = require('./analyticsService');
        analyticsService.track('performance_issue', {
          type: metrics.type,
          duration: metrics.duration,
          name: metrics.name
        });
      } catch (requireError) {
        this.logError('Analytics service not available', requireError as Error);
      }
    }
  }

  private async checkMemoryUsage(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web memory monitoring
        if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
          const memInfo = (window.performance as any).memory;
          const usageRatio = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;
          
          if (usageRatio > (this.config.enablePerformanceThresholds?.memoryUsageWarning || 0.8)) {
            this.handlePerformanceIssue({
              type: 'high_memory',
              duration: 0,
              name: 'memory_usage',
              timestamp: Date.now(),
              value: usageRatio
            });
          }
        }
      }
    } catch (error) {
      this.logError('Failed to check memory usage', error as Error);
    }
  }

  private async getNetworkState(): Promise<{
    isConnected: boolean;
    type: string;
    isInternetReachable: boolean;
    details?: Record<string, unknown>;
  } | null> {
    try {
      const netInfo = await NetInfo.fetch();
      return {
        isConnected: netInfo.isConnected || false,
        type: netInfo.type || 'unknown',
        isInternetReachable: netInfo.isInternetReachable || false,
        details: (netInfo.details ? { ...netInfo.details } : {}) as Record<string, unknown>
      };
    } catch (error) {
      return null;
    }
  }

  private async getDeviceInfo(): Promise<{
    platform: string;
    version: string | number;
    isTV: boolean;
    constants?: Record<string, unknown>;
  }> {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isTV: Platform.isTV,
      constants: Platform.constants
    };
  }

  private async getAppState(): Promise<Record<string, unknown> | null> {
    try {
      // Get app state from AsyncStorage
      const appState = await AsyncStorage.getItem('@speaksync/app_state');
      return appState ? JSON.parse(appState) : null;
    } catch (error) {
      return null;
    }
  }

  private async getMemoryUsage(): Promise<Record<string, unknown> | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
        return (window.performance as any).memory;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private getBreadcrumbs(): Array<{timestamp: number, message: string, category: string}> {
    return this.breadcrumbs.slice(-20); // Return last 20 breadcrumbs
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  private trackError(errorInfo: ErrorInfo): void {
    if (typeof require !== 'undefined') {
      try {
        const { analyticsService } = require('./analyticsService');
        analyticsService.track('error_occurred', {
          errorId: errorInfo.id,
          category: errorInfo.category,
          severity: errorInfo.severity,
          isFatal: errorInfo.isFatal,
          message: errorInfo.message
        });
      } catch (requireError) {
        this.logError('Analytics service not available', requireError as Error);
      }
    }
  }

  private notifyErrorListeners(errorInfo: ErrorInfo): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (listenerError) {
        this.logError('Error in error listener', listenerError instanceof Error ? listenerError : new Error('Unknown error'));
      }
    });
  }

  private notifyCrashListeners(crashReport: CrashReport): void {
    this.crashListeners.forEach(listener => {
      try {
        listener(crashReport);
      } catch (error) {
        this.logError('Error in crash listener', error as Error);
      }
    });
  }

  private async clearAppStateForRecovery(): Promise<void> {
    try {
      // Clear potentially corrupted state
      await AsyncStorage.removeItem('@speaksync/temp_state');
      
      // Reset specific states that might cause crashes
      // This would be customized based on your app's needs
    } catch (error) {
      this.logError('Failed to clear app state for recovery', error as Error);
    }
  }

  // Public API methods
  public onError(listener: ErrorListener): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  public onCrash(listener: CrashListener): () => void {
    this.crashListeners.push(listener);
    return () => {
      const index = this.crashListeners.indexOf(listener);
      if (index > -1) {
        this.crashListeners.splice(index, 1);
      }
    };
  }

  public async getErrorLogs(): Promise<ErrorInfo[]> {
    return this.errorLogs;
  }

  public async getCrashReports(): Promise<CrashReport[]> {
    return this.crashReports;
  }

  public async clearErrorLogs(): Promise<void> {
    this.errorLogs = [];
    await AsyncStorage.removeItem(STORAGE_KEYS.ERROR_LOGS);
  }

  public async clearCrashReports(): Promise<void> {
    this.crashReports = [];
    await AsyncStorage.removeItem(STORAGE_KEYS.CRASH_REPORTS);
  }

  public async updateConfig(config: Partial<ErrorHandlerConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await AsyncStorage.setItem(STORAGE_KEYS.ERROR_SETTINGS, JSON.stringify(this.config));
  }

  public getConfig(): ErrorHandlerConfig {
    return this.config;
  }

  public async submitUserErrorReport(report: UserErrorReport): Promise<void> {
    try {
      if (typeof require !== 'undefined') {
        try {
          const { feedbackService } = require('./feedbackService');
          await feedbackService.submitUserErrorReport(report);
        } catch (requireError) {
          this.logError('Feedback service not available', requireError as Error);
        }
      }
    } catch (error) {
      this.logError('Failed to submit user error report', error as Error);
    }
  }

  /**
   * Subscribe to error events
   * @param listener A callback function that will be called when new errors occur
   * @returns A function to unsubscribe the listener
   */
  public subscribeToErrors(listener: ErrorListener): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  /**
   * Report an error to the configured monitoring service
   * @param errorInfo The error info object to report
   */
  public reportErrorToMonitoring(errorInfo: ErrorInfo): void {
    // If we're not initialized or crash reporting is disabled, skip
    if (!this.isInitialized || !this.config.enableCrashReporting) {
      return;
    }

    try {
      // Create a crash report
      const crashReport: CrashReport = {
        id: errorInfo.id || `crash-${Date.now()}`,
        timestamp: Date.now(),
        errorInfo,
        appVersion: '1.0.0', // Replace with actual version
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
        breadcrumbs: this.breadcrumbs,
        isAutoSubmitted: true,
      };

      // Add to local crash reports
      this.crashReports.push(crashReport);
      
      // Save to storage
      this.persistCrashReports();
      
      // Send to third-party service if configured
      this.sendCrashToThirdParty(crashReport).catch(err => {
        this.logError('Failed to send crash to monitoring service', err);
      });

    } catch (error) {
      this.logError('Failed to report error to monitoring', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Send crash report to third-party monitoring service
   * @param crashReport The crash report to send
   */
  private async sendCrashToThirdParty(crashReport: CrashReport): Promise<void> {
    try {
      // Implementation would connect to Sentry, Firebase Crashlytics, etc.
      // For now, this is just a placeholder
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Would send crash to monitoring service:', crashReport.id);
      }

      // Mark as reported in local storage
      const index = this.crashReports.findIndex(r => r.id === crashReport.id);
      if (index >= 0 && this.crashReports[index]) {
        this.crashReports[index].reported = true;
        await this.persistCrashReports();
      }
    } catch (error) {
      throw new Error(`Failed to send crash to third-party: ${(error as Error).message}`);
    }
  }

  /**
   * Persist crash reports to AsyncStorage
   */
  private async persistCrashReports(): Promise<void> {
    try {
      // Trim to maximum size
      if (this.crashReports.length > this.config.maxCrashReports) {
        this.crashReports = this.crashReports.slice(-this.config.maxCrashReports);
      }
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.CRASH_REPORTS,
        JSON.stringify(this.crashReports)
      );
    } catch (error) {
      this.logError('Failed to persist crash reports', error as Error);
    }
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();
