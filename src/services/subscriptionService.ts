import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Platform } from 'react-native';
import {
  SubscriptionTier,
  SubscriptionStatus,
  UserSubscription,
  FreeTierUsage,
  FeatureFlags,
  FREE_TIER_LIMITS,
  TierFeatureMapping,
  CtaType,
  CtaMessage,
  SubscriptionContext,
} from '../types/subscriptionTypes';
import { ErrorCategory, ErrorSeverity } from '../types/errorTypes';
import { LoggingService } from './loggingService';
import NetInfo from '@react-native-community/netinfo';
import RevenueCatService from './revenueCatService';

/**
 * Service for managing subscriptions, feature access, and usage tracking
 */
class SubscriptionService {
  private static instance: SubscriptionService | null = null;
  private logger: LoggingService;
  private userSubscription: UserSubscription | null = null;
  private freeTierUsage: FreeTierUsage | null = null;
  private unsubscribeListeners: Unsubscribe[] = [];
  private revenueCatService: RevenueCatService;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.revenueCatService = RevenueCatService.getInstance();
  }

  /**
   * Get the singleton instance of SubscriptionService
   */
  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Initialize the subscription service and RevenueCat
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize RevenueCat
      const apiKey = RevenueCatService.getPlatformApiKey();
      await this.revenueCatService.initialize({
        apiKey,
        debugMode: __DEV__,
      });

      // Set up auth state listener
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          // Get subscription from Firestore
          await this.fetchUserSubscription(user.uid);
          
          // Link user to RevenueCat
          await this.revenueCatService.setUserId(user.uid);
          
          // Listen for subscription changes
          this.setupSubscriptionListeners(user.uid);
        } else {
          // Clean up listeners when user signs out
          this.clearListeners();
          this.userSubscription = null;
          this.freeTierUsage = null;
        }
      });

    } catch (error) {
      this.logger.error("Failed to initialize subscription service", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.HIGH
      });
    }
  }

  /**
   * Set up listeners for subscription and usage changes
   */
  private setupSubscriptionListeners(userId: string): void {
    // Clear any existing listeners
    this.clearListeners();

    // Subscribe to subscription changes
    const subscriptionUnsubscribe = onSnapshot(
      doc(db, 'subscriptions', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          this.userSubscription = {
            subscriptionTier: data.subscriptionTier,
            subscriptionStatus: data.subscriptionStatus,
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
        } else {
          // No subscription document, create default free subscription
          this.createDefaultSubscription(userId);
        }
      },
      (error) => {
        this.logger.error("Error listening to subscription changes", 
          error instanceof Error ? error : new Error(String(error)), {
          category: ErrorCategory.SUBSCRIPTION,
          severity: ErrorSeverity.MEDIUM
        });
      }
    );

    // Subscribe to free tier usage changes
    const usageUnsubscribe = onSnapshot(
      doc(db, 'freeTierUsage', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          this.freeTierUsage = {
            freeSessionCount: data.freeSessionCount || 0,
            freeSessionDurationAccumulated: data.freeSessionDurationAccumulated || 0,
            savedScriptsCount: data.savedScriptsCount || 0,
            lastUpdated: data.lastUpdated?.toMillis() || Date.now(),
          };
        } else {
          // No usage document, create default
          this.createDefaultFreeTierUsage(userId);
        }
      },
      (error) => {
        this.logger.error("Error listening to usage changes", 
          error instanceof Error ? error : new Error(String(error)), {
          category: ErrorCategory.SUBSCRIPTION,
          severity: ErrorSeverity.MEDIUM
        });
      }
    );

    // Store unsubscribe functions
    this.unsubscribeListeners.push(subscriptionUnsubscribe, usageUnsubscribe);
  }

  /**
   * Clear all Firestore listeners
   */
  private clearListeners(): void {
    this.unsubscribeListeners.forEach(unsubscribe => unsubscribe());
    this.unsubscribeListeners = [];
  }

  /**
   * Fetch user subscription from Firestore
   */
  private async fetchUserSubscription(userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.userSubscription = {
          subscriptionTier: data.subscriptionTier,
          subscriptionStatus: data.subscriptionStatus,
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
      } else {
        // No subscription document found, create default
        await this.createDefaultSubscription(userId);
      }

      // Also fetch usage data
      await this.fetchFreeTierUsage(userId);

    } catch (error) {
      this.logger.error("Failed to fetch user subscription", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.MEDIUM
      });
      
      // Set default subscription as fallback
      this.userSubscription = {
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartDate: Date.now(),
      };
    }
  }

  /**
   * Fetch free tier usage data from Firestore
   */
  private async fetchFreeTierUsage(userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'freeTierUsage', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.freeTierUsage = {
          freeSessionCount: data.freeSessionCount || 0,
          freeSessionDurationAccumulated: data.freeSessionDurationAccumulated || 0,
          savedScriptsCount: data.savedScriptsCount || 0,
          lastUpdated: data.lastUpdated?.toMillis() || Date.now(),
        };
      } else {
        // No usage document found, create default
        await this.createDefaultFreeTierUsage(userId);
      }
    } catch (error) {
      this.logger.error("Failed to fetch free tier usage", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.MEDIUM
      });
      
      // Set default usage as fallback
      this.freeTierUsage = {
        freeSessionCount: 0,
        freeSessionDurationAccumulated: 0,
        savedScriptsCount: 0,
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Create default free subscription for new users
   */
  private async createDefaultSubscription(userId: string): Promise<void> {
    try {
      const defaultSubscription: UserSubscription = {
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartDate: Date.now(),
      };

      await setDoc(doc(db, 'subscriptions', userId), {
        ...defaultSubscription,
        subscriptionStartDate: serverTimestamp(),
      });

      this.userSubscription = defaultSubscription;
    } catch (error) {
      this.logger.error("Failed to create default subscription", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.MEDIUM
      });
    }
  }

  /**
   * Create default free tier usage tracking
   */
  private async createDefaultFreeTierUsage(userId: string): Promise<void> {
    try {
      const defaultUsage: FreeTierUsage = {
        freeSessionCount: 0,
        freeSessionDurationAccumulated: 0,
        savedScriptsCount: 0,
        lastUpdated: Date.now(),
      };

      await setDoc(doc(db, 'freeTierUsage', userId), {
        ...defaultUsage,
        lastUpdated: serverTimestamp(),
      });

      this.freeTierUsage = defaultUsage;
    } catch (error) {
      this.logger.error("Failed to create default free tier usage", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.MEDIUM
      });
    }
  }

  /**
   * Get the current subscription context with features and usage information
   */
  public getSubscriptionContext(): SubscriptionContext {
    if (!this.userSubscription) {
      // Return default free context if no subscription loaded
      return this.getDefaultSubscriptionContext();
    }

    const { subscriptionTier } = this.userSubscription;
    const features = TierFeatureMapping[subscriptionTier];
    
    // Check if user is in free trial
    const isFreeTrial = Boolean(
      this.userSubscription.freeTrialEndDate && 
      Date.now() < this.userSubscription.freeTrialEndDate
    );

    // Calculate days left in trial
    const daysLeftInTrial = this.userSubscription.freeTrialEndDate 
      ? Math.max(0, Math.ceil((this.userSubscription.freeTrialEndDate - Date.now()) / (1000 * 60 * 60 * 24)))
      : undefined;

    return {
      subscription: this.userSubscription,
      freeTierUsage: this.freeTierUsage || undefined,
      features,
      isFeatureAvailable: (feature) => this.isFeatureAvailable(feature),
      isFreeTrial,
      daysLeftInTrial,
      hasReachedFreeLimit: (limitType) => this.hasReachedFreeLimit(limitType),
      upgradeNeeded: (feature) => this.getUpgradeForFeature(feature),
    };
  }

  /**
   * Fallback free subscription context when data isn't loaded
   */
  private getDefaultSubscriptionContext(): SubscriptionContext {
    const defaultSubscription: UserSubscription = {
      subscriptionTier: SubscriptionTier.FREE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionStartDate: Date.now(),
    };

    const features = TierFeatureMapping[SubscriptionTier.FREE];

    return {
      subscription: defaultSubscription,
      features,
      isFeatureAvailable: (feature) => TierFeatureMapping[SubscriptionTier.FREE][feature],
      isFreeTrial: false,
      hasReachedFreeLimit: () => false,
      upgradeNeeded: (feature) => this.getUpgradeForFeature(feature),
    };
  }

  /**
   * Check if a specific feature is available for the current subscription
   */
  public isFeatureAvailable(feature: keyof FeatureFlags): boolean {
    if (!this.userSubscription) {
      return false;
    }

    return TierFeatureMapping[this.userSubscription.subscriptionTier][feature];
  }

  /**
   * Check if user has reached a free tier limit
   */
  public hasReachedFreeLimit(limitType: 'scripts' | 'sessions' | 'time'): boolean {
    // If not free tier, no limits apply
    if (this.userSubscription?.subscriptionTier !== SubscriptionTier.FREE) {
      return false;
    }

    if (!this.freeTierUsage) {
      return false; // Can't determine without usage data
    }

    switch (limitType) {
      case 'scripts':
        return this.freeTierUsage.savedScriptsCount >= FREE_TIER_LIMITS.MAX_SCRIPTS;
      case 'sessions':
        return this.freeTierUsage.freeSessionCount >= FREE_TIER_LIMITS.MAX_SESSION_COUNT;
      case 'time':
        return this.freeTierUsage.freeSessionDurationAccumulated >= FREE_TIER_LIMITS.MAX_SESSION_DURATION;
      default:
        return false;
    }
  }

  /**
   * Get the subscription tier needed to unlock a feature
   */
  public getUpgradeForFeature(feature: keyof FeatureFlags): SubscriptionTier | null {
    // If feature is already available, no upgrade needed
    if (this.isFeatureAvailable(feature)) {
      return null;
    }

    // Check which tier has this feature
    if (TierFeatureMapping[SubscriptionTier.PRO][feature]) {
      return SubscriptionTier.PRO;
    } else if (TierFeatureMapping[SubscriptionTier.STUDIO][feature]) {
      return SubscriptionTier.STUDIO;
    }

    return null; // Feature not available in any tier
  }

  /**
   * Track script creation for free tier limits
   */
  public async trackScriptCreation(userId: string): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      // Use transaction to ensure atomic update
      await runTransaction(db, async (transaction) => {
        const usageDocRef = doc(db, 'freeTierUsage', userId);
        const usageDoc = await transaction.get(usageDocRef);
        
        if (!usageDoc.exists()) {
          // Create default usage document if it doesn't exist
          transaction.set(usageDocRef, {
            freeSessionCount: 0,
            freeSessionDurationAccumulated: 0,
            savedScriptsCount: 1, // Start with this script
            lastUpdated: serverTimestamp(),
          });
        } else {
          // Increment script count
          transaction.update(usageDocRef, {
            savedScriptsCount: increment(1),
            lastUpdated: serverTimestamp(),
          });
        }
      });
      
      // Refresh usage data
      if (auth.currentUser) {
        await this.fetchFreeTierUsage(auth.currentUser.uid);
      }
      
      return true;
    } catch (error) {
      this.logger.error("Failed to track script creation", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.MEDIUM
      });
      return false;
    }
  }

  /**
   * Track session usage for free tier limits
   */
  public async trackSessionStart(userId: string): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      // Use transaction to ensure atomic update
      await runTransaction(db, async (transaction) => {
        const usageDocRef = doc(db, 'freeTierUsage', userId);
        const usageDoc = await transaction.get(usageDocRef);
        
        if (!usageDoc.exists()) {
          // Create default usage document if it doesn't exist
          transaction.set(usageDocRef, {
            freeSessionCount: 1, // Start with this session
            freeSessionDurationAccumulated: 0,
            savedScriptsCount: 0,
            lastUpdated: serverTimestamp(),
          });
        } else {
          // Increment session count
          transaction.update(usageDocRef, {
            freeSessionCount: increment(1),
            lastUpdated: serverTimestamp(),
          });
        }
      });
      
      // Refresh usage data
      if (auth.currentUser) {
        await this.fetchFreeTierUsage(auth.currentUser.uid);
      }
      
      return true;
    } catch (error) {
      this.logger.error("Failed to track session start", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.MEDIUM
      });
      return false;
    }
  }

  /**
   * Track session duration for free tier limits
   */
  public async trackSessionDuration(userId: string, durationInSeconds: number): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      // Use transaction to ensure atomic update
      await runTransaction(db, async (transaction) => {
        const usageDocRef = doc(db, 'freeTierUsage', userId);
        const usageDoc = await transaction.get(usageDocRef);
        
        if (!usageDoc.exists()) {
          // Create default usage document if it doesn't exist
          transaction.set(usageDocRef, {
            freeSessionCount: 1,
            freeSessionDurationAccumulated: durationInSeconds,
            savedScriptsCount: 0,
            lastUpdated: serverTimestamp(),
          });
        } else {
          // Add duration
          transaction.update(usageDocRef, {
            freeSessionDurationAccumulated: increment(durationInSeconds),
            lastUpdated: serverTimestamp(),
          });
        }
      });
      
      // Refresh usage data
      if (auth.currentUser) {
        await this.fetchFreeTierUsage(auth.currentUser.uid);
      }
      
      return true;
    } catch (error) {
      this.logger.error("Failed to track session duration", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.MEDIUM
      });
      return false;
    }
  }

  /**
   * Reset free tier usage limits when upgrading to paid plan
   */
  public async resetUsageLimits(userId: string): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      // Keep script count but reset session counts
      await updateDoc(doc(db, 'freeTierUsage', userId), {
        freeSessionCount: 0,
        freeSessionDurationAccumulated: 0,
        lastUpdated: serverTimestamp(),
      });
      
      // Refresh usage data
      if (auth.currentUser) {
        await this.fetchFreeTierUsage(auth.currentUser.uid);
      }
      
      return true;
    } catch (error) {
      this.logger.error("Failed to reset usage limits", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.MEDIUM
      });
      return false;
    }
  }

  /**
   * Get appropriate CTA message for a specific scenario
   */
  public getCtaMessage(ctaType: CtaType): CtaMessage {
    switch (ctaType) {
      case CtaType.SESSION_LIMIT:
        return {
          title: "Session Limit Reached",
          description: "You've reached the free limit of sessions. Upgrade to Pro for unlimited sessions.",
          buttonText: "Upgrade to Pro",
          targetTier: SubscriptionTier.PRO,
          image: "session_limit.png"
        };
      case CtaType.SCRIPT_LIMIT:
        return {
          title: "Script Limit Reached",
          description: "You've reached the free limit of saved scripts. Upgrade to Pro for unlimited scripts.",
          buttonText: "Upgrade to Pro",
          targetTier: SubscriptionTier.PRO,
          image: "script_limit.png"
        };
      case CtaType.TIME_LIMIT:
        return {
          title: "Time Limit Reached",
          description: "You've reached the free time limit. Upgrade to Pro for unlimited teleprompter time.",
          buttonText: "Upgrade to Pro",
          targetTier: SubscriptionTier.PRO,
          image: "time_limit.png"
        };
      case CtaType.FEATURE_LOCKED:
        return {
          title: "Feature Not Available",
          description: "This feature is only available on Pro and Studio plans.",
          buttonText: "See Plans",
          targetTier: SubscriptionTier.PRO,
          image: "feature_locked.png"
        };
      case CtaType.TRIAL_ENDING:
        return {
          title: "Trial Ending Soon",
          description: "Your free trial is ending soon. Upgrade now to keep all Pro features.",
          buttonText: "Upgrade Now",
          targetTier: SubscriptionTier.PRO,
          image: "trial_ending.png"
        };
      case CtaType.GENERAL_UPGRADE:
      default:
        return {
          title: "Upgrade Your Experience",
          description: "Unlock all premium features by upgrading to a Pro subscription.",
          buttonText: "See Plans",
          targetTier: SubscriptionTier.PRO,
          image: "upgrade.png"
        };
    }
  }

  /**
   * Handle purchase through RevenueCat
   */
  public async purchase(productId: string): Promise<boolean> {
    try {
      const isConnected = await this.checkInternetConnection();
      if (!isConnected) {
        throw new Error("No internet connection available");
      }

      if (!auth.currentUser?.uid) {
        throw new Error("User not authenticated");
      }

      const customerInfo = await this.revenueCatService.purchaseProduct(productId);
      
      // Determine which tier was purchased
      let newTier: SubscriptionTier;
      if (productId.includes('studio')) {
        newTier = SubscriptionTier.STUDIO;
      } else if (productId.includes('pro')) {
        newTier = SubscriptionTier.PRO;
      } else {
        newTier = SubscriptionTier.FREE;
      }

      // Update subscription in Firestore
      await this.updateSubscription(auth.currentUser.uid, {
        subscriptionTier: newTier,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        lastPaymentDate: Date.now(),
        revenueCatUserId: auth.currentUser.uid,
        receiptData: {
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          transactionId: customerInfo.originalPurchaseDate || Date.now().toString(),
          purchaseDate: Date.now(),
          receipt: 'stored_in_revenuecat',
        }
      });

      // Reset usage limits
      await this.resetUsageLimits(auth.currentUser.uid);

      return true;
    } catch (error) {
      this.logger.error("Purchase failed", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.HIGH
      });
      return false;
    }
  }

  /**
   * Update subscription data
   */
  private async updateSubscription(userId: string, updates: Partial<UserSubscription>): Promise<void> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new subscription if it doesn't exist
        const newSubscription: UserSubscription = {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: Date.now(),
          ...updates,
        };

        await setDoc(docRef, {
          ...newSubscription,
          updatedAt: serverTimestamp(),
          subscriptionStartDate: serverTimestamp(),
        });
      }
    } catch (error) {
      this.logger.error("Failed to update subscription", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.HIGH
      });
    }
  }

  /**
   * Restore previous purchases through RevenueCat
   */
  public async restorePurchases(): Promise<boolean> {
    try {
      const isConnected = await this.checkInternetConnection();
      if (!isConnected) {
        throw new Error("No internet connection available");
      }

      if (!auth.currentUser?.uid) {
        throw new Error("User not authenticated");
      }

      // Restore purchases through RevenueCat
      const customerInfo = await this.revenueCatService.restorePurchases();
      
      // Check for active subscriptions
      const activeSubscriptions = customerInfo.activeSubscriptions;
      
      // Determine which tier to assign
      let restoredTier = SubscriptionTier.FREE;
      
      if (activeSubscriptions.some(sub => sub.includes('studio'))) {
        restoredTier = SubscriptionTier.STUDIO;
      } else if (activeSubscriptions.some(sub => sub.includes('pro'))) {
        restoredTier = SubscriptionTier.PRO;
      }

      // Only update if we found an active subscription
      if (restoredTier === SubscriptionTier.PRO || restoredTier === SubscriptionTier.STUDIO) {
        // Update subscription in Firestore
        await this.updateSubscription(auth.currentUser.uid, {
          subscriptionTier: restoredTier,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          revenueCatUserId: auth.currentUser.uid
        });

        // Reset usage limits for paid plans
        await this.resetUsageLimits(auth.currentUser.uid);
        
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error("Restore purchases failed", 
        error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SUBSCRIPTION,
        severity: ErrorSeverity.HIGH
      });
      return false;
    }
  }

  /**
   * Check if we have an internet connection
   */
  private async checkInternetConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  }
}

export default SubscriptionService;
export const subscriptionService = SubscriptionService.getInstance();
