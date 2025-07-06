import React, { useState, useEffect } from 'react';
import { Portal, Snackbar } from 'react-native-paper';
import { monitoringService } from '../../services/monitoringService';
import { ErrorHandlingService } from '../../services/errorHandlingService';

interface ErrorNotification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const ErrorNotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<ErrorNotification | null>(null);

  useEffect(() => {
    // Set up error listener
    const errorService = ErrorHandlingService.getInstance();
    
    const handleError = (error: Error, context?: any) => {
      const notification: ErrorNotification = {
        id: Date.now().toString(),
        message: getErrorMessage(error),
        type: getErrorType(error),
        action: getErrorAction(error) || undefined
      };
      
      setNotifications(prev => [...prev, notification]);
    };

    // Set up monitoring event listener
    const handleMonitoringEvent = (event: any) => {
      if (event.type === 'performance_warning') {
        const notification: ErrorNotification = {
          id: Date.now().toString(),
          message: 'App performance is degraded. Consider restarting.',
          type: 'warning'
        };
        
        setNotifications(prev => [...prev, notification]);
      }
    };

    // Subscribe to error events (this would need to be implemented in ErrorHandlingService)
    // errorService.on('error', handleError);
    // monitoringService.on('event', handleMonitoringEvent);

    return () => {
      // Cleanup listeners
      // errorService.off('error', handleError);
      // monitoringService.off('event', handleMonitoringEvent);
    };
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      setCurrentNotification(notifications[0] || null);
    }
  }, [notifications, currentNotification]);

  const dismissNotification = () => {
    setNotifications(prev => prev.slice(1));
    setCurrentNotification(null);
  };

  const getErrorMessage = (error: Error): string => {
    // Map error types to user-friendly messages
    if (error.message.includes('network')) {
      return 'Network connection issue. Please check your internet.';
    }
    if (error.message.includes('subscription')) {
      return 'Subscription service unavailable. Please try again.';
    }
    if (error.message.includes('auth')) {
      return 'Authentication failed. Please sign in again.';
    }
    return 'Something went wrong. Please try again.';
  };

  const getErrorType = (error: Error): 'error' | 'warning' | 'info' => {
    if (error.message.includes('warning')) {
      return 'warning';
    }
    if (error.message.includes('info')) {
      return 'info';
    }
    return 'error';
  };

  const getErrorAction = (error: Error) => {
    if (error.message.includes('network')) {
      return {
        label: 'Retry',
        onPress: () => {
          // Implement retry logic
          window.location.reload();
        }
      };
    }
    return undefined;
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <Portal>
      <Snackbar
        visible={!!currentNotification}
        onDismiss={dismissNotification}
        duration={5000}
        {...(currentNotification.action && { action: currentNotification.action })}
      >
        {currentNotification.message}
      </Snackbar>
    </Portal>
  );
};
