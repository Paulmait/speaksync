import { Platform, NativeModules, DeviceEventEmitter } from 'react-native';
import { PerformanceOptimizer } from './performanceOptimizer';

export interface ExternalDisplayState {
  isConnected: boolean;
  displayCount: number;
  currentDisplay: ExternalDisplay | null;
  availableDisplays: ExternalDisplay[];
  isMirroring: boolean;
  isWirelessCasting: boolean;
  error: string | null;
}

export interface ExternalDisplay {
  id: string;
  name: string;
  type: 'wired' | 'wireless';
  technology: 'hdmi' | 'usb-c' | 'lightning' | 'chromecast' | 'airplay';
  resolution: {
    width: number;
    height: number;
  };
  isAvailable: boolean;
}

export interface TeleprompterDisplayOptions {
  mirrorHorizontally: boolean;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  scrollSpeed: number;
  showControls: boolean;
  enableSpeechTracking: boolean;
}

class ExternalDisplayService {
  private static instance: ExternalDisplayService;
  private performanceOptimizer = PerformanceOptimizer.getInstance();
  private listeners: Array<(state: ExternalDisplayState) => void> = [];
  private currentState: ExternalDisplayState = {
    isConnected: false,
    displayCount: 0,
    currentDisplay: null,
    availableDisplays: [],
    isMirroring: false,
    isWirelessCasting: false,
    error: null,
  };

  static getInstance(): ExternalDisplayService {
    if (!ExternalDisplayService.instance) {
      ExternalDisplayService.instance = new ExternalDisplayService();
    }
    return ExternalDisplayService.instance;
  }

  // Initialize external display monitoring
  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await this.initializeIOS();
      } else if (Platform.OS === 'android') {
        await this.initializeAndroid();
      }

      // Set up display change listeners
      this.setupDisplayListeners();
      
      // Initial scan for available displays
      await this.scanForDisplays();

    } catch (error) {
      console.error('Failed to initialize external display service:', error);
      this.updateState({ error: 'Failed to initialize external display support' });
    }
  }

  // iOS-specific initialization using UIScene/Multi-Window API
  private async initializeIOS(): Promise<void> {
    // This would require a native iOS module
    try {
      // Check if UIScene multiple window support is available (iOS 13+)
      if (NativeModules.ExternalDisplayModule) {
        await NativeModules.ExternalDisplayModule.initialize();
      }
    } catch (error) {
      console.warn('iOS external display module not available:', error);
    }
  }

  // Android-specific initialization using Presentation API
  private async initializeAndroid(): Promise<void> {
    // This would require a native Android module
    try {
      // Initialize Android Presentation API for secondary displays
      if (NativeModules.ExternalDisplayModule) {
        await NativeModules.ExternalDisplayModule.initialize();
      }
    } catch (error) {
      console.warn('Android external display module not available:', error);
    }
  }

  // Set up listeners for display connection/disconnection events
  private setupDisplayListeners(): void {
    if (Platform.OS === 'ios') {
      // iOS screen connection events
      DeviceEventEmitter.addListener('ExternalDisplayConnected', this.handleDisplayConnected.bind(this));
      DeviceEventEmitter.addListener('ExternalDisplayDisconnected', this.handleDisplayDisconnected.bind(this));
    } else if (Platform.OS === 'android') {
      // Android display events
      DeviceEventEmitter.addListener('DisplayAdded', this.handleDisplayConnected.bind(this));
      DeviceEventEmitter.addListener('DisplayRemoved', this.handleDisplayDisconnected.bind(this));
    }

    // Wireless casting events
    DeviceEventEmitter.addListener('CastSessionStarted', this.handleCastStarted.bind(this));
    DeviceEventEmitter.addListener('CastSessionEnded', this.handleCastEnded.bind(this));
  }

  // Scan for available external displays
  async scanForDisplays(): Promise<ExternalDisplay[]> {
    try {
      const wiredDisplays = await this.scanWiredDisplays();
      const wirelessDisplays = await this.scanWirelessDisplays();
      
      const allDisplays = [...wiredDisplays, ...wirelessDisplays];
      
      this.updateState({ 
        availableDisplays: allDisplays,
        displayCount: allDisplays.length,
        isConnected: allDisplays.length > 0,
      });

      return allDisplays;
    } catch (error) {
      console.error('Failed to scan for displays:', error);
      this.updateState({ error: 'Failed to scan for external displays' });
      return [];
    }
  }

  // Scan for wired displays (HDMI, USB-C, Lightning)
  private async scanWiredDisplays(): Promise<ExternalDisplay[]> {
    const displays: ExternalDisplay[] = [];

    try {
      if (NativeModules.ExternalDisplayModule?.getWiredDisplays) {
        const nativeDisplays = await NativeModules.ExternalDisplayModule.getWiredDisplays();
        
        for (const display of nativeDisplays) {
          displays.push({
            id: display.id,
            name: display.name || 'External Display',
            type: 'wired',
            technology: this.detectWiredTechnology(display),
            resolution: {
              width: display.width || 1920,
              height: display.height || 1080,
            },
            isAvailable: true,
          });
        }
      }
    } catch (error) {
      console.warn('Failed to scan wired displays:', error);
    }

    return displays;
  }

  // Scan for wireless displays (Chromecast, AirPlay)
  private async scanWirelessDisplays(): Promise<ExternalDisplay[]> {
    const displays: ExternalDisplay[] = [];

    try {
      // Scan for Chromecast devices
      const chromecastDisplays = await this.scanChromecastDevices();
      displays.push(...chromecastDisplays);

      // Scan for AirPlay devices (iOS only)
      if (Platform.OS === 'ios') {
        const airplayDisplays = await this.scanAirPlayDevices();
        displays.push(...airplayDisplays);
      }
    } catch (error) {
      console.warn('Failed to scan wireless displays:', error);
    }

    return displays;
  }

  // Scan for Chromecast devices using Google Cast SDK
  private async scanChromecastDevices(): Promise<ExternalDisplay[]> {
    const displays: ExternalDisplay[] = [];

    try {
      if (NativeModules.GoogleCastModule?.discoverDevices) {
        const devices = await NativeModules.GoogleCastModule.discoverDevices();
        
        for (const device of devices) {
          displays.push({
            id: device.deviceId,
            name: device.friendlyName,
            type: 'wireless',
            technology: 'chromecast',
            resolution: {
              width: 1920, // Standard Cast resolution
              height: 1080,
            },
            isAvailable: device.isAvailable,
          });
        }
      }
    } catch (error) {
      console.warn('Failed to scan Chromecast devices:', error);
    }

    return displays;
  }

  // Scan for AirPlay devices (iOS only)
  private async scanAirPlayDevices(): Promise<ExternalDisplay[]> {
    const displays: ExternalDisplay[] = [];

    try {
      if (Platform.OS === 'ios' && NativeModules.AirPlayModule?.discoverDevices) {
        const devices = await NativeModules.AirPlayModule.discoverDevices();
        
        for (const device of devices) {
          displays.push({
            id: device.deviceId,
            name: device.name,
            type: 'wireless',
            technology: 'airplay',
            resolution: {
              width: device.width || 1920,
              height: device.height || 1080,
            },
            isAvailable: device.isAvailable,
          });
        }
      }
    } catch (error) {
      console.warn('Failed to scan AirPlay devices:', error);
    }

    return displays;
  }

  // Connect to an external display
  async connectToDisplay(
    displayId: string,
    options: TeleprompterDisplayOptions
  ): Promise<boolean> {
    try {
      const display = this.currentState.availableDisplays.find(d => d.id === displayId);
      if (!display) {
        throw new Error('Display not found');
      }

      this.updateState({ error: null });

      if (display.type === 'wired') {
        return await this.connectWiredDisplay(display, options);
      } else {
        return await this.connectWirelessDisplay(display, options);
      }
    } catch (error) {
      console.error('Failed to connect to display:', error);
      this.updateState({ error: 'Failed to connect to external display' });
      return false;
    }
  }

  // Connect to wired display using native presentation API
  private async connectWiredDisplay(
    display: ExternalDisplay,
    options: TeleprompterDisplayOptions
  ): Promise<boolean> {
    try {
      if (NativeModules.ExternalDisplayModule?.connectWiredDisplay) {
        const success = await NativeModules.ExternalDisplayModule.connectWiredDisplay(
          display.id,
          {
            mirrorHorizontally: options.mirrorHorizontally,
            fontSize: options.fontSize,
            backgroundColor: options.backgroundColor,
            textColor: options.textColor,
            showControls: options.showControls,
          }
        );

        if (success) {
          this.updateState({
            currentDisplay: display,
            isMirroring: true,
            isWirelessCasting: false,
          });
        }

        return success;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect wired display:', error);
      return false;
    }
  }

  // Connect to wireless display using Cast/AirPlay
  private async connectWirelessDisplay(
    display: ExternalDisplay,
    options: TeleprompterDisplayOptions
  ): Promise<boolean> {
    try {
      let success = false;

      if (display.technology === 'chromecast') {
        success = await this.connectChromecast(display, options);
      } else if (display.technology === 'airplay') {
        success = await this.connectAirPlay(display, options);
      }

      if (success) {
        this.updateState({
          currentDisplay: display,
          isMirroring: false,
          isWirelessCasting: true,
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to connect wireless display:', error);
      return false;
    }
  }

  // Connect to Chromecast device
  private async connectChromecast(
    display: ExternalDisplay,
    options: TeleprompterDisplayOptions
  ): Promise<boolean> {
    try {
      if (NativeModules.GoogleCastModule?.connect) {
        return await NativeModules.GoogleCastModule.connect(display.id, {
          appId: 'your-cast-app-id', // Custom receiver app for SpeakSync
          sessionData: {
            teleprompterOptions: options,
          },
        });
      }
      return false;
    } catch (error) {
      console.error('Failed to connect Chromecast:', error);
      return false;
    }
  }

  // Connect to AirPlay device
  private async connectAirPlay(
    display: ExternalDisplay,
    options: TeleprompterDisplayOptions
  ): Promise<boolean> {
    try {
      if (Platform.OS === 'ios' && NativeModules.AirPlayModule?.connect) {
        return await NativeModules.AirPlayModule.connect(display.id, options);
      }
      return false;
    } catch (error) {
      console.error('Failed to connect AirPlay:', error);
      return false;
    }
  }

  // Update content on external display
  async updateDisplayContent(
    scriptContent: string,
    currentPosition: number,
    highlightedWords?: number[]
  ): Promise<void> {
    try {
      const { currentDisplay, isMirroring, isWirelessCasting } = this.currentState;
      
      if (!currentDisplay) return;

      if (isMirroring && NativeModules.ExternalDisplayModule?.updateContent) {
        await NativeModules.ExternalDisplayModule.updateContent({
          content: scriptContent,
          position: currentPosition,
          highlightedWords,
        });
      } else if (isWirelessCasting) {
        if (currentDisplay.technology === 'chromecast') {
          await this.updateChromecastContent(scriptContent, currentPosition, highlightedWords);
        } else if (currentDisplay.technology === 'airplay') {
          await this.updateAirPlayContent(scriptContent, currentPosition, highlightedWords);
        }
      }
    } catch (error) {
      console.error('Failed to update display content:', error);
    }
  }

  // Update Chromecast content
  private async updateChromecastContent(
    scriptContent: string,
    currentPosition: number,
    highlightedWords?: number[]
  ): Promise<void> {
    if (NativeModules.GoogleCastModule?.sendMessage) {
      await NativeModules.GoogleCastModule.sendMessage({
        type: 'UPDATE_CONTENT',
        data: {
          content: scriptContent,
          position: currentPosition,
          highlightedWords,
          timestamp: Date.now(),
        },
      });
    }
  }

  // Update AirPlay content
  private async updateAirPlayContent(
    scriptContent: string,
    currentPosition: number,
    highlightedWords?: number[]
  ): Promise<void> {
    if (Platform.OS === 'ios' && NativeModules.AirPlayModule?.updateContent) {
      await NativeModules.AirPlayModule.updateContent({
        content: scriptContent,
        position: currentPosition,
        highlightedWords,
      });
    }
  }

  // Disconnect from current display
  async disconnect(): Promise<void> {
    try {
      const { currentDisplay, isMirroring, isWirelessCasting } = this.currentState;
      
      if (!currentDisplay) return;

      if (isMirroring && NativeModules.ExternalDisplayModule?.disconnect) {
        await NativeModules.ExternalDisplayModule.disconnect();
      } else if (isWirelessCasting) {
        if (currentDisplay.technology === 'chromecast' && NativeModules.GoogleCastModule?.disconnect) {
          await NativeModules.GoogleCastModule.disconnect();
        } else if (currentDisplay.technology === 'airplay' && NativeModules.AirPlayModule?.disconnect) {
          await NativeModules.AirPlayModule.disconnect();
        }
      }

      this.updateState({
        currentDisplay: null,
        isMirroring: false,
        isWirelessCasting: false,
      });
    } catch (error) {
      console.error('Failed to disconnect display:', error);
      this.updateState({ error: 'Failed to disconnect from external display' });
    }
  }

  // Event handlers
  private handleDisplayConnected(displayInfo: any): void {
    this.scanForDisplays(); // Refresh available displays
  }

  private handleDisplayDisconnected(displayInfo: any): void {
    const { currentDisplay } = this.currentState;
    
    if (currentDisplay && currentDisplay.id === displayInfo.id) {
      this.updateState({
        currentDisplay: null,
        isMirroring: false,
        isWirelessCasting: false,
      });
    }
    
    this.scanForDisplays(); // Refresh available displays
  }

  private handleCastStarted(sessionInfo: any): void {
    this.updateState({ isWirelessCasting: true });
  }

  private handleCastEnded(sessionInfo: any): void {
    this.updateState({
      currentDisplay: null,
      isWirelessCasting: false,
    });
  }

  // Utility methods
  private detectWiredTechnology(display: any): 'hdmi' | 'usb-c' | 'lightning' {
    if (Platform.OS === 'ios') {
      return 'lightning'; // or USB-C for newer devices
    } else {
      return display.type === 'usb' ? 'usb-c' : 'hdmi';
    }
  }

  // State management
  addListener(listener: (state: ExternalDisplayState) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (state: ExternalDisplayState) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private updateState(updates: Partial<ExternalDisplayState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  getCurrentState(): ExternalDisplayState {
    return { ...this.currentState };
  }
}

export const externalDisplayService = ExternalDisplayService.getInstance();
