import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  UserSubscription, 
  FreeTierUsage, 
  SubscriptionTier,
  SubscriptionStatus 
} from '../types/subscriptionTypes';
import { LoggingService } from '../services/loggingService';

interface SubscriptionStatusState {
  subscription: UserSubscription | null;
  usage: FreeTierUsage | null;
  isLoading: boolean;
  error: string | null;
}

export const useSubscriptionStatus = () => {
  const [state, setState] = useState<SubscriptionStatusState>({
    subscription: null,
    usage: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const logger = LoggingService.getInstance();
    let unsubscribeSubscription: (() => void) | null = null;
    let unsubscribeUsage: (() => void) | null = null;

    const setupListeners = (userId: string) => {
      // Listen to subscription changes
      unsubscribeSubscription = onSnapshot(
        doc(db, 'subscriptions', userId),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const subscription: UserSubscription = {
              subscriptionTier: data.subscriptionTier || SubscriptionTier.FREE,
              subscriptionStatus: data.subscriptionStatus || SubscriptionStatus.ACTIVE,
              subscriptionStartDate: data.subscriptionStartDate?.toMillis() || Date.now(),
              subscriptionEndDate: data.subscriptionEndDate?.toMillis(),
              freeTrialEndDate: data.freeTrialEndDate?.toMillis(),
              lastPaymentDate: data.lastPaymentDate?.toMillis(),
              nextBillingDate: data.nextBillingDate?.toMillis(),
              stripeCustomerId: data.stripeCustomerId,
              revenueCatUserId: data.revenueCatUserId,
              cancelAtPeriodEnd: data.cancelAtPeriodEnd,
              paymentMethod: data.paymentMethod,
              receiptData: data.receiptData,
            };

            setState(prev => ({ ...prev, subscription, isLoading: false }));
          } else {
            // Create default free subscription
            const defaultSubscription: UserSubscription = {
              subscriptionTier: SubscriptionTier.FREE,
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionStartDate: Date.now(),
            };
            setState(prev => ({ ...prev, subscription: defaultSubscription, isLoading: false }));
          }
        },
        (error) => {
          logger.error('Error listening to subscription changes', error);
          setState(prev => ({ ...prev, error: error.message, isLoading: false }));
        }
      );

      // Listen to usage changes
      unsubscribeUsage = onSnapshot(
        doc(db, 'freeTierUsage', userId),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const usage: FreeTierUsage = {
              freeSessionCount: data.freeSessionCount || 0,
              freeSessionDurationAccumulated: data.freeSessionDurationAccumulated || 0,
              savedScriptsCount: data.savedScriptsCount || 0,
              lastUpdated: data.lastUpdated?.toMillis() || Date.now(),
            };
            setState(prev => ({ ...prev, usage }));
          } else {
            // Create default usage
            const defaultUsage: FreeTierUsage = {
              freeSessionCount: 0,
              freeSessionDurationAccumulated: 0,
              savedScriptsCount: 0,
              lastUpdated: Date.now(),
            };
            setState(prev => ({ ...prev, usage: defaultUsage }));
          }
        },
        (error) => {
          logger.error('Error listening to usage changes', error);
        }
      );
    };

    // Listen to auth state changes
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setupListeners(user.uid);
      } else {
        // Clean up listeners and reset state
        if (unsubscribeSubscription) {
          unsubscribeSubscription();
        }
        if (unsubscribeUsage) {
          unsubscribeUsage();
        }
        setState({
          subscription: null,
          usage: null,
          isLoading: false,
          error: null
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSubscription) {
        unsubscribeSubscription();
      }
      if (unsubscribeUsage) {
        unsubscribeUsage();
      }
    };
  }, []);

  return state;
};
