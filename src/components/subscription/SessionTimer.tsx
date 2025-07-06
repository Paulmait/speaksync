import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Text, 
  Button, 
  Modal, 
  Portal, 
  Card,
  Title,
  Paragraph,
  useTheme,
  ProgressBar 
} from 'react-native-paper';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { FREE_TIER_LIMITS, SubscriptionTier } from '../../types/subscriptionTypes';
import { subscriptionService } from '../../services/subscriptionService';
import { auth } from '../../services/firebase';

interface SessionTimerProps {
  isActive: boolean;
  onTimeLimit: () => void;
  onUpgrade?: () => void;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ 
  isActive, 
  onTimeLimit, 
  onUpgrade 
}) => {
  const theme = useTheme();
  const { subscription, usage } = useSubscriptionStatus();
  const [sessionTime, setSessionTime] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const isFreeTier = subscription?.subscriptionTier === SubscriptionTier.FREE;
  const timeLimit = FREE_TIER_LIMITS.MAX_SESSION_DURATION; // 180 seconds (3 minutes)
  const usedTime = usage?.freeSessionDurationAccumulated || 0;
  const remainingTime = Math.max(0, timeLimit - usedTime);
  const currentSessionLimit = Math.min(remainingTime, timeLimit);

  useEffect(() => {
    if (isActive && isFreeTier) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000);
        setSessionTime(elapsed);

        // Check if we've hit the session limit
        if (elapsed >= currentSessionLimit) {
          // Stop the timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Track the session duration
          trackSessionDuration(elapsed);
          
          // Show limit modal and notify parent
          setShowLimitModal(true);
          onTimeLimit();
        }
      }, 1000);
    } else {
      // Clean up timer when not active
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Track session duration when stopping
      if (startTimeRef.current && sessionTime > 0) {
        trackSessionDuration(sessionTime);
      }

      setSessionTime(0);
      startTimeRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isFreeTier, currentSessionLimit, sessionTime]);

  const trackSessionDuration = async (duration: number) => {
    if (auth.currentUser && duration > 0) {
      await subscriptionService.trackSessionDuration(auth.currentUser.uid, duration);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (!isFreeTier || currentSessionLimit === 0) {
      return 0;
    }
    return sessionTime / currentSessionLimit;
  };

  const getProgressColor = (): string => {
    const progress = getProgress();
    if (progress < 0.7) {
      return theme.colors.primary;
    }
    if (progress < 0.9) {
      return '#f59e0b'; // Warning
    }
    return '#ef4444'; // Danger
  };

  // Don't show for paid users
  if (!isFreeTier) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.timerCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.timerText, { color: theme.colors.onSurface }]}>
          {formatTime(sessionTime)} / {formatTime(currentSessionLimit)}
        </Text>
        
        <ProgressBar 
          progress={getProgress()} 
          color={getProgressColor()}
          style={styles.progressBar}
        />
        
        {remainingTime < 60 && remainingTime > 0 && (
          <Text style={[styles.warningText, { color: '#f59e0b' }]}>
            Less than 1 minute of free time remaining!
          </Text>
        )}
        
        {remainingTime === 0 && sessionTime === 0 && (
          <Text style={[styles.warningText, { color: '#ef4444' }]}>
            Free time limit reached for today
          </Text>
        )}
      </View>

      <Portal>
        <Modal
          visible={showLimitModal}
          onDismiss={() => setShowLimitModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Card>
            <Card.Content>
              <Title>Session Time Limit Reached</Title>
              <Paragraph>
                You've reached your free session time limit. Upgrade to Pro for unlimited teleprompter time and access to all premium features.
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
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 100,
  },
  timerCard: {
    padding: 12,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 150,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  warningText: {
    fontSize: 12,
    textAlign: 'center',
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
