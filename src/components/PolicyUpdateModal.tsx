import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Portal,
  Modal,
  Text,
  Surface,
  Button,
  Divider,
  ActivityIndicator,
  Checkbox,
} from 'react-native-paper';
import { BRAND_COLORS } from '../constants/branding';
import { PolicyUpdateData } from '../types/userConsent';
import { userConsentService } from '../services/userConsentService';
import { legalDocumentService } from '../services/legalDocumentService';
import { LegalDocumentType } from '../types/legalDocuments';
import { LoggingService } from '../services/loggingService';

interface PolicyUpdateModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConsentUpdated: (hasConsented: boolean) => void;
  updateData: PolicyUpdateData;
  userId: string;
}

const logger = LoggingService.getInstance();

export default function PolicyUpdateModal({
  visible,
  onDismiss,
  onConsentUpdated,
  updateData,
  userId,
}: PolicyUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>('');

  const getDocumentTypeTitle = (type: string) => {
    switch (type) {
      case 'terms':
        return 'Terms of Use';
      case 'privacy':
        return 'Privacy Policy';
      case 'ai':
        return 'AI Disclaimer';
      default:
        return 'Legal Document';
    }
  };

  const getDocumentTypeLegal = (type: string): LegalDocumentType => {
    switch (type) {
      case 'terms':
        return LegalDocumentType.TERMS_OF_USE;
      case 'privacy':
        return LegalDocumentType.PRIVACY_POLICY;
      case 'ai':
        return LegalDocumentType.AI_DISCLAIMER;
      default:
        return LegalDocumentType.TERMS_OF_USE;
    }
  };

  const handleViewFullDocument = async () => {
    try {
      setViewingDocument(true);
      const document = await legalDocumentService.getActiveDocument(
        getDocumentTypeLegal(updateData.documentType)
      );
      
      if (document) {
        setDocumentContent(document.content);
      } else {
        Alert.alert('Error', 'Document not available');
      }
    } catch (error) {
      logger.error('Failed to load document', error as Error);
      Alert.alert('Error', 'Failed to load document');
    }
  };

  const handleSubmitConsent = async () => {
    if (!hasConsented) {
      Alert.alert(
        'Consent Required',
        `You must agree to the updated ${getDocumentTypeTitle(updateData.documentType)} to continue using SpeakSync.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      
      await userConsentService.updateUserConsent(
        userId,
        updateData,
        hasConsented
      );

      onConsentUpdated(hasConsented);
      onDismiss();
      
    } catch (error) {
      logger.error('Failed to update consent', error as Error);
      Alert.alert('Error', 'Failed to update consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (viewingDocument) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setViewingDocument(false)}
          contentContainerStyle={styles.documentModalContainer}
        >
          <Surface style={styles.documentSurface} elevation={4}>
            <View style={styles.documentHeader}>
              <Text variant="headlineSmall" style={styles.documentTitle}>
                {getDocumentTypeTitle(updateData.documentType)}
              </Text>
              <Button
                mode="text"
                onPress={() => setViewingDocument(false)}
                style={styles.closeButton}
              >
                Close
              </Button>
            </View>
            <Divider />
            <ScrollView style={styles.documentScroll}>
              <Text variant="bodyMedium" style={styles.documentContent}>
                {documentContent}
              </Text>
            </ScrollView>
          </Surface>
        </Modal>
      </Portal>
    );
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {}} // Prevent dismissal without action
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.surface} elevation={4}>
          <View style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>
              Updated Legal Document
            </Text>

            <Text variant="bodyMedium" style={styles.description}>
              We've updated our {getDocumentTypeTitle(updateData.documentType)}.
              Please review the changes and provide your consent to continue using SpeakSync.
            </Text>

            <View style={styles.versionInfo}>
              <Text variant="bodySmall" style={styles.versionText}>
                Previous Version: {updateData.previousVersion}
              </Text>
              <Text variant="bodySmall" style={styles.versionText}>
                New Version: {updateData.newVersion}
              </Text>
              <Text variant="bodySmall" style={styles.versionText}>
                Effective Date: {formatDate(updateData.effectiveDate)}
              </Text>
            </View>

            {updateData.summary && (
              <View style={styles.summaryContainer}>
                <Text variant="titleSmall" style={styles.summaryTitle}>
                  Summary of Changes:
                </Text>
                <Text variant="bodyMedium" style={styles.summaryText}>
                  {updateData.summary}
                </Text>
              </View>
            )}

            {updateData.changes && updateData.changes.length > 0 && (
              <View style={styles.changesContainer}>
                <Text variant="titleSmall" style={styles.changesTitle}>
                  Key Changes:
                </Text>
                {updateData.changes.map((change, index) => (
                  <Text key={index} variant="bodySmall" style={styles.changeItem}>
                    • {change}
                  </Text>
                ))}
              </View>
            )}

            <Button
              mode="outlined"
              onPress={handleViewFullDocument}
              style={styles.viewButton}
            >
              View Full Document
            </Button>

            <Divider style={styles.divider} />

            <View style={styles.consentContainer}>
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={hasConsented ? 'checked' : 'unchecked'}
                  onPress={() => setHasConsented(!hasConsented)}
                  color={BRAND_COLORS.PRIMARY_BLUE}
                />
                <Text variant="bodyMedium" style={styles.consentText}>
                  I have read and agree to the updated {getDocumentTypeTitle(updateData.documentType)}
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSubmitConsent}
                disabled={!hasConsented || loading}
                style={[
                  styles.submitButton,
                  (!hasConsented || loading) && styles.disabledButton
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={BRAND_COLORS.WHITE} />
                ) : (
                  'Accept and Continue'
                )}
              </Button>

              <Text variant="bodySmall" style={styles.footerText}>
                You must accept the updated terms to continue using SpeakSync
              </Text>
            </View>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    maxHeight: '90%',
  },
  surface: {
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.WHITE,
    maxHeight: '100%',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  versionInfo: {
    backgroundColor: BRAND_COLORS.GRAY_LIGHT,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  versionText: {
    color: BRAND_COLORS.GRAY_DARK,
    marginBottom: 4,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontWeight: '600',
    color: BRAND_COLORS.BLACK,
    marginBottom: 8,
  },
  summaryText: {
    color: BRAND_COLORS.GRAY_DARK,
    lineHeight: 22,
  },
  changesContainer: {
    marginBottom: 16,
  },
  changesTitle: {
    fontWeight: '600',
    color: BRAND_COLORS.BLACK,
    marginBottom: 8,
  },
  changeItem: {
    color: BRAND_COLORS.GRAY_DARK,
    marginBottom: 4,
    marginLeft: 8,
  },
  viewButton: {
    marginBottom: 20,
    borderColor: BRAND_COLORS.PRIMARY_BLUE,
  },
  divider: {
    marginVertical: 20,
  },
  consentContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consentText: {
    flex: 1,
    marginLeft: 12,
    color: BRAND_COLORS.BLACK,
    lineHeight: 22,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
    minWidth: 200,
  },
  disabledButton: {
    backgroundColor: BRAND_COLORS.GRAY_MEDIUM,
  },
  footerText: {
    color: BRAND_COLORS.GRAY_DARK,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  
  // Document viewer styles
  documentModalContainer: {
    margin: 20,
    height: '90%',
  },
  documentSurface: {
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.WHITE,
    height: '100%',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  documentTitle: {
    fontWeight: 'bold',
    color: BRAND_COLORS.BLACK,
  },
  closeButton: {
    marginRight: -8,
  },
  documentScroll: {
    flex: 1,
    padding: 20,
  },
  documentContent: {
    color: BRAND_COLORS.BLACK,
    lineHeight: 24,
  },
});
