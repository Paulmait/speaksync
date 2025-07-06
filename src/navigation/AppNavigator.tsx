import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, Portal, Modal, Text, Button } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types';
import { useScriptStore } from '../store/scriptStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { subscriptionService } from '../services/subscriptionService';
import { CtaType, SubscriptionTier } from '../types/subscriptionTypes';
import { LoggingService } from '../services/loggingService';
import { BRAND_COLORS } from '../constants/branding';
import { useConsentStatus } from '../hooks/useConsentStatus';
import PolicyUpdateModal from '../components/PolicyUpdateModal';
import { 
  HomeScreen, 
  ScriptEditorScreen, 
  TeleprompterScreen,
  AuthScreen,
  SignInScreen,
  SignUpScreen,
  ProfileScreen,
  AnalyticsScreen,
  SessionDetailScreen,
  SubscriptionScreen,
  LegalDocumentsScreen,
  OnboardingConsentScreen
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  colors: {
    primary: BRAND_COLORS.PRIMARY_BLUE,
    secondary: BRAND_COLORS.SECONDARY_GREEN,
    background: BRAND_COLORS.GRAY_LIGHT,
    surface: BRAND_COLORS.WHITE,
    text: BRAND_COLORS.BLACK,
    placeholder: BRAND_COLORS.GRAY_DARK,
  },
};

export default function AppNavigator() {
  const { authState } = useScriptStore();
  const { initializeRevenueCat } = useSubscriptionStore();
  const isAuthenticated = !!authState.user;
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [ctaMessage, setCtaMessage] = useState<{
    title: string;
    description: string;
    buttonText: string;
  } | null>(null);

  // Consent status checking
  const {
    consentStatus,
    showPolicyUpdate,
    policyUpdateData,
    handleConsentUpdated,
    dismissPolicyUpdate,
  } = useConsentStatus();

  // Initialize RevenueCat when the app starts
  useEffect(() => {
    const initSubscriptions = async () => {
      try {
        await initializeRevenueCat();
        
        // Also initialize our subscription service
        await subscriptionService.initialize();
      } catch (error) {
        const logger = LoggingService.getInstance();
        logger.error('Failed to initialize subscriptions', 
          error instanceof Error ? error : new Error(String(error)), {
          category: "SUBSCRIPTION",
          severity: "HIGH"
        });
      }
    };

    initSubscriptions();
  }, [initializeRevenueCat]);

  // Function to check feature access and show upgrade modal if needed
  const checkFeatureAccess = (feature: keyof typeof SubscriptionTier) => {
    const subscriptionContext = subscriptionService.getSubscriptionContext();
    if (!subscriptionContext.isFeatureAvailable(feature as any)) {
      // Show upgrade modal with proper CTA message
      const ctaInfo = subscriptionService.getCtaMessage(CtaType.FEATURE_LOCKED);
      setCtaMessage({
        title: ctaInfo.title,
        description: ctaInfo.description,
        buttonText: ctaInfo.buttonText
      });
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  // Handle upgrade button press
  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    // Navigate to subscription screen - will need to be implemented via navigation
  };

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {isAuthenticated ? (
            // Authenticated Stack
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: 'SpeakSync',
                  headerRight: () => (
                    <ProfileButton />
                  ),
                }}
              />
              <Stack.Screen
                name="ScriptEditor"
                component={ScriptEditorScreen}
                options={{
                  title: 'Script Editor',
                }}
              />
              <Stack.Screen
                name="Teleprompter"
                component={TeleprompterScreen}
                options={{
                  title: 'Teleprompter',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="Analytics"
                component={AnalyticsScreen}
                options={{
                  title: 'Analytics',
                }}
              />
              <Stack.Screen
                name="SessionDetail"
                component={SessionDetailScreen}
                options={{
                  title: 'Session Details',
                }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  title: 'Profile',
                }}
              />
              <Stack.Screen
                name="Subscription"
                component={SubscriptionScreen}
                options={{
                  title: 'Subscription',
                }}
              />
              <Stack.Screen
                name="LegalDocuments"
                component={LegalDocumentsScreen}
                options={{
                  title: 'Legal Documents',
                }}
              />
            </>
          ) : (
            // Authentication Stack
            <>
              <Stack.Screen
                name="Auth"
                component={AuthScreen}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="SignIn"
                component={SignInScreen}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="SignUp"
                component={SignUpScreen}
                options={{
                  headerShown: false,
                }}
              />
            </>
          )}
        </Stack.Navigator>
        
        {/* Feature Upgrade Modal */}
        <Portal>
          <Modal
            visible={showUpgradeModal}
            onDismiss={() => setShowUpgradeModal(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              {ctaMessage && (
                <>
                  <Text style={styles.modalTitle}>{ctaMessage.title}</Text>
                  <Text style={styles.modalDescription}>{ctaMessage.description}</Text>
                  <Button 
                    mode="contained" 
                    onPress={handleUpgrade}
                    style={styles.upgradeButton}
                  >
                    {ctaMessage.buttonText}
                  </Button>
                  <Button 
                    onPress={() => setShowUpgradeModal(false)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </View>
          </Modal>
        </Portal>

        {/* Policy Update Modal */}
        {showPolicyUpdate && policyUpdateData && authState.user && (
          <PolicyUpdateModal
            visible={showPolicyUpdate}
            onDismiss={dismissPolicyUpdate}
            onConsentUpdated={handleConsentUpdated}
            updateData={policyUpdateData}
            userId={authState.user.uid}
          />
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}

// Profile Button Component
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

function ProfileButton() {
  const navigation = useNavigation();
  
  return (
    <IconButton
      icon="account-circle"
      size={24}
      iconColor="#ffffff"
      onPress={() => navigation.navigate('Profile' as never)}
    />
  );
}

// Styles for the subscription modal
const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  upgradeButton: {
    marginBottom: 10,
    width: '100%',
  },
});
