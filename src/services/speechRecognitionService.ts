import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import Constants from 'expo-constants';
import { Platform, PermissionsAndroid } from 'react-native';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import type { 
  SpeechRecognitionState, 
  AudioPermissions, 
  TranscriptionResult, 
  SpeechConfig,
  WordMatch 
} from '../types';

class SpeechRecognitionService {
  private deepgram: any = null;
  private connection: any = null;
  private recording: Audio.Recording | null = null;
  private listeners: Array<(state: SpeechRecognitionState) => void> = [];
  private wordListeners: Array<(word: string, confidence: number, timestamp: number) => void> = [];
  private karaokeListeners: Array<(match: WordMatch | null) => void> = [];
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
    deepgramApiKey: Constants.expoConfig?.extra?.deepgramApiKey || '',
  };

  constructor() {
    this.initializeAudio();
    // Automatically set Deepgram API key from Expo Constants
    const deepgramApiKey = Constants.expoConfig?.extra?.deepgramApiKey;
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
      console.error('Audio initialization failed:', error);
      this.updateState({ error: 'Failed to initialize audio system' });
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
      console.error('Deepgram initialization failed:', error);
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
      console.error('Permission request failed:', error);
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
      console.error('Failed to start listening:', error);
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

      // Set up event listeners
      this.connection.on(LiveTranscriptionEvents.Open, () => {
        this.updateState({ isConnected: true });
        console.log('Deepgram connection opened');
      });

      this.connection.on(LiveTranscriptionEvents.Close, () => {
        this.updateState({ isConnected: false });
        console.log('Deepgram connection closed');
      });

      this.connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
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

      this.connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('Deepgram error:', error);
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
      console.error('Deepgram listening failed:', error);
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
      console.log('Device STT started');
      
    } catch (error) {
      console.error('Device STT failed:', error);
      this.updateState({ 
        error: 'Device speech recognition failed',
        isListening: false 
      });
      throw error;
    }
  }

  private async startRecording(streamToDeepgram: boolean = false): Promise<void> {
    try {
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000,
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      
      this.updateState({ isRecording: true });
      await this.recording.startAsync();

      if (streamToDeepgram && this.connection) {
        // Stream audio data to Deepgram
        this.streamAudioToDeepgram();
      }

    } catch (error) {
      console.error('Recording failed:', error);
      this.updateState({ 
        isRecording: false, 
        error: 'Failed to start recording' 
      });
      throw error;
    }
  }

  private streamAudioToDeepgram(): void {
    if (!this.recording || !this.connection) return;

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
        console.error('Audio streaming error:', error);
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
        this.connection.requestClose();
        this.connection = null;
      }

    } catch (error) {
      console.error('Failed to stop listening:', error);
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
    console.log('Transcription:', result);
  }

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
      console.error('Permission check failed:', error);
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
        console.error('Word listener error:', error);
      }
    });
  }

  private notifyKaraokeMatch(match: WordMatch | null): void {
    this.karaokeListeners.forEach(listener => {
      try {
        listener(match);
      } catch (error) {
        console.error('Karaoke listener error:', error);
      }
    });
  }

  private processWordsForKaraoke(words: any[], transcript: string, confidence: number, isFinal: boolean): void {
    const timestamp = Date.now();
    
    if (words && words.length > 0) {
      // Process individual words from Deepgram
      words.forEach((wordData: any) => {
        if (wordData.word) {
          this.notifyWordRecognized(wordData.word, wordData.confidence || confidence, timestamp);
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
