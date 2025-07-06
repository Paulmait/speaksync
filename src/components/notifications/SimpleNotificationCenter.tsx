import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Snackbar, Banner, Portal, useTheme } from 'react-native-paper';

interface NotificationItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface SimpleNotificationCenterProps {
  notifications: NotificationItem[];
  bannerNotifications: NotificationItem[];
  onNotificationDismiss: (id: string) => void;
  onBannerDismiss: (id: string) => void;
}

export const SimpleNotificationCenter: React.FC<SimpleNotificationCenterProps> = ({
  notifications,
  bannerNotifications,
  onNotificationDismiss,
  onBannerDismiss
}) => {
  const theme = useTheme();

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

  return (
    <Portal>
      {/* Banner notifications */}
      {bannerNotifications.map((notification) => (
        <Banner
          key={notification.id}
          visible={true}
          actions={[
            {
              label: 'Dismiss',
              onPress: () => onBannerDismiss(notification.id),
            },
            ...(notification.action ? [notification.action] : [])
          ]}
          icon={notification.type === 'error' ? 'alert-circle' : 'information'}
        >
          {notification.message}
        </Banner>
      ))}

      {/* Snackbar notifications */}
      <View style={styles.snackbarContainer}>
        {notifications.map((notification, index) => (
          <Snackbar
            key={notification.id}
            visible={true}
            onDismiss={() => onNotificationDismiss(notification.id)}
            duration={notification.persistent ? 0 : 4000}
            style={[
              styles.snackbar,
              { 
                backgroundColor: getSnackbarColor(notification.type),
                bottom: 20 + (index * 70)
              }
            ]}
          >
            {notification.message}
          </Snackbar>
        ))}
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

export type { NotificationItem };
