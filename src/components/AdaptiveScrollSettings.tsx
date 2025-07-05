import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  Modal,
  Portal,
  Surface,
  Text,
  Button,
  Switch,
  Divider,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { AdaptiveScrollSettings } from '../types';

interface AdaptiveScrollSettingsModalProps {
  visible: boolean;
  settings: AdaptiveScrollSettings;
  onClose: () => void;
  onSave: (settings: AdaptiveScrollSettings) => void;
  onReset: () => void;
}

export default function AdaptiveScrollSettingsModal({
  visible,
  settings,
  onClose,
  onSave,
  onReset,
}: AdaptiveScrollSettingsModalProps) {
  const [localSettings, setLocalSettings] = React.useState<AdaptiveScrollSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const updateSetting = <K extends keyof AdaptiveScrollSettings>(
    key: K,
    value: AdaptiveScrollSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modal}
      >
        <Surface style={styles.surface}>
          <Text variant="headlineSmall" style={styles.title}>
            Adaptive Scroll Settings
          </Text>
          
          <Text variant="bodyMedium" style={styles.description}>
            Configure dynamic scrolling based on your speaking pace
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Enable Adaptive Scrolling</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Automatically adjust scroll speed based on speech pace
              </Text>
            </View>
            <Switch
              value={localSettings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.sliderSection}>
            <Text variant="bodyLarge" style={styles.sliderLabel}>
              Base Scroll Speed: {Math.round(localSettings.baseScrollSpeed)}
            </Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              Base scrolling speed when speech is not detected
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={200}
              value={localSettings.baseScrollSpeed}
              onValueChange={(value) => updateSetting('baseScrollSpeed', value)}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#6366f1"
            />
          </View>

          <View style={styles.sliderSection}>
            <Text variant="bodyLarge" style={styles.sliderLabel}>
              Responsiveness: {Math.round(localSettings.responsiveness * 100)}%
            </Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              How quickly scrolling adapts to pace changes
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={1.0}
              value={localSettings.responsiveness}
              onValueChange={(value) => updateSetting('responsiveness', value)}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#6366f1"
            />
          </View>

          <View style={styles.sliderSection}>
            <Text variant="bodyLarge" style={styles.sliderLabel}>
              Smoothing: {Math.round(localSettings.smoothingFactor * 100)}%
            </Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              Higher values create smoother but less responsive scrolling
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={1.0}
              value={localSettings.smoothingFactor}
              onValueChange={(value) => updateSetting('smoothingFactor', value)}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#6366f1"
            />
          </View>

          <View style={styles.sliderSection}>
            <Text variant="bodyLarge" style={styles.sliderLabel}>
              Pause Threshold: {localSettings.pauseThreshold.toFixed(1)}s
            </Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              Time before detecting speech pause
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={5.0}
              value={localSettings.pauseThreshold}
              onValueChange={(value) => updateSetting('pauseThreshold', value)}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#6366f1"
            />
          </View>

          <View style={styles.sliderSection}>
            <Text variant="bodyLarge" style={styles.sliderLabel}>
              Max Acceleration: {localSettings.accelerationLimit.toFixed(1)}x
            </Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              Maximum scroll speed multiplier for fast speech
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1.0}
              maximumValue={5.0}
              value={localSettings.accelerationLimit}
              onValueChange={(value) => updateSetting('accelerationLimit', value)}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#6366f1"
            />
          </View>

          <View style={styles.sliderSection}>
            <Text variant="bodyLarge" style={styles.sliderLabel}>
              Look Ahead: {localSettings.lookAheadWords} words
            </Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              How many words ahead to scroll for smooth reading
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={20}
              value={localSettings.lookAheadWords}
              onValueChange={(value) => updateSetting('lookAheadWords', Math.round(value))}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#6366f1"
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={styles.button}
            >
              Reset
            </Button>
            <Button
              mode="outlined"
              onPress={onClose}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
            >
              Save
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  surface: {
    padding: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#6b7280',
  },
  divider: {
    marginVertical: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    color: '#6b7280',
    marginTop: 4,
  },
  sliderSection: {
    marginBottom: 20,
  },
  sliderLabel: {
    marginBottom: 4,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
