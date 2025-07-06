/**
 * Subscription and Feature Flag Type Definitions for SpeakSync
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
 * Represents the structure of a user's subscription data
 */
export interface UserSubscription {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate: number;
  subscriptionEndDate?: number; // Only for Pro/Studio
  freeTrialEndDate?: number;
  lastPaymentDate?: number;
  nextBillingDate?: number;
  stripeCustomerId?: string;
  revenueCatUserId?: string;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: {
    id: string;
    type: string; // e.g., 'card', 'apple_pay', 'google_pay'
    last4?: string; // Last 4 digits of the card
    expiryMonth?: number;
    expiryYear?: number;
    brand?: string; // e.g., 'visa', 'mastercard'
  };
  receiptData?: {
    platform: 'ios' | 'android' | 'web';
    transactionId: string;
    purchaseDate: number;
    receipt: string;
  };
}

/**
 * Free tier usage tracking data
 */
export interface FreeTierUsage {
  freeSessionCount: number;
  freeSessionDurationAccumulated: number; // in seconds
  savedScriptsCount: number;
  lastUpdated: number;
}

/**
 * Feature flags determine which features are available for a subscription tier
 */
export interface FeatureFlags {
  unlimitedTime: boolean;
  unlimitedScripts: boolean;
  aiFeedback: boolean;
  cloudSync: boolean;
  analytics: boolean;
  exportVideo: boolean;
  overlayExport: boolean;
  teamCollaboration: boolean;
  multiDeviceSync: boolean;
  prioritySupport: boolean;
  removeWatermark: boolean;
  customThemes: boolean;
  advancedPrompting: boolean;
  scriptTemplates: boolean;
  audioPractice: boolean;
}

/**
 * Feature flag configuration mapping for each subscription tier
 */
export const TierFeatureMapping: Record<SubscriptionTier, FeatureFlags> = {
  [SubscriptionTier.FREE]: {
    unlimitedTime: false,
    unlimitedScripts: false,
    aiFeedback: false,
    cloudSync: true,
    analytics: false,
    exportVideo: false,
    overlayExport: false,
    teamCollaboration: false,
    multiDeviceSync: false,
    prioritySupport: false,
    removeWatermark: false,
    customThemes: false,
    advancedPrompting: false,
    scriptTemplates: true,
    audioPractice: false
  },
  [SubscriptionTier.PRO]: {
    unlimitedTime: true,
    unlimitedScripts: true,
    aiFeedback: true,
    cloudSync: true,
    analytics: true,
    exportVideo: false,
    overlayExport: false,
    teamCollaboration: false,
    multiDeviceSync: true,
    prioritySupport: false,
    removeWatermark: true,
    customThemes: true,
    advancedPrompting: true,
    scriptTemplates: true,
    audioPractice: true
  },
  [SubscriptionTier.STUDIO]: {
    unlimitedTime: true,
    unlimitedScripts: true,
    aiFeedback: true,
    cloudSync: true,
    analytics: true,
    exportVideo: true,
    overlayExport: true,
    teamCollaboration: true,
    multiDeviceSync: true,
    prioritySupport: true,
    removeWatermark: true,
    customThemes: true,
    advancedPrompting: true,
    scriptTemplates: true,
    audioPractice: true
  }
};

/**
 * Free tier usage limits
 */
export const FREE_TIER_LIMITS = {
  MAX_SCRIPTS: 1,
  MAX_SESSION_COUNT: 5,
  MAX_SESSION_DURATION: 180, // 3 minutes in seconds
};

/**
 * CTA messaging based on feature access
 */
export interface CtaMessage {
  title: string;
  description: string;
  buttonText: string;
  targetTier: SubscriptionTier;
  image?: string;
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
 * Full subscription context including the subscription status and feature access
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
}
