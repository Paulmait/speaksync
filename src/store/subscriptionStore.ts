import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import RevenueCatService from '../services/revenueCatService';

export type SubscriptionTier = 'free' | 'pro' | 'studio';

export interface SubscriptionFeatures {
  maxRecordingDuration: number; // in seconds
  videoQuality: string[];
  watermarkFree: boolean;
  externalDisplay: boolean;
  bluetoothRemote: boolean;
  advancedAnalytics: boolean;
  cloudStorage: number; // in GB
  exportFormats: string[];
}

export interface Subscription {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: Date | null;
  features: SubscriptionFeatures;
}

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
}

interface SubscriptionActions {
  setSubscription: (subscription: Subscription) => void;
  upgradeSubscription: (tier: SubscriptionTier) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
  getFeatures: (tier: SubscriptionTier) => SubscriptionFeatures;
  initializeRevenueCat: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  purchaseProduct: (productId: string) => Promise<boolean>;
}

export type SubscriptionStore = SubscriptionState & SubscriptionActions;

const getSubscriptionFeatures = (tier: SubscriptionTier): SubscriptionFeatures => {
  switch (tier) {
    case 'free':
      return {
        maxRecordingDuration: 600, // 10 minutes
        videoQuality: ['low', 'medium'],
        watermarkFree: false,
        externalDisplay: false,
        bluetoothRemote: false,
        advancedAnalytics: false,
        cloudStorage: 1, // 1GB
        exportFormats: ['mp4'],
      };
    case 'pro':
      return {
        maxRecordingDuration: 3600, // 1 hour
        videoQuality: ['low', 'medium', 'high'],
        watermarkFree: true,
        externalDisplay: true,
        bluetoothRemote: true,
        advancedAnalytics: true,
        cloudStorage: 10, // 10GB
        exportFormats: ['mp4', 'mov', 'avi'],
      };
    case 'studio':
      return {
        maxRecordingDuration: 7200, // 2 hours
        videoQuality: ['low', 'medium', 'high', '4k'],
        watermarkFree: true,
        externalDisplay: true,
        bluetoothRemote: true,
        advancedAnalytics: true,
        cloudStorage: 100, // 100GB
        exportFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
      };
    default:
      return getSubscriptionFeatures('free');
  }
};

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      subscription: {
        tier: 'free',
        isActive: true,
        expiresAt: null,
        features: getSubscriptionFeatures('free'),
      },
      isLoading: false,
      error: null,

      // Actions
      setSubscription: (subscription: Subscription) => {
        set({ subscription });
      },

      upgradeSubscription: async (tier: SubscriptionTier) => {
        set({ isLoading: true, error: null });
        
        try {
          const revenueCatService = RevenueCatService.getInstance();
          const productId = tier === 'pro' ? 'speaksync_pro_monthly' : 'speaksync_studio_monthly';
          
          const customerInfo = await revenueCatService.purchaseProduct(productId);
          
          if (customerInfo.activeSubscriptions.includes(productId)) {
            const status = await revenueCatService.checkSubscriptionStatus();
            
            const newSubscription: Subscription = {
              tier,
              isActive: true,
              expiresAt: status.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              features: getSubscriptionFeatures(tier),
            };

            set({ 
              subscription: newSubscription,
              isLoading: false 
            });

            return true;
          }
          
          return false;
        } catch (error) {
          set({ 
            error: 'Failed to upgrade subscription',
            isLoading: false 
          });
          return false;
        }
      },

      cancelSubscription: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const freeSubscription: Subscription = {
            tier: 'free',
            isActive: true,
            expiresAt: null,
            features: getSubscriptionFeatures('free'),
          };

          set({ 
            subscription: freeSubscription,
            isLoading: false 
          });

          return true;
        } catch (error) {
          set({ 
            error: 'Failed to cancel subscription',
            isLoading: false 
          });
          return false;
        }
      },

      checkSubscriptionStatus: async () => {
        set({ isLoading: true });
        
        try {
          const revenueCatService = RevenueCatService.getInstance();
          const status = await revenueCatService.checkSubscriptionStatus();
          
          if (status.isActive) {
            // Determine tier based on active subscription
            let tier: SubscriptionTier = 'free';
            if (status.activeSubscriptions.includes('speaksync_studio_monthly')) {
              tier = 'studio';
            } else if (status.activeSubscriptions.includes('speaksync_pro_monthly')) {
              tier = 'pro';
            }

            const subscription: Subscription = {
              tier,
              isActive: true,
              expiresAt: status.expirationDate || null,
              features: getSubscriptionFeatures(tier),
            };

            set({ subscription });
          } else {
            // No active subscriptions, set to free
            const freeSubscription: Subscription = {
              tier: 'free',
              isActive: true,
              expiresAt: null,
              features: getSubscriptionFeatures('free'),
            };

            set({ subscription: freeSubscription });
          }

          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: 'Failed to check subscription status',
            isLoading: false 
          });
        }
      },

      getFeatures: (tier: SubscriptionTier) => {
        return getSubscriptionFeatures(tier);
      },

      initializeRevenueCat: async () => {
        try {
          const revenueCatService = RevenueCatService.getInstance();
          const apiKey = RevenueCatService.getPlatformApiKey();
          
          await revenueCatService.initialize({
            apiKey,
            debugMode: __DEV__,
          });
          
          // Check current subscription status after initialization
          await get().checkSubscriptionStatus();
        } catch (error) {
          console.error('Failed to initialize RevenueCat:', error);
          set({ error: 'Failed to initialize purchases' });
        }
      },

      restorePurchases: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const revenueCatService = RevenueCatService.getInstance();
          await revenueCatService.restorePurchases();
          
          // Update subscription based on restored purchases
          const status = await revenueCatService.checkSubscriptionStatus();
          
          if (status.isActive) {
            let tier: SubscriptionTier = 'free';
            if (status.activeSubscriptions.includes('speaksync_studio_monthly')) {
              tier = 'studio';
            } else if (status.activeSubscriptions.includes('speaksync_pro_monthly')) {
              tier = 'pro';
            }

            const subscription: Subscription = {
              tier,
              isActive: true,
              expiresAt: status.expirationDate || null,
              features: getSubscriptionFeatures(tier),
            };

            set({ subscription, isLoading: false });
            return true;
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ 
            error: 'Failed to restore purchases',
            isLoading: false 
          });
          return false;
        }
      },

      purchaseProduct: async (productId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const revenueCatService = RevenueCatService.getInstance();
          const customerInfo = await revenueCatService.purchaseProduct(productId);
          
          if (customerInfo.activeSubscriptions.includes(productId)) {
            // Determine tier
            let tier: SubscriptionTier = 'free';
            if (productId === 'speaksync_studio_monthly') {
              tier = 'studio';
            } else if (productId === 'speaksync_pro_monthly') {
              tier = 'pro';
            }
            
            const status = await revenueCatService.checkSubscriptionStatus();

            const subscription: Subscription = {
              tier,
              isActive: true,
              expiresAt: status.expirationDate || null,
              features: getSubscriptionFeatures(tier),
            };

            set({ subscription, isLoading: false });
            return true;
          }
          
          return false;
        } catch (error) {
          set({ 
            error: 'Failed to purchase product',
            isLoading: false 
          });
          return false;
        }
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
      }),
    }
  )
);
