import { Platform, PermissionsAndroid, NativeModules, DeviceEventEmitter } from 'react-native';
import { PerformanceOptimizer } from './performanceOptimizer';

export interface BLEDevice {
  id: string;
  name: string;
  type: 'presentation_remote' | 'foot_pedal' | 'keyboard' | 'generic_hid';
  manufacturer?: string;
  model?: string;
  batteryLevel?: number;
  isConnected: boolean;
  supportedButtons: string[];
  rssi?: number; // Signal strength
}

export interface BLERemoteState {
  isScanning: boolean;
  hasPermission: boolean;
  isBluetoothEnabled: boolean;
  discoveredDevices: BLEDevice[];
  connectedDevices: BLEDevice[];
  error: string | null;
  lastCommand: RemoteCommand | null;
}

export interface RemoteCommand {
  deviceId: string;
  button: string;
  action: 'press' | 'release' | 'hold';
  timestamp: number;
}

export interface ButtonMapping {
  button: string;
  action: TeleprompterAction;
  holdAction?: TeleprompterAction;
  holdDuration?: number; // ms
}

export type TeleprompterAction = 
  | 'play_pause'
  | 'scroll_up'
  | 'scroll_down'
  | 'speed_increase'
  | 'speed_decrease'
  | 'next_marker'
  | 'previous_marker'
  | 'reset_position'
  | 'toggle_speech_recognition'
  | 'toggle_karaoke';

class BLERemoteService {
  private static instance: BLERemoteService;
  private performanceOptimizer = PerformanceOptimizer.getInstance();
  private listeners: Array<(state: BLERemoteState) => void> = [];
  private commandListeners: Array<(command: RemoteCommand) => void> = [];
  private buttonMappings: Map<string, ButtonMapping> = new Map();
  private scanTimeout: NodeJS.Timeout | null = null;
  
  private currentState: BLERemoteState = {
    isScanning: false,
    hasPermission: false,
    isBluetoothEnabled: false,
    discoveredDevices: [],
    connectedDevices: [],
    error: null,
    lastCommand: null,
  };

  static getInstance(): BLERemoteService {
    if (!BLERemoteService.instance) {
      BLERemoteService.instance = new BLERemoteService();
    }
    return BLERemoteService.instance;
  }

  // Initialize BLE service and permissions
  async initialize(): Promise<boolean> {
    try {
      // Request Bluetooth permissions
      const hasPermission = await this.requestBluetoothPermissions();
      if (!hasPermission) {
        this.updateState({ 
          hasPermission: false,
          error: 'Bluetooth permissions not granted'
        });
        return false;
      }

      // Check if Bluetooth is enabled
      const isEnabled = await this.checkBluetoothEnabled();
      this.updateState({ 
        hasPermission: true,
        isBluetoothEnabled: isEnabled
      });

      if (!isEnabled) {
        this.updateState({ error: 'Bluetooth is not enabled' });
        return false;
      }

      // Initialize native BLE module
      if (NativeModules.BLERemoteModule) {
        await NativeModules.BLERemoteModule.initialize();
      }

      // Set up event listeners
      this.setupEventListeners();

      // Load default button mappings
      this.loadDefaultButtonMappings();

      return true;
    } catch (error) {
      console.error('Failed to initialize BLE remote service:', error);
      this.updateState({ error: 'Failed to initialize Bluetooth' });
      return false;
    }
  }

  // Request Bluetooth permissions (Android requires special handling)
  private async requestBluetoothPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Android 12+ requires additional permissions
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // iOS handles Bluetooth permissions automatically
        return true;
      }
    } catch (error) {
      console.error('Failed to request Bluetooth permissions:', error);
      return false;
    }
  }

  // Check if Bluetooth is enabled
  private async checkBluetoothEnabled(): Promise<boolean> {
    try {
      if (NativeModules.BLERemoteModule?.isBluetoothEnabled) {
        return await NativeModules.BLERemoteModule.isBluetoothEnabled();
      }
      return false;
    } catch (error) {
      console.error('Failed to check Bluetooth status:', error);
      return false;
    }
  }

  // Set up event listeners for BLE events
  private setupEventListeners(): void {
    DeviceEventEmitter.addListener('BLEDeviceDiscovered', this.handleDeviceDiscovered.bind(this));
    DeviceEventEmitter.addListener('BLEDeviceConnected', this.handleDeviceConnected.bind(this));
    DeviceEventEmitter.addListener('BLEDeviceDisconnected', this.handleDeviceDisconnected.bind(this));
    DeviceEventEmitter.addListener('BLERemoteCommand', this.handleRemoteCommand.bind(this));
    DeviceEventEmitter.addListener('BLEError', this.handleBLEError.bind(this));
  }

  // Load default button mappings for common remote types
  private loadDefaultButtonMappings(): void {
    // Presentation remote mappings
    this.setButtonMapping('up_arrow', { button: 'up_arrow', action: 'scroll_up' });
    this.setButtonMapping('down_arrow', { button: 'down_arrow', action: 'scroll_down' });
    this.setButtonMapping('space', { button: 'space', action: 'play_pause' });
    this.setButtonMapping('right_arrow', { button: 'right_arrow', action: 'next_marker' });
    this.setButtonMapping('left_arrow', { button: 'left_arrow', action: 'previous_marker' });
    
    // Foot pedal mappings
    this.setButtonMapping('pedal_left', { 
      button: 'pedal_left', 
      action: 'scroll_up',
      holdAction: 'speed_increase',
      holdDuration: 1000
    });
    this.setButtonMapping('pedal_right', { 
      button: 'pedal_right', 
      action: 'scroll_down',
      holdAction: 'speed_decrease',
      holdDuration: 1000
    });
    this.setButtonMapping('pedal_center', { button: 'pedal_center', action: 'play_pause' });

    // Generic HID mappings
    this.setButtonMapping('button_a', { button: 'button_a', action: 'play_pause' });
    this.setButtonMapping('button_b', { button: 'button_b', action: 'reset_position' });
    this.setButtonMapping('dpad_up', { button: 'dpad_up', action: 'scroll_up' });
    this.setButtonMapping('dpad_down', { button: 'dpad_down', action: 'scroll_down' });
  }

  // Start scanning for BLE devices
  async startScanning(duration: number = 10000): Promise<void> {
    try {
      if (!this.currentState.hasPermission || !this.currentState.isBluetoothEnabled) {
        throw new Error('Bluetooth not available');
      }

      this.updateState({ 
        isScanning: true, 
        error: null,
        discoveredDevices: [] // Clear previous results
      });

      // Start BLE scan with HID device filter
      if (NativeModules.BLERemoteModule?.startScan) {
        await NativeModules.BLERemoteModule.startScan({
          serviceUUIDs: [
            '00001812-0000-1000-8000-00805f9b34fb', // HID Service UUID
            '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service UUID
          ],
          scanMode: 'balanced', // balanced, low_power, low_latency
          allowDuplicates: false,
        });
      }

      // Auto-stop scanning after duration
      this.scanTimeout = setTimeout(() => {
        this.stopScanning();
      }, duration);

    } catch (error) {
      console.error('Failed to start BLE scanning:', error);
      this.updateState({ 
        isScanning: false,
        error: 'Failed to start scanning for devices'
      });
    }
  }

  // Stop scanning for BLE devices
  async stopScanning(): Promise<void> {
    try {
      this.updateState({ isScanning: false });

      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout);
        this.scanTimeout = null;
      }

      if (NativeModules.BLERemoteModule?.stopScan) {
        await NativeModules.BLERemoteModule.stopScan();
      }
    } catch (error) {
      console.error('Failed to stop BLE scanning:', error);
    }
  }

  // Connect to a BLE device
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      this.updateState({ error: null });

      if (NativeModules.BLERemoteModule?.connect) {
        const success = await NativeModules.BLERemoteModule.connect(deviceId);
        
        if (success) {
          // Device connection will be handled by event listener
          return true;
        } else {
          this.updateState({ error: 'Failed to connect to device' });
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to connect to BLE device:', error);
      this.updateState({ error: 'Connection failed' });
      return false;
    }
  }

  // Disconnect from a BLE device
  async disconnectFromDevice(deviceId: string): Promise<boolean> {
    try {
      if (NativeModules.BLERemoteModule?.disconnect) {
        const success = await NativeModules.BLERemoteModule.disconnect(deviceId);
        
        if (success) {
          // Remove from connected devices
          this.updateState({
            connectedDevices: this.currentState.connectedDevices.filter(
              device => device.id !== deviceId
            )
          });
        }

        return success;
      }

      return false;
    } catch (error) {
      console.error('Failed to disconnect BLE device:', error);
      return false;
    }
  }

  // Set custom button mapping
  setButtonMapping(buttonId: string, mapping: ButtonMapping): void {
    this.buttonMappings.set(buttonId, mapping);
  }

  // Get button mapping
  getButtonMapping(buttonId: string): ButtonMapping | undefined {
    return this.buttonMappings.get(buttonId);
  }

  // Get all button mappings
  getAllButtonMappings(): Map<string, ButtonMapping> {
    return new Map(this.buttonMappings);
  }

  // Process remote command and execute corresponding action
  private processRemoteCommand(command: RemoteCommand): void {
    const mapping = this.buttonMappings.get(command.button);
    if (!mapping) {
      console.warn(`No mapping found for button: ${command.button}`);
      return;
    }

    let action: TeleprompterAction;

    // Check if this is a hold action
    if (command.action === 'hold' && mapping.holdAction) {
      action = mapping.holdAction;
    } else if (command.action === 'press') {
      action = mapping.action;
    } else {
      return; // Ignore release events unless specifically mapped
    }

    // Execute the teleprompter action
    this.executeTeleprompterAction(action, command);

    // Update state with last command
    this.updateState({ lastCommand: command });
  }

  // Execute teleprompter action
  private executeTeleprompterAction(action: TeleprompterAction, command: RemoteCommand): void {
    // Emit the action for the teleprompter to handle
    DeviceEventEmitter.emit('TeleprompterRemoteAction', {
      action,
      deviceId: command.deviceId,
      timestamp: command.timestamp,
    });

    // Show visual feedback
    this.showRemoteCommandFeedback(action, command.deviceId);
  }

  // Show visual feedback for remote command
  private showRemoteCommandFeedback(action: TeleprompterAction, deviceId: string): void {
    DeviceEventEmitter.emit('RemoteCommandFeedback', {
      action,
      deviceId,
      message: this.getActionDisplayName(action),
      timestamp: Date.now(),
    });
  }

  // Get display name for action
  private getActionDisplayName(action: TeleprompterAction): string {
    switch (action) {
      case 'play_pause': return 'Play/Pause';
      case 'scroll_up': return 'Scroll Up';
      case 'scroll_down': return 'Scroll Down';
      case 'speed_increase': return 'Speed Up';
      case 'speed_decrease': return 'Speed Down';
      case 'next_marker': return 'Next Section';
      case 'previous_marker': return 'Previous Section';
      case 'reset_position': return 'Reset Position';
      case 'toggle_speech_recognition': return 'Toggle Speech';
      case 'toggle_karaoke': return 'Toggle Karaoke';
      default: return 'Unknown Action';
    }
  }

  // Event handlers
  private handleDeviceDiscovered(deviceInfo: any): void {
    const device: BLEDevice = {
      id: deviceInfo.id,
      name: deviceInfo.name || 'Unknown Device',
      type: this.detectDeviceType(deviceInfo),
      manufacturer: deviceInfo.manufacturer,
      model: deviceInfo.model,
      isConnected: false,
      supportedButtons: this.getSupportedButtons(deviceInfo),
      rssi: deviceInfo.rssi,
    };

    // Add to discovered devices if not already present
    const existingIndex = this.currentState.discoveredDevices.findIndex(
      d => d.id === device.id
    );

    if (existingIndex >= 0) {
      // Update existing device
      const updatedDevices = [...this.currentState.discoveredDevices];
      updatedDevices[existingIndex] = device;
      this.updateState({ discoveredDevices: updatedDevices });
    } else {
      // Add new device
      this.updateState({
        discoveredDevices: [...this.currentState.discoveredDevices, device]
      });
    }
  }

  private handleDeviceConnected(deviceInfo: any): void {
    const device = this.currentState.discoveredDevices.find(d => d.id === deviceInfo.id);
    if (device) {
      device.isConnected = true;
      device.batteryLevel = deviceInfo.batteryLevel;

      this.updateState({
        connectedDevices: [...this.currentState.connectedDevices, device]
      });
    }
  }

  private handleDeviceDisconnected(deviceInfo: any): void {
    this.updateState({
      connectedDevices: this.currentState.connectedDevices.filter(
        device => device.id !== deviceInfo.id
      )
    });
  }

  private handleRemoteCommand(commandData: any): void {
    const command: RemoteCommand = {
      deviceId: commandData.deviceId,
      button: commandData.button,
      action: commandData.action,
      timestamp: Date.now(),
    };

    // Process the command
    this.processRemoteCommand(command);

    // Notify command listeners
    this.commandListeners.forEach(listener => listener(command));
  }

  private handleBLEError(errorInfo: any): void {
    console.error('BLE Error:', errorInfo);
    this.updateState({ error: errorInfo.message || 'Bluetooth error occurred' });
  }

  // Utility methods
  private detectDeviceType(deviceInfo: any): BLEDevice['type'] {
    const name = deviceInfo.name?.toLowerCase() || '';
    
    if (name.includes('presenter') || name.includes('remote') || name.includes('clicker')) {
      return 'presentation_remote';
    } else if (name.includes('pedal') || name.includes('foot')) {
      return 'foot_pedal';
    } else if (name.includes('keyboard')) {
      return 'keyboard';
    } else {
      return 'generic_hid';
    }
  }

  private getSupportedButtons(deviceInfo: any): string[] {
    // This would be determined by the device's HID descriptor
    // For now, return common buttons based on device type
    const type = this.detectDeviceType(deviceInfo);
    
    switch (type) {
      case 'presentation_remote':
        return ['up_arrow', 'down_arrow', 'left_arrow', 'right_arrow', 'space', 'escape'];
      case 'foot_pedal':
        return ['pedal_left', 'pedal_right', 'pedal_center'];
      case 'keyboard':
        return ['space', 'enter', 'escape', 'up_arrow', 'down_arrow', 'left_arrow', 'right_arrow'];
      default:
        return ['button_a', 'button_b', 'dpad_up', 'dpad_down', 'dpad_left', 'dpad_right'];
    }
  }

  // State management
  addListener(listener: (state: BLERemoteState) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (state: BLERemoteState) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  addCommandListener(listener: (command: RemoteCommand) => void): void {
    this.commandListeners.push(listener);
  }

  removeCommandListener(listener: (command: RemoteCommand) => void): void {
    this.commandListeners = this.commandListeners.filter(l => l !== listener);
  }

  private updateState(updates: Partial<BLERemoteState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  getCurrentState(): BLERemoteState {
    return { ...this.currentState };
  }

  // Cleanup
  cleanup(): void {
    this.stopScanning();
    
    // Disconnect all devices
    this.currentState.connectedDevices.forEach(device => {
      this.disconnectFromDevice(device.id);
    });

    // Clear listeners
    DeviceEventEmitter.removeAllListeners('BLEDeviceDiscovered');
    DeviceEventEmitter.removeAllListeners('BLEDeviceConnected');
    DeviceEventEmitter.removeAllListeners('BLEDeviceDisconnected');
    DeviceEventEmitter.removeAllListeners('BLERemoteCommand');
    DeviceEventEmitter.removeAllListeners('BLEError');
  }
}

export const bleRemoteService = BLERemoteService.getInstance();
