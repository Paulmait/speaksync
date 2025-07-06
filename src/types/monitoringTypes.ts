/**
 * Monitoring and crash reporting type definitions
 */

export interface CrashReport {
  id: string;
  timestamp: Date;
  error: {
    message: string;
    stack: string;
    name: string;
    type: string;
  };
  context: Record<string, unknown>;
  platform: string;
  appVersion: string;
  userId: string;
  sessionId: string;
  breadcrumbs: Breadcrumb[];
  tags: Record<string, string>;
  fingerprint: string;
  severity: 'fatal' | 'error' | 'warning' | 'info';
  handled: boolean;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  unit?: string;
  timestamp: Date;
  startTime?: number;
  endTime?: number;
  tags?: Record<string, string>;
  attributes?: Record<string, unknown>;
}

export interface Breadcrumb {
  timestamp: number;
  message: string;
  category: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
}

export interface MonitoringConfig {
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableRealUserMonitoring: boolean;
  enableSessionReplay: boolean;
  sampleRate: number;
  environment: string;
  providers: {
    sentry: SentryConfig;
    crashlytics: CrashlyticsConfig;
    firebasePerformance: FirebasePerformanceConfig;
    datadog: DatadogConfig;
  };
}

export interface SentryConfig {
  enabled: boolean;
  dsn: string;
  options: {
    debug: boolean;
    enableAutoSessionTracking: boolean;
    enableOutOfMemoryTracking: boolean;
    enableWatchdogTerminationTracking: boolean;
    attachStacktrace: boolean;
    enableCaptureFailedRequests: boolean;
  };
}

export interface CrashlyticsConfig {
  enabled: boolean;
  options: {
    enableInDevMode: boolean;
    recordPreviousLog: boolean;
  };
}

export interface FirebasePerformanceConfig {
  enabled: boolean;
  options: {
    enableAutoScreenTracking: boolean;
    enableAutoNetworkTracking: boolean;
    enableCustomTraces: boolean;
  };
}

export interface DatadogConfig {
  enabled: boolean;
  clientToken: string;
  applicationId: string;
  options: {
    site: string;
    trackingConsent: 'granted' | 'not-granted' | 'pending';
    enableXRayTracing: boolean;
    enableCrashReporting: boolean;
    enableViewTracking: boolean;
    enableResourceTracking: boolean;
    enableActionTracking: boolean;
    enableErrorTracking: boolean;
  };
}

export enum CrashReportingProvider {
  SENTRY = 'sentry',
  CRASHLYTICS = 'crashlytics',
  FIREBASE_PERFORMANCE = 'firebasePerformance',
  DATADOG = 'datadog'
}

export interface SessionInfo {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  userId?: string;
  platform: string;
  appVersion: string;
  crashCount: number;
  errorCount: number;
  isHealthy: boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  crashFreeUsers: number;
  crashFreeSessionsRate: number;
  topErrors: Array<{
    error: string;
    count: number;
    affectedUsers: number;
  }>;
  errorsByCategory: Record<string, number>;
  errorTrends: Array<{
    date: string;
    count: number;
  }>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  apdex: number;
  slowestTransactions: Array<{
    name: string;
    duration: number;
    timestamp: Date;
  }>;
  resourceUsage: {
    memory: number;
    cpu: number;
    battery?: number;
  };
  networkMetrics: {
    requests: number;
    failures: number;
    averageLatency: number;
  };
}

export interface MonitoringDashboard {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    crashFreeRate: number;
    errorRate: number;
    averageSessionDuration: number;
  };
  errors: ErrorMetrics;
  performance: PerformanceMetrics;
  alerts: Alert[];
  incidents: Incident[];
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  timestamp: Date;
  affectedMetric: string;
  threshold: number;
  currentValue: number;
  actions: string[];
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startTime: Date;
  endTime?: Date;
  affectedServices: string[];
  updates: IncidentUpdate[];
  rootCause?: string;
  resolution?: string;
}

export interface IncidentUpdate {
  id: string;
  timestamp: Date;
  status: string;
  message: string;
  author: string;
}

export interface UserJourney {
  id: string;
  userId: string;
  sessionId: string;
  steps: JourneyStep[];
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  abandonedAt?: string;
  conversionGoals: string[];
  metadata: Record<string, unknown>;
}

export interface JourneyStep {
  id: string;
  name: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface RealUserMonitoring {
  pageViews: number;
  uniqueUsers: number;
  bounceRate: number;
  averageSessionDuration: number;
  topPages: Array<{
    page: string;
    views: number;
    avgLoadTime: number;
  }>;
  userFlows: UserJourney[];
  geographicData: Array<{
    country: string;
    users: number;
    performance: number;
  }>;
  deviceData: Array<{
    device: string;
    users: number;
    crashRate: number;
  }>;
}
