import { environmentService } from './environmentService';
import { LoggingService } from './loggingService';
import { Platform } from 'react-native';

export interface BetaTestingConfig {
  enableMockData: boolean;
  enableDebugFeatures: boolean;
  enablePerformanceMonitoring: boolean;
  enableCrashReporting: boolean;
  enableAnalytics: boolean;
  enableFeatureFlags: boolean;
  maxSessionDuration: number; // in minutes
  maxScriptsPerUser: number;
  maxSessionsPerDay: number;
}

export interface BetaTesterInfo {
  testerId: string;
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
  };
  appVersion: string;
  joinDate: Date;
  lastActive: Date;
  feedbackSubmitted: number;
  bugsReported: number;
}

class BetaTestingService {
  private static instance: BetaTestingService | null = null;
  private config: BetaTestingConfig;
  private logger: LoggingService;
  private testerInfo: BetaTesterInfo | null = null;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.config = this.loadBetaConfig();
  }

  public static getInstance(): BetaTestingService {
    if (!BetaTestingService.instance) {
      BetaTestingService.instance = new BetaTestingService();
    }
    return BetaTestingService.instance;
  }

  private loadBetaConfig(): BetaTestingConfig {
    const envConfig = environmentService.getConfig();
    
    return {
      enableMockData: envConfig.betaTestingMode && envConfig.enableMockServices,
      enableDebugFeatures: envConfig.debugMode,
      enablePerformanceMonitoring: envConfig.enableAnalytics,
      enableCrashReporting: envConfig.enableCrashReporting,
      enableAnalytics: envConfig.enableAnalytics,
      enableFeatureFlags: envConfig.enableFeatureFlags,
      maxSessionDuration: 60, // 60 minutes for beta testing
      maxScriptsPerUser: 10, // Limit scripts for beta testing
      maxSessionsPerDay: 5, // Limit sessions per day for beta testing
    };
  }

  public async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing beta testing service', {
        betaMode: this.config.enableMockData,
        debugMode: this.config.enableDebugFeatures,
        platform: Platform.OS
      });

      // Initialize tester info
      await this.initializeTesterInfo();

      // Log beta testing environment
      this.logger.info('Beta testing environment initialized', {
        betaMode: this.config.enableMockData,
        debugMode: this.config.enableDebugFeatures,
        environment: environmentService.getEnvironmentInfo()
      });

    } catch (error) {
      this.logger.error('Failed to initialize beta testing service', 
        error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async initializeTesterInfo(): Promise<void> {
    // Generate unique tester ID
    const testerId = `beta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.testerInfo = {
      testerId,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version?.toString() || 'unknown',
        model: 'unknown'
      },
      appVersion: '1.0.0-beta',
      joinDate: new Date(),
      lastActive: new Date(),
      feedbackSubmitted: 0,
      bugsReported: 0
    };

    this.logger.info('Beta tester info initialized', { testerId });
  }

  public getConfig(): BetaTestingConfig {
    return { ...this.config };
  }

  public getTesterInfo(): BetaTesterInfo | null {
    return this.testerInfo ? { ...this.testerInfo } : null;
  }

  public shouldUseMockData(): boolean {
    return this.config.enableMockData;
  }

  public shouldEnableDebugFeatures(): boolean {
    return this.config.enableDebugFeatures;
  }

  public shouldEnablePerformanceMonitoring(): boolean {
    return this.config.enablePerformanceMonitoring;
  }

  public shouldEnableCrashReporting(): boolean {
    return this.config.enableCrashReporting;
  }

  public shouldEnableAnalytics(): boolean {
    return this.config.enableAnalytics;
  }

  public shouldEnableFeatureFlags(): boolean {
    return this.config.enableFeatureFlags;
  }

  public getMaxSessionDuration(): number {
    return this.config.maxSessionDuration;
  }

  public getMaxScriptsPerUser(): number {
    return this.config.maxScriptsPerUser;
  }

  public getMaxSessionsPerDay(): number {
    return this.config.maxSessionsPerDay;
  }

  public async submitFeedback(feedback: string, category: string): Promise<void> {
    try {
      if (this.testerInfo) {
        this.testerInfo.feedbackSubmitted++;
        this.testerInfo.lastActive = new Date();
      }

      this.logger.info('Beta tester feedback submitted', {
        category,
        feedbackLength: feedback.length,
        testerId: this.testerInfo?.testerId
      });

      // In a real implementation, this would send to a feedback service
      if (__DEV__) {
        console.log('Beta Feedback:', { category, feedback });
      }

    } catch (error) {
      this.logger.error('Failed to submit beta feedback', 
        error instanceof Error ? error : new Error(String(error)));
    }
  }

  public async reportBug(bugDescription: string, severity: 'low' | 'medium' | 'high'): Promise<void> {
    try {
      if (this.testerInfo) {
        this.testerInfo.bugsReported++;
        this.testerInfo.lastActive = new Date();
      }

      this.logger.info('Beta tester bug reported', {
        severity,
        descriptionLength: bugDescription.length,
        testerId: this.testerInfo?.testerId
      });

      // In a real implementation, this would send to a bug tracking service
      if (__DEV__) {
        console.log('Beta Bug Report:', { severity, description: bugDescription });
      }

    } catch (error) {
      this.logger.error('Failed to report beta bug', 
        error instanceof Error ? error : new Error(String(error)));
    }
  }

  public isFeatureEnabled(featureName: string): boolean {
    // For beta testing, enable most features but with limits
    const betaFeatures = [
      'speech_recognition',
      'script_editor',
      'teleprompter',
      'analytics',
      'subscription_management'
    ];

    return betaFeatures.includes(featureName);
  }

  public getBetaTestingLimits(): Record<string, any> {
    return {
      maxSessionDuration: this.config.maxSessionDuration,
      maxScriptsPerUser: this.config.maxScriptsPerUser,
      maxSessionsPerDay: this.config.maxSessionsPerDay,
      enableMockData: this.config.enableMockData,
      enableDebugFeatures: this.config.enableDebugFeatures
    };
  }
}

export const betaTestingService = BetaTestingService.getInstance();
export default BetaTestingService; 