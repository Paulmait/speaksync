import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { LoggingService } from './loggingService';

export interface EnvironmentConfig {
  // API Keys
  deepgramApiKey: string;
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  
  // RevenueCat
  revenueCatApiKeyIos: string;
  revenueCatApiKeyAndroid: string;
  
  // Feature Flags
  debugMode: boolean;
  enableSpeechLogging: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  betaTestingMode: boolean;
  enableFeatureFlags: boolean;
  enableMockServices: boolean;
  
  // Security
  enableApiKeyValidation: boolean;
  enableEnvironmentCheck: boolean;
}

class EnvironmentService {
  private static instance: EnvironmentService | null = null;
  private config: EnvironmentConfig;
  private logger: LoggingService;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  private loadConfiguration(): EnvironmentConfig {
    const extra = Constants.expoConfig?.extra || {};
    
    return {
      // API Keys
      deepgramApiKey: extra['deepgramApiKey'] || '',
      firebaseApiKey: extra['firebaseApiKey'] || '',
      firebaseAuthDomain: extra['firebaseAuthDomain'] || '',
      firebaseProjectId: extra['firebaseProjectId'] || '',
      firebaseStorageBucket: extra['firebaseStorageBucket'] || '',
      firebaseMessagingSenderId: extra['firebaseMessagingSenderId'] || '',
      firebaseAppId: extra['firebaseAppId'] || '',
      
      // RevenueCat
      revenueCatApiKeyIos: extra['revenueCatApiKeyIos'] || '',
      revenueCatApiKeyAndroid: extra['revenueCatApiKeyAndroid'] || '',
      
      // Feature Flags
      debugMode: extra['debugMode'] === true,
      enableSpeechLogging: extra['enableSpeechLogging'] === true,
      enableAnalytics: extra['enableAnalytics'] !== false,
      enableCrashReporting: extra['enableCrashReporting'] !== false,
      betaTestingMode: extra['betaTestingMode'] === true,
      enableFeatureFlags: extra['enableFeatureFlags'] !== false,
      enableMockServices: extra['enableMockServices'] === true,
      
      // Security
      enableApiKeyValidation: extra['enableApiKeyValidation'] !== false,
      enableEnvironmentCheck: extra['enableEnvironmentCheck'] !== false,
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];
    
    // Check for placeholder values
    if (this.config.deepgramApiKey === 'your_deepgram_api_key_here') {
      errors.push('Deepgram API key not configured');
    }
    
    if (this.config.firebaseApiKey === 'your_firebase_api_key_here') {
      errors.push('Firebase API key not configured');
    }
    
    if (this.config.firebaseProjectId === 'your_project_id') {
      errors.push('Firebase project ID not configured');
    }
    
    // Check for empty required values
    if (!this.config.deepgramApiKey) {
      errors.push('Deepgram API key is required');
    }
    
    if (!this.config.firebaseApiKey) {
      errors.push('Firebase API key is required');
    }
    
    if (!this.config.firebaseProjectId) {
      errors.push('Firebase project ID is required');
    }
    
    if (errors.length > 0) {
      const error = new Error(errors.join(', '));
      this.logger.error('Environment configuration validation failed', error, {
        category: 'ENVIRONMENT' as any,
        severity: 'HIGH' as any
      });
      
      if (this.config.enableEnvironmentCheck === true) {
        throw error;
      }
    }
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public isDebugMode(): boolean {
    return this.config.debugMode;
  }

  public isBetaTestingMode(): boolean {
    return this.config.betaTestingMode;
  }

  public shouldEnableAnalytics(): boolean {
    return this.config.enableAnalytics;
  }

  public shouldEnableCrashReporting(): boolean {
    return this.config.enableCrashReporting;
  }

  public shouldEnableFeatureFlags(): boolean {
    return this.config.enableFeatureFlags;
  }

  public shouldUseMockServices(): boolean {
    return this.config.enableMockServices;
  }

  public getRevenueCatApiKey(): string {
    return Platform.OS === 'ios' 
      ? this.config.revenueCatApiKeyIos 
      : this.config.revenueCatApiKeyAndroid;
  }

  public validateApiKey(apiKey: string, serviceName: string): boolean {
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey === '') {
      this.logger.warn(`Invalid API key detected for ${serviceName}`, { 
        serviceName, 
        error: 'API key validation failed' 
      });
      return false;
    }
    return true;
  }

  public getEnvironmentInfo(): string {
    return `Environment: ${__DEV__ ? 'Development' : 'Production'}, ` +
           `Platform: ${Platform.OS}, ` +
           `Beta Mode: ${this.config.betaTestingMode}, ` +
           `Debug Mode: ${this.config.debugMode}`;
  }
}

export const environmentService = EnvironmentService.getInstance();
export default EnvironmentService; 