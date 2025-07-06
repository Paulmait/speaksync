/**
 * Error Notification Component for SpeakSync
 * Displays user-friendly error notifications with actionable buttons
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Card, Button, IconButton } from 'react-native-paper';
import { ErrorInfo, ErrorAction } from '../../types/errorTypes';

interface Props {
  errorInfo: ErrorInfo;
  // eslint-disable-next-line no-unused-vars
  onAction: (actionId: string) => void;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
  persistent?: boolean;
  style?: Record<string, unknown>;
}

export const ErrorNotificationComponent: React.FC<Props> = ({
  errorInfo,
  onAction,
  onDismiss,
  autoHide = true,
  duration = 5000,
  persistent = false,
  style
}) => {
  const [visible, setVisible] = useState(true);
  const [slideAnim] = useState(new Animated.Value(-100));

  const handleDismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setVisible(false);
      onDismiss();
    });
  }, [slideAnim, onDismiss]);

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true
    }).start();

    // Auto hide if enabled and not persistent
    if (autoHide && !persistent) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [slideAnim, autoHide, persistent, duration, handleDismiss]);

  const handleActionPress = (action: ErrorAction) => {
    onAction(action.id);
    if (!persistent) {
      handleDismiss();
    }
  };

  const getSeverityColor = () => {
    switch (errorInfo.severity) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  const getSeverityIcon = () => {
    switch (errorInfo.severity) {
      case 'critical':
        return 'alert-circle';
      case 'high':
        return 'alert';
      case 'medium':
        return 'information';
      case 'low':
        return 'check-circle';
      default:
        return 'information';
    }
  };

  if (!visible) {
    return null;
  }

  const primaryAction = errorInfo.actions.find(action => action.isPrimary);
  const secondaryActions = errorInfo.actions.filter(action => !action.isPrimary).slice(0, 2);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
        style
      ]}
    >
      <Card style={[styles.card, { borderLeftColor: getSeverityColor() }]}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <IconButton
                icon={getSeverityIcon()}
                iconColor={getSeverityColor()}
                size={24}
                accessibilityLabel={`Error severity: ${errorInfo.severity}`}
              />
            </View>
            
            <View style={styles.messageContainer}>
              <Text style={styles.title}>
                {errorInfo.category.charAt(0).toUpperCase() + errorInfo.category.slice(1)} Error
              </Text>
              <Text style={styles.message} numberOfLines={3}>
                {errorInfo.userMessage}
              </Text>
            </View>
            
            {!persistent && (
              <IconButton
                icon="close"
                size={20}
                onPress={handleDismiss}
                accessibilityLabel="Dismiss notification"
                style={styles.closeButton}
              />
            )}
          </View>
          
          {errorInfo.actions.length > 0 && (
            <View style={styles.actions}>
              {primaryAction && (
                <Button
                  mode="contained"
                  onPress={() => handleActionPress(primaryAction)}
                  style={[styles.actionButton, styles.primaryAction]}
                  disabled={primaryAction.disabled}
                  accessibilityLabel={primaryAction.label}
                >
                  {primaryAction.label}
                </Button>
              )}
              
              <View style={styles.secondaryActions}>
                {secondaryActions.map((action) => (
                  <Button
                    key={action.id}
                    mode="outlined"
                    onPress={() => handleActionPress(action)}
                    style={styles.actionButton}
                    disabled={action.disabled}
                    accessibilityLabel={action.label}
                    compact
                  >
                    {action.label}
                  </Button>
                ))}
              </View>
            </View>
          )}
          
          {errorInfo.retryCount > 0 && (
            <Text style={styles.retryInfo}>
              Retry attempt {errorInfo.retryCount}
            </Text>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  card: {
    elevation: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  content: {
    paddingBottom: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  iconContainer: {
    marginRight: 8,
    marginTop: -8
  },
  messageContainer: {
    flex: 1,
    marginRight: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#212121'
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#424242'
  },
  closeButton: {
    margin: -8,
    marginTop: -12
  },
  actions: {
    marginTop: 12
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 4
  },
  primaryAction: {
    marginBottom: 8
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  retryInfo: {
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
    fontStyle: 'italic'
  }
});

export default ErrorNotificationComponent;
