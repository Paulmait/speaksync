import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  IconButton, 
  Text, 
  Button, 
  Modal, 
  Portal, 
  Card,
  Title,
  Paragraph,
  useTheme 
} from 'react-native-paper';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { TierFeatureMapping, SubscriptionTier } from '../../types/subscriptionTypes';

interface FeatureLockProps {
  feature: keyof typeof TierFeatureMapping[SubscriptionTier.FREE];
  requiredTier: SubscriptionTier;
  children: React.ReactNode;
  onUpgrade?: () => void;
  fallbackComponent?: React.ReactNode;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({
  feature,
  requiredTier,
  children,
  onUpgrade,
  fallbackComponent
}) => {
  const theme = useTheme();
  const { subscription } = useSubscriptionStatus();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasFeatureAccess = () => {
    if (!subscription) {
      return false;
    }
    return TierFeatureMapping[subscription.subscriptionTier][feature];
  };

  const handleFeatureClick = () => {
    if (hasFeatureAccess()) {
      return;
    }
    setShowUpgradeModal(true);
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    if (onUpgrade) {
      onUpgrade();
    }
  };

  if (hasFeatureAccess()) {
    return <>{children}</>;
  }

  // Show locked state
  return (
    <View style={styles.lockedContainer}>
      <View style={[styles.lockedOverlay, { backgroundColor: theme.colors.surface }]}>
        <IconButton 
          icon="lock" 
          size={24} 
          iconColor={theme.colors.outline}
        />
        <Text style={[styles.lockedText, { color: theme.colors.outline }]}>
          {requiredTier} Feature
        </Text>
      </View>
      
      <View style={styles.disabledContent} pointerEvents="none">
        {fallbackComponent || children}
      </View>
      
      <View style={styles.unlockButton}>
        <Button 
          mode="contained" 
          compact 
          onPress={handleFeatureClick}
        >
          Unlock
        </Button>
      </View>

      <Portal>
        <Modal
          visible={showUpgradeModal}
          onDismiss={() => setShowUpgradeModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Card>
            <Card.Content>
              <Title>Upgrade Required</Title>
              <Paragraph>
                This feature requires a {requiredTier} subscription. Upgrade now to unlock all premium features.
              </Paragraph>
              
              <View style={styles.modalButtons}>
                <Button 
                  mode="contained" 
                  onPress={handleUpgrade}
                  style={styles.upgradeButton}
                >
                  Upgrade to {requiredTier}
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowUpgradeModal(false)}
                >
                  Cancel
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  lockedContainer: {
    position: 'relative',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 8,
    opacity: 0.9,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  disabledContent: {
    opacity: 0.3,
  },
  unlockButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 11,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  upgradeButton: {
    flex: 1,
  },
});
