import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  Text,
  IconButton,
  Surface,
  Switch,
  Button,
  Portal,
  Modal,
  TextInput,
  Chip,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { speechRecognitionService } from '../services/speechRecognitionService';
import type { SpeechRecognitionState, AudioPermissions } from '../types';

interface SpeechRecognitionPanelProps {
  visible: boolean;
  onDismiss: () => void;
  onTranscriptUpdate: (transcript: string) => void;
  currentScript: string;
  settings: {
    backgroundColor: string;
    textColor: string;
  };
}

export default function SpeechRecognitionPanel({
  visible,
  onDismiss,
  onTranscriptUpdate,
  currentScript,
  settings,
}: SpeechRecognitionPanelProps) {
  const [speechState, setSpeechState] = useState<SpeechRecognitionState>(
    speechRecognitionService.getState()
  );
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [transcriptComparison, setTranscriptComparison] = useState({
    accuracy: 0,
    wordsMatched: 0,
    totalWords: 0,
  });
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (visible) {
      // Subscribe to speech recognition updates
      unsubscribeRef.current = speechRecognitionService.subscribe(setSpeechState);
      
      // Check permissions on mount
      checkPermissions();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [visible]);

  useEffect(() => {
    // Update transcript when speech recognition provides new text
    const fullTranscript = speechRecognitionService.getFullTranscript();
    if (fullTranscript) {
      onTranscriptUpdate(fullTranscript);
      calculateAccuracy(fullTranscript);
    }
  }, [speechState.currentTranscript, speechState.finalTranscript, onTranscriptUpdate]);

  const checkPermissions = async () => {
    try {
      const permissions = await speechRecognitionService.checkPermissions();
      if (!permissions.granted) {
        showPermissionAlert(permissions);
      }
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  };

  const showPermissionAlert = (permissions: AudioPermissions) => {
    Alert.alert(
      'Microphone Permission Required',
      'SpeakSync needs microphone access for speech recognition during teleprompter practice. This helps you practice your delivery and compare your speech with the script.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: permissions.canAskAgain ? 'Grant Permission' : 'Open Settings',
          onPress: async () => {
            if (permissions.canAskAgain) {
              await speechRecognitionService.requestPermissions();
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  };

  const handleStartListening = async () => {
    try {
      await speechRecognitionService.startListening();
    } catch (error) {
      Alert.alert(
        'Speech Recognition Error',
        'Failed to start speech recognition. Please check your microphone permissions and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStopListening = async () => {
    try {
      await speechRecognitionService.stopListening();
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  };

  const handleToggleListening = async () => {
    if (speechState.isListening) {
      await handleStopListening();
    } else {
      await handleStartListening();
    }
  };

  const handleSwitchMode = (useDeepgram: boolean) => {
    const mode = useDeepgram ? 'deepgram' : 'device';
    speechRecognitionService.switchMode(mode);
    
    if (useDeepgram && !apiKey) {
      setShowApiKeyInput(true);
    }
  };

  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      speechRecognitionService.setApiKey(apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  const calculateAccuracy = (transcript: string) => {
    if (!currentScript || !transcript) {
      setTranscriptComparison({ accuracy: 0, wordsMatched: 0, totalWords: 0 });
      return;
    }

    // Simple word-based accuracy calculation
    const scriptWords = currentScript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const transcriptWords = transcript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    let matches = 0;
    const maxLength = Math.min(scriptWords.length, transcriptWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (scriptWords[i] === transcriptWords[i]) {
        matches++;
      }
    }

    const accuracy = scriptWords.length > 0 ? (matches / scriptWords.length) * 100 : 0;
    
    setTranscriptComparison({
      accuracy: Math.round(accuracy),
      wordsMatched: matches,
      totalWords: scriptWords.length,
    });
  };

  const handleClearTranscript = () => {
    speechRecognitionService.clearTranscript();
    onTranscriptUpdate('');
    setTranscriptComparison({ accuracy: 0, wordsMatched: 0, totalWords: 0 });
  };

  const getStatusColor = () => {
    if (speechState.error) return '#ef4444';
    if (speechState.isListening) return '#10b981';
    if (speechState.isProcessing) return '#f59e0b';
    return '#6b7280';
  };

  const getStatusText = () => {
    if (speechState.error) return speechState.error;
    if (speechState.isListening) return 'Listening...';
    if (speechState.isProcessing) return 'Processing...';
    if (!speechState.hasPermission) return 'Microphone permission required';
    return 'Ready to listen';
  };

  const getAccuracyColor = () => {
    if (transcriptComparison.accuracy >= 90) return '#10b981';
    if (transcriptComparison.accuracy >= 75) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: settings.backgroundColor }
        ]}
      >
        <Surface style={styles.header} elevation={2}>
          <Text variant="headlineSmall" style={[styles.title, { color: settings.textColor }]}>
            Speech Recognition
          </Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            iconColor={settings.textColor}
          />
        </Surface>

        <View style={styles.content}>
          {/* Status Section */}
          <View style={styles.statusSection}>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
              <Text variant="bodyMedium" style={[styles.statusText, { color: settings.textColor }]}>
                {getStatusText()}
              </Text>
            </View>
            
            {speechState.isListening && (
              <ProgressBar
                indeterminate
                color={getStatusColor()}
                style={styles.progressBar}
              />
            )}
          </View>

          {/* Mode Selection */}
          <View style={styles.modeSection}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: settings.textColor }]}>
              Recognition Mode
            </Text>
            
            <View style={styles.modeButtons}>
              <Button
                mode={speechState.mode === 'deepgram' ? 'contained' : 'outlined'}
                onPress={() => handleSwitchMode(true)}
                style={styles.modeButton}
                disabled={speechState.isListening}
              >
                Deepgram (Cloud)
              </Button>
              <Button
                mode={speechState.mode === 'device' ? 'contained' : 'outlined'}
                onPress={() => handleSwitchMode(false)}
                style={styles.modeButton}
                disabled={speechState.isListening}
              >
                Device STT
              </Button>
            </View>

            {speechState.mode === 'deepgram' && (
              <View style={styles.apiKeySection}>
                <Button
                  mode="outlined"
                  onPress={() => setShowApiKeyInput(true)}
                  icon="key"
                  style={styles.apiKeyButton}
                >
                  {apiKey ? 'Update API Key' : 'Set Deepgram API Key'}
                </Button>
                {speechState.isConnected && (
                  <Chip icon="check" style={styles.connectedChip}>
                    Connected
                  </Chip>
                )}
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Control Section */}
          <View style={styles.controlSection}>
            <View style={styles.mainControls}>
              <IconButton
                icon={speechState.isListening ? 'microphone-off' : 'microphone'}
                size={48}
                mode="contained"
                onPress={handleToggleListening}
                disabled={!speechState.hasPermission || speechState.isProcessing}
                iconColor="#ffffff"
                containerColor={speechState.isListening ? '#ef4444' : '#10b981'}
                style={styles.micButton}
              />
              
              <Button
                mode="outlined"
                onPress={handleClearTranscript}
                icon="delete"
                style={styles.clearButton}
                disabled={speechState.isListening}
              >
                Clear
              </Button>
            </View>
          </View>

          {/* Accuracy Section */}
          {transcriptComparison.totalWords > 0 && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.accuracySection}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: settings.textColor }]}>
                  Speech Accuracy
                </Text>
                
                <View style={styles.accuracyStats}>
                  <View style={styles.accuracyStat}>
                    <Text variant="displaySmall" style={[styles.accuracyNumber, { color: getAccuracyColor() }]}>
                      {transcriptComparison.accuracy}%
                    </Text>
                    <Text variant="bodySmall" style={[styles.accuracyLabel, { color: settings.textColor }]}>
                      Accuracy
                    </Text>
                  </View>
                  
                  <View style={styles.accuracyStat}>
                    <Text variant="titleLarge" style={[styles.matchNumber, { color: settings.textColor }]}>
                      {transcriptComparison.wordsMatched}/{transcriptComparison.totalWords}
                    </Text>
                    <Text variant="bodySmall" style={[styles.accuracyLabel, { color: settings.textColor }]}>
                      Words Matched
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Current Transcript */}
          {(speechState.currentTranscript || speechState.finalTranscript) && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.transcriptSection}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: settings.textColor }]}>
                  Live Transcript
                </Text>
                
                <Surface style={styles.transcriptBox} elevation={1}>
                  <Text style={[styles.finalTranscript, { color: settings.textColor }]}>
                    {speechState.finalTranscript}
                  </Text>
                  {speechState.currentTranscript && (
                    <Text style={[styles.currentTranscript, { color: getStatusColor() }]}>
                      {speechState.currentTranscript}
                    </Text>
                  )}
                </Surface>
                
                {speechState.confidence > 0 && (
                  <Text variant="bodySmall" style={[styles.confidence, { color: settings.textColor }]}>
                    Confidence: {Math.round(speechState.confidence * 100)}%
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* API Key Input Modal */}
        <Portal>
          <Modal
            visible={showApiKeyInput}
            onDismiss={() => setShowApiKeyInput(false)}
            contentContainerStyle={styles.apiKeyModal}
          >
            <Text variant="titleLarge" style={styles.apiKeyTitle}>
              Deepgram API Key
            </Text>
            
            <Text variant="bodyMedium" style={styles.apiKeyDescription}>
              Enter your Deepgram API key for high-quality cloud speech recognition.
              You can get a free API key at deepgram.com
            </Text>
            
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter API key..."
              secureTextEntry
              style={styles.apiKeyInput}
            />
            
            <View style={styles.apiKeyButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowApiKeyInput(false)}
                style={styles.apiKeyButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSetApiKey}
                disabled={!apiKey.trim()}
                style={styles.apiKeyButton}
              >
                Save
              </Button>
            </View>
          </Modal>
        </Portal>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#6366f1',
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  modeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
  },
  apiKeySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  apiKeyButton: {
    flex: 1,
  },
  connectedChip: {
    backgroundColor: '#10b981',
  },
  divider: {
    marginVertical: 16,
  },
  controlSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  micButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  clearButton: {},
  accuracySection: {
    marginBottom: 20,
  },
  accuracyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  accuracyStat: {
    alignItems: 'center',
  },
  accuracyNumber: {
    fontWeight: 'bold',
  },
  matchNumber: {
    fontWeight: 'bold',
  },
  accuracyLabel: {
    marginTop: 4,
  },
  transcriptSection: {},
  transcriptBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 80,
  },
  finalTranscript: {
    lineHeight: 24,
    marginBottom: 8,
  },
  currentTranscript: {
    lineHeight: 24,
    fontStyle: 'italic',
  },
  confidence: {
    textAlign: 'right',
  },
  apiKeyModal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  apiKeyTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  apiKeyDescription: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#6b7280',
  },
  apiKeyInput: {
    marginBottom: 20,
  },
  apiKeyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
