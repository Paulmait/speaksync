import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { Platform, PermissionsAndroid } from 'react-native';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { ErrorHandlingService } from './errorHandlingService';
import { logger } from './loggingService';
import { 
  ErrorCategory,
  ErrorSeverity
} from '../types/errorTypes';
import type { 
  SpeechRecognitionState, 
  AudioPermissions, 
  TranscriptionResult, 
  SpeechConfig,
  WordMatch 
} from '../types';

// Interface for Deepgram transcript data is implicitly defined through usage
// We're using 'any' type in the event listeners for flexibility

// Type for a Deepgram connection with requestClose() method
interface DeepgramConnection {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void): void;
  requestClose?(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

class SpeechRecognitionService {
  private deepgram: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private connection: DeepgramConnection | null = null;
  private recording: Audio.Recording | null = null;
  // These eslint-disable lines are needed because the parameter names are required
  // for documentation even though they're unused in the type declaration
  /* eslint-disable @typescript-eslint/no-unused-vars */
  private listeners: Array<(state: SpeechRecognitionState) => void> = [];
  private wordListeners: Array<(word: string, confidence: number, timestamp: number) => void> = [];
  private karaokeListeners: Array<(match: WordMatch | null) => void> = [];
  /* eslint-enable @typescript-eslint/no-unused-vars */
  private errorHandler = ErrorHandlingService.getInstance();
  private currentState: SpeechRecognitionState = {
    isListening: false,
    isRecording: false,
    hasPermission: false,
    isProcessing: false,
    transcript: '',
    currentTranscript: '',
    finalTranscript: '',
    confidence: 0,
    error: null,
    isEnabled: true,
    language: 'en-US',
    lastWordTimestamp: 0,
    mode: 'deepgram',
    isConnected: false,
  };

  private config: SpeechConfig = {
    language: 'en-US',
    model: 'nova-2',
    smartFormat: true,
    punctuate: true,
    profanityFilter: false,
    redact: [],
    keywords: [],
    detectLanguage: false,
    enableUtteranceEndMarker: true,
    enableWordTimestamps: true,
    deepgramApiKey: Constants.expoConfig?.extra?.['deepgramApiKey'] || '',
  };

  constructor() {
    this.initializeAudio();
    // Automatically set Deepgram API key from Expo Constants
    const deepgramApiKey = Constants.expoConfig?.extra?.['deepgramApiKey'];
    if (deepgramApiKey) {
      this.setApiKey(deepgramApiKey);
    }
  }

  private async initializeAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      const errorMessage = 'Failed to initialize audio system';
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AUDIO,
        severity: ErrorSeverity.HIGH,
        context: { 
          component: 'SpeechRecognitionService', 
          method: 'initializeAudio',
          message: 'Audio system initialization failed. Please check your device audio settings.' 
        }
      });
      this.updateState({ error: errorMessage });
    }
  }

  public setConfig(newConfig: Partial<SpeechConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public setApiKey(apiKey: string) {
    this.config.deepgramApiKey = apiKey;
    if (apiKey) {
      this.initializeDeepgram();
    }
  }

  private initializeDeepgram() {
    if (!this.config.deepgramApiKey) {
      this.updateState({ mode: 'device', error: 'No Deepgram API key provided' });
      return;
    }

    try {
      this.deepgram = createClient(this.config.deepgramApiKey);
      this.updateState({ mode: 'deepgram', error: null });
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.SERVICE,
        severity: ErrorSeverity.MEDIUM,
        context: { 
          component: 'SpeechRecognitionService', 
          method: 'initializeDeepgram',
          message: 'Speech recognition service unavailable. Using device recognition instead.' 
        }
      });
      this.updateState({ 
        mode: 'device', 
        error: 'Failed to initialize Deepgram. Falling back to device STT.' 
      });
    }
  }

  public async requestPermissions(): Promise<AudioPermissions> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'SpeakSync needs access to your microphone for speech recognition during teleprompter practice.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const permissions: AudioPermissions = {
          granted: granted === PermissionsAndroid.RESULTS.GRANTED,
          canAskAgain: granted !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
          status: granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied',
        };

        this.updateState({ hasPermission: permissions.granted });
        return permissions;
      } else {
        // iOS permissions are handled by expo-av automatically
        const { status } = await Audio.requestPermissionsAsync();
        const permissions: AudioPermissions = {
          granted: status === 'granted',
          canAskAgain: status !== 'denied',
          status: status as 'granted' | 'denied' | 'undetermined',
        };

        this.updateState({ hasPermission: permissions.granted });
        return permissions;
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.PERMISSION,
        severity: ErrorSeverity.HIGH,
        context: { 
          component: 'SpeechRecognitionService', 
          method: 'requestPermissions',
          message: 'Microphone access denied. Please grant permissions in settings.' 
        }
      });
      const permissions: AudioPermissions = {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      };
      this.updateState({ hasPermission: false, error: 'Failed to request microphone permissions' });
      return permissions;
    }
  }

  public async startListening(): Promise<void> {
    if (!this.currentState.hasPermission) {
      const permissions = await this.requestPermissions();
      if (!permissions.granted) {
        throw new Error('Microphone permission not granted');
      }
    }

    this.updateState({ 
      isListening: true, 
      error: null, 
      currentTranscript: '', 
      finalTranscript: '' 
    });

    try {
      if (this.currentState.mode === 'deepgram' && this.deepgram) {
        await this.startDeepgramListening();
      } else {
        await this.startDeviceListening();
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.SPEECH_RECOGNITION,
        severity: ErrorSeverity.HIGH,
        context: { 
          component: 'SpeechRecognitionService', 
          method: 'startListening',
          message: 'Speech processing temporarily unavailable. Please try again.' 
        }
      });
      this.updateState({ 
        isListening: false, 
        error: 'Failed to start speech recognition' 
      });
      throw error;
    }
  }

  private async startDeepgramListening(): Promise<void> {
    try {
      // Create Deepgram connection
      this.connection = this.deepgram.listen.live({
        language: this.config.language,
        model: this.config.model,
        smart_format: this.config.smartFormat,
        punctuate: this.config.punctuate,
        profanity_filter: this.config.profanityFilter,
        redact: this.config.redact,
        keywords: this.config.keywords,
        detect_language: this.config.detectLanguage,
        utterance_end_ms: this.config.enableUtteranceEndMarker ? 1000 : undefined,
        encoding: 'linear16',
        sample_rate: 16000,
        channels: 1,
      });

      // Safety check
      if (!this.connection) {
        throw new Error('Failed to create Deepgram connection');
      }

      // The connection can't be null here since we check for it above,
      // but TypeScript still wants us to be sure
      const connection = this.connection;
      if (!connection) {
        throw new Error('Connection should be defined but is null');
      }
      
      // Set up event listeners
      connection.on(LiveTranscriptionEvents.Open, () => {
        this.updateState({ isConnected: true });
        logger.info('Deepgram connection opened', { category: 'speech_recognition' });
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        this.updateState({ isConnected: false });
        logger.info('Deepgram connection closed', { category: 'speech_recognition' });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript || '';
        const confidence = data.channel?.alternatives?.[0]?.confidence || 0;
        const isFinal = data.is_final || false;
        const words = data.channel?.alternatives?.[0]?.words || [];

        if (transcript) {
          if (isFinal) {
            this.updateState({ 
              finalTranscript: this.currentState.finalTranscript + ' ' + transcript,
              currentTranscript: '',
              confidence: confidence 
            });

            // Process words for karaoke highlighting
            this.processWordsForKaraoke(words, transcript, confidence, isFinal);
          } else {
            this.updateState({ 
              currentTranscript: transcript,
              confidence: confidence 
            });

            // Process interim words for real-time highlighting
            this.processWordsForKaraoke(words, transcript, confidence, isFinal);
          }

          // Notify listeners with transcription result
          this.notifyTranscription({
            transcript,
            confidence,
            isFinal,
            timestamp: Date.now(),
            words: words,
          });
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error: Error) => {
        logger.error('Deepgram transcription error', error, {
          category: 'speech_recognition',
          service: 'deepgram'
        });
        this.updateState({ 
          error: 'Deepgram transcription error. Switching to device STT.',
          mode: 'device' 
        });
        // Fallback to device STT
        this.startDeviceListening();
      });

      // Start recording and streaming
      await this.startRecording(true);

    } catch (error) {
      logger.error('Deepgram listening failed', error as Error, {
        category: 'speech_recognition',
        service: 'deepgram'
      });
      this.updateState({ 
        mode: 'device', 
        error: 'Deepgram failed. Using device STT.' 
      });
      await this.startDeviceListening();
    }
  }

  private async startDeviceListening(): Promise<void> {
    try {
      // Start recording for device STT
      await this.startRecording(false);
      
      // For device STT, we'll process the recording in chunks
      this.updateState({ mode: 'device' });
      
      // Note: Device STT implementation would depend on platform-specific modules
      // This is a placeholder for the device STT implementation
      logger.info('Device STT started', { category: 'speech_recognition', service: 'device' });
      
    } catch (error) {
      logger.error('Device STT failed', error as Error, {
        category: 'speech_recognition',
        service: 'device'
      });
      this.updateState({ 
        error: 'Device speech recognition failed',
        isListening: false 
      });
      throw error;
    }
  }

  private async startRecording(streamToDeepgram: boolean = false): Promise<void> {
    try {
      // Optimized recording options with performance considerations
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000, // Optimized for speech recognition
          numberOfChannels: 1,
          bitRate: 64000, // Reduced bitrate for better performance
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.MEDIUM, // Balanced quality/performance
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 64000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 64000, // Optimized for speech
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      
      this.updateState({ isRecording: true });
      await this.recording.startAsync();

      if (streamToDeepgram && this.connection) {
        // Stream audio data to Deepgram with performance optimization
        this.streamAudioToDeepgram();
      }

    } catch (error) {
      logger.error('Recording failed', error as Error, {
        category: 'speech_recognition', 
        audio: 'recording'
      });
      this.updateState({ 
        isRecording: false, 
        error: 'Failed to start recording' 
      });
      throw error;
    }
  }

  private streamAudioToDeepgram(): void {
    if (!this.recording || !this.connection) {
      return;
    }

    // This is a simplified version - in practice, you'd need to stream
    // real-time audio chunks to Deepgram
    const streamInterval = setInterval(async () => {
      if (!this.currentState.isRecording || !this.connection) {
        clearInterval(streamInterval);
        return;
      }

      try {
        // Get audio data and send to Deepgram
        // This would require platform-specific implementation
        // for real-time audio streaming
        
      } catch (error) {
        logger.error('Audio streaming error', error as Error, {
          category: 'speech_recognition',
          service: 'deepgram'
        });
        clearInterval(streamInterval);
      }
    }, 100); // Stream every 100ms
  }

  public async stopListening(): Promise<void> {
    this.updateState({ isListening: false, isProcessing: true });

    try {
      // Stop recording
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.updateState({ isRecording: false });
        this.recording = null;
      }

      // Close Deepgram connection
      if (this.connection) {
        // Check if the connection has a requestClose method
        if (typeof this.connection.requestClose === 'function') {
          this.connection.requestClose();
        }
        this.connection = null;
      }

    } catch (error) {
      logger.error('Failed to stop listening', error as Error, { 
        category: 'speech_recognition',
        action: 'stop_listening'
      });
      this.updateState({ error: 'Failed to stop speech recognition' });
    } finally {
      this.updateState({ isProcessing: false });
    }
  }

  public async toggleListening(): Promise<void> {
    if (this.currentState.isListening) {
      await this.stopListening();
    } else {
      await this.startListening();
    }
  }

  public clearTranscript(): void {
    this.updateState({ 
      currentTranscript: '', 
      finalTranscript: '', 
      confidence: 0 
    });
  }

  public getFullTranscript(): string {
    const final = this.currentState.finalTranscript.trim();
    const current = this.currentState.currentTranscript.trim();
    return final + (current ? ' ' + current : '');
  }

  private updateState(updates: Partial<SpeechRecognitionState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  private notifyTranscription(result: TranscriptionResult): void {
    // This can be used for additional transcription event handling
    logger.info('Transcription received', {
      category: 'speech_recognition', 
      transcript: result.transcript,
      confidence: result.confidence,
      isFinal: result.isFinal,
      timestamp: result.timestamp
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public subscribe(listener: (state: SpeechRecognitionState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getState(): SpeechRecognitionState {
    return { ...this.currentState };
  }

  public async checkPermissions(): Promise<AudioPermissions> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return {
          granted,
          canAskAgain: true,
          status: granted ? 'granted' : 'undetermined',
        };
      } else {
        const { status } = await Audio.getPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain: status !== 'denied',
          status: status as 'granted' | 'denied' | 'undetermined',
        };
      }
    } catch (error) {
      logger.error('Permission check failed', error as Error, {
        category: 'permission', 
        platform: Platform.OS
      });
      return {
        granted: false,
        canAskAgain: true,
        status: 'undetermined',
      };
    }
  }

  public switchMode(mode: 'deepgram' | 'device'): void {
    if (this.currentState.isListening) {
      this.stopListening().then(() => {
        this.updateState({ mode });
      });
    } else {
      this.updateState({ mode });
    }
  }

  // Karaoke integration methods
  public onWordRecognized(listener: (word: string, confidence: number, timestamp: number) => void): () => void {
    this.wordListeners.push(listener);
    
    return () => {
      const index = this.wordListeners.indexOf(listener);
      if (index > -1) {
        this.wordListeners.splice(index, 1);
      }
    };
  }

  public onKaraokeMatch(listener: (match: WordMatch | null) => void): () => void {
    this.karaokeListeners.push(listener);
    
    return () => {
      const index = this.karaokeListeners.indexOf(listener);
      if (index > -1) {
        this.karaokeListeners.splice(index, 1);
      }
    };
  }

  private notifyWordRecognized(word: string, confidence: number, timestamp: number): void {
    this.wordListeners.forEach(listener => {
      try {
        listener(word, confidence, timestamp);
      } catch (error) {
        logger.error('Word listener error', error as Error, {
          category: 'speech_recognition',
          action: 'word_recognition'
        });
      }
    });
  }

  private notifyKaraokeMatch(match: WordMatch | null): void {
    this.karaokeListeners.forEach(listener => {
      try {
        listener(match);
      } catch (error) {
        logger.error('Karaoke listener error', error as Error, {
          category: 'speech_recognition',
          action: 'karaoke_match'
        });
      }
    });
  }

  private processWordsForKaraoke(
    words: Array<{ word: string; confidence?: number; start?: number; end?: number }>,
    transcript: string, 
    confidence: number,
    isFinal?: boolean
  ): void {
    const timestamp = Date.now();
    
    if (words && words.length > 0) {
      // Process individual words from Deepgram
      words.forEach((wordData) => {
        if (wordData.word) {
          this.notifyWordRecognized(wordData.word, wordData.confidence || confidence, timestamp);
          
          // For final transcripts, notify karaoke match system with more confidence
          if (isFinal) {
            logger.info('Final word processed', { 
              word: wordData.word, 
              confidence: wordData.confidence || confidence,
              isFinal: true
            });
          }
        }
      });
    } else if (transcript.trim()) {
      // Fallback: split transcript into words
      const transcriptWords = transcript.trim().split(/\s+/);
      transcriptWords.forEach((word: string) => {
        if (word) {
          this.notifyWordRecognized(word, confidence, timestamp);
        }
      });
    }
  }

  public destroy(): void {
    this.stopListening();
    this.listeners = [];
    this.wordListeners = [];
    this.karaokeListeners = [];
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
export default speechRecognitionService;
