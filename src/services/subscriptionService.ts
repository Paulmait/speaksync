import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Subscription,
  SubscriptionTier,
  SubscriptionFeatures,
  SubscriptionUsage,
  FeatureGate,
  FeatureName,
  BillingInfo,
  Invoice,
  PaymentMethod,
} from '../types';

class SubscriptionService {
  private readonly FEATURE_LIMITS: Record<SubscriptionTier, SubscriptionFeatures> = {
    free: {
      maxScripts: 5,
      maxTeams: 1,
      maxTeamMembers: 3,
      maxStorageGB: 0.1,
      cloudSync: false,
      teamCollaboration: false,
      advancedAnalytics: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
      exportOptions: ['txt'],
      integrations: [],
    },
    personal: {
      maxScripts: 50,
      maxTeams: 3,
      maxTeamMembers: 5,
      maxStorageGB: 2,
      cloudSync: true,
      teamCollaboration: true,
      advancedAnalytics: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
      exportOptions: ['txt', 'pdf', 'docx'],
      integrations: ['google-drive', 'dropbox'],
    },
    business: {
      maxScripts: 500,
      maxTeams: 10,
      maxTeamMembers: 50,
      maxStorageGB: 20,
      cloudSync: true,
      teamCollaboration: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      exportOptions: ['txt', 'pdf', 'docx', 'html', 'rtf'],
      integrations: ['google-drive', 'dropbox', 'onedrive', 'sharepoint', 'slack'],
    },
    enterprise: {
      maxScripts: -1, // Unlimited
      maxTeams: -1, // Unlimited
      maxTeamMembers: 500,
      maxStorageGB: 100,
      cloudSync: true,
      teamCollaboration: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      exportOptions: ['txt', 'pdf', 'docx', 'html', 'rtf', 'xml', 'json'],
      integrations: ['google-drive', 'dropbox', 'onedrive', 'sharepoint', 'slack', 'teams', 'zoom', 'custom'],
    },
  };

  private readonly PRICING: Record<SubscriptionTier, { monthly: number; yearly: number }> = {
    free: { monthly: 0, yearly: 0 },
    personal: { monthly: 9.99, yearly: 99.99 },
    business: { monthly: 29.99, yearly: 299.99 },
    enterprise: { monthly: 99.99, yearly: 999.99 },
  };

  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', userId));
      
      if (!subscriptionDoc.exists()) {
        // Create a default free subscription
        return this.createFreeSubscription(userId);
      }

      const data = subscriptionDoc.data();
      return {
        id: subscriptionDoc.id,
        ...data,
        currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
        currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
        trialStart: data.trialStart?.toDate(),
        trialEnd: data.trialEnd?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        usage: {
          ...data.usage,
          lastUpdated: data.usage?.lastUpdated?.toDate() || new Date(),
        },
      } as Subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new Error('Failed to get subscription');
    }
  }

  private async createFreeSubscription(userId: string): Promise<Subscription> {
    const now = new Date();
    const subscription: Subscription = {
      id: userId,
      userId,
      tier: 'free',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      cancelAtPeriodEnd: false,
      features: this.FEATURE_LIMITS.free,
      usage: {
        scriptsUsed: 0,
        teamsUsed: 0,
        storageUsedGB: 0,
        teamMembersUsed: 0,
        lastUpdated: now,
      },
      createdAt: now,
      updatedAt: now,
    };

    await updateDoc(doc(db, 'subscriptions', userId), {
      ...subscription,
      currentPeriodStart: serverTimestamp(),
      currentPeriodEnd: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      'usage.lastUpdated': serverTimestamp(),
    });

    return subscription;
  }

  async updateSubscription(userId: string, tier: SubscriptionTier): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      const now = new Date();
      
      await updateDoc(subscriptionRef, {
        tier,
        features: this.FEATURE_LIMITS[tier],
        updatedAt: serverTimestamp(),
        // Update current period based on billing cycle
        currentPeriodStart: serverTimestamp(),
        currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      await updateDoc(subscriptionRef, {
        cancelAtPeriodEnd: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  async reactivateSubscription(userId: string): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      await updateDoc(subscriptionRef, {
        cancelAtPeriodEnd: false,
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  async updateUsage(userId: string, usage: Partial<SubscriptionUsage>): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      await updateDoc(subscriptionRef, {
        usage: {
          ...usage,
          lastUpdated: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating usage:', error);
      throw new Error('Failed to update usage');
    }
  }

  checkFeature(feature: FeatureName, subscription: Subscription | null): FeatureGate {
    if (!subscription) {
      return {
        feature,
        enabled: false,
        tier: 'free',
        reason: 'No subscription found',
        upgradeUrl: this.getUpgradeUrl(feature),
      };
    }

    const features = subscription.features;
    let enabled = false;
    let reason: string | undefined;

    switch (feature) {
      case 'unlimited_scripts':
        enabled = features.maxScripts === -1;
        reason = enabled ? undefined : `Limited to ${features.maxScripts} scripts`;
        break;
      case 'team_collaboration':
        enabled = features.teamCollaboration;
        reason = enabled ? undefined : 'Team collaboration not available';
        break;
      case 'advanced_analytics':
        enabled = features.advancedAnalytics;
        reason = enabled ? undefined : 'Advanced analytics not available';
        break;
      case 'priority_support':
        enabled = features.prioritySupport;
        reason = enabled ? undefined : 'Priority support not available';
        break;
      case 'custom_branding':
        enabled = features.customBranding;
        reason = enabled ? undefined : 'Custom branding not available';
        break;
      case 'api_access':
        enabled = features.apiAccess;
        reason = enabled ? undefined : 'API access not available';
        break;
      case 'bulk_export':
        enabled = features.exportOptions.length > 1;
        reason = enabled ? undefined : 'Limited export options';
        break;
      case 'integrations':
        enabled = features.integrations.length > 0;
        reason = enabled ? undefined : 'Integrations not available';
        break;
      case 'real_time_collaboration':
        enabled = features.teamCollaboration && subscription.tier !== 'free';
        reason = enabled ? undefined : 'Real-time collaboration not available';
        break;
      case 'version_history':
        enabled = subscription.tier !== 'free';
        reason = enabled ? undefined : 'Version history not available';
        break;
      default:
        enabled = false;
        reason = 'Unknown feature';
    }

    return {
      feature,
      enabled,
      tier: subscription.tier,
      reason,
      upgradeUrl: enabled ? undefined : this.getUpgradeUrl(feature),
    };
  }

  canUseFeature(feature: FeatureName, subscription: Subscription | null): boolean {
    return this.checkFeature(feature, subscription).enabled;
  }

  getUpgradeUrl(feature: FeatureName): string {
    // Return appropriate upgrade URL based on feature
    const baseUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://speaksync.app';
    return `${baseUrl}/pricing?feature=${feature}`;
  }

  async checkUsageLimits(userId: string): Promise<{
    scriptsLimitReached: boolean;
    teamsLimitReached: boolean;
    storageLimitReached: boolean;
    teamMembersLimitReached: boolean;
    warnings: string[];
  }> {
    try {
      const subscription = await this.getSubscription(userId);
      if (!subscription) {
        return {
          scriptsLimitReached: true,
          teamsLimitReached: true,
          storageLimitReached: true,
          teamMembersLimitReached: true,
          warnings: ['No subscription found'],
        };
      }

      const { features, usage } = subscription;
      const warnings: string[] = [];

      const scriptsLimitReached = features.maxScripts !== -1 && usage.scriptsUsed >= features.maxScripts;
      const teamsLimitReached = features.maxTeams !== -1 && usage.teamsUsed >= features.maxTeams;
      const storageLimitReached = usage.storageUsedGB >= features.maxStorageGB;
      const teamMembersLimitReached = usage.teamMembersUsed >= features.maxTeamMembers;

      // Add warnings when approaching limits
      if (features.maxScripts !== -1 && usage.scriptsUsed >= features.maxScripts * 0.8) {
        warnings.push(`Approaching script limit (${usage.scriptsUsed}/${features.maxScripts})`);
      }
      
      if (features.maxTeams !== -1 && usage.teamsUsed >= features.maxTeams * 0.8) {
        warnings.push(`Approaching team limit (${usage.teamsUsed}/${features.maxTeams})`);
      }

      if (usage.storageUsedGB >= features.maxStorageGB * 0.8) {
        warnings.push(`Approaching storage limit (${usage.storageUsedGB.toFixed(2)}GB/${features.maxStorageGB}GB)`);
      }

      return {
        scriptsLimitReached,
        teamsLimitReached,
        storageLimitReached,
        teamMembersLimitReached,
        warnings,
      };
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return {
        scriptsLimitReached: true,
        teamsLimitReached: true,
        storageLimitReached: true,
        teamMembersLimitReached: true,
        warnings: ['Error checking limits'],
      };
    }
  }

  subscribeToSubscription(userId: string, callback: (subscription: Subscription | null) => void): Unsubscribe {
    return onSnapshot(
      doc(db, 'subscriptions', userId),
      (doc) => {
        if (!doc.exists()) {
          callback(null);
          return;
        }

        const data = doc.data();
        const subscription: Subscription = {
          id: doc.id,
          ...data,
          currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
          currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
          trialStart: data.trialStart?.toDate(),
          trialEnd: data.trialEnd?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          usage: {
            ...data.usage,
            lastUpdated: data.usage?.lastUpdated?.toDate() || new Date(),
          },
        } as Subscription;

        callback(subscription);
      },
      (error) => {
        console.error('Error subscribing to subscription:', error);
        callback(null);
      }
    );
  }

  // Payment and billing methods (to be implemented with Stripe/RevenueCat)
  async createPaymentSession(userId: string, tier: SubscriptionTier, billingInterval: 'monthly' | 'yearly'): Promise<string> {
    // This would integrate with Stripe for web or RevenueCat for mobile
    // For now, return a placeholder URL
    const price = this.PRICING[tier][billingInterval];
    console.log(`Creating payment session for ${tier} (${billingInterval}): $${price}`);
    
    // In a real implementation, this would create a Stripe Checkout session
    // or handle RevenueCat subscription purchase
    return `https://checkout.stripe.com/pay/placeholder?tier=${tier}&interval=${billingInterval}`;
  }

  async handlePaymentSuccess(userId: string, tier: SubscriptionTier, stripeSubscriptionId?: string): Promise<void> {
    try {
      await this.updateSubscription(userId, tier);
      
      if (stripeSubscriptionId) {
        const subscriptionRef = doc(db, 'subscriptions', userId);
        await updateDoc(subscriptionRef, {
          stripeSubscriptionId,
          status: 'active',
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw new Error('Failed to handle payment success');
    }
  }

  async handlePaymentFailure(userId: string, reason: string): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      await updateDoc(subscriptionRef, {
        status: 'past_due',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // Utility methods
  getTierDisplayName(tier: SubscriptionTier): string {
    switch (tier) {
      case 'free': return 'Free';
      case 'personal': return 'Personal';
      case 'business': return 'Business';
      case 'enterprise': return 'Enterprise';
      default: return 'Unknown';
    }
  }

  getTierColor(tier: SubscriptionTier): string {
    switch (tier) {
      case 'free': return '#6B7280';
      case 'personal': return '#3B82F6';
      case 'business': return '#10B981';
      case 'enterprise': return '#8B5CF6';
      default: return '#6B7280';
    }
  }

  getFeaturesList(tier: SubscriptionTier): string[] {
    const features = this.FEATURE_LIMITS[tier];
    const list: string[] = [];

    if (features.maxScripts === -1) {
      list.push('Unlimited scripts');
    } else {
      list.push(`${features.maxScripts} scripts`);
    }

    if (features.maxTeams === -1) {
      list.push('Unlimited teams');
    } else {
      list.push(`${features.maxTeams} teams`);
    }

    list.push(`${features.maxTeamMembers} team members`);
    list.push(`${features.maxStorageGB}GB storage`);

    if (features.cloudSync) list.push('Cloud sync');
    if (features.teamCollaboration) list.push('Team collaboration');
    if (features.advancedAnalytics) list.push('Advanced analytics');
    if (features.prioritySupport) list.push('Priority support');
    if (features.customBranding) list.push('Custom branding');
    if (features.apiAccess) list.push('API access');

    return list;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
