import { CameraView, CameraType, FlashMode, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { PerformanceOptimizer } from './performanceOptimizer';

export interface VideoRecordingState {
  isRecording: boolean;
  hasPermission: boolean;
  cameraType: 'front' | 'back';
  flashMode: 'off' | 'on' | 'auto';
  recordingUri: string | null;
  duration: number;
  isProcessing: boolean;
  error: string | null;
}

export interface VideoRecordingOptions {
  quality: 'low' | 'medium' | 'high' | '4k';
  orientation: 'portrait' | 'landscape';
  enableAudio: boolean;
  maxDuration?: number; // in seconds
}

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number;
  size: 'small' | 'medium' | 'large';
}

class VideoRecordingService {
  private static instance: VideoRecordingService;
  private camera: CameraView | null = null;
  private recording: any = null;
  private performanceOptimizer = PerformanceOptimizer.getInstance();
  private listeners: Array<(state: VideoRecordingState) => void> = [];
  private currentState: VideoRecordingState = {
    isRecording: false,
    hasPermission: false,
    cameraType: 'front',
    flashMode: 'off',
    recordingUri: null,
    duration: 0,
    isProcessing: false,
    error: null,
  };

  static getInstance(): VideoRecordingService {
    if (!VideoRecordingService.instance) {
      VideoRecordingService.instance = new VideoRecordingService();
    }
    return VideoRecordingService.instance;
  }

  // Initialize camera permissions and setup
  async initialize(): Promise<boolean> {
    try {
      // For now, return true to skip complex permission setup
      // In production, implement proper expo-camera v16 permission checking
      this.updateState({ hasPermission: true });
      return true;
    } catch (error) {
      console.error('Failed to initialize video recording:', error);
      this.updateState({ 
        error: 'Failed to initialize camera permissions',
        hasPermission: false 
      });
      return false;
    }
  }

  // Start video recording with teleprompter synchronization
  async startRecording(
    options: VideoRecordingOptions,
    sessionId: string,
    onSyncUpdate?: (timestamp: number, scrollPosition: number) => void
  ): Promise<boolean> {
    if (!this.camera || !this.currentState.hasPermission) {
      this.updateState({ error: 'Camera not available or permissions not granted' });
      return false;
    }

    try {
      this.updateState({ isRecording: true, error: null });

      // Optimize performance for recording
      this.performanceOptimizer.initMemoryMonitoring();

      const recordingOptions = {
        quality: this.getQualitySettings(options.quality),
        maxDuration: options.maxDuration || 3600, // 1 hour max
        maxFileSize: this.getMaxFileSize(options.quality),
        mute: !options.enableAudio,
      };

      this.recording = await this.camera.recordAsync(recordingOptions);

      // Start sync tracking
      if (onSyncUpdate) {
        this.startSyncTracking(sessionId, onSyncUpdate);
      }

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.updateState({ 
        isRecording: false,
        error: 'Failed to start video recording'
      });
      return false;
    }
  }

  // Stop video recording
  async stopRecording(): Promise<string | null> {
    if (!this.recording || !this.currentState.isRecording) {
      return null;
    }

    try {
      this.updateState({ isProcessing: true });

      await this.camera?.stopRecording();
      const uri = this.recording.uri;

      this.updateState({ 
        isRecording: false,
        recordingUri: uri,
        isProcessing: false
      });

      // Clean up performance monitoring
      this.performanceOptimizer.cleanup();

      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.updateState({ 
        isRecording: false,
        isProcessing: false,
        error: 'Failed to stop recording'
      });
      return null;
    }
  }

  // Export video with watermark (for free tier users)
  async exportVideo(
    videoUri: string,
    watermarkOptions: WatermarkOptions,
    outputPath?: string
  ): Promise<string | null> {
    try {
      this.updateState({ isProcessing: true, error: null });

      const outputUri = outputPath || 
        `${FileSystem.documentDirectory}exported_video_${Date.now()}.mp4`;

      if (watermarkOptions.enabled) {
        // Apply watermark using FFmpeg or native video processing
        const watermarkedUri = await this.applyWatermark(videoUri, watermarkOptions, outputUri);
        
        // Save to media library
        await MediaLibrary.saveToLibraryAsync(watermarkedUri);
        
        this.updateState({ isProcessing: false });
        return watermarkedUri;
      } else {
        // Pro/Studio tier - no watermark
        await MediaLibrary.saveToLibraryAsync(videoUri);
        this.updateState({ isProcessing: false });
        return videoUri;
      }
    } catch (error) {
      console.error('Failed to export video:', error);
      this.updateState({ 
        isProcessing: false,
        error: 'Failed to export video'
      });
      return null;
    }
  }

  // Apply watermark to video
  private async applyWatermark(
    videoUri: string,
    watermarkOptions: WatermarkOptions,
    outputUri: string
  ): Promise<string> {
    // For React Native, we'll use expo-av with overlay or FFmpeg
    // This is a simplified implementation - in production, use FFmpeg for better quality
    
    const watermarkConfig = {
      text: watermarkOptions.text,
      position: this.getWatermarkPosition(watermarkOptions.position),
      opacity: watermarkOptions.opacity,
      fontSize: this.getWatermarkSize(watermarkOptions.size),
    };

    // Apply watermark using native video processing
    // This would require a native module or FFmpeg integration
    return this.processVideoWithWatermark(videoUri, watermarkConfig, outputUri);
  }

  // Process video with watermark (native implementation needed)
  private async processVideoWithWatermark(
    inputUri: string,
    watermarkConfig: any,
    outputUri: string
  ): Promise<string> {
    // This would call a native module to process the video
    // For now, return the input URI (implement native processing)
    
    if (Platform.OS === 'ios') {
      // Use AVFoundation for iOS video processing
      return this.processVideoIOS(inputUri, watermarkConfig, outputUri);
    } else {
      // Use MediaMetadataRetriever and MediaMuxer for Android
      return this.processVideoAndroid(inputUri, watermarkConfig, outputUri);
    }
  }

  private async processVideoIOS(
    inputUri: string,
    watermarkConfig: any,
    outputUri: string
  ): Promise<string> {
    // iOS-specific video processing with AVFoundation
    // This would require a native iOS module
    return inputUri; // Placeholder
  }

  private async processVideoAndroid(
    inputUri: string,
    watermarkConfig: any,
    outputUri: string
  ): Promise<string> {
    // Android-specific video processing
    // This would require a native Android module
    return inputUri; // Placeholder
  }

  // Synchronize video with teleprompter session data
  private startSyncTracking(
    sessionId: string,
    onSyncUpdate: (timestamp: number, scrollPosition: number) => void
  ): void {
    const startTime = Date.now();
    
    const syncInterval = setInterval(() => {
      if (!this.currentState.isRecording) {
        clearInterval(syncInterval);
        return;
      }

      const timestamp = Date.now() - startTime;
      // Get current scroll position from teleprompter
      // This would be passed from the teleprompter component
      onSyncUpdate(timestamp, 0); // scrollPosition would come from teleprompter
    }, 100); // 10fps sync tracking
  }

  // Get quality settings based on tier
  private getQualitySettings(quality: string) {
    // Return simple quality strings for now
    // In production, use proper expo-camera v16 quality constants
    switch (quality) {
      case '4k':
        return '2160p';
      case 'high':
        return '1080p';
      case 'medium':
        return '720p';
      case 'low':
      default:
        return '480p';
    }
  }

  private getMaxFileSize(quality: string): number {
    // Return max file size in bytes based on quality
    switch (quality) {
      case '4k': return 2000 * 1024 * 1024; // 2GB
      case 'high': return 1000 * 1024 * 1024; // 1GB
      case 'medium': return 500 * 1024 * 1024; // 500MB
      case 'low': return 200 * 1024 * 1024; // 200MB
      default: return 500 * 1024 * 1024;
    }
  }

  private getWatermarkPosition(position: string) {
    switch (position) {
      case 'top-left': return { x: 0.05, y: 0.05 };
      case 'top-right': return { x: 0.75, y: 0.05 };
      case 'bottom-left': return { x: 0.05, y: 0.85 };
      case 'bottom-right': return { x: 0.75, y: 0.85 };
      default: return { x: 0.75, y: 0.85 };
    }
  }

  private getWatermarkSize(size: string): number {
    switch (size) {
      case 'small': return 12;
      case 'medium': return 16;
      case 'large': return 20;
      default: return 16;
    }
  }

  // State management
  addListener(listener: (state: VideoRecordingState) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (state: VideoRecordingState) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private updateState(updates: Partial<VideoRecordingState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  getCurrentState(): VideoRecordingState {
    return { ...this.currentState };
  }

  // Camera reference management
  setCameraRef(camera: CameraView | null): void {
    this.camera = camera;
  }

  // Switch camera (front/back)
  switchCamera(): void {
    const newType = this.currentState.cameraType === 'front' 
      ? 'back' 
      : 'front';
    
    this.updateState({ cameraType: newType });
  }

  // Toggle flash
  toggleFlash(): void {
    const newFlash = this.currentState.flashMode === 'off' 
      ? 'on' 
      : 'off';
    
    this.updateState({ flashMode: newFlash });
  }
}

export const videoRecordingService = VideoRecordingService.getInstance();
