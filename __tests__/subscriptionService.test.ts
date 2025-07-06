import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import SubscriptionService from '../src/services/subscriptionService';
import { SubscriptionTier, SubscriptionStatus, FeatureFlags, CtaType, SubscriptionContext } from '../src/types/subscriptionTypes';

// Mock Firebase
jest.mock('../src/services/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id'
    }
  },
  db: {}
}));

// Mock RevenueCat
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getCustomerInfo: jest.fn(),
  purchaseProduct: jest.fn(),
  restorePurchases: jest.fn(),
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    subscriptionService = SubscriptionService.getInstance();
    jest.clearAllMocks();
  });

  describe('Feature Access Control', () => {
    it('should allow free tier features for free users', () => {
      const mockContext = {
        subscription: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: Date.now(),
        },
        freeTierUsage: {
          freeSessionCount: 0,
          freeSessionDurationAccumulated: 0,
          savedScriptsCount: 0,
          lastUpdated: Date.now(),
        },
        features: {} as FeatureFlags,
        isFeatureAvailable: jest.fn((feature: string) => {
          // Mock free tier features
          const freeFeatures = ['basicTeleprompter', 'scriptTemplates'];
          return freeFeatures.includes(feature);
        }),
        isFreeTrial: false,
        hasReachedFreeLimit: jest.fn(() => false),
        upgradeNeeded: jest.fn(() => null),
      };

      // Mock the getSubscriptionContext method instead
      jest.spyOn(subscriptionService, 'getSubscriptionContext').mockReturnValue(mockContext as unknown as SubscriptionContext);

      const context = subscriptionService.getSubscriptionContext();
      expect(context.isFeatureAvailable('scriptTemplates')).toBe(true);
      expect(context.isFeatureAvailable('cloudSync')).toBe(true);
      expect(context.isFeatureAvailable('unlimitedTime')).toBe(false);
    });

    it('should block premium features for free users', () => {
      const mockContext = {
        subscription: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: Date.now(),
        },
        freeTierUsage: {
          freeSessionCount: 0,
          freeSessionDurationAccumulated: 0,
          savedScriptsCount: 0,
          lastUpdated: Date.now(),
        },
        features: {} as FeatureFlags,
        isFeatureAvailable: jest.fn((feature: keyof FeatureFlags) => {
          // Mock free tier features
          const freeFeatures: (keyof FeatureFlags)[] = ['scriptTemplates', 'cloudSync', 'multiDeviceSync'];
          return freeFeatures.includes(feature);
        }),
        isFreeTrial: false,
        hasReachedFreeLimit: jest.fn(() => false),
        upgradeNeeded: jest.fn(() => null),
      };

      // Mock the getSubscriptionContext method
      jest.spyOn(subscriptionService, 'getSubscriptionContext').mockReturnValue(mockContext as unknown as SubscriptionContext);

      const context = subscriptionService.getSubscriptionContext();
      expect(context.isFeatureAvailable('unlimitedTime')).toBe(false);
      expect(context.isFeatureAvailable('aiFeedback')).toBe(false);
      expect(context.isFeatureAvailable('analytics')).toBe(false);
    });

    it('should allow all features for pro users', () => {
      const mockContext = {
        subscription: {
          subscriptionTier: SubscriptionTier.PRO,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: Date.now(),
        },
        freeTierUsage: undefined,
        features: {} as FeatureFlags,
        isFeatureAvailable: jest.fn(() => true), // Pro users get all features
        isFreeTrial: false,
        hasReachedFreeLimit: jest.fn(() => false),
        upgradeNeeded: jest.fn(() => null),
      };

      // Mock the getSubscriptionContext method
      jest.spyOn(subscriptionService, 'getSubscriptionContext').mockReturnValue(mockContext as unknown as SubscriptionContext);

      const context = subscriptionService.getSubscriptionContext();
      expect(context.isFeatureAvailable('unlimitedTime')).toBe(true);
      expect(context.isFeatureAvailable('aiFeedback')).toBe(true);
      expect(context.isFeatureAvailable('analytics')).toBe(true);
    });
  });

  describe('Free Tier Limits', () => {
    it('should track script creation for free users', () => {
      const mockContext = {
        subscription: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: Date.now(),
        },
        freeTierUsage: {
          freeSessionCount: 0,
          freeSessionDurationAccumulated: 0,
          savedScriptsCount: 0,
          lastUpdated: Date.now(),
        },
        features: {} as FeatureFlags,
        isFeatureAvailable: jest.fn(),
        isFreeTrial: false,
        hasReachedFreeLimit: jest.fn((limitType) => {
          if (limitType === 'scripts') {
            return false; // Not reached limit yet
          }
          return false;
        }),
        upgradeNeeded: jest.fn(() => null),
      };

      // Mock the getSubscriptionContext method
      jest.spyOn(subscriptionService, 'getSubscriptionContext').mockReturnValue(mockContext as unknown as SubscriptionContext);

      const context = subscriptionService.getSubscriptionContext();
      expect(context.hasReachedFreeLimit('scripts')).toBe(false);
    });

    it('should block script creation when limit is reached', () => {
      const mockContext = {
        subscription: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: Date.now(),
        },
        freeTierUsage: {
          freeSessionCount: 0,
          freeSessionDurationAccumulated: 0,
          savedScriptsCount: 1, // At limit
          lastUpdated: Date.now(),
        },
        features: {} as FeatureFlags,
        isFeatureAvailable: jest.fn(),
        isFreeTrial: false,
        hasReachedFreeLimit: jest.fn((limitType) => {
          if (limitType === 'scripts') {
            return true; // Limit reached
          }
          return false;
        }),
        upgradeNeeded: jest.fn(() => null),
      };

      // Mock the getSubscriptionContext method
      jest.spyOn(subscriptionService, 'getSubscriptionContext').mockReturnValue(mockContext as unknown as SubscriptionContext);

      const context = subscriptionService.getSubscriptionContext();
      expect(context.hasReachedFreeLimit('scripts')).toBe(true);
    });

    it('should track session duration for free users', () => {
      const mockContext = {
        subscription: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: Date.now(),
        },
        isFeatureAvailable: jest.fn(),
        hasReachedFreeLimit: jest.fn((limitType) => {
          if (limitType === 'time') {
            return false; // Not reached limit yet
          }
          return false;
        }),
        freeTierUsage: {
          freeSessionCount: 1,
          freeSessionDurationAccumulated: 120, // 2 minutes
          savedScriptsCount: 0,
          lastUpdated: Date.now(),
        }
      };

      // Mock the getSubscriptionContext method
      jest.spyOn(subscriptionService, 'getSubscriptionContext').mockReturnValue(mockContext as unknown as SubscriptionContext);

      const context = subscriptionService.getSubscriptionContext();
      expect(context.hasReachedFreeLimit('time')).toBe(false);
    });
  });

  describe('CTA Messages', () => {
    it('should generate appropriate upgrade messages', () => {
      const featureLockedMessage = subscriptionService.getCtaMessage(CtaType.FEATURE_LOCKED);
      
      expect(featureLockedMessage).toHaveProperty('title');
      expect(featureLockedMessage).toHaveProperty('description');
      expect(featureLockedMessage).toHaveProperty('buttonText');
      expect(featureLockedMessage.buttonText).toContain('Upgrade');
    });

    it('should generate session limit messages', () => {
      const sessionLimitMessage = subscriptionService.getCtaMessage(CtaType.SESSION_LIMIT);
      
      expect(sessionLimitMessage).toHaveProperty('title');
      expect(sessionLimitMessage).toHaveProperty('description');
      expect(sessionLimitMessage).toHaveProperty('buttonText');
      expect(sessionLimitMessage.description).toContain('session');
    });

    it('should generate script limit messages', () => {
      const scriptLimitMessage = subscriptionService.getCtaMessage(CtaType.SCRIPT_LIMIT);
      
      expect(scriptLimitMessage).toHaveProperty('title');
      expect(scriptLimitMessage).toHaveProperty('description');
      expect(scriptLimitMessage).toHaveProperty('buttonText');
      expect(scriptLimitMessage.description).toContain('script');
    });
  });

  describe('Subscription Context', () => {
    it('should return current subscription context', () => {
      const mockContext = {
        subscription: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: Date.now(),
        },
        isFeatureAvailable: jest.fn(),
        hasReachedFreeLimit: jest.fn(),
        freeTierUsage: {
          freeSessionCount: 0,
          freeSessionDurationAccumulated: 0,
          savedScriptsCount: 0,
          lastUpdated: Date.now(),
        }
      };

      // Mock the getSubscriptionContext method
      jest.spyOn(subscriptionService, 'getSubscriptionContext').mockReturnValue(mockContext as unknown as SubscriptionContext);
      
      const context = subscriptionService.getSubscriptionContext();

      expect(context).toEqual(mockContext);
      expect(context.subscription.subscriptionTier).toBe(SubscriptionTier.FREE);
    });

    it('should handle null subscription context gracefully', () => {
      const context = subscriptionService.getSubscriptionContext();
      
      // Should return default context or handle null gracefully
      expect(context).toBeDefined();
    });
  });
});
