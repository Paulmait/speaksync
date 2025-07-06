import React, { createContext, useContext, ReactNode } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { 
  SubscriptionContext as SubscriptionContextType, 
  CtaType, 
  CtaMessage,
  FeatureFlags,
  SubscriptionTier,
  FreeTierUsage
} from '../types/subscriptionTypes';

interface SubscriptionContextValue {
  isLoading: boolean;
  subscriptionContext: SubscriptionContextType | null;
  checkFeatureAccess: (feature: keyof FeatureFlags) => boolean;
  checkFreeLimit: (limitType: 'scripts' | 'sessions' | 'time') => boolean;
  getCtaMessage: (ctaType: CtaType) => CtaMessage;
  getCurrentTier: () => SubscriptionTier | null;
  getFreeTierUsage: () => FreeTierUsage | null;
  purchaseSubscription: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

export const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const subscription = useSubscription();
  
  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscriptionContext(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
