/**
 * Subscription types for SpeakSync Web App
 * Mirroring the mobile app subscription system
 */

/**
 * Available subscription tiers
 */
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  STUDIO = 'studio'
}

/**
 * Status of a user's subscription
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIALING = 'trialing',
  CANCELLED = 'cancelled',
  GRACE_PERIOD = 'grace_period'
}

/**
 * Free tier usage limits
 */
export const FREE_TIER_LIMITS = {
  MAX_SCRIPTS: 1,
  MAX_SESSION_DURATION: 180, // 3 minutes in seconds
  MAX_SESSION_COUNT: 5,
} as const;

/**
 * Feature flags for different subscription tiers
 */
export interface FeatureFlags {
  // Core Features
  basicTeleprompter: boolean;
  scriptTemplates: boolean;
  scriptEditor: boolean;
  
  // Time and Storage
  unlimitedTime: boolean;
  unlimitedScripts: boolean;
  cloudSync: boolean;
  
  // AI Features
  aiFeedback: boolean;
  aiSuggestions: boolean;
  speechAnalysis: boolean;
  
  // Export and Sharing
  exportPdf: boolean;
  exportVideo: boolean;
  shareScripts: boolean;
  
  // Analytics and Insights
  analytics: boolean;
  performanceMetrics: boolean;
  progressTracking: boolean;
  
  // Collaboration
  teamCollaboration: boolean;
  realTimeEditing: boolean;
  commentSystem: boolean;
  
  // Advanced Features
  customBranding: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

/**
 * User subscription data
 */
export interface UserSubscription {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate: number;
  subscriptionEndDate?: number;
  freeTrialEndDate?: number;
  lastPaymentDate?: number;
  nextBillingDate?: number;
  stripeCustomerId?: string;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: {
    id: string;
    type: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    brand?: string;
  };
}

/**
 * Free tier usage tracking
 */
export interface FreeTierUsage {
  savedScriptsCount: number;
  sessionCount: number;
  totalSessionDuration: number; // in seconds
  lastSessionDate?: number;
  lastUpdated: number;
}

/**
 * Different types of CTAs that can be shown to users
 */
export enum CtaType {
  SESSION_LIMIT = 'session_limit',
  SCRIPT_LIMIT = 'script_limit',
  TIME_LIMIT = 'time_limit',
  FEATURE_LOCKED = 'feature_locked',
  TRIAL_ENDING = 'trial_ending',
  GENERAL_UPGRADE = 'general_upgrade'
}

/**
 * CTA message structure
 */
export interface CtaMessage {
  title: string;
  description: string;
  buttonText: string;
  secondaryButtonText?: string;
  benefits?: string[];
  image?: string;
}

/**
 * Full subscription context
 */
export interface SubscriptionContext {
  subscription: UserSubscription;
  freeTierUsage?: FreeTierUsage;
  features: FeatureFlags;
  isFeatureAvailable: (feature: keyof FeatureFlags) => boolean;
  isFreeTrial: boolean;
  daysLeftInTrial?: number;
  hasReachedFreeLimit: (limitType: 'scripts' | 'sessions' | 'time') => boolean;
  upgradeNeeded: (feature: keyof FeatureFlags) => SubscriptionTier | null;
  // Usage tracking functions
  updateScriptCount: (increment?: number) => Promise<void>;
  updateSessionCount: (increment?: number) => Promise<void>;
  updateSessionDuration: (additionalSeconds: number) => Promise<void>;
  resetMonthlyUsage: () => Promise<void>;
}
