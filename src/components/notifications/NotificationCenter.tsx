import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Snackbar, Banner, Portal, useTheme } from 'react-native-paper';
import { ErrorCategory, ErrorSeverity } from '../../types/errorTypes';

interface NotificationItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const NotificationCenter: React.FC = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bannerNotifications, setBannerNotifications] = useState<NotificationItem[]>([]);

  const showNotification = useCallback((notification: NotificationItem) => {
    setNotifications(prev => [...prev, notification]);
    
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        setNotifications(current => current.filter(n => n.id !== notification.id));
      }, notification.duration);
    }
  }, []);

  const showBannerNotification = useCallback((notification: NotificationItem) => {
    setBannerNotifications(prev => {
      // Remove existing notification of same type
      const notificationPrefix = notification.id.split('-')[0];
      const filtered = prev.filter(n => notificationPrefix && !n.id.startsWith(notificationPrefix));
      return [...filtered, notification];
    });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissBannerNotification = useCallback((id: string) => {
    setBannerNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showErrorNotification = useCallback((error: Error, category: ErrorCategory, severity: ErrorSeverity) => {
    // Only show user-facing errors
    if (severity === ErrorSeverity.MEDIUM || severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
      const notificationData: NotificationItem = {
        id: `error-${Date.now()}`,
        type: severity === ErrorSeverity.CRITICAL ? 'error' : 'warning',
        title: getErrorTitle(category),
        message: getUserFriendlyErrorMessage(error, category),
        duration: severity === ErrorSeverity.CRITICAL ? 0 : 4000,
        persistent: severity === ErrorSeverity.CRITICAL,
      };

      if (severity === ErrorSeverity.CRITICAL) {
        notificationData.action = {
          label: 'Retry',
          onPress: () => {
            handleErrorRecovery(category);
          }
        };
      }

      showNotification(notificationData);
    }
  }, [showNotification]);

  const showSubscriptionNotification = useCallback((type: 'upgrade' | 'limit' | 'expired', details?: string) => {
    switch (type) {
      case 'upgrade':
        showNotification({
          id: `sub-upgrade-${Date.now()}`,
          type: 'success',
          title: 'Subscription Upgraded',
          message: details || 'Welcome to your new subscription! Enjoy your new features.',
          duration: 5000
        });
        break;
      case 'limit':
        showBannerNotification({
          id: `sub-limit-${Date.now()}`,
          type: 'warning',
          title: 'Subscription Limit Reached',
          message: details || 'You\'ve reached your subscription limit. Upgrade to continue using all features.',
          persistent: true,            action: {
              label: 'Upgrade',
              onPress: () => {
                // Navigate to subscription screen - to be implemented
              }
            }
        });
        break;
      case 'expired':
        showBannerNotification({
          id: `sub-expired-${Date.now()}`,
          type: 'error',
          title: 'Subscription Expired',
          message: details || 'Your subscription has expired. Renew to continue using premium features.',
          persistent: true,
          action: {
            label: 'Renew',
            onPress: () => {
              // Navigate to subscription screen - to be implemented
            }
          }
        });
        break;
    }
  }, [showNotification, showBannerNotification]);

  const showNetworkNotification = useCallback((isOffline: boolean) => {
    if (isOffline) {
      showBannerNotification({
        id: `network-offline-${Date.now()}`,
        type: 'warning',
        title: 'Connection Issue',
        message: 'Your device appears to be offline. Some features may be limited.',
        persistent: true
      });
    } else {
      // Dismiss offline notification when back online
      setBannerNotifications(prev => prev.filter(n => !n.id.startsWith('network-offline')));
      showNotification({
        id: `network-online-${Date.now()}`,
        type: 'success',
        title: 'Connection Restored',
        message: 'You\'re back online!',
        duration: 3000
      });
    }
  }, [showBannerNotification, showNotification]);

  const getErrorTitle = (category: ErrorCategory): string => {
    switch (category) {
      case ErrorCategory.NETWORK:
        return 'Connection Error';
      case ErrorCategory.PERMISSION:
        return 'Permission Required';
      case ErrorCategory.VALIDATION:
        return 'Invalid Input';
      case ErrorCategory.SUBSCRIPTION:
        return 'Subscription Issue';
      case ErrorCategory.SYNC:
        return 'Sync Error';
      case ErrorCategory.STORAGE:
        return 'Storage Error';
      case ErrorCategory.PERFORMANCE:
        return 'Performance Issue';
      default:
        return 'Error';
    }
  };

  const getUserFriendlyErrorMessage = (error: Error, category: ErrorCategory): string => {
    // Provide user-friendly error messages based on category
    switch (category) {
      case ErrorCategory.NETWORK:
        return 'Please check your internet connection and try again.';
      case ErrorCategory.PERMISSION:
        return 'Please grant the required permissions to continue.';
      case ErrorCategory.SUBSCRIPTION:
        if (error.message.includes('limit reached')) {
          return 'You\'ve reached your subscription limit. Upgrade to continue.';
        }
        return 'There was an issue with your subscription. Please check your account.';
      case ErrorCategory.SYNC:
        return 'Unable to sync your data. Changes are saved locally.';
      case ErrorCategory.STORAGE:
        return 'Unable to save data. Please free up storage space.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleErrorRecovery = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.NETWORK:
        // Attempt to retry network operations
        break;
      case ErrorCategory.SYNC:
        // Attempt to re-sync data
        break;
      default:
        // Generic retry - refresh the current screen
        break;
    }
  };

  const getSnackbarColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'success':
        return '#10b981';
      case 'info':
      default:
        return theme.colors.primary;
    }
  };

  // This component is designed to be used as a singleton service
  // External access to methods would be handled through a notification service

  return (
    <Portal>
      {/* Banner notifications for persistent issues */}
      {bannerNotifications.map((notification) => (
        <Banner
          key={notification.id}
          visible={true}
          actions={[
            {
              label: 'Dismiss',
              onPress: () => dismissBannerNotification(notification.id),
            },
            ...(notification.action ? [notification.action] : [])
          ]}
          icon={notification.type === 'error' ? 'alert-circle' : 'information'}
        >
          {notification.message}
        </Banner>
      ))}

      {/* Snackbar notifications for temporary messages */}
      <View style={styles.snackbarContainer}>
        {notifications.map((notification, index) => {
          const snackbarProps: any = {
            key: notification.id,
            visible: true,
            onDismiss: () => dismissNotification(notification.id),
            duration: notification.persistent ? 0 : 4000,
            style: [
              styles.snackbar,
              { 
                backgroundColor: getSnackbarColor(notification.type),
                bottom: 20 + (index * 70) // Stack multiple notifications
              }
            ],
          };

          if (notification.action) {
            snackbarProps.action = {
              label: notification.action.label,
              onPress: notification.action.onPress,
              textColor: '#ffffff'
            };
          }

          return (
            <Snackbar {...snackbarProps}>
              {notification.message}
            </Snackbar>
          );
        })}
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  snackbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
});
