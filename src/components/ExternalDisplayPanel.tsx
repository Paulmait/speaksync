import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  List,
  IconButton,
  Switch,
  Chip,
  Portal,
  Modal,
  ProgressBar,
} from 'react-native-paper';
import {
  externalDisplayService,
  ExternalDisplayState,
  ExternalDisplay,
  TeleprompterDisplayOptions,
} from '../services/externalDisplayService';
import { useSubscriptionStore } from '../store/subscriptionStore';

interface ExternalDisplayPanelProps {
  isActive: boolean;
  scriptContent: string;
  currentPosition: number;
  highlightedWords?: number[];
  onDisplayOptionsChange?: (options: TeleprompterDisplayOptions) => void;
}

export function ExternalDisplayPanel({
  isActive,
  scriptContent,
  currentPosition,
  highlightedWords,
  onDisplayOptionsChange,
}: ExternalDisplayPanelProps) {
  const { subscription } = useSubscriptionStore();
  const [displayState, setDisplayState] = useState<ExternalDisplayState>(
    externalDisplayService.getCurrentState()
  );
  const [showDisplayList, setShowDisplayList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [displayOptions, setDisplayOptions] = useState<TeleprompterDisplayOptions>({
    mirrorHorizontally: true,
    fontSize: 24,
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    scrollSpeed: 1.0,
    showControls: false,
    enableSpeechTracking: true,
  });

  useEffect(() => {
    const listener = (state: ExternalDisplayState) => {
      setDisplayState(state);
    };

    externalDisplayService.addListener(listener);
    
    // Initialize service if subscription allows
    if (subscription?.features.externalDisplay) {
      externalDisplayService.initialize();
    }

    return () => {
      externalDisplayService.removeListener(listener);
    };
  }, [subscription]);

  // Update display content when props change
  useEffect(() => {
    if (displayState.currentDisplay && (displayState.isMirroring || displayState.isWirelessCasting)) {
      externalDisplayService.updateDisplayContent(scriptContent, currentPosition, highlightedWords);
    }
  }, [scriptContent, currentPosition, highlightedWords, displayState.currentDisplay, displayState.isMirroring, displayState.isWirelessCasting]);

  const handleScanForDisplays = async () => {
    setIsScanning(true);
    try {
      await externalDisplayService.scanForDisplays();
      setShowDisplayList(true);
    } catch (error) {
      Alert.alert('Scan Error', 'Failed to scan for external displays');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectToDisplay = async (display: ExternalDisplay) => {
    try {
      const success = await externalDisplayService.connectToDisplay(display.id, displayOptions);
      
      if (success) {
        setShowDisplayList(false);
        Alert.alert('Connected', `Connected to ${display.name}`);
      } else {
        Alert.alert('Connection Failed', `Failed to connect to ${display.name}`);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'An error occurred while connecting');
    }
  };

  const handleDisconnect = async () => {
    try {
      await externalDisplayService.disconnect();
      Alert.alert('Disconnected', 'Disconnected from external display');
    } catch (error) {
      Alert.alert('Disconnect Error', 'Failed to disconnect');
    }
  };

  const handleOptionsChange = (newOptions: Partial<TeleprompterDisplayOptions>) => {
    const updatedOptions = { ...displayOptions, ...newOptions };
    setDisplayOptions(updatedOptions);
    onDisplayOptionsChange?.(updatedOptions);
  };

  const renderDisplayItem = ({ item }: { item: ExternalDisplay }) => (
    <List.Item
      title={item.name}
      description={`${item.type} • ${item.technology} • ${item.resolution.width}x${item.resolution.height}`}
      left={(props) => (
        <List.Icon
          {...props}
          icon={
            item.type === 'wired' 
              ? item.technology === 'hdmi' ? 'video-input-hdmi' : 'usb'
              : item.technology === 'chromecast' ? 'cast' : 'airplay'
          }
        />
      )}
      right={(props) => (
        <Button
          mode="contained"
          compact
          onPress={() => handleConnectToDisplay(item)}
          disabled={!item.isAvailable}
        >
          Connect
        </Button>
      )}
      style={styles.displayItem}
    />
  );

  // Check if feature is available for current subscription
  if (!subscription?.features.externalDisplay) {
    return (
      <Surface style={styles.upgradeContainer}>
        <Text variant="titleMedium" style={styles.upgradeTitle}>
          External Display
        </Text>
        <Text variant="bodyMedium" style={styles.upgradeText}>
          Connect to external monitors and wireless displays.
        </Text>
        <Button
          mode="contained"
          style={styles.upgradeButton}
          onPress={() => {/* Navigate to subscription */}}
        >
          Upgrade to Pro
        </Button>
      </Surface>
    );
  }

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.panel}>
        {/* Connection Status */}
        {displayState.currentDisplay ? (
          <View style={styles.connectedContainer}>
            <View style={styles.connectedHeader}>
              <Text variant="titleSmall">{displayState.currentDisplay.name}</Text>
              <Chip 
                icon={displayState.isMirroring ? 'monitor' : 'cast'}
                compact
              >
                {displayState.isMirroring ? 'Mirrored' : 'Casting'}
              </Chip>
            </View>
            <View style={styles.connectedControls}>
              <IconButton
                icon="cog"
                size={20}
                onPress={() => setShowSettings(true)}
              />
              <IconButton
                icon="close"
                size={20}
                onPress={handleDisconnect}
              />
            </View>
          </View>
        ) : (
          <View style={styles.disconnectedContainer}>
            <Text variant="titleSmall">External Display</Text>
            <Button
              mode="contained"
              compact
              icon="monitor-multiple"
              onPress={handleScanForDisplays}
              loading={isScanning}
              disabled={isScanning}
              style={styles.scanButton}
            >
              {isScanning ? 'Scanning...' : 'Connect Display'}
            </Button>
          </View>
        )}

        {/* Error Display */}
        {displayState.error && (
          <Text variant="bodySmall" style={styles.errorText}>
            {displayState.error}
          </Text>
        )}
      </Surface>

      {/* Display List Modal */}
      <Portal>
        <Modal
          visible={showDisplayList}
          onDismiss={() => setShowDisplayList(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Available Displays
          </Text>
          
          {displayState.availableDisplays.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium">No displays found</Text>
              <Text variant="bodySmall" style={styles.emptyHint}>
                Make sure your external display is connected or your wireless device is discoverable
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayState.availableDisplays}
              renderItem={renderDisplayItem}
              keyExtractor={(item) => item.id}
              style={styles.displayList}
            />
          )}

          <View style={styles.modalActions}>
            <Button onPress={handleScanForDisplays} disabled={isScanning}>
              Refresh
            </Button>
            <Button onPress={() => setShowDisplayList(false)}>
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Display Settings Modal */}
      <Portal>
        <Modal
          visible={showSettings}
          onDismiss={() => setShowSettings(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Display Settings
          </Text>

          {/* Mirror Horizontally */}
          <View style={styles.settingRow}>
            <Text variant="titleMedium">Mirror Horizontally</Text>
            <Switch
              value={displayOptions.mirrorHorizontally}
              onValueChange={(value) => handleOptionsChange({ mirrorHorizontally: value })}
            />
          </View>

          {/* Font Size */}
          <View style={styles.settingGroup}>
            <Text variant="titleMedium">Font Size: {displayOptions.fontSize}px</Text>
            <View style={styles.fontSizeButtons}>
              {[16, 20, 24, 28, 32, 36].map((size) => (
                <Button
                  key={size}
                  mode={displayOptions.fontSize === size ? 'contained' : 'outlined'}
                  compact
                  onPress={() => handleOptionsChange({ fontSize: size })}
                  style={styles.fontSizeButton}
                >
                  {size}
                </Button>
              ))}
            </View>
          </View>

          {/* Colors */}
          <View style={styles.settingGroup}>
            <Text variant="titleMedium">Background Color</Text>
            <View style={styles.colorButtons}>
              {['#000000', '#1a1a1a', '#333333', '#ffffff'].map((color) => (
                <Button
                  key={color}
                  mode={displayOptions.backgroundColor === color ? 'contained' : 'outlined'}
                  compact
                  onPress={() => handleOptionsChange({ backgroundColor: color })}
                  style={[styles.colorButton, { backgroundColor: color }]}
                >
                  {color === '#000000' ? 'Black' : 
                   color === '#1a1a1a' ? 'Dark' : 
                   color === '#333333' ? 'Gray' : 'White'}
                </Button>
              ))}
            </View>
          </View>

          {/* Speech Tracking */}
          <View style={styles.settingRow}>
            <Text variant="titleMedium">Enable Speech Tracking</Text>
            <Switch
              value={displayOptions.enableSpeechTracking}
              onValueChange={(value) => handleOptionsChange({ enableSpeechTracking: value })}
            />
          </View>

          <Button
            mode="contained"
            onPress={() => setShowSettings(false)}
            style={styles.modalCloseButton}
          >
            Done
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    right: 16,
    zIndex: 999,
  },
  panel: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    minWidth: 200,
    elevation: 4,
  },
  upgradeContainer: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  upgradeTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  upgradeButton: {
    minWidth: 120,
  },
  connectedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectedHeader: {
    flex: 1,
  },
  connectedControls: {
    flexDirection: 'row',
  },
  disconnectedContainer: {
    alignItems: 'center',
  },
  scanButton: {
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 4,
    fontSize: 12,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  displayList: {
    maxHeight: 300,
  },
  displayItem: {
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyHint: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingGroup: {
    marginBottom: 16,
  },
  fontSizeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  fontSizeButton: {
    minWidth: 50,
  },
  colorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  colorButton: {
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalCloseButton: {
    marginTop: 16,
  },
});
