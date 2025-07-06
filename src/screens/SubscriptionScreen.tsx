import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Surface,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useSubscriptionStore, SubscriptionTier } from '../store/subscriptionStore';
import RevenueCatService from '../services/revenueCatService';

interface PlanCardProps {
  tier: SubscriptionTier;
  title: string;
  price: string;
  features: string[];
  isCurrentPlan: boolean;
  onSubscribe: () => void;
  loading: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  tier,
  title,
  price,
  features,
  isCurrentPlan,
  onSubscribe,
  loading,
}) => (
  <Card style={styles.planCard} mode="outlined">
    <Card.Content>
      <Text variant="headlineSmall" style={styles.planTitle}>
        {title}
      </Text>
      <Text variant="headlineMedium" style={styles.planPrice}>
        {price}
      </Text>
      <Text variant="bodyMedium" style={styles.planPeriod}>
        per month
      </Text>
      
      <Divider style={styles.divider} />
      
      {features.map((feature, index) => (
        <Text key={index} variant="bodyMedium" style={styles.feature}>
          • {feature}
        </Text>
      ))}
    </Card.Content>
    
    <Card.Actions>
      <Button
        mode={isCurrentPlan ? "outlined" : "contained"}
        onPress={onSubscribe}
        disabled={isCurrentPlan || loading}
        loading={loading}
        style={styles.subscribeButton}
      >
        {isCurrentPlan ? "Current Plan" : "Subscribe"}
      </Button>
    </Card.Actions>
  </Card>
);

export default function SubscriptionScreen() {
  const {
    subscription,
    isLoading,
    error,
    upgradeSubscription,
    restorePurchases,
    checkSubscriptionStatus,
  } = useSubscriptionStore();

  const [products, setProducts] = useState<any[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const revenueCatService = RevenueCatService.getInstance();
      const productList = await revenueCatService.getProducts();
      setProducts(productList);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleSubscribe = async (tier: SubscriptionTier) => {
    setLoadingPlan(tier);
    try {
      const success = await upgradeSubscription(tier);
      if (success) {
        Alert.alert('Success', `Successfully subscribed to ${tier} plan!`);
      } else {
        Alert.alert('Error', 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert('Success', 'Purchases restored successfully!');
      } else {
        Alert.alert('Info', 'No purchases found to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.');
    }
  };

  const plans = [
    {
      tier: 'free' as SubscriptionTier,
      title: 'Free',
      price: '$0',
      features: [
        'Up to 10 minutes recording',
        'Basic video quality',
        'Watermark included',
        '1GB cloud storage',
        'MP4 export only',
      ],
    },
    {
      tier: 'pro' as SubscriptionTier,
      title: 'Pro',
      price: '$9.99',
      features: [
        'Up to 1 hour recording',
        'High-quality video',
        'No watermark',
        'External display support',
        'Bluetooth remote control',
        '10GB cloud storage',
        'Multiple export formats',
      ],
    },
    {
      tier: 'studio' as SubscriptionTier,
      title: 'Studio',
      price: '$19.99',
      features: [
        'Up to 2 hours recording',
        '4K video quality',
        'No watermark',
        'External display support',
        'Bluetooth remote control',
        'Advanced analytics',
        '100GB cloud storage',
        'All export formats',
      ],
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading subscription information...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.header} elevation={1}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Choose Your Plan
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Unlock powerful features for professional teleprompter sessions
        </Text>
      </Surface>

      {error && (
        <Card style={styles.errorCard} mode="outlined">
          <Card.Content>
            <Text variant="bodyMedium" style={styles.errorText}>
              {error}
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.currentPlanContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Current Plan
        </Text>
        <Text variant="bodyLarge" style={styles.currentPlan}>
          {subscription?.tier?.toUpperCase() || 'FREE'}
        </Text>
        {subscription?.expiresAt && (
          <Text variant="bodyMedium" style={styles.expiryDate}>
            Expires: {subscription.expiresAt.toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.tier}
            tier={plan.tier}
            title={plan.title}
            price={plan.price}
            features={plan.features}
            isCurrentPlan={subscription?.tier === plan.tier}
            onSubscribe={() => handleSubscribe(plan.tier)}
            loading={loadingPlan === plan.tier}
          />
        ))}
      </View>

      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={handleRestorePurchases}
          style={styles.restoreButton}
        >
          Restore Purchases
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  header: {
    padding: 24,
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  errorText: {
    color: '#dc2626',
  },
  currentPlanContainer: {
    padding: 16,
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  currentPlan: {
    fontWeight: 'bold',
    color: '#6366f1',
    marginTop: 8,
  },
  expiryDate: {
    color: '#6b7280',
    marginTop: 4,
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  planTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  planPrice: {
    fontWeight: 'bold',
    color: '#6366f1',
    textAlign: 'center',
    marginTop: 8,
  },
  planPeriod: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  feature: {
    color: '#374151',
    marginBottom: 8,
  },
  subscribeButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  actionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  restoreButton: {
    marginTop: 16,
  },
});
