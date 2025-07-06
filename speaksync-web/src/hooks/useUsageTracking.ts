'use client';

import { useState, useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CtaType, SubscriptionTier, FREE_TIER_LIMITS, FeatureFlags } from '@/types/subscription';

interface UseUsageTrackingReturn {
  // Script management
  canCreateScript: boolean;
  scriptCount: number;
  scriptLimit: number;
  handleScriptCreated: () => Promise<boolean>;
  handleScriptDeleted: () => Promise<void>;
  
  // Session management
  canStartSession: boolean;
  sessionCount: number;
  sessionLimit: number;
  sessionDuration: number;
  sessionDurationLimit: number;
  handleSessionStarted: () => Promise<boolean>;
  handleSessionDurationUpdate: (seconds: number) => Promise<boolean>;
  
  // Utility functions
  getRemainingScripts: () => number;
  getRemainingSessions: () => number;
  getRemainingTime: () => number;
  showUpgradePrompt: (type: CtaType) => void;
  
  // State
  upgradePromptType: CtaType | null;
  isUpgradePromptOpen: boolean;
  closeUpgradePrompt: () => void;
}

export function useUsageTracking(): UseUsageTrackingReturn {
  const subscription = useSubscription();
  const [upgradePromptType, setUpgradePromptType] = useState<CtaType | null>(null);
  const [isUpgradePromptOpen, setIsUpgradePromptOpen] = useState(false);

  // Get current usage and limits
  const scriptCount = subscription?.freeTierUsage?.savedScriptsCount || 0;
  const sessionCount = subscription?.freeTierUsage?.sessionCount || 0;
  const sessionDuration = subscription?.freeTierUsage?.totalSessionDuration || 0;
  
  const scriptLimit = subscription?.subscription.subscriptionTier === 'free' 
    ? FREE_TIER_LIMITS.MAX_SCRIPTS 
    : Infinity;
  
  const sessionLimit = subscription?.subscription.subscriptionTier === 'free'
    ? FREE_TIER_LIMITS.MAX_SESSION_COUNT
    : Infinity;
    
  const sessionDurationLimit = subscription?.subscription.subscriptionTier === 'free'
    ? FREE_TIER_LIMITS.MAX_SESSION_DURATION
    : Infinity;

  // Check if user can perform actions
  const canCreateScript = scriptCount < scriptLimit;
  const canStartSession = sessionCount < sessionLimit && sessionDuration < sessionDurationLimit;

  // Script management functions
  const handleScriptCreated = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;
    
    if (!canCreateScript) {
      setUpgradePromptType(CtaType.SCRIPT_LIMIT);
      setIsUpgradePromptOpen(true);
      return false;
    }
    
    try {
      await subscription.updateScriptCount(1);
      return true;
    } catch (error) {
      console.error('Error updating script count:', error);
      return false;
    }
  }, [subscription, canCreateScript]);

  const handleScriptDeleted = useCallback(async (): Promise<void> => {
    if (!subscription) return;
    
    try {
      await subscription.updateScriptCount(-1);
    } catch (error) {
      console.error('Error updating script count:', error);
    }
  }, [subscription]);

  // Session management functions
  const handleSessionStarted = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;
    
    if (!canStartSession) {
      if (sessionCount >= sessionLimit) {
        setUpgradePromptType(CtaType.SESSION_LIMIT);
      } else {
        setUpgradePromptType(CtaType.TIME_LIMIT);
      }
      setIsUpgradePromptOpen(true);
      return false;
    }
    
    try {
      await subscription.updateSessionCount(1);
      return true;
    } catch (error) {
      console.error('Error updating session count:', error);
      return false;
    }
  }, [subscription, canStartSession, sessionCount, sessionLimit]);

  const handleSessionDurationUpdate = useCallback(async (seconds: number): Promise<boolean> => {
    if (!subscription) return false;
    
    const newDuration = sessionDuration + seconds;
    
    if (newDuration > sessionDurationLimit && subscription.subscription.subscriptionTier === 'free') {
      setUpgradePromptType(CtaType.TIME_LIMIT);
      setIsUpgradePromptOpen(true);
      return false;
    }
    
    try {
      await subscription.updateSessionDuration(seconds);
      return true;
    } catch (error) {
      console.error('Error updating session duration:', error);
      return false;
    }
  }, [subscription, sessionDuration, sessionDurationLimit]);

  // Utility functions
  const getRemainingScripts = useCallback((): number => {
    return Math.max(0, scriptLimit - scriptCount);
  }, [scriptLimit, scriptCount]);

  const getRemainingSessions = useCallback((): number => {
    return Math.max(0, sessionLimit - sessionCount);
  }, [sessionLimit, sessionCount]);

  const getRemainingTime = useCallback((): number => {
    return Math.max(0, sessionDurationLimit - sessionDuration);
  }, [sessionDurationLimit, sessionDuration]);

  const showUpgradePrompt = useCallback((type: CtaType) => {
    setUpgradePromptType(type);
    setIsUpgradePromptOpen(true);
  }, []);

  const closeUpgradePrompt = useCallback(() => {
    setIsUpgradePromptOpen(false);
    setUpgradePromptType(null);
  }, []);

  return {
    // Script management
    canCreateScript,
    scriptCount,
    scriptLimit,
    handleScriptCreated,
    handleScriptDeleted,
    
    // Session management
    canStartSession,
    sessionCount,
    sessionLimit,
    sessionDuration,
    sessionDurationLimit,
    handleSessionStarted,
    handleSessionDurationUpdate,
    
    // Utility functions
    getRemainingScripts,
    getRemainingSessions,
    getRemainingTime,
    showUpgradePrompt,
    
    // State
    upgradePromptType,
    isUpgradePromptOpen,
    closeUpgradePrompt,
  };
}

// Helper hook for feature access checking
export function useFeatureAccess() {
  const subscription = useSubscription();
  const [upgradePromptType, setUpgradePromptType] = useState<CtaType | null>(null);
  const [isUpgradePromptOpen, setIsUpgradePromptOpen] = useState(false);

  const checkFeatureAccess = useCallback((feature: keyof FeatureFlags) => {
    if (!subscription) return false;
    
    const isAvailable = subscription.isFeatureAvailable(feature);
    
    if (!isAvailable) {
      setUpgradePromptType(CtaType.FEATURE_LOCKED);
      setIsUpgradePromptOpen(true);
      return false;
    }
    
    return true;
  }, [subscription]);

  const requireFeature = useCallback((feature: keyof FeatureFlags) => {
    if (!checkFeatureAccess(feature)) {
      throw new Error(`Feature ${feature} requires upgrade`);
    }
  }, [checkFeatureAccess]);

  const getRequiredTier = useCallback((feature: keyof FeatureFlags): SubscriptionTier | null => {
    if (!subscription) return SubscriptionTier.PRO;
    return subscription.upgradeNeeded(feature);
  }, [subscription]);

  const closeUpgradePrompt = useCallback(() => {
    setIsUpgradePromptOpen(false);
    setUpgradePromptType(null);
  }, []);

  return {
    checkFeatureAccess,
    requireFeature,
    getRequiredTier,
    upgradePromptType,
    isUpgradePromptOpen,
    closeUpgradePrompt,
  };
}
