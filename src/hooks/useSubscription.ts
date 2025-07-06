import { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import { 
  SubscriptionContext, 
  SubscriptionTier, 
  FreeTierUsage,
  FeatureFlags,
  CtaType,
  CtaMessage
} from '../types/subscriptionTypes';

export function useSubscription() {
  const [subscriptionContext, setSubscriptionContext] = useState<SubscriptionContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize the subscription context
    const initSubscription = async () => {
      try {
        await subscriptionService.initialize();
        setSubscriptionContext(subscriptionService.getSubscriptionContext());
      } finally {
        setIsLoading(false);
      }
    };

    initSubscription();

    // Set up listener for changes to subscription
    const subscriptionInterval = setInterval(() => {
      setSubscriptionContext(subscriptionService.getSubscriptionContext());
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(subscriptionInterval);
    };
  }, []);

  const checkFeatureAccess = useCallback((feature: keyof FeatureFlags) => {
    if (!subscriptionContext) {
      return false;
    }
    return subscriptionContext.isFeatureAvailable(feature);
  }, [subscriptionContext]);

  const checkFreeLimit = useCallback((limitType: 'scripts' | 'sessions' | 'time') => {
    if (!subscriptionContext) {
      return false;
    }
    return subscriptionContext.hasReachedFreeLimit(limitType);
  }, [subscriptionContext]);

  const getCtaMessage = useCallback((ctaType: CtaType): CtaMessage => {
    return subscriptionService.getCtaMessage(ctaType);
  }, []);

  const getCurrentTier = useCallback((): SubscriptionTier | null => {
    if (!subscriptionContext) {
      return null;
    }
    return subscriptionContext.subscription.subscriptionTier;
  }, [subscriptionContext]);

  const getFreeTierUsage = useCallback((): FreeTierUsage | null => {
    if (!subscriptionContext || !subscriptionContext.freeTierUsage) {
      return null;
    }
    return subscriptionContext.freeTierUsage;
  }, [subscriptionContext]);

  const purchaseSubscription = useCallback(async (productId: string): Promise<boolean> => {
    return await subscriptionService.purchase(productId);
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    return await subscriptionService.restorePurchases();
  }, []);

  return {
    isLoading,
    subscriptionContext,
    checkFeatureAccess,
    checkFreeLimit,
    getCtaMessage,
    getCurrentTier,
    getFreeTierUsage,
    purchaseSubscription,
    restorePurchases,
  };
}
