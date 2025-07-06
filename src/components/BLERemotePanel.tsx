import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  DeviceEventEmitter,
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
  Card,
} from 'react-native-paper';
import {
  bleRemoteService,
  BLERemoteState,
  BLEDevice,
  ButtonMapping,
  TeleprompterAction,
  RemoteCommand,
} from '../services/bleRemoteService';
import { useSubscriptionStore } from '../store/subscriptionStore';

interface BLERemotePanelProps {
  isActive: boolean;
  onRemoteAction: (action: TeleprompterAction) => void;
}

export function BLERemotePanel({ isActive, onRemoteAction }: BLERemotePanelProps) {
  const { subscription } = useSubscriptionStore();
  const [remoteState, setRemoteState] = useState<BLERemoteState>(
    bleRemoteService.getCurrentState()
  );
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [showButtonMapping, setShowButtonMapping] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BLEDevice | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [buttonMappings, setButtonMappings] = useState<Map<string, ButtonMapping>>(
    bleRemoteService.getAllButtonMappings()
  );

  useEffect(() => {
    const stateListener = (state: BLERemoteState) => {
      setRemoteState(state);
    };

    const commandListener = (command: RemoteCommand) => {
      // Commands are processed by the service, we just show feedback
      console.log('Remote command received:', command);
    };

    const actionListener = (actionData: any) => {
      // Handle teleprompter actions from remote
      onRemoteAction(actionData.action);
    };

    const feedbackListener = (feedbackData: any) => {
      setLastFeedback(feedbackData.message);
      // Clear feedback after 2 seconds
      setTimeout(() => setLastFeedback(null), 2000);
    };

    bleRemoteService.addListener(stateListener);
    bleRemoteService.addCommandListener(commandListener);
    
    DeviceEventEmitter.addListener('TeleprompterRemoteAction', actionListener);
    DeviceEventEmitter.addListener('RemoteCommandFeedback', feedbackListener);

    // Initialize service if subscription allows
    if (subscription?.features.bluetoothRemote) {
      bleRemoteService.initialize();
    }

    return () => {
      bleRemoteService.removeListener(stateListener);
      bleRemoteService.removeCommandListener(commandListener);
      DeviceEventEmitter.removeAllListeners('TeleprompterRemoteAction');
      DeviceEventEmitter.removeAllListeners('RemoteCommandFeedback');
    };
  }, [subscription, onRemoteAction]);

  const handleStartScanning = async () => {
    try {
      await bleRemoteService.startScanning(15000); // 15 seconds
      setShowDeviceList(true);
    } catch (error) {
      Alert.alert('Scan Error', 'Failed to start scanning for remote devices');
    }
  };

  const handleStopScanning = async () => {
    await bleRemoteService.stopScanning();
  };

  const handleConnectDevice = async (device: BLEDevice) => {
    try {
      const success = await bleRemoteService.connectToDevice(device.id);
      
      if (success) {
        setShowDeviceList(false);
        Alert.alert('Connected', `Connected to ${device.name}`);
      } else {
        Alert.alert('Connection Failed', `Failed to connect to ${device.name}`);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'An error occurred while connecting');
    }
  };

  const handleDisconnectDevice = async (device: BLEDevice) => {
    try {
      const success = await bleRemoteService.disconnectFromDevice(device.id);
      
      if (success) {
        Alert.alert('Disconnected', `Disconnected from ${device.name}`);
      }
    } catch (error) {
      Alert.alert('Disconnect Error', 'Failed to disconnect device');
    }
  };

  const handleUpdateButtonMapping = (button: string, action: TeleprompterAction) => {
    const mapping: ButtonMapping = {
      button,
      action,
    };
    
    bleRemoteService.setButtonMapping(button, mapping);
    setButtonMappings(new Map(bleRemoteService.getAllButtonMappings()));
  };

  const getDeviceIcon = (device: BLEDevice): string => {
    switch (device.type) {
      case 'presentation_remote': return 'presentation';
      case 'foot_pedal': return 'foot-print';
      case 'keyboard': return 'keyboard';
      default: return 'bluetooth';
    }
  };

  const getActionIcon = (action: TeleprompterAction): string => {
    switch (action) {
      case 'play_pause': return 'play-pause';
      case 'scroll_up': return 'arrow-up';
      case 'scroll_down': return 'arrow-down';
      case 'speed_increase': return 'speedometer';
      case 'speed_decrease': return 'speedometer-slow';
      case 'next_marker': return 'skip-next';
      case 'previous_marker': return 'skip-previous';
      case 'reset_position': return 'restore';
      case 'toggle_speech_recognition': return 'microphone';
      case 'toggle_karaoke': return 'music';
      default: return 'gesture-tap';
    }
  };

  const renderDeviceItem = ({ item }: { item: BLEDevice }) => (
    <List.Item
      title={item.name}
      description={`${item.type} • ${item.manufacturer || 'Unknown'} • Signal: ${item.rssi || 'N/A'}dBm`}
      left={(props) => (
        <List.Icon {...props} icon={getDeviceIcon(item)} />
      )}
      right={(props) => (
        <View style={styles.deviceActions}>
          {item.batteryLevel && (
            <Chip icon="battery" compact style={styles.batteryChip}>
              {item.batteryLevel}%
            </Chip>
          )}
          <Button
            mode={item.isConnected ? 'outlined' : 'contained'}
            compact
            onPress={() => 
              item.isConnected 
                ? handleDisconnectDevice(item)
                : handleConnectDevice(item)
            }
          >
            {item.isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </View>
      )}
      style={styles.deviceItem}
      onPress={() => {
        setSelectedDevice(item);
        setShowButtonMapping(true);
      }}
    />
  );

  const renderButtonMapping = (button: string, mapping: ButtonMapping) => (
    <Card key={button} style={styles.mappingCard}>
      <Card.Content>
        <View style={styles.mappingRow}>
          <View style={styles.mappingInfo}>
            <Text variant="titleSmall">{button.replace('_', ' ').toUpperCase()}</Text>
            <Text variant="bodyMedium">{mapping.action.replace('_', ' ')}</Text>
          </View>
          <IconButton
            icon={getActionIcon(mapping.action)}
            size={20}
          />
        </View>
      </Card.Content>
    </Card>
  );

  // Check if feature is available for current subscription
  if (!subscription?.features.bluetoothRemote) {
    return (
      <Surface style={styles.upgradeContainer}>
        <Text variant="titleMedium" style={styles.upgradeTitle}>
          Bluetooth Remote
        </Text>
        <Text variant="bodyMedium" style={styles.upgradeText}>
          Control your teleprompter with presentation remotes and foot pedals.
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
        {/* Bluetooth Status */}
        <View style={styles.statusContainer}>
          <Text variant="titleSmall">Bluetooth Remote</Text>
          {!remoteState.isBluetoothEnabled && (
            <Chip icon="bluetooth-off" compact style={styles.statusChip}>
              Bluetooth Off
            </Chip>
          )}
          {remoteState.connectedDevices.length > 0 && (
            <Chip icon="bluetooth-connect" compact style={styles.statusChip}>
              {remoteState.connectedDevices.length} Connected
            </Chip>
          )}
        </View>

        {/* Connected Devices */}
        {remoteState.connectedDevices.length > 0 ? (
          <View style={styles.connectedDevices}>
            {remoteState.connectedDevices.map((device) => (
              <View key={device.id} style={styles.connectedDevice}>
                <Text variant="bodySmall">{device.name}</Text>
                <IconButton
                  icon="close"
                  size={16}
                  onPress={() => handleDisconnectDevice(device)}
                />
              </View>
            ))}
          </View>
        ) : (
          <Button
            mode="contained"
            compact
            icon="bluetooth-audio"
            onPress={handleStartScanning}
            disabled={!remoteState.isBluetoothEnabled || remoteState.isScanning}
            loading={remoteState.isScanning}
            style={styles.scanButton}
          >
            {remoteState.isScanning ? 'Scanning...' : 'Connect Remote'}
          </Button>
        )}

        {/* Button Mappings Button */}
        {remoteState.connectedDevices.length > 0 && (
          <Button
            mode="outlined"
            compact
            icon="tune"
            onPress={() => setShowButtonMapping(true)}
            style={styles.settingsButton}
          >
            Button Mapping
          </Button>
        )}

        {/* Last Feedback */}
        {lastFeedback && (
          <View style={styles.feedbackContainer}>
            <Text variant="bodySmall" style={styles.feedbackText}>
              {lastFeedback}
            </Text>
          </View>
        )}

        {/* Error Display */}
        {remoteState.error && (
          <Text variant="bodySmall" style={styles.errorText}>
            {remoteState.error}
          </Text>
        )}
      </Surface>

      {/* Device List Modal */}
      <Portal>
        <Modal
          visible={showDeviceList}
          onDismiss={() => setShowDeviceList(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Bluetooth Devices
          </Text>
          
          {remoteState.isScanning && (
            <View style={styles.scanningContainer}>
              <ProgressBar indeterminate />
              <Text variant="bodyMedium" style={styles.scanningText}>
                Scanning for devices...
              </Text>
            </View>
          )}

          {remoteState.discoveredDevices.length === 0 && !remoteState.isScanning ? (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium">No devices found</Text>
              <Text variant="bodySmall" style={styles.emptyHint}>
                Make sure your remote device is in pairing mode
              </Text>
            </View>
          ) : (
            <FlatList
              data={remoteState.discoveredDevices}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.id}
              style={styles.deviceList}
            />
          )}

          <View style={styles.modalActions}>
            <Button 
              onPress={handleStartScanning} 
              disabled={remoteState.isScanning}
            >
              Scan Again
            </Button>
            <Button onPress={handleStopScanning}>
              Stop Scan
            </Button>
            <Button onPress={() => setShowDeviceList(false)}>
              Close
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Button Mapping Modal */}
      <Portal>
        <Modal
          visible={showButtonMapping}
          onDismiss={() => setShowButtonMapping(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Button Mappings
          </Text>
          
          {selectedDevice && (
            <Text variant="bodyMedium" style={styles.deviceName}>
              {selectedDevice.name}
            </Text>
          )}

          <View style={styles.mappingsContainer}>
            {Array.from(buttonMappings.entries()).map(([button, mapping]) =>
              renderButtonMapping(button, mapping)
            )}
          </View>

          <Text variant="bodySmall" style={styles.mappingHint}>
            Tap a button on your remote to see it highlighted here
          </Text>

          <Button
            mode="contained"
            onPress={() => setShowButtonMapping(false)}
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
    bottom: 100,
    right: 16,
    zIndex: 999,
  },
  panel: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    minWidth: 180,
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
  statusContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    marginTop: 4,
  },
  connectedDevices: {
    marginBottom: 8,
  },
  connectedDevice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  scanButton: {
    marginBottom: 8,
  },
  settingsButton: {
    marginTop: 4,
  },
  feedbackContainer: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  feedbackText: {
    textAlign: 'center',
    color: '#1976d2',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
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
  scanningContainer: {
    padding: 16,
  },
  scanningText: {
    textAlign: 'center',
    marginTop: 8,
  },
  deviceList: {
    maxHeight: 300,
  },
  deviceItem: {
    paddingVertical: 8,
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batteryChip: {
    height: 24,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  deviceName: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  mappingsContainer: {
    maxHeight: 300,
  },
  mappingCard: {
    marginBottom: 8,
  },
  mappingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mappingInfo: {
    flex: 1,
  },
  mappingHint: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    fontStyle: 'italic',
  },
  modalCloseButton: {
    marginTop: 16,
  },
});
