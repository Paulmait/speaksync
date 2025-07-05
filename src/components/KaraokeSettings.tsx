import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Switch,
  TextInput,
  Card,
  Title,
  Paragraph,
  Divider,
  Chip,
  IconButton,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { KaraokeHighlightSettings } from '../types';

interface KaraokeSettingsProps {
  visible: boolean;
  settings: KaraokeHighlightSettings;
  onClose: () => void;
  onSave: (settings: KaraokeHighlightSettings) => void;
  onReset: () => void;
}

/**
 * Comprehensive karaoke settings configuration panel
 */
export const KaraokeSettings: React.FC<KaraokeSettingsProps> = ({
  visible,
  settings,
  onClose,
  onSave,
  onReset,
}) => {
  const [localSettings, setLocalSettings] = useState<KaraokeHighlightSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof KaraokeHighlightSettings>(
    key: K,
    value: KaraokeHighlightSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const predefinedColors = [
    { name: 'Gold', value: '#FFD700' },
    { name: 'Yellow', value: '#FFFF00' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Red', value: '#FF4444' },
    { name: 'Green', value: '#44FF44' },
    { name: 'Blue', value: '#4444FF' },
    { name: 'Purple', value: '#AA44FF' },
    { name: 'Pink', value: '#FF44AA' },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Title style={styles.title}>Karaoke Highlighting Settings</Title>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          {/* Enable/Disable Karaoke */}
          <Card style={styles.section}>
            <Card.Content>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Enable Karaoke Mode</Text>
                  <Paragraph style={styles.settingDescription}>
                    Real-time word highlighting as you speak
                  </Paragraph>
                </View>
                <Switch
                  value={localSettings.enabled}
                  onValueChange={(value) => updateSetting('enabled', value)}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Highlight Colors */}
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Highlight Appearance</Text>
              
              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Text Color</Text>
                <View style={styles.colorPicker}>
                  {predefinedColors.map((color) => (
                    <Chip
                      key={color.value}
                      selected={localSettings.highlightColor === color.value}
                      onPress={() => updateSetting('highlightColor', color.value)}
                      style={[
                        styles.colorChip,
                        { backgroundColor: color.value },
                      ]}
                      textStyle={{ color: '#000' }}
                    >
                      {color.name}
                    </Chip>
                  ))}
                </View>
                
                <TextInput
                  label="Custom Color (Hex)"
                  value={localSettings.highlightColor}
                  onChangeText={(value) => updateSetting('highlightColor', value)}
                  style={styles.textInput}
                  mode="outlined"
                  placeholder="#FFD700"
                />
              </View>

              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Background Color</Text>
                <TextInput
                  label="Background Color (RGBA)"
                  value={localSettings.highlightBackgroundColor}
                  onChangeText={(value) => updateSetting('highlightBackgroundColor', value)}
                  style={styles.textInput}
                  mode="outlined"
                  placeholder="rgba(255, 215, 0, 0.3)"
                />
              </View>
            </Card.Content>
          </Card>

          {/* Auto-Scroll Settings */}
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Auto-Scroll</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Enable Auto-Scroll</Text>
                  <Paragraph style={styles.settingDescription}>
                    Automatically scroll to keep highlighted words in view
                  </Paragraph>
                </View>
                <Switch
                  value={localSettings.autoScroll}
                  onValueChange={(value) => updateSetting('autoScroll', value)}
                />
              </View>

              {localSettings.autoScroll && (
                <View style={styles.settingGroup}>
                  <Text style={styles.settingLabel}>
                    Scroll Offset: {localSettings.scrollOffset}px
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={300}
                    step={10}
                    value={localSettings.scrollOffset}
                    onValueChange={(value: number) => updateSetting('scrollOffset', value)}
                  />
                  <Paragraph style={styles.settingDescription}>
                    Distance from top of screen when auto-scrolling
                  </Paragraph>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Matching Sensitivity */}
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Matching Sensitivity</Text>
              
              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>
                  Match Threshold: {Math.round(localSettings.matchThreshold * 100)}%
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.3}
                  maximumValue={1.0}
                  step={0.05}
                  value={localSettings.matchThreshold}
                  onValueChange={(value: number) => updateSetting('matchThreshold', value)}
                />
                <Paragraph style={styles.settingDescription}>
                  Lower = more lenient matching, Higher = exact matching required
                </Paragraph>
              </View>
            </Card.Content>
          </Card>

          {/* Animation Settings */}
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Animation</Text>
              
              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>
                  Highlight Duration: {localSettings.highlightDuration}ms
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={500}
                  maximumValue={3000}
                  step={100}
                  value={localSettings.highlightDuration}
                  onValueChange={(value: number) => updateSetting('highlightDuration', value)}
                />
              </View>

              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>
                  Animation Speed: {localSettings.animationDuration}ms
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={100}
                  maximumValue={800}
                  step={50}
                  value={localSettings.animationDuration}
                  onValueChange={(value: number) => updateSetting('animationDuration', value)}
                />
              </View>

              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>
                  Fade Delay: {localSettings.fadeOutDelay}ms
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={2000}
                  step={100}
                  value={localSettings.fadeOutDelay}
                  onValueChange={(value: number) => updateSetting('fadeOutDelay', value)}
                />
                <Paragraph style={styles.settingDescription}>
                  Time before highlight starts fading out
                </Paragraph>
              </View>
            </Card.Content>
          </Card>

          {/* Preview */}
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View
                style={[
                  styles.preview,
                  { backgroundColor: localSettings.highlightBackgroundColor },
                ]}
              >
                <Text style={[styles.previewText, { color: localSettings.highlightColor }]}>
                  This is how highlighted text will appear
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={styles.button}
            >
              Reset to Defaults
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
            >
              Save Settings
            </Button>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  section: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
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
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 0,
  },
  settingGroup: {
    marginBottom: 16,
  },
  textInput: {
    marginTop: 8,
  },
  slider: {
    marginVertical: 8,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  colorChip: {
    margin: 4,
  },
  preview: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  previewText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  bottomSpace: {
    height: 20,
  },
});

export default KaraokeSettings;
