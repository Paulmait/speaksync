/**
 * Crash Reporting and Performance Monitoring Service
 * Integrates with Sentry, Crashlytics, Firebase Performance, and Datadog RUM
 */

import { Platform } from 'react-native';
import { ErrorHandlingService } from './errorHandlingService';
import { ErrorCategory, ErrorSeverity } from '../types/errorTypes';
import { 
  CrashReport, 
  PerformanceMetric, 
  MonitoringConfig, 
  CrashReportingProvider 
} from '../types/monitoringTypes';

export class MonitoringService {
  private static instance: MonitoringService;
  private errorHandler: ErrorHandlingService;
  private providers: Map<string, any> = new Map(); // eslint-disable-line @typescript-eslint/no-explicit-any
  private config: MonitoringConfig;
  private isInitialized = false;

  private constructor() {
    this.errorHandler = ErrorHandlingService.getInstance();
    this.config = {
      enableCrashReporting: true,
      enablePerformanceMonitoring: true,
      enableRealUserMonitoring: true,
      enableSessionReplay: false,
      sampleRate: 0.1,
      environment: 'production',
      providers: {
        sentry: {
          enabled: true,
          dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
          options: {
            debug: __DEV__,
            enableAutoSessionTracking: true,
            enableOutOfMemoryTracking: true,
            enableWatchdogTerminationTracking: true,
            attachStacktrace: true,
            enableCaptureFailedRequests: true,
          }
        },
        crashlytics: {
          enabled: Platform.OS !== 'web',
          options: {
            enableInDevMode: false,
            recordPreviousLog: true,
          }
        },
        firebasePerformance: {
          enabled: true,
          options: {
            enableAutoScreenTracking: true,
            enableAutoNetworkTracking: true,
            enableCustomTraces: true,
          }
        },
        datadog: {
          enabled: false, // Enable when configured
          clientToken: process.env.EXPO_PUBLIC_DATADOG_CLIENT_TOKEN || '',
          applicationId: process.env.EXPO_PUBLIC_DATADOG_APPLICATION_ID || '',
          options: {
            site: 'US1',
            trackingConsent: 'granted',
            enableXRayTracing: true,
            enableCrashReporting: true,
            enableViewTracking: true,
            enableResourceTracking: true,
            enableActionTracking: true,
            enableErrorTracking: true,
          }
        }
      }
    };
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Sentry
      if (this.config.providers.sentry.enabled) {
        await this.initializeSentry();
      }

      // Initialize Crashlytics
      if (this.config.providers.crashlytics.enabled && Platform.OS !== 'web') {
        await this.initializeCrashlytics();
      }

      // Initialize Firebase Performance
      if (this.config.providers.firebasePerformance.enabled) {
        await this.initializeFirebasePerformance();
      }

      // Initialize Datadog RUM
      if (this.config.providers.datadog.enabled) {
        await this.initializeDatadog();
      }

      this.isInitialized = true;
      this.logInfo('Monitoring services initialized successfully');
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.SERVICE,
        severity: ErrorSeverity.HIGH,
        context: { 
          component: 'MonitoringService', 
          method: 'initialize',
          message: 'Monitoring initialization failed'
        }
      });
    }
  }

  private async initializeSentry(): Promise<void> {
    try {
      const Sentry = await import('@sentry/react-native');
      
      Sentry.init({
        dsn: this.config.providers.sentry.dsn,
        debug: this.config.providers.sentry.options.debug,
        environment: this.config.environment,
        sampleRate: this.config.sampleRate,
        enableAutoSessionTracking: this.config.providers.sentry.options.enableAutoSessionTracking,
        enableOutOfMemoryTracking: this.config.providers.sentry.options.enableOutOfMemoryTracking,
        enableWatchdogTerminationTracking: this.config.providers.sentry.options.enableWatchdogTerminationTracking,
        attachStacktrace: this.config.providers.sentry.options.attachStacktrace,
        enableCaptureFailedRequests: this.config.providers.sentry.options.enableCaptureFailedRequests,
      });

      this.providers.set('sentry', Sentry);
      this.logInfo('Sentry initialized successfully');
    } catch (error) {
      this.logError('Failed to initialize Sentry', error);
    }
  }

  private async initializeCrashlytics(): Promise<void> {
    try {
      const crashlytics = await import('@react-native-firebase/crashlytics');
      
      // Enable/disable based on environment
      await crashlytics.default().setCrashlyticsCollectionEnabled(
        !__DEV__ || this.config.providers.crashlytics.options.enableInDevMode
      );

      this.providers.set('crashlytics', crashlytics.default());
      this.logInfo('Crashlytics initialized successfully');
    } catch (error) {
      this.logError('Failed to initialize Crashlytics', error);
    }
  }

  private async initializeFirebasePerformance(): Promise<void> {
    try {
      const perf = await import('@react-native-firebase/perf');
      
      // Configure performance monitoring
      const perfInstance = perf.default();
      
      this.providers.set('firebasePerformance', perfInstance);
      this.logInfo('Firebase Performance initialized successfully');
    } catch (error) {
      this.logError('Failed to initialize Firebase Performance', error);
    }
  }

  private async initializeDatadog(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const { datadogRum } = await import('@datadog/browser-rum');
        
        datadogRum.init({
          applicationId: this.config.providers.datadog.applicationId,
          clientToken: this.config.providers.datadog.clientToken,
          site: this.config.providers.datadog.options.site,
          service: 'speaksync-web',
          env: this.config.environment,
          version: '1.0.0',
          sessionSampleRate: this.config.sampleRate * 100,
          trackingConsent: this.config.providers.datadog.options.trackingConsent,
          enableExperimentalFeatures: ['clickmap'],
        });

        this.providers.set('datadog', datadogRum);
      } else {
        // React Native Datadog SDK would be initialized here
        // For now, we'll skip mobile Datadog initialization
        this.logInfo('Datadog RUM not available for React Native');
      }
    } catch (error) {
      this.logError('Failed to initialize Datadog RUM', error);
    }
  }

  public async reportCrash(error: Error, context?: Record<string, unknown>): Promise<void> {
    const crashReport: CrashReport = {
      id: `crash_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      error: {
        message: error.message,
        stack: error.stack || '',
        name: error.name,
        type: error.constructor.name,
      },
      context: context || {},
      platform: Platform.OS,
      appVersion: '1.0.0', // TODO: Get from app config
      userId: 'anonymous', // TODO: Get actual user ID
      sessionId: this.generateSessionId(),
      breadcrumbs: [],
      tags: {},
      fingerprint: this.generateFingerprint(error),
      severity: 'error',
      handled: true,
    };

    // Report to all enabled providers
    await Promise.all([
      this.reportToSentry(crashReport),
      this.reportToCrashlytics(crashReport),
      this.reportToDatadog(crashReport),
    ]);
  }

  public async reportPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      // Report to Firebase Performance
      if (this.providers.has('firebasePerformance')) {
        await this.reportPerformanceToFirebase(metric);
      }

      // Report to Datadog
      if (this.providers.has('datadog')) {
        await this.reportPerformanceToDatadog(metric);
      }

      // Report to Sentry
      if (this.providers.has('sentry')) {
        await this.reportPerformanceToSentry(metric);
      }
    } catch (error) {
      this.logError('Failed to report performance metric', error);
    }
  }

  private async reportToSentry(report: CrashReport): Promise<void> {
    try {
      const sentry = this.providers.get('sentry');
      if (!sentry) {
        return;
      }

      sentry.withScope((scope: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        scope.setTag('platform', report.platform);
        scope.setTag('appVersion', report.appVersion);
        scope.setUser({ id: report.userId });
        scope.setContext('crashReport', report.context);
        scope.setFingerprint([report.fingerprint]);
        
        sentry.captureException(new Error(report.error.message));
      });
    } catch (error) {
      this.logError('Failed to report to Sentry', error);
    }
  }

  private async reportToCrashlytics(report: CrashReport): Promise<void> {
    try {
      const crashlytics = this.providers.get('crashlytics');
      if (!crashlytics) return;

      // Set user identifier
      crashlytics.setUserId(report.userId);

      // Set custom attributes
      Object.entries(report.context).forEach(([key, value]) => {
        crashlytics.setAttribute(key, String(value));
      });

      // Record non-fatal error
      crashlytics.recordError(new Error(report.error.message));
    } catch (error) {
      this.logError('Failed to report to Crashlytics', error);
    }
  }

  private async reportToDatadog(report: CrashReport): Promise<void> {
    try {
      const datadog = this.providers.get('datadog');
      if (!datadog) return;

      if (Platform.OS === 'web') {
        datadog.addError(new Error(report.error.message), {
          fingerprint: report.fingerprint,
          context: report.context,
          tags: report.tags,
        });
      }
    } catch (error) {
      this.logError('Failed to report to Datadog', error);
    }
  }

  private async reportPerformanceToFirebase(metric: PerformanceMetric): Promise<void> {
    try {
      const firebasePerf = this.providers.get('firebasePerformance');
      if (!firebasePerf) return;

      const trace = firebasePerf.newTrace(metric.name);
      trace.putAttribute('category', metric.category);
      trace.putMetric(metric.name, metric.value);
      
      if (metric.startTime && metric.endTime) {
        // This would need to be implemented differently for Firebase Performance
        // as it handles timing automatically
      }
    } catch (error) {
      this.logError('Failed to report performance to Firebase', error);
    }
  }

  private async reportPerformanceToDatadog(metric: PerformanceMetric): Promise<void> {
    try {
      const datadog = this.providers.get('datadog');
      if (!datadog && Platform.OS === 'web') return;

      if (Platform.OS === 'web') {
        datadog.addTiming(metric.name, metric.value, {
          category: metric.category,
          tags: metric.tags || {},
        });
      }
    } catch (error) {
      this.logError('Failed to report performance to Datadog', error);
    }
  }

  private async reportPerformanceToSentry(metric: PerformanceMetric): Promise<void> {
    try {
      const sentry = this.providers.get('sentry');
      if (!sentry) return;

      sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric.name}: ${metric.value}${metric.unit || 'ms'}`,
        level: 'info',
        data: {
          category: metric.category,
          value: metric.value,
          unit: metric.unit,
          tags: metric.tags,
        },
      });
    } catch (error) {
      this.logError('Failed to report performance to Sentry', error);
    }
  }

  public setUser(userId: string, userInfo?: Record<string, unknown>): void {
    try {
      // Set user for Sentry
      const sentry = this.providers.get('sentry');
      if (sentry) {
        sentry.setUser({ id: userId, ...userInfo });
      }

      // Set user for Crashlytics
      const crashlytics = this.providers.get('crashlytics');
      if (crashlytics) {
        crashlytics.setUserId(userId);
        if (userInfo) {
          Object.entries(userInfo).forEach(([key, value]) => {
            crashlytics.setAttribute(key, String(value));
          });
        }
      }

      // Set user for Datadog
      const datadog = this.providers.get('datadog');
      if (datadog && Platform.OS === 'web') {
        datadog.setUser({ id: userId, ...userInfo });
      }
    } catch (error) {
      this.logError('Failed to set user', error);
    }
  }

  public addBreadcrumb(
    message: string, 
    category: string = 'navigation', 
    data?: Record<string, unknown>
  ): void {
    try {
      const breadcrumb = {
        message,
        category,
        timestamp: Date.now(),
        data: data || {},
      };

      // Add to Sentry
      const sentry = this.providers.get('sentry');
      if (sentry) {
        sentry.addBreadcrumb(breadcrumb);
      }

      // Add to Crashlytics (as log)
      const crashlytics = this.providers.get('crashlytics');
      if (crashlytics) {
        crashlytics.log(`[${category}] ${message}`);
      }
    } catch (error) {
      this.logError('Failed to add breadcrumb', error);
    }
  }

  public setTag(key: string, value: string): void {
    try {
      // Set tag for Sentry
      const sentry = this.providers.get('sentry');
      if (sentry) {
        sentry.setTag(key, value);
      }

      // Set attribute for Crashlytics
      const crashlytics = this.providers.get('crashlytics');
      if (crashlytics) {
        crashlytics.setAttribute(key, value);
      }
    } catch (error) {
      this.logError('Failed to set tag', error);
    }
  }

  public async startSession(): Promise<string> {
    const sessionId = this.generateSessionId();
    
    try {
      // Start session for applicable providers
      const sentry = this.providers.get('sentry');
      if (sentry) {
        sentry.startSession();
      }

      this.addBreadcrumb('Session started', 'session', { sessionId });
    } catch (error) {
      this.logError('Failed to start session', error);
    }

    return sessionId;
  }

  public async endSession(): Promise<void> {
    try {
      // End session for applicable providers
      const sentry = this.providers.get('sentry');
      if (sentry) {
        sentry.endSession();
      }

      this.addBreadcrumb('Session ended', 'session');
    } catch (error) {
      this.logError('Failed to end session', error);
    }
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Error): string {
    const message = error.message || 'unknown_error';
    const stack = error.stack || '';
    const hash = this.simpleHash(message + stack);
    return `${error.name || 'Error'}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private logInfo(message: string): void {
    if (__DEV__) {
      // console.log(`[MonitoringService] ${message}`);
    }
  }

  private logError(message: string, error: unknown): void {
    if (__DEV__) {
      // console.error(`[MonitoringService] ${message}:`, error);
    }
  }

  // Configuration methods
  public updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  public isProviderEnabled(provider: CrashReportingProvider): boolean {
    return this.providers.has(provider);
  }

  public getProviderStatus(): Record<CrashReportingProvider, boolean> {
    return {
      sentry: this.providers.has('sentry'),
      crashlytics: this.providers.has('crashlytics'),
      firebasePerformance: this.providers.has('firebasePerformance'),
      datadog: this.providers.has('datadog'),
    };
  }
}

export const monitoringService = MonitoringService.getInstance();
