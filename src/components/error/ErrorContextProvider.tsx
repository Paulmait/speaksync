/**
 * ErrorContextProvider for SpeakSync
 * Provides a centralized error management system for the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ErrorInfo, ErrorCategory, ErrorSeverity } from '../../types/errorTypes';
import { ErrorHandlingService } from '../../services/errorHandlingService';
import { ErrorNotificationComponent } from './ErrorNotificationComponent';
import { LoggingService } from '../../services/loggingService';

// eslint-disable-next-line no-unused-vars
interface ErrorContextType {
  currentError: ErrorInfo | null;
  // eslint-disable-next-line no-unused-vars
  setError: (error: Error, category?: ErrorCategory, severity?: ErrorSeverity) => void;
  clearError: () => void;
}

const defaultErrorContext: ErrorContextType = {
  currentError: null,
  setError: () => {},
  clearError: () => {},
};

export const ErrorContext = createContext<ErrorContextType>(defaultErrorContext);

export const useErrorContext = () => useContext(ErrorContext);

interface ErrorContextProviderProps {
  children: React.ReactNode;
}

export const ErrorContextProvider: React.FC<ErrorContextProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [errorHandlingService] = useState(() => ErrorHandlingService.getInstance());
  const [logger] = useState(() => LoggingService.getInstance());

  // Handle action from the error notification
  const handleAction = useCallback((actionId: string) => {
    logger.info('Error action triggered', { actionId });
    
    if (actionId === 'retry') {
      // Handle retry - we'll determine retry action based on error category
      if (currentError) {
        logger.info('Attempting to retry action', { category: currentError.category });
        // Increment retry count
        const updatedError = {
          ...currentError,
          retryCount: currentError.retryCount + 1
        };
        setCurrentError(updatedError);
        
        // Simple retry logic based on category - in a real app, this would be more sophisticated
        switch(currentError.category) {
          case ErrorCategory.NETWORK:
            // For example, we might trigger a sync operation
            logger.info('Retrying network operation');
            break;
          default:
            logger.info('No specific retry action for this error category');
        }
      }
    } else if (actionId === 'report') {
      // Report error to monitoring service
      if (currentError) {
        logger.info('Reporting error to monitoring service');
        errorHandlingService.reportErrorToMonitoring(currentError);
      }
    }
    
    // Clear the error after handling the action
    setCurrentError(null);
  }, [currentError, errorHandlingService, logger]);

  // Clear the current error
  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  // Set a new error with additional context
  const setError = useCallback((
    error: Error, 
    category: ErrorCategory = ErrorCategory.UI, 
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ) => {
    logger.error('Error occurred', error);
    
    const errorInfo: ErrorInfo = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      message: error.message || 'An unexpected error occurred',
      stack: error.stack,
      category,
      severity,
      context: {},
      isFatal: severity === ErrorSeverity.CRITICAL,
      tags: {},
      actions: [
        { id: 'dismiss', label: 'Dismiss', action: 'dismiss' },
        { id: 'retry', label: 'Retry', action: 'retry' },
        { id: 'report', label: 'Report', action: 'report' }
      ],
      userMessage: 'Something went wrong. Please try again later.',
      isResolved: false,
      retryCount: 0
    };
    
    setCurrentError(errorInfo);
    errorHandlingService.handleError(error, { category, severity });
  }, [errorHandlingService, logger]);

  // Subscribe to global errors from the error handling service
  useEffect(() => {
    const unsubscribe = errorHandlingService.subscribeToErrors((errorInfo: ErrorInfo) => {
      // Only show UI errors or high severity errors
      if (errorInfo.category === ErrorCategory.UI || 
          errorInfo.severity === ErrorSeverity.HIGH) {
        setCurrentError(errorInfo);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [errorHandlingService]);

  return (
    <ErrorContext.Provider value={{ currentError, setError, clearError }}>
      {children}
      {currentError && (
        <ErrorNotificationComponent 
          errorInfo={currentError}
          onAction={handleAction}
          onDismiss={clearError}
          persistent={currentError.severity === ErrorSeverity.HIGH}
        />
      )}
    </ErrorContext.Provider>
  );
};
