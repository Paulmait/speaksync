/**
 * Error Boundary Component for SpeakSync
 * Provides a React error boundary with recovery options and user-friendly error display
 */

import React, { Component, ErrorInfo as ReactErrorInfo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, IconButton } from 'react-native-paper';
import { ErrorInfo, ErrorBoundaryState, ErrorSeverity, ErrorCategory } from '../../types/errorTypes';
import { errorHandlingService } from '../../services/errorHandlingService';
import { ErrorNotificationComponent } from './ErrorNotificationComponent';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    errorInfo: ErrorInfo;
    retry: () => void;
    reportError: () => void;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showNotifications?: boolean;
}

interface State extends ErrorBoundaryState {
  showDetails: boolean;
  showNotification: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeout: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      maxRetries: props.maxRetries || 3,
      showDetails: false,
      showNotification: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, reactErrorInfo: ReactErrorInfo) {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      category: ErrorCategory.UI,
      severity: ErrorSeverity.HIGH,
      context: {
        componentStack: reactErrorInfo.componentStack,
        source: 'error_boundary',
        retryCount: this.state.retryCount
      },
      isFatal: false,
      tags: {
        component: 'ErrorBoundary',
        hasRetry: String(this.props.enableRetry !== false)
      },
      actions: [
        { id: 'retry', label: 'Try Again', action: 'retry', isPrimary: true },
        { id: 'report', label: 'Report Issue', action: 'report_bug' },
        { id: 'reload', label: 'Reload App', action: 'reload_app' }
      ],
      userMessage: this.generateUserMessage(error),
      isResolved: false,
      retryCount: this.state.retryCount
    };

    this.setState({ 
      errorInfo,
      showNotification: this.props.showNotifications !== false
    });

    // Report error to error handling service
    errorHandlingService.handleError(error, {
      category: ErrorCategory.UI,
      severity: ErrorSeverity.HIGH,
      context: {
        componentStack: reactErrorInfo.componentStack,
        source: 'error_boundary'
      }
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private generateErrorId(): string {
    return `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserMessage(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk') || message.includes('loading')) {
      return "We're having trouble loading part of the app. Please try refreshing.";
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return "We're having trouble connecting. Please check your internet connection.";
    }
    
    if (message.includes('permission')) {
      return "We need additional permissions to continue. Please check your settings.";
    }
    
    return "Something unexpected happened. Don't worry, we're working to fix this.";
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.state.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
        showDetails: false,
        showNotification: false
      }));

      // Add slight delay to allow UI to settle
      this.retryTimeout = setTimeout(() => {
        this.forceUpdate();
      }, 100);
    }
  };

  private handleReportError = () => {
    if (this.state.errorInfo) {
      errorHandlingService.submitUserErrorReport({
        errorId: this.state.errorInfo.id,
        userDescription: 'Error reported from ErrorBoundary',
        category: ErrorCategory.UI,
        severity: ErrorSeverity.HIGH,
        stepsToReproduce: 'Error occurred during normal app usage',
        expectedBehavior: 'App should work normally',
        actualBehavior: this.state.error?.message || 'App crashed',
        contactInfo: {
          allowFollowUp: true
        }
      });
    }
  };

  private handleReloadApp = () => {
    // For web environments
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
    // For React Native, this would need to be implemented with a restart package
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  private handleNotificationAction = (actionId: string) => {
    switch (actionId) {
      case 'retry':
        this.handleRetry();
        break;
      case 'report_bug':
        this.handleReportError();
        break;
      case 'reload_app':
        this.handleReloadApp();
        break;
    }
  };

  private dismissNotification = () => {
    this.setState({ showNotification: false });
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount, maxRetries, showDetails, showNotification } = this.state;
      const { fallback: FallbackComponent, enableRetry = true } = this.props;

      // Use custom fallback if provided
      if (FallbackComponent && error && errorInfo) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            retry={this.handleRetry}
            reportError={this.handleReportError}
          />
        );
      }

      const canRetry = enableRetry && retryCount < maxRetries;

      return (
        <View style={styles.container}>
          {showNotification && errorInfo && (
            <ErrorNotificationComponent
              errorInfo={errorInfo}
              onAction={this.handleNotificationAction}
              onDismiss={this.dismissNotification}
              autoHide={false}
              persistent={true}
            />
          )}
          
          <ScrollView contentContainerStyle={styles.content}>
            <Card style={styles.errorCard}>
              <Card.Content>
                <View style={styles.header}>
                  <Text style={styles.title}>Oops! Something went wrong</Text>
                  <IconButton
                    icon="information-outline"
                    onPress={this.toggleDetails}
                    accessibilityLabel="Toggle error details"
                  />
                </View>
                
                <Text style={styles.message}>
                  {errorInfo?.userMessage || "We're working to fix this issue."}
                </Text>
                
                {retryCount > 0 && (
                  <Text style={styles.retryInfo}>
                    Retry attempts: {retryCount} of {maxRetries}
                  </Text>
                )}
                
                {showDetails && error && (
                  <View style={styles.details}>
                    <Text style={styles.detailsTitle}>Technical Details:</Text>
                    <Text style={styles.errorMessage}>{error.message}</Text>
                    {error.stack && (
                      <ScrollView style={styles.stackTrace}>
                        <Text style={styles.stackText}>{error.stack}</Text>
                      </ScrollView>
                    )}
                  </View>
                )}
                
                <View style={styles.actions}>
                  {canRetry && (
                    <Button
                      mode="contained"
                      onPress={this.handleRetry}
                      style={styles.primaryButton}
                      accessibilityLabel="Try again"
                    >
                      Try Again
                    </Button>
                  )}
                  
                  <Button
                    mode="outlined"
                    onPress={this.handleReportError}
                    style={styles.secondaryButton}
                    accessibilityLabel="Report this issue"
                  >
                    Report Issue
                  </Button>
                  
                  <Button
                    mode="text"
                    onPress={this.handleReloadApp}
                    style={styles.textButton}
                    accessibilityLabel="Reload application"
                  >
                    Reload App
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16
  },
  errorCard: {
    margin: 8,
    elevation: 4
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    flex: 1
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
    color: '#424242'
  },
  retryInfo: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
    fontStyle: 'italic'
  },
  details: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#424242'
  },
  errorMessage: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 8,
    fontFamily: 'monospace'
  },
  stackTrace: {
    maxHeight: 200,
    backgroundColor: '#fafafa',
    padding: 8,
    borderRadius: 4
  },
  stackText: {
    fontSize: 12,
    color: '#616161',
    fontFamily: 'monospace'
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 16
  },
  primaryButton: {
    marginBottom: 8
  },
  secondaryButton: {
    marginBottom: 8
  },
  textButton: {
    alignSelf: 'center'
  }
});

export default ErrorBoundary;
