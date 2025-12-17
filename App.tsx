import 'react-native-polyfill-globals/auto';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { ErrorBoundary } from './src/components/error/ErrorBoundary';
import { ErrorContextProvider } from './src/components/error/ErrorContextProvider';
import { AccessibilityProvider } from './src/components/accessibility/AccessibilityProvider';
import { OnboardingProvider } from './src/components/onboarding/OnboardingProvider';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { SimpleNotificationCenter } from './src/components/notifications/SimpleNotificationCenter';
import { ErrorHandlingService } from './src/services/errorHandlingService';
import { monitoringService } from './src/services/monitoringService';
import { aiEthicsService } from './src/services/aiEthicsService';
import { LoggingService } from './src/services/loggingService';
import { environmentService } from './src/services/environmentService';
import { betaTestingService } from './src/services/betaTestingService';
import { securityService } from './src/services/securityService';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        // Get logger instance first
        const logger = LoggingService.getInstance();
        
        // Initialize environment service first
        logger.info('Initializing environment service');
        const envConfig = environmentService.getConfig();
        logger.info('Environment configuration loaded', {
          betaMode: envConfig.betaTestingMode,
          debugMode: envConfig.debugMode,
          platform: Platform.OS
        });
        
        // Initialize beta testing service
        logger.info('Initializing beta testing service');
        await betaTestingService.initialize();
        
        // Initialize security service
        logger.info('Initializing security service');
        await securityService.initialize();
        
        // Initialize monitoring and crash reporting
        logger.info('Initializing monitoring service');
        await monitoringService.initialize();
        
        // Initialize error handling
        logger.info('Initializing error handling service');
        await ErrorHandlingService.getInstance().initialize(); 
        
        // Initialize AI ethics monitoring
        logger.info('Initializing AI ethics service');
        const ethicsService = aiEthicsService;
        await ethicsService.updateSettings({
          enableBiasDetection: true,
          enableUserFeedback: true,
          enableAuditLogging: true,
        });
        
        // Initialize subscription service
        logger.info('Initializing subscription service');
        const subscriptionService = (await import('./src/services/subscriptionService')).default;
        await subscriptionService.getInstance().initialize();

        // Start session tracking
        logger.info('Starting monitoring session');
        await monitoringService.startSession();
        
        logger.info('All services initialized successfully');
      } catch (error) {
        // Handle initialization errors gracefully
        const logger = LoggingService.getInstance();
        logger.error('Failed to initialize services', error instanceof Error ? error : new Error('Unknown error'));
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      monitoringService.endSession().catch(() => {
        // Ignore cleanup errors
      });
    };
  }, []);

  return (
    <ErrorBoundary>
      <ErrorContextProvider>
        <AccessibilityProvider>
          <OnboardingProvider>
            <SubscriptionProvider>
              <AppNavigator />
              <SimpleNotificationCenter 
                notifications={[]}
                bannerNotifications={[]}
                onNotificationDismiss={() => {}}
                onBannerDismiss={() => {}}
              />
            </SubscriptionProvider>
          </OnboardingProvider>
        </AccessibilityProvider>
      </ErrorContextProvider>
    </ErrorBoundary>
  );
}
