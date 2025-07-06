import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Text, 
  ProgressBar, 
  Card, 
  Button, 
  Modal, 
  Portal,
  Title,
  Paragraph,
  useTheme 
} from 'react-native-paper';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { FREE_TIER_LIMITS, SubscriptionTier } from '../../types/subscriptionTypes';

interface UsageTrackerProps {
  type: 'scripts' | 'sessions' | 'time';
  onUpgrade?: () => void;
}

export const UsageTracker: React.FC<UsageTrackerProps> = ({ type, onUpgrade }) => {
  const theme = useTheme();
  const { subscription, usage } = useSubscriptionStatus();
  const [showLimitModal, setShowLimitModal] = useState(false);

  const isFreeTier = subscription?.subscriptionTier === SubscriptionTier.FREE;

  const getUsageInfo = () => {
    if (!usage || !isFreeTier) {
      return { current: 0, limit: 0, progress: 0, limitReached: false };
    }

    switch (type) {
      case 'scripts':
        return {
          current: usage.savedScriptsCount,
          limit: FREE_TIER_LIMITS.MAX_SCRIPTS,
          progress: usage.savedScriptsCount / FREE_TIER_LIMITS.MAX_SCRIPTS,
          limitReached: usage.savedScriptsCount >= FREE_TIER_LIMITS.MAX_SCRIPTS
        };
      case 'sessions':
        return {
          current: usage.freeSessionCount,
          limit: FREE_TIER_LIMITS.MAX_SESSION_COUNT,
          progress: usage.freeSessionCount / FREE_TIER_LIMITS.MAX_SESSION_COUNT,
          limitReached: usage.freeSessionCount >= FREE_TIER_LIMITS.MAX_SESSION_COUNT
        };
      case 'time':
        return {
          current: Math.floor(usage.freeSessionDurationAccumulated / 60), // Convert to minutes
          limit: Math.floor(FREE_TIER_LIMITS.MAX_SESSION_DURATION / 60), // Convert to minutes
          progress: usage.freeSessionDurationAccumulated / FREE_TIER_LIMITS.MAX_SESSION_DURATION,
          limitReached: usage.freeSessionDurationAccumulated >= FREE_TIER_LIMITS.MAX_SESSION_DURATION
        };
      default:
        return { current: 0, limit: 0, progress: 0, limitReached: false };
    }
  };

  const { current, limit, progress, limitReached } = getUsageInfo();

  const getDisplayText = () => {
    switch (type) {
      case 'scripts':
        return `Scripts: ${current}/${limit}`;
      case 'sessions':
        return `Sessions: ${current}/${limit}`;
      case 'time':
        return `Time: ${current}/${limit} min`;
      default:
        return '';
    }
  };

  const getProgressColor = () => {
    if (progress < 0.7) {
      return theme.colors.primary;
    }
    if (progress < 0.9) {
      return '#f59e0b'; // Warning color
    }
    return '#ef4444'; // Danger color
  };

  useEffect(() => {
    if (limitReached) {
      setShowLimitModal(true);
    }
  }, [limitReached]);

  if (!isFreeTier) {
    return null; // Don't show for paid users
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.usageText, { color: theme.colors.onSurface }]}>
            {getDisplayText()}
          </Text>
          <ProgressBar 
            progress={Math.min(progress, 1)} 
            color={getProgressColor()}
            style={styles.progressBar}
          />
          {progress > 0.8 && !limitReached && (
            <Text style={[styles.warningText, { color: '#f59e0b' }]}>
              {type === 'scripts' ? 'Almost at script limit!' : 
               type === 'sessions' ? 'Few sessions remaining!' : 
               'Time running low!'}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={showLimitModal}
          onDismiss={() => setShowLimitModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Card>
            <Card.Content>
              <Title>Limit Reached</Title>
              <Paragraph>
                {type === 'scripts' && 'You\'ve reached the free limit of 1 saved script. Upgrade to Pro for unlimited scripts.'}
                {type === 'sessions' && 'You\'ve reached the free limit of 5 sessions. Upgrade to Pro for unlimited sessions.'}
                {type === 'time' && 'You\'ve reached the free time limit of 3 minutes. Upgrade to Pro for unlimited time.'}
              </Paragraph>
              
              <View style={styles.modalButtons}>
                <Button 
                  mode="contained" 
                  onPress={() => {
                    setShowLimitModal(false);
                    if (onUpgrade) {
                      onUpgrade();
                    }
                  }}
                  style={styles.upgradeButton}
                >
                  Upgrade to Pro
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowLimitModal(false)}
                >
                  Close
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
  container: {
    padding: 8,
  },
  card: {
    elevation: 2,
  },
  usageText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  warningText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
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
