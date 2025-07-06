/**
 * Feedback Service for SpeakSync
 * Handles user feedback, bug reports, feature requests, and diagnostic information
 */

import {
  FeedbackSubmission,
  FeedbackAttachment,
  DiagnosticInfo,
  UserContactInfo,
  FeedbackSettings,
  FeedbackCategory,
  ErrorInfo,
  UserAction,
  PerformanceInfo
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEYS = {
  FEEDBACK_SETTINGS: '@speaksync/feedback_settings',
  PENDING_FEEDBACK: '@speaksync/pending_feedback',
  USER_ACTIONS: '@speaksync/user_actions',
  ERROR_LOGS: '@speaksync/error_logs'
};

const DEFAULT_CATEGORIES: FeedbackCategory[] = [
  {
    id: 'bug_report',
    name: 'Bug Report',
    description: 'Report issues or unexpected behavior',
    icon: '🐛',
    isDefault: true,
    requiresAttachment: false,
    suggestedActions: ['Take screenshot', 'Describe steps to reproduce', 'Include device info']
  },
  {
    id: 'feature_request',
    name: 'Feature Request',
    description: 'Suggest new features or improvements',
    icon: '💡',
    isDefault: true,
    requiresAttachment: false,
    suggestedActions: ['Describe the feature', 'Explain the use case', 'Compare with existing solutions']
  },
  {
    id: 'ui_ux',
    name: 'UI/UX Feedback',
    description: 'Feedback about user interface and experience',
    icon: '🎨',
    isDefault: true,
    requiresAttachment: true,
    suggestedActions: ['Take screenshot', 'Describe the issue', 'Suggest improvements']
  },
  {
    id: 'performance',
    name: 'Performance Issue',
    description: 'Report slow performance or crashes',
    icon: '⚡',
    isDefault: true,
    requiresAttachment: false,
    suggestedActions: ['Include device specs', 'Describe when it happens', 'Close other apps']
  },
  {
    id: 'content',
    name: 'Content Feedback',
    description: 'Feedback about content, help docs, or tutorials',
    icon: '📖',
    isDefault: true,
    requiresAttachment: false,
    suggestedActions: ['Specify the content', 'Suggest improvements', 'Rate helpfulness']
  },
  {
    id: 'general',
    name: 'General Feedback',
    description: 'Any other feedback or suggestions',
    icon: '💬',
    isDefault: true,
    requiresAttachment: false,
    suggestedActions: ['Be specific', 'Provide context', 'Suggest alternatives']
  }
];

class FeedbackService {
  private static instance: FeedbackService;
  private settings: FeedbackSettings;
  private userActions: UserAction[] = [];
  private errorLogs: ErrorInfo[] = [];
  private pendingFeedback: FeedbackSubmission[] = [];

  private constructor() {
    this.settings = {
      enableAutoSubmission: false,
      includeDiagnostics: true,
      allowScreenshots: true,
      shareUsageData: false,
      contactPreferences: {
        preferredContactMethod: 'in_app',
        allowFollowUp: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      categories: DEFAULT_CATEGORIES
    };
    this.loadSettings();
    this.initializeErrorTracking();
  }

  static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  // Initialization
  private async loadSettings(): Promise<void> {
    try {
      const [settings, actions, errors, pending] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.FEEDBACK_SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ACTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.ERROR_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.PENDING_FEEDBACK)
      ]);

      if (settings) {
        this.settings = { ...this.settings, ...JSON.parse(settings) };
      }

      if (actions) {
        this.userActions = JSON.parse(actions);
      }

      if (errors) {
        this.errorLogs = JSON.parse(errors);
      }

      if (pending) {
        this.pendingFeedback = JSON.parse(pending);
      }
    } catch (error) {
      console.error('Failed to load feedback settings:', error);
    }
  }

  private initializeErrorTracking(): void {
    // Set up global error handler
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.logError({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        context: 'global',
        userAction: 'unknown'
      });
      
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  // User Action Tracking
  async trackUserAction(action: string, screen: string, data?: { [key: string]: any }): Promise<void> {
    if (!this.settings.shareUsageData) return;

    const userAction: UserAction = {
      action,
      screen,
      timestamp: Date.now(),
      data
    };

    this.userActions.push(userAction);

    // Keep only last 100 actions
    if (this.userActions.length > 100) {
      this.userActions = this.userActions.slice(-100);
    }

    await this.saveUserActions();
  }

  // Error Logging
  async logError(errorInfo: ErrorInfo): Promise<void> {
    this.errorLogs.push(errorInfo);

    // Keep only last 50 errors
    if (this.errorLogs.length > 50) {
      this.errorLogs = this.errorLogs.slice(-50);
    }

    await this.saveErrorLogs();

    // Auto-submit critical errors if enabled
    if (this.settings.enableAutoSubmission && errorInfo.message.includes('crash')) {
      await this.submitAutomaticBugReport(errorInfo);
    }
  }

  // Diagnostic Information
  async collectDiagnosticInfo(): Promise<DiagnosticInfo> {
    try {
      const networkState = await NetInfo.fetch();
      
      const performanceInfo = await this.getPerformanceInfo();
      const recentActions = this.userActions.slice(-10); // Last 10 actions
      const lastError = this.errorLogs.length > 0 ? this.errorLogs[this.errorLogs.length - 1] : undefined;

      return {
        appVersion: '1.0.0', // Would get from app config
        buildNumber: '1',
        platform: Platform.OS as 'ios' | 'android',
        osVersion: Platform.Version.toString(),
        deviceModel: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
        deviceId: Math.random().toString(36).substring(2, 10), // Anonymized random ID
        memoryUsage: 100, // Mock value
        diskSpace: 1000, // Mock value
        networkStatus: networkState.isConnected ? 
          (networkState.type === 'wifi' ? 'online' : 'poor') : 'offline',
        lastError,
        recentActions,
        performance: performanceInfo
      };
    } catch (error) {
      console.error('Failed to collect diagnostic info:', error);
      return this.getBasicDiagnosticInfo();
    }
  }

  private async getMemoryUsage(): Promise<{ used: number; total: number }> {
    try {
      // This would need a native module to get real memory info
      return { used: 100, total: 1000 }; // Mock values in MB
    } catch {
      return { used: 0, total: 0 };
    }
  }

  private async getDiskSpace(): Promise<{ free: number; total: number }> {
    try {
      // Mock values since we removed DeviceInfo dependency
      return { 
        free: 1000, // MB
        total: 4000 // MB
      };
    } catch {
      return { free: 0, total: 0 };
    }
  }

  private async getPerformanceInfo(): Promise<PerformanceInfo> {
    return {
      averageFPS: 60, // Would need performance monitoring
      memoryLeaks: false,
      crashCount: this.errorLogs.filter(e => e.message.includes('crash')).length,
      slowOperations: [],
      renderTimes: []
    };
  }

  private getBasicDiagnosticInfo(): DiagnosticInfo {
    return {
      appVersion: '1.0.0',
      buildNumber: '1',
      platform: Platform.OS as 'ios' | 'android',
      osVersion: Platform.Version.toString(),
      deviceModel: 'Unknown',
      deviceId: 'unknown',
      memoryUsage: 0,
      diskSpace: 0,
      networkStatus: 'offline' as const,
      recentActions: [],
      performance: {
        averageFPS: 0,
        memoryLeaks: false,
        crashCount: 0,
        slowOperations: [],
        renderTimes: []
      }
    };
  }

  // Feedback Submission
  async submitFeedback(
    type: FeedbackSubmission['type'],
    category: string,
    title: string,
    description: string,
    priority: FeedbackSubmission['priority'] = 'medium',
    attachments: FeedbackAttachment[] = [],
    userContact?: Partial<UserContactInfo>
  ): Promise<string> {
    
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const submission: FeedbackSubmission = {
      id: feedbackId,
      type,
      category: category as FeedbackSubmission['category'],
      title,
      description,
      priority,
      attachments,
      diagnostics: this.settings.includeDiagnostics ? await this.collectDiagnosticInfo() : undefined,
      userContact: userContact ? { ...this.settings.contactPreferences, ...userContact } : undefined,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
      isAnonymous: !userContact?.email
    };

    // Add to pending submissions
    this.pendingFeedback.push(submission);
    await this.savePendingFeedback();

    // Try to submit immediately
    try {
      await this.uploadFeedback(submission);
      submission.status = 'reviewing';
    } catch (error) {
      console.error('Failed to submit feedback immediately:', error);
      // Will retry later
    }

    return feedbackId;
  }

  private async uploadFeedback(submission: FeedbackSubmission): Promise<void> {
    // This would integrate with your backend API
    const endpoint = 'https://api.speaksync.app/feedback';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove from pending after successful upload
      this.pendingFeedback = this.pendingFeedback.filter(f => f.id !== submission.id);
      await this.savePendingFeedback();
      
    } catch (error) {
      throw new Error(`Failed to upload feedback: ${(error as Error).message}`);
    }
  }

  // Automatic Bug Report
  private async submitAutomaticBugReport(errorInfo: ErrorInfo): Promise<void> {
    const title = `Auto-reported: ${errorInfo.message.substring(0, 50)}...`;
    const description = `
Automatic bug report generated from error:

Context: ${errorInfo.context}
User Action: ${errorInfo.userAction}
Timestamp: ${new Date(errorInfo.timestamp).toISOString()}

Error Details:
${errorInfo.message}

Stack Trace:
${errorInfo.stack || 'Not available'}
    `;

    try {
      await this.submitFeedback(
        'bug_report',
        'performance',
        title,
        description.trim(),
        'high',
        [],
        { allowFollowUp: false, preferredContactMethod: 'none' }
      );
    } catch (error) {
      console.error('Failed to submit automatic bug report:', error);
    }
  }

  // Attachment Handling
  async addScreenshot(uri: string, description?: string): Promise<FeedbackAttachment> {
    const attachment: FeedbackAttachment = {
      id: `screenshot_${Date.now()}`,
      type: 'screenshot',
      filename: `screenshot_${Date.now()}.png`,
      size: 0, // Would need to get actual file size
      localPath: uri,
      description
    };

    return attachment;
  }

  async addLogFile(logs: string[], description?: string): Promise<FeedbackAttachment> {
    const content = logs.join('\n');
    const attachment: FeedbackAttachment = {
      id: `logs_${Date.now()}`,
      type: 'log_file',
      filename: `logs_${Date.now()}.txt`,
      size: content.length,
      description
    };

    // Store logs content in the attachment for now
    // In a real implementation, you'd save to a temporary file
    (attachment as any).content = content;

    return attachment;
  }

  // Retry Pending Submissions
  async retryPendingSubmissions(): Promise<void> {
    const failed: FeedbackSubmission[] = [];

    for (const submission of this.pendingFeedback) {
      try {
        await this.uploadFeedback(submission);
      } catch (error) {
        console.error(`Failed to retry submission ${submission.id}:`, error);
        failed.push(submission);
      }
    }

    this.pendingFeedback = failed;
    await this.savePendingFeedback();
  }

  // Settings Management
  async updateSettings(settings: Partial<FeedbackSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK_SETTINGS, JSON.stringify(this.settings));
  }

  getSettings(): FeedbackSettings {
    return this.settings;
  }

  getCategories(): FeedbackCategory[] {
    return this.settings.categories;
  }

  getCategoryById(id: string): FeedbackCategory | null {
    return this.settings.categories.find(c => c.id === id) || null;
  }

  // Data Access
  getPendingFeedback(): FeedbackSubmission[] {
    return this.pendingFeedback;
  }

  getRecentErrors(): ErrorInfo[] {
    return this.errorLogs.slice(-10);
  }

  getRecentActions(): UserAction[] {
    return this.userActions.slice(-20);
  }

  // Analytics
  getFeedbackStats(): {
    totalSubmitted: number;
    byType: { [key: string]: number };
    byCategory: { [key: string]: number };
    byPriority: { [key: string]: number };
  } {
    const submitted = this.pendingFeedback.filter(f => f.status !== 'submitted');
    
    return {
      totalSubmitted: submitted.length,
      byType: this.groupBy(submitted, 'type'),
      byCategory: this.groupBy(submitted, 'category'),
      byPriority: this.groupBy(submitted, 'priority')
    };
  }

  private groupBy(array: any[], key: string): { [key: string]: number } {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  // Storage
  private async saveUserActions(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ACTIONS, JSON.stringify(this.userActions));
    } catch (error) {
      console.error('Failed to save user actions:', error);
    }
  }

  private async saveErrorLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ERROR_LOGS, JSON.stringify(this.errorLogs));
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }

  private async savePendingFeedback(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_FEEDBACK, JSON.stringify(this.pendingFeedback));
    } catch (error) {
      console.error('Failed to save pending feedback:', error);
    }
  }

  // Cleanup
  async clearOldData(): Promise<void> {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Clear old user actions
    this.userActions = this.userActions.filter(action => action.timestamp > thirtyDaysAgo);
    
    // Clear old error logs
    this.errorLogs = this.errorLogs.filter(error => error.timestamp > thirtyDaysAgo);
    
    // Save cleaned data
    await Promise.all([
      this.saveUserActions(),
      this.saveErrorLogs()
    ]);
  }
}

export default FeedbackService;
