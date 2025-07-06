import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Portal,
  Modal,
  Searchbar,
  Surface,
  IconButton,
  Chip,
} from 'react-native-paper';
import { LanguageOption } from '../types';
import MultiLanguageService from '../services/multiLanguageService';

interface LanguageSelectorProps {
  selectedLanguage?: LanguageOption | null;
  onLanguageSelect: (language: LanguageOption) => void;
  showDetectionInfo?: boolean;
  detectedLanguage?: LanguageOption | null;
  confidence?: number;
  showFlags?: boolean;
  title?: string;
  subtitle?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageSelect,
  showDetectionInfo = false,
  detectedLanguage,
  confidence,
  showFlags = true,
  title = 'Select Language',
  subtitle,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageOption[]>([]);
  const [filteredLanguages, setFilteredLanguages] = useState<LanguageOption[]>([]);

  const multiLanguageService = MultiLanguageService.getInstance();

  useEffect(() => {
    const languages = multiLanguageService.getSupportedLanguages();
    setSupportedLanguages(languages);
    setFilteredLanguages(languages);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLanguages(supportedLanguages);
    } else {
      const filtered = supportedLanguages.filter(
        (lang) =>
          lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLanguages(filtered);
    }
  }, [searchQuery, supportedLanguages]);

  const handleLanguageSelect = (language: LanguageOption) => {
    onLanguageSelect(language);
    setVisible(false);
    setSearchQuery('');
  };

  const renderLanguageItem = ({ item }: { item: LanguageOption }) => (
    <TouchableOpacity onPress={() => handleLanguageSelect(item)}>
      <Surface style={styles.languageItem}>
        <View style={styles.languageInfo}>
          {showFlags && (
            <Text style={styles.flag}>{item.flag}</Text>
          )}
          <View style={styles.languageText}>
            <Text style={styles.languageName}>{item.name}</Text>
            <Text style={styles.nativeName}>{item.nativeName}</Text>
          </View>
          {item.rtl && (
            <Chip
              mode="outlined"
              compact
              style={styles.rtlChip}
              textStyle={styles.chipText}
            >
              RTL
            </Chip>
          )}
        </View>
        {selectedLanguage?.code === item.code && (
          <IconButton icon="check" iconColor="#4CAF50" size={20} />
        )}
      </Surface>
    </TouchableOpacity>
  );

  const getDisplayText = () => {
    if (selectedLanguage) {
      return showFlags
        ? `${selectedLanguage.flag} ${selectedLanguage.name}`
        : selectedLanguage.name;
    }
    return 'Select Language';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Surface style={styles.selector}>
          <View style={styles.selectorContent}>
            <View style={styles.selectorText}>
              <Text style={styles.selectorTitle}>{title}</Text>
              {subtitle && <Text style={styles.selectorSubtitle}>{subtitle}</Text>}
            </View>
            <View style={styles.selectedLanguage}>
              <Text style={styles.selectedText}>{getDisplayText()}</Text>
              <IconButton icon="chevron-down" size={20} />
            </View>
          </View>
        </Surface>
      </TouchableOpacity>

      {showDetectionInfo && detectedLanguage && (
        <Card style={styles.detectionCard}>
          <Card.Content>
            <View style={styles.detectionContent}>
              <IconButton icon="auto-fix" size={20} iconColor="#2196F3" />
              <View style={styles.detectionText}>
                <Text style={styles.detectionTitle}>Auto-detected Language</Text>
                <Text style={styles.detectionLanguage}>
                  {showFlags && detectedLanguage.flag} {detectedLanguage.name}
                  {confidence && (
                    <Text style={styles.confidence}>
                      {' '}({Math.round(confidence * 100)}% confidence)
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Language</Text>
            <IconButton
              icon="close"
              onPress={() => setVisible(false)}
              style={styles.closeButton}
            />
          </View>

          <Searchbar
            placeholder="Search languages..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          <FlatList
            data={filteredLanguages}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            style={styles.languageList}
            showsVerticalScrollIndicator={false}
          />

          <Button
            mode="outlined"
            onPress={() => setVisible(false)}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selector: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    flex: 1,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectorSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  selectedLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detectionCard: {
    marginTop: 8,
    backgroundColor: '#E3F2FD',
  },
  detectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detectionText: {
    flex: 1,
    marginLeft: 8,
  },
  detectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  detectionLanguage: {
    fontSize: 14,
    color: '#1976D2',
  },
  confidence: {
    fontSize: 12,
    opacity: 0.8,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    margin: 0,
  },
  searchbar: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  nativeName: {
    fontSize: 12,
    opacity: 0.7,
  },
  rtlChip: {
    marginLeft: 8,
    height: 24,
  },
  chipText: {
    fontSize: 10,
  },
  cancelButton: {
    margin: 20,
    marginTop: 10,
  },
});

export default LanguageSelector;
