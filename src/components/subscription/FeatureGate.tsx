import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton } from 'react-native-paper';
import { useSubscriptionContext } from '../../contexts/SubscriptionContext';
import { CtaType, FeatureFlags } from '../../types/subscriptionTypes';

interface FeatureGateProps {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgrade?: () => void;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  onUpgrade,
}) => {
  const { checkFeatureAccess, getCtaMessage } = useSubscriptionContext();
  
  const hasAccess = checkFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const ctaMessage = getCtaMessage(CtaType.FEATURE_LOCKED);

  return (
    <Card style={styles.gateCard}>
      <Card.Content style={styles.gateContent}>
        <IconButton 
          icon="lock" 
          size={48} 
          iconColor="#9ca3af"
          style={styles.lockIcon}
        />
        <Title style={styles.gateTitle}>{ctaMessage.title}</Title>
        <Paragraph style={styles.gateDescription}>
          {ctaMessage.description}
        </Paragraph>
        <Button 
          mode="contained" 
          onPress={onUpgrade}
          style={styles.upgradeButton}
        >
          {ctaMessage.buttonText}
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  gateCard: {
    margin: 16,
  },
  gateContent: {
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: {
    marginBottom: 8,
  },
  gateTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  gateDescription: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#6b7280',
  },
  upgradeButton: {
    width: '100%',
  },
});
