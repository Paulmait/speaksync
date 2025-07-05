import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Surface,
  Switch,
  Button,
  TextInput,
  Portal,
  Modal,
  IconButton,
  Divider,
  Chip,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { PacingMeterSettings, FillerWordSettings } from '../types';

interface PacingSettingsProps {
  visible: boolean;
  onDismiss: () => void;
  pacingSettings: PacingMeterSettings;
  fillerSettings: FillerWordSettings;
  onPacingSettingsChange: (settings: PacingMeterSettings) => void;
  onFillerSettingsChange: (settings: FillerWordSettings) => void;
}

const DEFAULT_FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'so', 'actually', 'basically', 'literally',
  'honestly', 'obviously', 'right', 'okay', 'well', 'yeah', 'hmm', 'ah'
];

const VISUAL_CUE_TYPES = [
  { label: 'Icon', value: 'icon' },
  { label: 'Highlight', value: 'highlight' },
  { label: 'Underline', value: 'underline' },
  { label: 'Shake', value: 'shake' },
];

const ICON_TYPES = [
  { label: 'Warning', value: 'warning' },
  { label: 'Alert', value: 'alert' },
  { label: 'Circle', value: 'circle' },
  { label: 'Dot', value: 'dot' },
];

const SENSITIVITY_LEVELS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

export default function PacingSettings({
  visible,
  onDismiss,
  pacingSettings,
  fillerSettings,
  onPacingSettingsChange,
  onFillerSettingsChange,
}: PacingSettingsProps) {
  const [localPacingSettings, setLocalPacingSettings] = useState<PacingMeterSettings>(pacingSettings);
  const [localFillerSettings, setLocalFillerSettings] = useState<FillerWordSettings>(fillerSettings);
  const [activeTab, setActiveTab] = useState<'pacing' | 'fillers'>('pacing');
  const [newFillerWord, setNewFillerWord] = useState('');

  const handlePacingChange = <K extends keyof PacingMeterSettings>(
    key: K,
    value: PacingMeterSettings[K]
  ) => {
    setLocalPacingSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFillerChange = <K extends keyof FillerWordSettings>(
    key: K,
    value: FillerWordSettings[K]
  ) => {
    setLocalFillerSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onPacingSettingsChange(localPacingSettings);
    onFillerSettingsChange(localFillerSettings);
    onDismiss();
  };

  const handleReset = () => {
    if (activeTab === 'pacing') {
      setLocalPacingSettings({
        enabled: true,
        targetWPM: 150,
        toleranceRange: 20,
        showVisualMeter: true,
        showSessionSummary: true,
        colorScheme: {
          optimal: '#4CAF50',
          acceptable: '#FF9800',
          poor: '#F44336',
        },
      });
    } else {
      setLocalFillerSettings({
        enabled: true,
        fillerWords: DEFAULT_FILLER_WORDS,
        visualCueType: 'icon',
        iconType: 'warning',
        cueColor: '#FF9800',
        showInRealTime: true,
        trackInSession: true,
        sensitivity: 'medium',
      });
    }
  };

  const addFillerWord = () => {
    if (newFillerWord.trim() && !localFillerSettings.fillerWords.includes(newFillerWord.trim().toLowerCase())) {
      handleFillerChange('fillerWords', [...localFillerSettings.fillerWords, newFillerWord.trim().toLowerCase()]);
      setNewFillerWord('');
    }
  };

  const removeFillerWord = (word: string) => {
    handleFillerChange('fillerWords', localFillerSettings.fillerWords.filter(w => w !== word));
  };

  const renderPacingTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Enable/Disable */}
      <Surface style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text variant="titleMedium">Enable Pacing Meter</Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              Show real-time speaking pace analysis
            </Text>
          </View>
          <Switch
            value={localPacingSettings.enabled}
            onValueChange={(value) => handlePacingChange('enabled', value)}
          />
        </View>
      </Surface>

      {localPacingSettings.enabled && (
        <>
          {/* Target WPM */}
          <Surface style={styles.settingCard}>
            <Text variant="titleMedium" style={styles.settingTitle}>
              Target Speaking Pace
            </Text>
            <View style={styles.sliderContainer}>
              <Text variant="bodyMedium" style={styles.sliderLabel}>
                Target WPM: {localPacingSettings.targetWPM}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={80}
                maximumValue={250}
                step={10}
                value={localPacingSettings.targetWPM}
                onValueChange={(value) => handlePacingChange('targetWPM', value)}
              />
              <View style={styles.sliderLabels}>
                <Text variant="bodySmall">80 WPM</Text>
                <Text variant="bodySmall">250 WPM</Text>
              </View>
            </View>
          </Surface>

          {/* Tolerance Range */}
          <Surface style={styles.settingCard}>
            <Text variant="titleMedium" style={styles.settingTitle}>
              Tolerance Range
            </Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              How much deviation from target is considered optimal
            </Text>
            <View style={styles.sliderContainer}>
              <Text variant="bodyMedium" style={styles.sliderLabel}>
                ±{localPacingSettings.toleranceRange} WPM
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={50}
                step={5}
                value={localPacingSettings.toleranceRange}
                onValueChange={(value) => handlePacingChange('toleranceRange', value)}
              />
              <View style={styles.sliderLabels}>
                <Text variant="bodySmall">5 WPM</Text>
                <Text variant="bodySmall">50 WPM</Text>
              </View>
            </View>
            <Text variant="bodySmall" style={styles.rangeInfo}>
              Optimal range: {localPacingSettings.targetWPM - localPacingSettings.toleranceRange} - {localPacingSettings.targetWPM + localPacingSettings.toleranceRange} WPM
            </Text>
          </Surface>

          {/* Visual Options */}
          <Surface style={styles.settingCard}>
            <Text variant="titleMedium" style={styles.settingTitle}>
              Visual Options
            </Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text variant="bodyMedium">Show Visual Meter</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Display real-time pace gauge
                </Text>
              </View>
              <Switch
                value={localPacingSettings.showVisualMeter}
                onValueChange={(value) => handlePacingChange('showVisualMeter', value)}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text variant="bodyMedium">Session Summary</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Show detailed report after each session
                </Text>
              </View>
              <Switch
                value={localPacingSettings.showSessionSummary}
                onValueChange={(value) => handlePacingChange('showSessionSummary', value)}
              />
            </View>
          </Surface>
        </>
      )}
    </ScrollView>
  );

  const renderFillersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Enable/Disable */}
      <Surface style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text variant="titleMedium">Enable Filler Detection</Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              Detect and highlight filler words in real-time
            </Text>
          </View>
          <Switch
            value={localFillerSettings.enabled}
            onValueChange={(value) => handleFillerChange('enabled', value)}
          />
        </View>
      </Surface>

      {localFillerSettings.enabled && (
        <>
          {/* Visual Cue Type */}
          <Surface style={styles.settingCard}>
            <Text variant="titleMedium" style={styles.settingTitle}>
              Visual Cue Style
            </Text>
            <View style={styles.chipContainer}>
              {VISUAL_CUE_TYPES.map((type) => (
                <Chip
                  key={type.value}
                  selected={localFillerSettings.visualCueType === type.value}
                  onPress={() => handleFillerChange('visualCueType', type.value as any)}
                  style={styles.chip}
                >
                  {type.label}
                </Chip>
              ))}
            </View>

            {localFillerSettings.visualCueType === 'icon' && (
              <>
                <Text variant="bodyMedium" style={styles.subSettingTitle}>
                  Icon Type
                </Text>
                <View style={styles.chipContainer}>
                  {ICON_TYPES.map((icon) => (
                    <Chip
                      key={icon.value}
                      selected={localFillerSettings.iconType === icon.value}
                      onPress={() => handleFillerChange('iconType', icon.value as any)}
                      style={styles.chip}
                    >
                      {icon.label}
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </Surface>

          {/* Detection Settings */}
          <Surface style={styles.settingCard}>
            <Text variant="titleMedium" style={styles.settingTitle}>
              Detection Settings
            </Text>
            
            <Text variant="bodyMedium" style={styles.subSettingTitle}>
              Sensitivity
            </Text>
            <View style={styles.chipContainer}>
              {SENSITIVITY_LEVELS.map((level) => (
                <Chip
                  key={level.value}
                  selected={localFillerSettings.sensitivity === level.value}
                  onPress={() => handleFillerChange('sensitivity', level.value as any)}
                  style={styles.chip}
                >
                  {level.label}
                </Chip>
              ))}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text variant="bodyMedium">Real-time Display</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Show visual cues immediately when detected
                </Text>
              </View>
              <Switch
                value={localFillerSettings.showInRealTime}
                onValueChange={(value) => handleFillerChange('showInRealTime', value)}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text variant="bodyMedium">Track in Session</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Include filler words in session summary
                </Text>
              </View>
              <Switch
                value={localFillerSettings.trackInSession}
                onValueChange={(value) => handleFillerChange('trackInSession', value)}
              />
            </View>
          </Surface>

          {/* Filler Words List */}
          <Surface style={styles.settingCard}>
            <Text variant="titleMedium" style={styles.settingTitle}>
              Filler Words
            </Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              Words and phrases to detect as fillers
            </Text>
            
            {/* Add new filler word */}
            <View style={styles.addFillerContainer}>
              <TextInput
                mode="outlined"
                label="Add filler word"
                value={newFillerWord}
                onChangeText={setNewFillerWord}
                style={styles.fillerInput}
                dense
                onSubmitEditing={addFillerWord}
              />
              <Button mode="contained" onPress={addFillerWord} style={styles.addButton}>
                Add
              </Button>
            </View>

            {/* Filler words list */}
            <View style={styles.fillerWordsContainer}>
              {localFillerSettings.fillerWords.map((word) => (
                <Chip
                  key={word}
                  mode="outlined"
                  onClose={() => removeFillerWord(word)}
                  style={styles.fillerWordChip}
                >
                  {word}
                </Chip>
              ))}
            </View>
          </Surface>
        </>
      )}
    </ScrollView>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Pace & Filler Settings
          </Text>
          <IconButton
            icon="close"
            onPress={onDismiss}
            style={styles.closeButton}
          />
        </View>

        {/* Tab navigation */}
        <View style={styles.tabNavigation}>
          <Button
            mode={activeTab === 'pacing' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('pacing')}
            style={styles.tabButton}
            compact
          >
            Pacing Meter
          </Button>
          <Button
            mode={activeTab === 'fillers' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('fillers')}
            style={styles.tabButton}
            compact
          >
            Filler Detection
          </Button>
        </View>

        <View style={styles.modalBody}>
          {activeTab === 'pacing' ? renderPacingTab() : renderFillersTab()}
        </View>

        {/* Action buttons */}
        <View style={styles.modalActions}>
          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.actionButton}
          >
            Reset to Defaults
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.actionButton}
          >
            Save Settings
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  tabNavigation: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabContent: {
    flex: 1,
  },
  settingCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  settingDescription: {
    opacity: 0.7,
    marginTop: 2,
  },
  subSettingTitle: {
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 8,
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderLabel: {
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeInfo: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginBottom: 4,
  },
  addFillerContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  fillerInput: {
    flex: 1,
  },
  addButton: {
    alignSelf: 'center',
  },
  fillerWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fillerWordChip: {
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
  },
});
