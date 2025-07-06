import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  List,
  ActivityIndicator,
  Button,
  Portal,
  Modal,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { legalDocumentService } from '../services/legalDocumentService';
import BrandedHeader from '../components/ui/BrandedHeader';
import { BRAND_COLORS } from '../constants/branding';
import { RootStackParamList } from '../types';
import { LegalDocument } from '../types/legalDocuments';
import { LoggingService } from '../services/loggingService';

type LegalDocumentsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'LegalDocuments'
>;

const { height } = Dimensions.get('window');
const logger = LoggingService.getInstance();

export default function LegalDocumentsScreen() {
  const navigation = useNavigation<LegalDocumentsScreenNavigationProp>();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLegalDocuments();
  }, []);

  const loadLegalDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first for offline support
      const cachedDocuments = await loadCachedDocuments();
      if (cachedDocuments.length > 0) {
        setDocuments(cachedDocuments);
      }

      // Try to fetch fresh documents
      try {
        const activeDocuments = await legalDocumentService.getAllActiveDocuments();
        setDocuments(activeDocuments);
        
        // Cache the fresh documents
        await cacheDocuments(activeDocuments);
        logger.info('Legal documents loaded and cached', {
          category: 'legal_documents',
          count: activeDocuments.length
        });
      } catch (fetchError) {
        // If fetch fails but we have cached documents, use them
        if (cachedDocuments.length === 0) {
          throw fetchError;
        }
        logger.warn('Using cached legal documents due to fetch error', {
          category: 'legal_documents',
          error: fetchError
        });
      }
    } catch (err) {
      const errorMessage = 'Failed to load legal documents';
      setError(errorMessage);
      logger.error('Failed to load legal documents', err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadCachedDocuments = async (): Promise<LegalDocument[]> => {
    try {
      const cached = await AsyncStorage.getItem('cached_legal_documents');
      if (cached) {
        const parsedDocuments = JSON.parse(cached);
        logger.info('Loaded cached legal documents', {
          category: 'legal_documents',
          count: parsedDocuments.length
        });
        return parsedDocuments;
      }
    } catch (err) {
      logger.warn('Failed to load cached legal documents', {
        category: 'legal_documents',
        error: err
      });
    }
    return [];
  };

  const cacheDocuments = async (docs: LegalDocument[]) => {
    try {
      await AsyncStorage.setItem('cached_legal_documents', JSON.stringify(docs));
      logger.info('Legal documents cached successfully', {
        category: 'legal_documents',
        count: docs.length
      });
    } catch (err) {
      logger.warn('Failed to cache legal documents', {
        category: 'legal_documents',
        error: err
      });
    }
  };

  const openDocument = (document: LegalDocument) => {
    setSelectedDocument(document);
    setModalVisible(true);
    logger.info('Legal document opened', {
      category: 'legal_documents',
      document: document.name,
      version: document.version
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDocument(null);
  };

  const getDocumentIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'privacy policy':
        return 'shield-lock';
      case 'terms of use':
        return 'file-document';
      case 'ai features disclaimer':
        return 'robot';
      default:
        return 'file-document-outline';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderDocumentModal = () => (
    <Portal>
      <Modal
        visible={modalVisible}
        onDismiss={closeModal}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {selectedDocument?.name}
          </Text>
          <Text variant="bodySmall" style={styles.modalSubtitle}>
            Version {selectedDocument?.version} • Effective {selectedDocument?.effectiveDate ? formatDate(selectedDocument.effectiveDate) : 'N/A'}
          </Text>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text variant="bodyMedium" style={styles.documentContent}>
            {selectedDocument?.content}
          </Text>
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            mode="contained"
            onPress={closeModal}
            style={styles.closeButton}
          >
            Close
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <BrandedHeader
          title="Legal Documents"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND_COLORS.PRIMARY_BLUE} />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading legal documents...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <BrandedHeader
          title="Legal Documents"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error}
          </Text>
          <Button
            mode="contained"
            onPress={loadLegalDocuments}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BrandedHeader
        title="Legal Documents"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        <Surface style={styles.surface} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Legal Policies & Terms
          </Text>
          <Text variant="bodyMedium" style={styles.sectionDescription}>
            View our legal documents including privacy policy, terms of use, and AI disclaimer.
          </Text>
        </Surface>

        {documents.map((document) => (
          <Surface key={document.id} style={styles.documentCard} elevation={1}>
            <List.Item
              title={document.name}
              description={`Version ${document.version} • Effective ${formatDate(document.effectiveDate)}`}
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon={getDocumentIcon(document.name)}
                  color={BRAND_COLORS.PRIMARY_BLUE}
                />
              )}
              right={(props) => (
                <List.Icon 
                  {...props} 
                  icon="chevron-right"
                  color={BRAND_COLORS.GRAY_DARK}
                />
              )}
              onPress={() => openDocument(document)}
              style={styles.listItem}
            />
            
            {document.metadata?.estimatedReadingTime && (
              <View style={styles.documentMeta}>
                <Text variant="bodySmall" style={styles.metaText}>
                  📖 {document.metadata.estimatedReadingTime} min read
                </Text>
                {document.metadata.wordCount && (
                  <Text variant="bodySmall" style={styles.metaText}>
                    📝 {document.metadata.wordCount.toLocaleString()} words
                  </Text>
                )}
              </View>
            )}
          </Surface>
        ))}

        <Surface style={styles.infoCard} elevation={1}>
          <Text variant="titleSmall" style={styles.infoTitle}>
            📱 Offline Access
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            These documents are cached on your device for offline viewing. Pull to refresh for the latest versions.
          </Text>
        </Surface>
      </ScrollView>

      {renderDocumentModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.GRAY_LIGHT,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: BRAND_COLORS.GRAY_DARK,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    textAlign: 'center',
    color: BRAND_COLORS.GRAY_DARK,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
  },
  surface: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.WHITE,
  },
  sectionTitle: {
    color: BRAND_COLORS.BLACK,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    color: BRAND_COLORS.GRAY_DARK,
    lineHeight: 20,
  },
  documentCard: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.WHITE,
  },
  listItem: {
    paddingVertical: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  metaText: {
    color: BRAND_COLORS.GRAY_DARK,
    fontSize: 12,
  },
  infoCard: {
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.WHITE,
  },
  infoTitle: {
    color: BRAND_COLORS.BLACK,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: BRAND_COLORS.GRAY_DARK,
    lineHeight: 18,
  },
  modalContainer: {
    backgroundColor: BRAND_COLORS.WHITE,
    margin: 20,
    borderRadius: 12,
    maxHeight: height * 0.9,
    elevation: 5,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.GRAY_LIGHT,
  },
  modalTitle: {
    color: BRAND_COLORS.BLACK,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: BRAND_COLORS.GRAY_DARK,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  documentContent: {
    color: BRAND_COLORS.BLACK,
    lineHeight: 22,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.GRAY_LIGHT,
  },
  closeButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
  },
});
