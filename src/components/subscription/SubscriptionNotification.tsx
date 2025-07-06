import React from 'react';
import { Portal, Snackbar } from 'react-native-paper';

interface SubscriptionNotificationProps {
  visible: boolean;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss: () => void;
}

export const SubscriptionNotification: React.FC<SubscriptionNotificationProps> = ({
  visible,
  message,
  action,
  onDismiss,
}) => {
  return (
    <Portal>
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={5000}
        action={action}
      >
        {message}
      </Snackbar>
    </Portal>
  );
};
