import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  List,
  Divider,
  ProgressBar,
  Dialog,
  Portal,
  ActivityIndicator,
  useTheme,
  Surface,
} from 'react-native-paper';
import { SubscriptionTier, FeatureFlags } from '../../types/subscriptionTypes';
import { subscriptionService } from '../../services';

interface SubscriptionManagerProps {
  userId: string;
  subscription: any | null; // Using any temporarily to fix TS errors
  onSubscriptionUpdate: (subscription: any) => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  userId,
  subscription,
  onSubscriptionUpdate,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [upgradeDialogVisible, setUpgradeDialogVisible] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(SubscriptionTier.PRO);
  const [usageLimits, setUsageLimits] = useState<any>(null);

  useEffect(() => {
    if (subscription) {
      checkUsageLimits();
    }
  }, [subscription]);

  const checkUsageLimits = async () => {
    try {
      const limits = await subscriptionService.checkUsageLimits(userId);
      setUsageLimits(limits);
    } catch (error) {
      console.error('Error checking usage limits:', error);
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      setLoading(true);
      
      // For mobile, we would integrate with RevenueCat here
      // For now, we'll show a placeholder
      Alert.alert(
        'Upgrade Subscription',
        `Upgrading to ${subscriptionService.getTierDisplayName(tier)}. This would open the payment flow.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              // Simulate upgrade
              await subscriptionService.updateSubscription(userId, tier);
              const updatedSubscription = await subscriptionService.getSubscription(userId);
              if (updatedSubscription) {
                onSubscriptionUpdate(updatedSubscription);
              }
              Alert.alert('Success', 'Subscription upgraded successfully!');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      Alert.alert('Error', 'Failed to upgrade subscription');
    } finally {
      setLoading(false);
      setUpgradeDialogVisible(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await subscriptionService.cancelSubscription(userId);
              const updatedSubscription = await subscriptionService.getSubscription(userId);
              if (updatedSubscription) {
                onSubscriptionUpdate(updatedSubscription);
              }
              Alert.alert('Success', 'Subscription cancelled successfully');
            } catch (error) {
              console.error('Error cancelling subscription:', error);
              Alert.alert('Error', 'Failed to cancel subscription');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    if (!subscription) return;

    try {
      setLoading(true);
      await subscriptionService.reactivateSubscription(userId);
      const updatedSubscription = await subscriptionService.getSubscription(userId);
      if (updatedSubscription) {
        onSubscriptionUpdate(updatedSubscription);
      }
      Alert.alert('Success', 'Subscription reactivated successfully!');
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      Alert.alert('Error', 'Failed to reactivate subscription');
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = () => {
    // In a real implementation, this would open the billing portal
    Alert.alert(
      'Billing Portal',
      'This would open the billing portal where you can manage your payment methods and view invoices.'
    );
  };

  const getTierColor = (tier: SubscriptionTier) => {
    return subscriptionService.getTierColor(tier);
  };

  const getUsagePercentage = (used: number, max: number) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((used / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return theme.colors.error;
    if (percentage >= 75) return theme.colors.onErrorContainer;
    return theme.colors.primary;
  };

  const renderFeatureStatus = (feature: FeatureName, label: string) => {
    const featureGate = subscriptionService.checkFeature(feature, subscription);
    return (
      <List.Item
        title={label}
        left={() => (
          <List.Icon
            icon={featureGate.enabled ? 'check-circle' : 'close-circle'}
            color={featureGate.enabled ? theme.colors.primary : theme.colors.outline}
          />
        )}
        right={() => (
          !featureGate.enabled && (
            <Button
              mode="text"
              compact
              onPress={() => {
                setSelectedTier('business');
                setUpgradeDialogVisible(true);
              }}
            >
              Upgrade
            </Button>
          )
        )}
        description={featureGate.enabled ? 'Available' : featureGate.reason}
      />
    );
  };

  const renderUsageItem = (label: string, used: number, max: number, unit: string = '') => {
    const percentage = getUsagePercentage(used, max);
    const isUnlimited = max === -1;
    
    return (
      <View style={styles.usageItem}>
        <View style={styles.usageHeader}>
          <Paragraph style={styles.usageLabel}>{label}</Paragraph>
          <Paragraph style={styles.usageText}>
            {used}{unit} {isUnlimited ? '/ Unlimited' : `/ ${max}${unit}`}
          </Paragraph>
        </View>
        {!isUnlimited && (
          <ProgressBar
            progress={percentage / 100}
            color={getUsageColor(percentage)}
            style={styles.progressBar}
          />
        )}
      </View>
    );
  };

  if (!subscription) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>Loading subscription...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Current Plan */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.planHeader}>
            <View>
              <Title style={styles.planTitle}>Current Plan</Title>
              <View style={styles.planTierContainer}>
                <Chip
                  style={[styles.tierChip, { backgroundColor: getTierColor(subscription.tier) }]}
                  textStyle={[styles.tierText, { color: theme.colors.onPrimary }]}
                >
                  {subscriptionService.getTierDisplayName(subscription.tier)}
                </Chip>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: subscription.status === 'active' 
                        ? theme.colors.primary 
                        : theme.colors.error
                    }
                  ]}
                  textStyle={{ color: theme.colors.onPrimary }}
                >
                  {subscription.status.toUpperCase()}
                </Chip>
              </View>
            </View>
            {subscription.tier !== 'enterprise' && (
              <Button
                mode="contained"
                onPress={() => setUpgradeDialogVisible(true)}
                disabled={loading}
              >
                Upgrade
              </Button>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.planDetails}>
            <Paragraph style={styles.detailText}>
              Billing Period: {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
            </Paragraph>
            {subscription.cancelAtPeriodEnd && (
              <Paragraph style={[styles.detailText, { color: theme.colors.error }]}>
                ⚠️ Subscription will be cancelled at the end of this period
              </Paragraph>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Usage */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Usage</Title>
          {subscription.usage && (
            <View style={styles.usageContainer}>
              {renderUsageItem(
                'Scripts',
                subscription.usage.scriptsUsed,
                subscription.features.maxScripts
              )}
              {renderUsageItem(
                'Teams',
                subscription.usage.teamsUsed,
                subscription.features.maxTeams
              )}
              {renderUsageItem(
                'Storage',
                subscription.usage.storageUsedGB,
                subscription.features.maxStorageGB,
                'GB'
              )}
              {renderUsageItem(
                'Team Members',
                subscription.usage.teamMembersUsed,
                subscription.features.maxTeamMembers
              )}
            </View>
          )}

          {usageLimits?.warnings.length > 0 && (
            <Surface style={styles.warningsContainer}>
              <Title style={styles.warningsTitle}>Usage Warnings</Title>
              {usageLimits.warnings.map((warning: string, index: number) => (
                <Paragraph key={index} style={styles.warningText}>
                  ⚠️ {warning}
                </Paragraph>
              ))}
            </Surface>
          )}
        </Card.Content>
      </Card>

      {/* Features */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Features</Title>
          <View style={styles.featuresContainer}>
            {renderFeatureStatus('team_collaboration', 'Team Collaboration')}
            {renderFeatureStatus('advanced_analytics', 'Advanced Analytics')}
            {renderFeatureStatus('priority_support', 'Priority Support')}
            {renderFeatureStatus('custom_branding', 'Custom Branding')}
            {renderFeatureStatus('api_access', 'API Access')}
            {renderFeatureStatus('bulk_export', 'Bulk Export')}
            {renderFeatureStatus('integrations', 'Integrations')}
          </View>
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Account</Title>
          <View style={styles.actionsContainer}>
            <Button
              mode="outlined"
              onPress={openBillingPortal}
              style={styles.actionButton}
              icon="credit-card"
            >
              Billing Portal
            </Button>
            
            {subscription.cancelAtPeriodEnd ? (
              <Button
                mode="contained"
                onPress={handleReactivate}
                style={styles.actionButton}
                loading={loading}
                disabled={loading}
                icon="restore"
              >
                Reactivate
              </Button>
            ) : (
              subscription.tier !== 'free' && (
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={[styles.actionButton, { borderColor: theme.colors.error }]}
                  textColor={theme.colors.error}
                  loading={loading}
                  disabled={loading}
                  icon="cancel"
                >
                  Cancel Subscription
                </Button>
              )
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Upgrade Dialog */}
      <Portal>
        <Dialog visible={upgradeDialogVisible} onDismiss={() => setUpgradeDialogVisible(false)}>
          <Dialog.Title>Upgrade Subscription</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.upgradeDescription}>
              Choose your new subscription tier:
            </Paragraph>
            
            <View style={styles.tierOptions}>
              {(['personal', 'business', 'enterprise'] as SubscriptionTier[])
                .filter(tier => tier !== subscription.tier)
                .map((tier) => (
                <Card
                  key={tier}
                  style={[
                    styles.tierCard,
                    selectedTier === tier && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedTier(tier)}
                >
                  <Card.Content style={styles.tierContent}>
                    <View style={styles.tierHeader}>
                      <Title style={styles.tierName}>
                        {subscriptionService.getTierDisplayName(tier)}
                      </Title>
                      <Chip
                        style={[styles.tierPriceChip, { backgroundColor: getTierColor(tier) }]}
                        textStyle={{ color: theme.colors.onPrimary }}
                      >
                        ${tier === 'personal' ? '9.99' : tier === 'business' ? '29.99' : '99.99'}/mo
                      </Chip>
                    </View>
                    <View style={styles.tierFeatures}>
                      {subscriptionService.getFeaturesList(tier).slice(0, 3).map((feature) => (
                        <Paragraph key={feature} style={styles.tierFeature}>
                          • {feature}
                        </Paragraph>
                      ))}
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUpgradeDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => handleUpgrade(selectedTier)}
              loading={loading}
              disabled={loading}
            >
              Upgrade to {subscriptionService.getTierDisplayName(selectedTier)}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  planTierContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tierChip: {
    height: 32,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    height: 32,
  },
  divider: {
    marginVertical: 16,
  },
  planDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  usageContainer: {
    gap: 16,
  },
  usageItem: {
    marginBottom: 8,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  usageText: {
    fontSize: 14,
    opacity: 0.7,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  warningsContainer: {
    padding: 12,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    marginBottom: 4,
  },
  featuresContainer: {
    gap: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  upgradeDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },
  tierOptions: {
    gap: 12,
  },
  tierCard: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tierContent: {
    paddingVertical: 12,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
  },
  tierPriceChip: {
    height: 28,
  },
  tierFeatures: {
    gap: 2,
  },
  tierFeature: {
    fontSize: 12,
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
});

export default SubscriptionManager;
