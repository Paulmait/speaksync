import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Text as RNText,
} from 'react-native';
import {
  Surface,
  IconButton,
  Text,
  Switch,
  Portal,
  Modal,
  Button,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { CameraView, CameraType } from 'expo-camera';
import { 
  videoRecordingService, 
  VideoRecordingState, 
  VideoRecordingOptions,
  WatermarkOptions 
} from '../services/videoRecordingService';
import { useSubscriptionStore } from '../store/subscriptionStore';

interface VideoRecordingPanelProps {
  sessionId: string;
  isActive: boolean;
  onRecordingStateChange: (isRecording: boolean) => void;
  onVideoRecorded: (videoUri: string) => void;
  onScrollSync?: (timestamp: number, scrollPosition: number) => void;
}

export function VideoRecordingPanel({
  sessionId,
  isActive,
  onRecordingStateChange,
  onVideoRecorded,
  onScrollSync,
}: VideoRecordingPanelProps) {
  const cameraRef = useRef<CameraView>(null);
  const { subscription } = useSubscriptionStore();
  const [recordingState, setRecordingState] = useState<VideoRecordingState>(
    videoRecordingService.getCurrentState()
  );
  const [showSettings, setShowSettings] = useState(false);
  const [recordingOptions, setRecordingOptions] = useState<VideoRecordingOptions>({
    quality: subscription?.tier === 'free' ? 'medium' : 'high',
    orientation: 'landscape',
    enableAudio: true,
    maxDuration: subscription?.tier === 'free' ? 600 : 3600, // 10 min free, 1 hour paid
  });

  useEffect(() => {
    const listener = (state: VideoRecordingState) => {
      setRecordingState(state);
      onRecordingStateChange(state.isRecording);
    };

    videoRecordingService.addListener(listener);
    videoRecordingService.initialize();

    return () => {
      videoRecordingService.removeListener(listener);
    };
  }, [onRecordingStateChange]);

  useEffect(() => {
    if (cameraRef.current) {
      videoRecordingService.setCameraRef(cameraRef.current);
    }
  }, []);

  const handleStartRecording = async () => {
    const success = await videoRecordingService.startRecording(
      recordingOptions,
      sessionId,
      onScrollSync
    );

    if (!success) {
      Alert.alert('Recording Error', 'Failed to start video recording');
    }
  };

  const handleStopRecording = async () => {
    const videoUri = await videoRecordingService.stopRecording();
    
    if (videoUri) {
      // Apply watermark based on subscription tier
      const watermarkOptions: WatermarkOptions = {
        enabled: subscription?.tier === 'free',
        text: 'SpeakSync',
        position: 'bottom-right',
        opacity: 0.7,
        size: 'medium',
      };

      const exportedUri = await videoRecordingService.exportVideo(
        videoUri,
        watermarkOptions
      );

      if (exportedUri) {
        onVideoRecorded(exportedUri);
        
        // Show tier-appropriate message
        if (subscription?.tier === 'free') {
          Alert.alert(
            'Video Recorded!',
            'Your video has been saved with a SpeakSync watermark. Upgrade to Pro to remove watermarks!',
            [
              { text: 'OK' },
              { text: 'Upgrade Now', onPress: () => {/* Navigate to subscription */ } }
            ]
          );
        } else {
          Alert.alert('Video Recorded!', 'Your video has been saved without watermarks.');
        }
      }
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case '4k': return '4K UHD';
      case 'high': return '1080p HD';
      case 'medium': return '720p';
      case 'low': return '480p';
      default: return quality;
    }
  };

  const getAvailableQualities = () => {
    const base = ['low', 'medium'];
    if (subscription?.tier !== 'free') {
      base.push('high');
      if (subscription?.tier === 'studio') {
        base.push('4k');
      }
    }
    return base;
  };

  if (!isActive || !recordingState.hasPermission) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.panel}>
        {/* Camera Preview */}
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={recordingState.cameraType}
            flash={recordingState.flashMode}
          >
            {/* Recording indicator */}
            {recordingState.isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>REC</Text>
              </View>
            )}

            {/* Camera controls overlay */}
            <View style={styles.cameraControls}>
              <IconButton
                icon="camera-flip"
                iconColor="white"
                size={24}
                onPress={() => videoRecordingService.switchCamera()}
              />
              <IconButton
                icon={recordingState.flashMode === 'off' ? 'flash-off' : 'flash'}
                iconColor="white"
                size={24}
                onPress={() => videoRecordingService.toggleFlash()}
              />
            </View>
          </CameraView>
        </View>

        {/* Recording controls */}
        <View style={styles.controls}>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => setShowSettings(true)}
            disabled={recordingState.isRecording}
          />

          {/* Main record button */}
          <IconButton
            icon={recordingState.isRecording ? 'stop' : 'record'}
            iconColor={recordingState.isRecording ? '#ef4444' : '#10b981'}
            size={40}
            style={[
              styles.recordButton,
              recordingState.isRecording && styles.recordingButton
            ]}
            onPress={recordingState.isRecording ? handleStopRecording : handleStartRecording}
            disabled={recordingState.isProcessing}
          />

          <View style={styles.statusContainer}>
            <Text variant="bodySmall">
              {getQualityLabel(recordingOptions.quality)}
            </Text>
            {subscription?.tier === 'free' && (
              <Chip 
                icon="watermark" 
                compact 
                textStyle={styles.watermarkChip}
              >
                Watermark
              </Chip>
            )}
          </View>
        </View>

        {/* Processing indicator */}
        {recordingState.isProcessing && (
          <View style={styles.processingContainer}>
            <ProgressBar indeterminate />
            <Text variant="bodySmall" style={styles.processingText}>
              Processing video...
            </Text>
          </View>
        )}
      </Surface>

      {/* Settings Modal */}
      <Portal>
        <Modal
          visible={showSettings}
          onDismiss={() => setShowSettings(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Video Settings
          </Text>

          {/* Quality Selection */}
          <View style={styles.settingGroup}>
            <Text variant="titleMedium">Quality</Text>
            <View style={styles.qualityButtons}>
              {getAvailableQualities().map((quality) => (
                <Button
                  key={quality}
                  mode={recordingOptions.quality === quality ? 'contained' : 'outlined'}
                  onPress={() => setRecordingOptions(prev => ({ ...prev, quality: quality as any }))}
                  style={styles.qualityButton}
                  compact
                >
                  {getQualityLabel(quality)}
                </Button>
              ))}
            </View>
            {subscription?.tier === 'free' && (
              <Text variant="bodySmall" style={styles.upgradeText}>
                Upgrade to Pro for HD quality and 4K (Studio tier)
              </Text>
            )}
          </View>

          {/* Audio Recording */}
          <View style={styles.settingGroup}>
            <View style={styles.settingRow}>
              <Text variant="titleMedium">Record Audio</Text>
              <Switch
                value={recordingOptions.enableAudio}
                onValueChange={(value) => 
                  setRecordingOptions(prev => ({ ...prev, enableAudio: value }))
                }
              />
            </View>
          </View>

          {/* Max Duration */}
          <View style={styles.settingGroup}>
            <Text variant="titleMedium">Max Duration</Text>
            <Text variant="bodyMedium">
              {subscription?.tier === 'free' 
                ? '10 minutes (Free tier)' 
                : '60 minutes (Pro/Studio tier)'
              }
            </Text>
          </View>

          {/* Watermark Info */}
          {subscription?.tier === 'free' && (
            <View style={styles.settingGroup}>
              <Text variant="titleMedium" style={styles.watermarkTitle}>
                Watermark
              </Text>
              <Text variant="bodyMedium">
                Free tier videos include a SpeakSync watermark. 
                Upgrade to Pro to remove watermarks.
              </Text>
              <Button
                mode="contained"
                style={styles.upgradeButton}
                onPress={() => {/* Navigate to subscription */}}
              >
                Upgrade Now
              </Button>
            </View>
          )}

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
    top: 16,
    right: 16,
    zIndex: 1000,
  },
  panel: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    minWidth: 200,
  },
  cameraContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  camera: {
    width: 160,
    height: 120,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 4,
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cameraControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'column',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  recordingButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusContainer: {
    alignItems: 'center',
  },
  watermarkChip: {
    fontSize: 10,
  },
  processingContainer: {
    marginTop: 8,
    padding: 8,
  },
  processingText: {
    textAlign: 'center',
    marginTop: 4,
    color: 'white',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  settingGroup: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  qualityButton: {
    minWidth: 80,
  },
  upgradeText: {
    color: '#6366f1',
    marginTop: 4,
  },
  watermarkTitle: {
    color: '#f59e0b',
  },
  upgradeButton: {
    marginTop: 8,
  },
  modalCloseButton: {
    marginTop: 16,
  },
});
