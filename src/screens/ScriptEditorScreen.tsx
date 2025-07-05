import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  IconButton,
  Surface,
  Divider,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScriptStore } from '../store/scriptStore';
import { RootStackParamList } from '../types';

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
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (scriptId) {
      const script = getScriptById(scriptId);
      if (script) {
        setTitle(script.title);
        setContent(script.content);
        setIsEditing(true);
      }
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
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your script.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your script.');
      return;
    }

    if (isEditing && scriptId) {
      updateScript(scriptId, { title: title.trim(), content: content.trim() });
    } else {
      addScript({ title: title.trim(), content: content.trim() });
    }

    setHasUnsavedChanges(false);
    navigation.goBack();
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
                style={styles.titleInput}
                value={title}
                onChangeText={handleTitleChange}
                placeholder="Enter script title..."
                placeholderTextColor="#9ca3af"
                multiline={false}
              />
            </Card.Content>
          </Card>

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
                </View>
              </View>
              
              <Divider style={styles.divider} />
              
              <TextInput
                style={styles.contentInput}
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
              disabled={!title.trim() || !content.trim()}
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
    lineHeight: 24,
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
