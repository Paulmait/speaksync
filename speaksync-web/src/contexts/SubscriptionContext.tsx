'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import {
  SubscriptionTier,
  SubscriptionStatus,
  UserSubscription,
  FreeTierUsage,
  FeatureFlags,
  SubscriptionContext as SubscriptionContextType,
  FREE_TIER_LIMITS,
  CtaType,
  CtaMessage
} from '@/types/subscription';

// Default feature flags for each tier
const getFeatureFlags = (tier: SubscriptionTier): FeatureFlags => {
  const baseFeatures: FeatureFlags = {
    basicTeleprompter: true,
    scriptTemplates: false,
    scriptEditor: true,
    unlimitedTime: false,
    unlimitedScripts: false,
    cloudSync: false,
    aiFeedback: false,
    aiSuggestions: false,
    speechAnalysis: false,
    exportPdf: false,
    exportVideo: false,
    shareScripts: false,
    analytics: false,
    performanceMetrics: false,
    progressTracking: false,
    teamCollaboration: false,
    realTimeEditing: false,
    commentSystem: false,
    customBranding: false,
    apiAccess: false,
    prioritySupport: false,
  };

  switch (tier) {
    case SubscriptionTier.FREE:
      return baseFeatures;
    
    case SubscriptionTier.PRO:
      return {
        ...baseFeatures,
        scriptTemplates: true,
        unlimitedTime: true,
        unlimitedScripts: true,
        cloudSync: true,
        aiFeedback: true,
        aiSuggestions: true,
        exportPdf: true,
        shareScripts: true,
        analytics: true,
        performanceMetrics: true,
        progressTracking: true,
      };
    
    case SubscriptionTier.STUDIO:
      return {
        ...baseFeatures,
        scriptTemplates: true,
        unlimitedTime: true,
        unlimitedScripts: true,
        cloudSync: true,
        aiFeedback: true,
        aiSuggestions: true,
        speechAnalysis: true,
        exportPdf: true,
        exportVideo: true,
        shareScripts: true,
        analytics: true,
        performanceMetrics: true,
        progressTracking: true,
        teamCollaboration: true,
        realTimeEditing: true,
        commentSystem: true,
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
      };
    
    default:
      return baseFeatures;
  }
};

// Default subscription for new users
const getDefaultSubscription = (): UserSubscription => ({
  subscriptionTier: SubscriptionTier.FREE,
  subscriptionStatus: SubscriptionStatus.ACTIVE,
  subscriptionStartDate: Date.now(),
});

// Default free tier usage
const getDefaultFreeTierUsage = (): FreeTierUsage => ({
  savedScriptsCount: 0,
  sessionCount: 0,
  totalSessionDuration: 0,
  lastUpdated: Date.now(),
});

// CTA messages for different scenarios
export const getCtaMessage = (type: CtaType): CtaMessage => {
  const messages: Record<CtaType, CtaMessage> = {
    [CtaType.SCRIPT_LIMIT]: {
      title: "Script Limit Reached",
      description: "You've reached the maximum number of scripts for your free account. Upgrade to Pro to create unlimited scripts and unlock powerful features.",
      buttonText: "Upgrade to Pro",
      secondaryButtonText: "Manage Scripts",
      benefits: [
        "Unlimited scripts",
        "Cloud synchronization",
        "AI-powered feedback",
        "Export to PDF"
      ]
    },
    [CtaType.SESSION_LIMIT]: {
      title: "Session Limit Reached",
      description: "You've used all your free teleprompter sessions this month. Upgrade to continue practicing with unlimited sessions.",
      buttonText: "Upgrade Now",
      secondaryButtonText: "Wait Until Reset",
      benefits: [
        "Unlimited practice sessions",
        "Extended session duration",
        "Performance analytics",
        "Speech analysis"
      ]
    },
    [CtaType.TIME_LIMIT]: {
      title: "Time Limit Reached",
      description: "Your free session time is up! Upgrade to Pro for unlimited session duration and advanced features.",
      buttonText: "Upgrade to Pro",
      secondaryButtonText: "End Session",
      benefits: [
        "Unlimited session time",
        "Auto-save progress",
        "Advanced controls",
        "Performance tracking"
      ]
    },
    [CtaType.FEATURE_LOCKED]: {
      title: "Premium Feature",
      description: "This feature is available with Pro and Studio plans. Upgrade to unlock advanced tools and boost your presentation skills.",
      buttonText: "Upgrade Now",
      secondaryButtonText: "Learn More",
      benefits: [
        "AI feedback and suggestions",
        "Advanced analytics",
        "Export capabilities",
        "Team collaboration"
      ]
    },
    [CtaType.TRIAL_ENDING]: {
      title: "Trial Ending Soon",
      description: "Your free trial ends in a few days. Upgrade now to keep all your premium features and continue improving your presentations.",
      buttonText: "Upgrade Now",
      secondaryButtonText: "Remind Me Later",
      benefits: [
        "Keep all premium features",
        "Unlimited everything",
        "Priority support",
        "Advanced tools"
      ]
    },
    [CtaType.GENERAL_UPGRADE]: {
      title: "Unlock Your Potential",
      description: "Take your presentations to the next level with Pro features designed for serious speakers and content creators.",
      buttonText: "Upgrade to Pro",
      secondaryButtonText: "See All Plans",
      benefits: [
        "Professional tools",
        "Unlimited content",
        "AI assistance",
        "Analytics insights"
      ]
    }
  };

  return messages[type];
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [freeTierUsage, setFreeTierUsage] = useState<FreeTierUsage | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up real-time subscription listener
  useEffect(() => {
    if (!user?.id) {
      setSubscription(null);
      setFreeTierUsage(null);
      setLoading(false);
      return;
    }

    // Subscribe to subscription document
    const subscriptionUnsubscribe = onSnapshot(
      doc(db, 'subscriptions', user.id),
      (doc) => {
        if (doc.exists()) {
          setSubscription(doc.data() as UserSubscription);
        } else {
          // Create default subscription for new user
          const defaultSub = getDefaultSubscription();
          setDoc(doc.ref, defaultSub);
          setSubscription(defaultSub);
        }
      },
      (error) => {
        console.error('Error listening to subscription:', error);
        // Fallback to default free subscription
        setSubscription(getDefaultSubscription());
      }
    );

    // Subscribe to free tier usage document
    const usageUnsubscribe = onSnapshot(
      doc(db, 'freeTierUsage', user.id),
      (doc) => {
        if (doc.exists()) {
          setFreeTierUsage(doc.data() as FreeTierUsage);
        } else {
          // Create default usage tracking
          const defaultUsage = getDefaultFreeTierUsage();
          setDoc(doc.ref, defaultUsage);
          setFreeTierUsage(defaultUsage);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to free tier usage:', error);
        setFreeTierUsage(getDefaultFreeTierUsage());
        setLoading(false);
      }
    );

    return () => {
      subscriptionUnsubscribe();
      usageUnsubscribe();
    };
  }, [user?.id]);

  // Helper functions
  const isFeatureAvailable = (feature: keyof FeatureFlags): boolean => {
    if (!subscription) return false;
    const features = getFeatureFlags(subscription.subscriptionTier);
    return features[feature];
  };

  const isFreeTrial = (): boolean => {
    if (!subscription) return false;
    return subscription.subscriptionStatus === SubscriptionStatus.TRIALING;
  };

  const getDaysLeftInTrial = (): number | undefined => {
    if (!subscription?.freeTrialEndDate || !isFreeTrial()) return undefined;
    const daysLeft = Math.ceil((subscription.freeTrialEndDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const hasReachedFreeLimit = (limitType: 'scripts' | 'sessions' | 'time'): boolean => {
    if (!subscription || !freeTierUsage) return false;
    if (subscription.subscriptionTier !== SubscriptionTier.FREE) return false;

    switch (limitType) {
      case 'scripts':
        return freeTierUsage.savedScriptsCount >= FREE_TIER_LIMITS.MAX_SCRIPTS;
      case 'sessions':
        return freeTierUsage.sessionCount >= FREE_TIER_LIMITS.MAX_SESSION_COUNT;
      case 'time':
        return freeTierUsage.totalSessionDuration >= FREE_TIER_LIMITS.MAX_SESSION_DURATION;
      default:
        return false;
    }
  };

  const upgradeNeeded = (feature: keyof FeatureFlags): SubscriptionTier | null => {
    if (!subscription) return SubscriptionTier.PRO;
    if (isFeatureAvailable(feature)) return null;

    // Check if feature is available in Pro tier
    const proFeatures = getFeatureFlags(SubscriptionTier.PRO);
    if (proFeatures[feature]) {
      return SubscriptionTier.PRO;
    }

    // Must need Studio tier
    return SubscriptionTier.STUDIO;
  };

  // Usage tracking functions
  const updateScriptCount = async (increment: number = 1) => {
    if (!user?.id || !freeTierUsage) return;

    try {
      const newCount = Math.max(0, freeTierUsage.savedScriptsCount + increment);
      await updateDoc(doc(db, 'freeTierUsage', user.id), {
        savedScriptsCount: newCount,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error updating script count:', error);
    }
  };

  const updateSessionCount = async (increment: number = 1) => {
    if (!user?.id || !freeTierUsage) return;

    try {
      const newCount = freeTierUsage.sessionCount + increment;
      await updateDoc(doc(db, 'freeTierUsage', user.id), {
        sessionCount: newCount,
        lastSessionDate: Date.now(),
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error updating session count:', error);
    }
  };

  const updateSessionDuration = async (additionalSeconds: number) => {
    if (!user?.id || !freeTierUsage) return;

    try {
      const newDuration = freeTierUsage.totalSessionDuration + additionalSeconds;
      await updateDoc(doc(db, 'freeTierUsage', user.id), {
        totalSessionDuration: newDuration,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error updating session duration:', error);
    }
  };

  // Reset monthly usage (called by a scheduled function typically)
  const resetMonthlyUsage = async () => {
    if (!user?.id) return;

    try {
      await updateDoc(doc(db, 'freeTierUsage', user.id), {
        sessionCount: 0,
        totalSessionDuration: 0,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
    }
  };

  if (loading || !subscription) {
    return (
      <SubscriptionContext.Provider value={undefined}>
        {children}
      </SubscriptionContext.Provider>
    );
  }

  const value: SubscriptionContextType = {
    subscription,
    freeTierUsage: freeTierUsage || undefined,
    features: getFeatureFlags(subscription.subscriptionTier),
    isFeatureAvailable,
    isFreeTrial: isFreeTrial(),
    daysLeftInTrial: getDaysLeftInTrial(),
    hasReachedFreeLimit,
    upgradeNeeded,
    // Expose usage tracking functions
    updateScriptCount,
    updateSessionCount,
    updateSessionDuration,
    resetMonthlyUsage,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
