import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Checkbox,
  Button,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BrandedHeader from '../components/ui/BrandedHeader';
import { BRAND_COLORS } from '../constants/branding';
import { RootStackParamList } from '../types';
import { userConsentService } from '../services/userConsentService';
import { legalDocumentService } from '../services/legalDocumentService';
import { LegalDocumentType } from '../types/legalDocuments';
import { LoggingService } from '../services/loggingService';
import { useScriptStore } from '../store/scriptStore';

type OnboardingConsentNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OnboardingConsent'
>;

const { height } = Dimensions.get('window');
const logger = LoggingService.getInstance();

export default function OnboardingConsentScreen() {
  const navigation = useNavigation<OnboardingConsentNavigationProp>();
  const { authState } = useScriptStore();
  
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false);
  const [acknowledgedAI, setAcknowledgedAI] = useState(false);
  const [aiDataUsageConsent, setAiDataUsageConsent] = useState(false);

  const handleViewDocument = async (type: LegalDocumentType) => {
    try {
      const document = await legalDocumentService.getActiveDocument(type);
      if (document) {
        navigation.navigate('LegalDocuments' as never);
      } else {
        Alert.alert('Error', 'Document not available. Please try again later.');
      }
    } catch (error) {
      logger.error('Failed to load document', error as Error);
      Alert.alert('Error', 'Failed to load document. Please try again later.');
    }
  };

  const handleSubmitConsent = async () => {
    if (!agreedToTerms) {
      Alert.alert(
        'Terms Required',
        'You must agree to the Terms of Use to continue using SpeakSync.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!acknowledgedPrivacy || !acknowledgedAI) {
      Alert.alert(
        'Acknowledgment Required',
        'Please acknowledge that you have read the Privacy Policy and AI Disclaimer.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);

      if (!authState.user?.uid) {
        throw new Error('User not authenticated');
      }

      // Submit consent to backend
      await userConsentService.initializeUserConsent(authState.user.uid, {
        agreedToTerms,
        acknowledgedPrivacy,
        acknowledgedAI,
        aiDataUsageConsent,
        consentedAt: Date.now(),
      });

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' as never }],
      });

    } catch (error) {
      logger.error('Failed to submit consent', error as Error);
      Alert.alert(
        'Error',
        'Failed to submit consent. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const canProceed = agreedToTerms && acknowledgedPrivacy && acknowledgedAI;

  return (
    <View style={styles.container}>
      <BrandedHeader
        title="Welcome to SpeakSync"
        showBackButton={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.surface} elevation={2}>
          <View style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>
              Legal Agreement
            </Text>

            <Text variant="bodyMedium" style={styles.description}>
              Before you can start using SpeakSync, please review and agree to our legal documents.
              Your privacy and understanding of our services are important to us.
            </Text>

            <Divider style={styles.divider} />

            {/* Terms of Use */}
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={agreedToTerms ? 'checked' : 'unchecked'}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                color={BRAND_COLORS.PRIMARY_BLUE}
              />
              <View style={styles.checkboxContent}>
                <Text variant="bodyMedium" style={styles.checkboxText}>
                  I agree to the{' '}
                  <Text
                    style={styles.link}
                    onPress={() => handleViewDocument(LegalDocumentType.TERMS_OF_USE)}
                  >
                    Terms of Use
                  </Text>
                </Text>
                <Text variant="bodySmall" style={styles.checkboxDescription}>
                  Required - Terms and conditions for using SpeakSync
                </Text>
              </View>
            </View>

            {/* Privacy Policy */}
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={acknowledgedPrivacy ? 'checked' : 'unchecked'}
                onPress={() => setAcknowledgedPrivacy(!acknowledgedPrivacy)}
                color={BRAND_COLORS.PRIMARY_BLUE}
              />
              <View style={styles.checkboxContent}>
                <Text variant="bodyMedium" style={styles.checkboxText}>
                  I have read and acknowledge the{' '}
                  <Text
                    style={styles.link}
                    onPress={() => handleViewDocument(LegalDocumentType.PRIVACY_POLICY)}
                  >
                    Privacy Policy
                  </Text>
                </Text>
                <Text variant="bodySmall" style={styles.checkboxDescription}>
                  Required - How we collect, use, and protect your data
                </Text>
              </View>
            </View>

            {/* AI Disclaimer */}
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={acknowledgedAI ? 'checked' : 'unchecked'}
                onPress={() => setAcknowledgedAI(!acknowledgedAI)}
                color={BRAND_COLORS.PRIMARY_BLUE}
              />
              <View style={styles.checkboxContent}>
                <Text variant="bodyMedium" style={styles.checkboxText}>
                  I have read and acknowledge the{' '}
                  <Text
                    style={styles.link}
                    onPress={() => handleViewDocument(LegalDocumentType.AI_DISCLAIMER)}
                  >
                    AI Disclaimer
                  </Text>
                </Text>
                <Text variant="bodySmall" style={styles.checkboxDescription}>
                  Required - Important information about AI features and limitations
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* AI Data Usage Consent */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              AI Data Usage (Optional)
            </Text>

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={aiDataUsageConsent ? 'checked' : 'unchecked'}
                onPress={() => setAiDataUsageConsent(!aiDataUsageConsent)}
                color={BRAND_COLORS.SECONDARY_GREEN}
              />
              <View style={styles.checkboxContent}>
                <Text variant="bodyMedium" style={styles.checkboxText}>
                  Allow anonymized data to improve AI features
                </Text>
                <Text variant="bodySmall" style={styles.checkboxDescription}>
                  Optional - Help us improve speech analysis and coaching suggestions.
                  All data is anonymized and aggregated. You can change this anytime in settings.
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSubmitConsent}
                disabled={!canProceed || loading}
                style={[
                  styles.continueButton,
                  !canProceed && styles.disabledButton
                ]}
                labelStyle={styles.continueButtonLabel}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={BRAND_COLORS.WHITE} />
                ) : (
                  'Continue to SpeakSync'
                )}
              </Button>

              <Text variant="bodySmall" style={styles.footerText}>
                By continuing, you confirm that you have read and agree to the above terms.
              </Text>
            </View>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.GRAY_LIGHT,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  surface: {
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.WHITE,
  },
  content: {
    padding: 24,
  },
  title: {
    fontWeight: 'bold',
    color: BRAND_COLORS.BLACK,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: BRAND_COLORS.GRAY_DARK,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    color: BRAND_COLORS.BLACK,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkboxContent: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxText: {
    color: BRAND_COLORS.BLACK,
    lineHeight: 22,
    marginBottom: 4,
  },
  checkboxDescription: {
    color: BRAND_COLORS.GRAY_DARK,
    lineHeight: 18,
  },
  link: {
    color: BRAND_COLORS.PRIMARY_BLUE,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  continueButton: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
    minWidth: 200,
  },
  continueButtonLabel: {
    color: BRAND_COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: BRAND_COLORS.GRAY_MEDIUM,
  },
  footerText: {
    color: BRAND_COLORS.GRAY_DARK,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 24,
  },
});
