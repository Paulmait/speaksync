import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  I18nManager,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  IconButton,
  Surface,
  Divider,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScriptStore } from '../store/scriptStore';
import { LanguageSelector } from '../components';
import MultiLanguageService from '../services/multiLanguageService';
import { RootStackParamList, LanguageOption, ExtendedScript } from '../types';

type ScriptEditorScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ScriptEditor'
>;

type ScriptEditorScreenRouteProp = RouteProp<
  RootStackParamList,
  'ScriptEditor'
>;

export default function ScriptEditorScreen() {
  const navigation = useNavigation<ScriptEditorScreenNavigationProp>();
  const route = useRoute<ScriptEditorScreenRouteProp>();
  const { scriptId } = route.params || {};
  
  const { addScript, updateScript, getScriptById } = useScriptStore();
  const multiLanguageService = MultiLanguageService.getInstance();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<LanguageOption | null>(null);
  const [languageConfidence, setLanguageConfidence] = useState<number | null>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);

  useEffect(() => {
    if (scriptId) {
      const script = getScriptById(scriptId);
      if (script) {
        setTitle(script.title);
        setContent(script.content);
        setIsEditing(true);
        
        // Load script language if it's an ExtendedScript
        const extendedScript = script as ExtendedScript;
        if (extendedScript.language) {
          setSelectedLanguage(extendedScript.language);
        }
        if (extendedScript.detectedLanguage) {
          setDetectedLanguage(extendedScript.detectedLanguage);
          setLanguageConfidence(extendedScript.languageConfidence || null);
        }
      }
    } else {
      // Set default language for new scripts
      const defaultLanguage = multiLanguageService.getDefaultLanguage();
      setSelectedLanguage(defaultLanguage);
    }
  }, [scriptId, getScriptById]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    setHasUnsavedChanges(true);
    
    // Auto-detect language if enabled and content is substantial
    if (text.trim().length > 50 && !selectedLanguage) {
      detectLanguageFromContent(text);
    }
  };

  const detectLanguageFromContent = async (text: string) => {
    if (isDetectingLanguage) return;
    
    setIsDetectingLanguage(true);
    try {
      const detected = await multiLanguageService.detectLanguage(text);
      if (detected) {
        setDetectedLanguage(detected);
        setLanguageConfidence(0.85); // Mock confidence for now
        
        // Auto-select if no language is currently selected
        if (!selectedLanguage) {
          setSelectedLanguage(detected);
        }
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  const handleLanguageSelect = (language: LanguageOption) => {
    setSelectedLanguage(language);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your script.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your script.');
      return;
    }

    if (!selectedLanguage) {
      Alert.alert('Error', 'Please select a language for your script.');
      return;
    }

    const scriptData = {
      title: title.trim(),
      content: content.trim(),
      language: selectedLanguage,
      detectedLanguage,
      languageConfidence,
      isMultilingual: false, // Could be enhanced to detect this
      textDirection: selectedLanguage.rtl ? 'rtl' as const : 'ltr' as const,
      characterSet: 'UTF-8'
    };

    try {
      if (isEditing && scriptId) {
        await updateScript(scriptId, scriptData);
      } else {
        await addScript(scriptData);
      }

      setHasUnsavedChanges(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save script. Please try again.');
      console.error('Save error:', error);
    }
  };

  const handlePreview = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content to preview.');
      return;
    }

    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Please save first before using the teleprompter.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save & Preview',
            onPress: () => {
              handleSave();
              if (scriptId) {
                navigation.navigate('Teleprompter', { scriptId });
              }
            },
          },
        ]
      );
    } else if (scriptId) {
      navigation.navigate('Teleprompter', { scriptId });
    }
  };

  const insertFormatting = (format: 'bold' | 'italic') => {
    const formatTags = {
      bold: ['**', '**'],
      italic: ['*', '*'],
    };
    
    const [openTag, closeTag] = formatTags[format];
    const newContent = content + openTag + 'text' + closeTag;
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Surface style={styles.surface}>
          <Card style={styles.titleCard} mode="elevated">
            <Card.Content>
              <Text variant="labelLarge" style={styles.label}>
                Script Title
              </Text>
              <TextInput
                style={[
                  styles.titleInput,
                  selectedLanguage?.rtl && styles.rtlText
                ]}
                value={title}
                onChangeText={handleTitleChange}
                placeholder="Enter script title..."
                placeholderTextColor="#9ca3af"
                multiline={false}
              />
            </Card.Content>
          </Card>

          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageSelect={handleLanguageSelect}
            showDetectionInfo={!!detectedLanguage}
            detectedLanguage={detectedLanguage}
            confidence={languageConfidence || undefined}
            title="Script Language"
            subtitle="Select the language of your script for optimal speech recognition"
          />

          <Card style={styles.editorCard} mode="elevated">
            <Card.Content>
              <View style={styles.editorHeader}>
                <Text variant="labelLarge" style={styles.label}>
                  Script Content
                </Text>
                <View style={styles.formattingToolbar}>
                  <IconButton
                    icon="format-bold"
                    mode="contained"
                    size={20}
                    onPress={() => insertFormatting('bold')}
                    iconColor="#374151"
                    containerColor="#f3f4f6"
                  />
                  <IconButton
                    icon="format-italic"
                    mode="contained"
                    size={20}
                    onPress={() => insertFormatting('italic')}
                    iconColor="#374151"
                    containerColor="#f3f4f6"
                  />
                  {selectedLanguage?.rtl && (
                    <Chip
                      mode="outlined"
                      compact
                      style={styles.rtlIndicator}
                      textStyle={styles.rtlText}
                    >
                      RTL
                    </Chip>
                  )}
                </View>
              </View>
              
              <Divider style={styles.divider} />
              
              <TextInput
                style={[
                  styles.contentInput,
                  selectedLanguage?.rtl && styles.rtlText
                ]}
                value={content}
                onChangeText={handleContentChange}
                placeholder="Start writing your script here..."
                placeholderTextColor="#9ca3af"
                multiline={true}
                textAlignVertical="top"
              />
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={[styles.button, styles.cancelButton]}
              labelStyle={styles.cancelButtonText}
            >
              Cancel
            </Button>
            
            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.button, styles.saveButton]}
              disabled={!title.trim() || !content.trim() || !selectedLanguage}
            >
              {isEditing ? 'Update' : 'Save'}
            </Button>
          </View>

          {scriptId && (
            <Button
              mode="contained"
              onPress={handlePreview}
              style={[styles.button, styles.previewButton]}
              icon="play"
              disabled={!content.trim()}
            >
              Open in Teleprompter
            </Button>
          )}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  surface: {
    padding: 16,
    paddingBottom: 32,
  },
  titleCard: {
    marginBottom: 16,
    elevation: 2,
  },
  editorCard: {
    marginBottom: 24,
    elevation: 2,
  },
  label: {
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 18,
    color: '#1f2937',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 48,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formattingToolbar: {
    flexDirection: 'row',
    gap: 4,
  },
  divider: {
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 16,
    color: '#1f2937',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 300,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rtlIndicator: {
    marginLeft: 8,
    backgroundColor: '#E3F2FD',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 4,
  },
  cancelButton: {
    borderColor: '#6b7280',
  },
  cancelButtonText: {
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  previewButton: {
    backgroundColor: '#10b981',
    marginTop: 8,
  },
});
