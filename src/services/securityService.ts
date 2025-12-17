import { Platform } from 'react-native';
import { LoggingService } from './loggingService';
import NetInfo from '@react-native-community/netinfo';

export interface SecurityConfig {
  enableNetworkValidation: boolean;
  enableDeviceValidation: boolean;
  enableAppIntegrity: boolean;
  enableDataEncryption: boolean;
  enableSecureStorage: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number; // in minutes
  allowedDevices: string[];
  blockedIPs: string[];
}

export interface SecurityAudit {
  timestamp: number;
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
    uniqueId: string;
  };
  networkInfo: {
    isConnected: boolean;
    type: string;
    isSecure: boolean;
  };
  appIntegrity: {
    isDebugMode: boolean;
    isEmulator: boolean;
    isJailbroken: boolean;
  };
  securityScore: number; // 0-100
  threats: string[];
}

class SecurityService {
  private static instance: SecurityService | null = null;
  private config: SecurityConfig;
  private logger: LoggingService;
  private loginAttempts: Map<string, number> = new Map();
  private securityAudits: SecurityAudit[] = [];

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.config = this.loadSecurityConfig();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private loadSecurityConfig(): SecurityConfig {
    return {
      enableNetworkValidation: true,
      enableDeviceValidation: true,
      enableAppIntegrity: true,
      enableDataEncryption: true,
      enableSecureStorage: true,
      maxLoginAttempts: 5,
      sessionTimeout: 30, // 30 minutes
      allowedDevices: [], // Empty for beta testing - allow all
      blockedIPs: [], // Empty for beta testing
    };
  }

  public async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing security service');
      
      // Perform initial security audit
      await this.performSecurityAudit();
      
      // Set up network monitoring
      this.setupNetworkMonitoring();
      
      this.logger.info('Security service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize security service', 
        error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async performSecurityAudit(): Promise<SecurityAudit> {
    const deviceInfo = await this.getDeviceInfo();
    const networkInfo = await this.getNetworkInfo();
    const appIntegrity = await this.checkAppIntegrity();
    
    const threats: string[] = [];
    let securityScore = 100;

    // Check for security threats
    if (appIntegrity.isDebugMode) {
      threats.push('Debug mode enabled');
      securityScore -= 20;
    }
    
    if (appIntegrity.isEmulator) {
      threats.push('Running on emulator');
      securityScore -= 10;
    }
    
    if (appIntegrity.isJailbroken) {
      threats.push('Device is jailbroken/rooted');
      securityScore -= 30;
    }
    
    if (!networkInfo.isSecure) {
      threats.push('Insecure network connection');
      securityScore -= 15;
    }

    const audit: SecurityAudit = {
      timestamp: Date.now(),
      deviceInfo,
      networkInfo,
      appIntegrity,
      securityScore: Math.max(0, securityScore),
      threats
    };

    this.securityAudits.push(audit);
    
    // Log security audit
    this.logger.info('Security audit completed', {
      securityScore: audit.securityScore,
      threats: audit.threats.length,
      devicePlatform: deviceInfo.platform
    });

    return audit;
  }

  private async getDeviceInfo(): Promise<SecurityAudit['deviceInfo']> {
    return {
      platform: Platform.OS,
      version: Platform.Version?.toString() || 'unknown',
      model: 'unknown', // For privacy in beta testing
      uniqueId: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  private async getNetworkInfo(): Promise<SecurityAudit['networkInfo']> {
    const netInfo = await NetInfo.fetch();
    
    return {
      isConnected: netInfo.isConnected || false,
      type: netInfo.type || 'unknown',
      isSecure: this.isSecureNetwork(netInfo.type)
    };
  }

  private isSecureNetwork(networkType: string | null): boolean {
    // Consider WiFi and cellular as secure for beta testing
    return networkType === 'wifi' || networkType === 'cellular';
  }

  private async checkAppIntegrity(): Promise<SecurityAudit['appIntegrity']> {
    return {
      isDebugMode: __DEV__,
      isEmulator: this.isEmulator(),
      isJailbroken: await this.isJailbroken()
    };
  }

  private isEmulator(): boolean {
    // Basic emulator detection for beta testing
    return Platform.OS === 'ios' && __DEV__;
  }

  private async isJailbroken(): Promise<boolean> {
    // Basic jailbreak detection for beta testing
    // In production, this would use more sophisticated detection
    return false; // Assume not jailbroken for beta testing
  }

  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        this.logger.warn('Network connection lost', {
          networkType: state.type,
          isConnected: state.isConnected
        });
      }
    });
  }

  public async validateLoginAttempt(userId: string): Promise<boolean> {
    const attempts = this.loginAttempts.get(userId) || 0;
    
    if (attempts >= this.config.maxLoginAttempts) {
      this.logger.warn('Too many login attempts', {
        userId,
        attempts,
        maxAttempts: this.config.maxLoginAttempts
      });
      return false;
    }
    
    this.loginAttempts.set(userId, attempts + 1);
    return true;
  }

  public resetLoginAttempts(userId: string): void {
    this.loginAttempts.delete(userId);
  }

  public getSecurityAudits(): SecurityAudit[] {
    return [...this.securityAudits];
  }

  public getLatestSecurityAudit(): SecurityAudit | null {
    return this.securityAudits.length > 0 
      ? this.securityAudits[this.securityAudits.length - 1] || null
      : null;
  }

  public isSecurityThreatDetected(): boolean {
    const latestAudit = this.getLatestSecurityAudit();
    return latestAudit ? latestAudit.threats.length > 0 : false;
  }

  public getSecurityScore(): number {
    const latestAudit = this.getLatestSecurityAudit();
    return latestAudit ? latestAudit.securityScore : 0;
  }

  public async validateSession(): Promise<boolean> {
    // For beta testing, always return true
    // In production, this would check session validity
    return true;
  }

  public getSecurityRecommendations(): string[] {
    const latestAudit = this.getLatestSecurityAudit();
    if (!latestAudit) return [];

    const recommendations: string[] = [];
    
    if (latestAudit.appIntegrity.isDebugMode) {
      recommendations.push('Disable debug mode for production');
    }
    
    if (!latestAudit.networkInfo.isSecure) {
      recommendations.push('Use secure network connection');
    }
    
    if (latestAudit.securityScore < 70) {
      recommendations.push('Review security configuration');
    }

    return recommendations;
  }
}

export const securityService = SecurityService.getInstance();
export default SecurityService; 