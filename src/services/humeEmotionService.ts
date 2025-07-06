import { HumeClient } from 'hume';
import { Platform } from 'react-native';

export interface EmotionScore {
  emotion: string;
  score: number;
}

export interface EmotionAnalysis {
  dominantEmotion: string;
  confidence: number;
  emotions: EmotionScore[];
  timestamp: number;
  prosody?: {
    pitch?: number;
    speaking_rate?: number;
    volume?: number;
  };
}

export interface EmotionIndicatorState {
  emoji: string;
  color: string;
  confidence: number;
  description: string;
}

export interface EmotionSessionData {
  sessionId: string;
  startTime: number;
  emotions: EmotionAnalysis[];
  averageConfidence: number;
  dominantEmotions: { [emotion: string]: number };
  emotionalJourney: Array<{
    timestamp: number;
    emotion: string;
    confidence: number;
  }>;
}

class HumeEmotionService {
  private static instance: HumeEmotionService;
  private client: HumeClient | null = null;
  private isInitialized = false;
  private currentSession: EmotionSessionData | null = null;
  private emotionListeners: Array<(emotion: EmotionAnalysis) => void> = [];
  private indicatorListeners: Array<(indicator: EmotionIndicatorState) => void> = [];
  private audioChunkSize = 1024; // Small chunks for real-time processing
  private processingQueue: ArrayBuffer[] = [];
  private isProcessing = false;

  static getInstance(): HumeEmotionService {
    if (!HumeEmotionService.instance) {
      HumeEmotionService.instance = new HumeEmotionService();
    }
    return HumeEmotionService.instance;
  }

  async initialize(apiKey: string): Promise<void> {
    try {
      this.client = new HumeClient({
        apiKey,
        // Use secure connection for production
        baseUrl: __DEV__ ? undefined : 'https://api.hume.ai',
      });

      this.isInitialized = true;
      console.log('[HumeEmotion] Service initialized successfully');
    } catch (error) {
      console.error('[HumeEmotion] Failed to initialize:', error);
      throw error;
    }
  }

  startEmotionSession(sessionId: string): void {
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      emotions: [],
      averageConfidence: 0,
      dominantEmotions: {},
      emotionalJourney: [],
    };

    console.log(`[HumeEmotion] Started emotion session: ${sessionId}`);
  }

  endEmotionSession(): EmotionSessionData | null {
    if (!this.currentSession) return null;

    // Calculate final statistics
    this.calculateSessionStatistics();

    const sessionData = { ...this.currentSession };
    this.currentSession = null;

    console.log(`[HumeEmotion] Ended emotion session: ${sessionData.sessionId}`);
    return sessionData;
  }

  async processAudioChunk(audioData: ArrayBuffer): Promise<void> {
    if (!this.isInitialized || !this.client || !this.currentSession) {
      return;
    }

    // Add to processing queue
    this.processingQueue.push(audioData);

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const audioChunk = this.processingQueue.shift();
      if (audioChunk) {
        await this.analyzeAudioChunk(audioChunk);
      }
    }

    this.isProcessing = false;
  }

  private async analyzeAudioChunk(audioData: ArrayBuffer): Promise<void> {
    try {
      if (!this.client) return;

      // Convert ArrayBuffer to base64 for API
      const base64Audio = this.arrayBufferToBase64(audioData);

      // Call Hume API for emotion analysis (simplified for demo)
      // In production, use streaming WebSocket API for real-time processing
      const mockEmotionResponse = this.generateMockEmotionData();
      this.processEmotionResults(mockEmotionResponse);
    } catch (error) {
      console.error('[HumeEmotion] Error analyzing audio chunk:', error);
    }
  }

  private async pollForResults(jobId: string, maxAttempts: number = 10): Promise<any> {
    // Simplified polling for demo - in production use WebSocket streaming
    return this.generateMockEmotionData();
  }

  private generateMockEmotionData(): any {
    // Generate realistic mock emotion data for development/demo
    const emotions = [
      'joy', 'excitement', 'confidence', 'determination', 'calmness',
      'surprise', 'confusion', 'anxiety', 'sadness', 'neutral'
    ];

    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const baseScore = Math.random() * 0.8 + 0.1; // 0.1 to 0.9

    return [{
      results: {
        predictions: {
          prosody: [{
            emotions: emotions.map(emotion => ({
              name: emotion,
              score: emotion === randomEmotion ? baseScore : Math.random() * 0.3
            })),
            prosody: {
              pitch: Math.random() * 200 + 100,
              speaking_rate: Math.random() * 2 + 1,
              volume: Math.random() * 0.8 + 0.2,
            }
          }]
        }
      }
    }];
  }

  private processEmotionResults(results: any): void {
    if (!results || !results[0] || !results[0].results) return;

    const prosodyResults = results[0].results.predictions?.prosody;
    if (!prosodyResults || prosodyResults.length === 0) return;

    // Process the latest prosody prediction
    const latestPrediction = prosodyResults[prosodyResults.length - 1];
    const emotions = latestPrediction.emotions || [];

    // Find dominant emotion
    const dominantEmotion = emotions.reduce((prev: any, current: any) => 
      (current.score > prev.score) ? current : prev
    );

    const emotionAnalysis: EmotionAnalysis = {
      dominantEmotion: dominantEmotion?.name || 'neutral',
      confidence: dominantEmotion?.score || 0,
      emotions: emotions.map((e: any) => ({
        emotion: e.name,
        score: e.score,
      })),
      timestamp: Date.now(),
      prosody: {
        pitch: latestPrediction.prosody?.pitch,
        speaking_rate: latestPrediction.prosody?.speaking_rate,
        volume: latestPrediction.prosody?.volume,
      },
    };

    // Add to current session
    if (this.currentSession) {
      this.currentSession.emotions.push(emotionAnalysis);
      this.currentSession.emotionalJourney.push({
        timestamp: emotionAnalysis.timestamp,
        emotion: emotionAnalysis.dominantEmotion,
        confidence: emotionAnalysis.confidence,
      });
    }

    // Notify listeners
    this.notifyEmotionListeners(emotionAnalysis);
    this.notifyIndicatorListeners(this.getEmotionIndicator(emotionAnalysis));
  }

  private getEmotionIndicator(analysis: EmotionAnalysis): EmotionIndicatorState {
    const emotion = analysis.dominantEmotion.toLowerCase();
    const confidence = analysis.confidence;

    // Map emotions to visual indicators
    const emotionMap: { [key: string]: { emoji: string; color: string; description: string } } = {
      joy: { emoji: '😊', color: '#10B981', description: 'Joyful & Positive' },
      excitement: { emoji: '🤩', color: '#F59E0B', description: 'Excited & Energetic' },
      confidence: { emoji: '💪', color: '#3B82F6', description: 'Confident & Strong' },
      determination: { emoji: '🎯', color: '#8B5CF6', description: 'Determined & Focused' },
      calmness: { emoji: '😌', color: '#06B6D4', description: 'Calm & Composed' },
      surprise: { emoji: '😮', color: '#F97316', description: 'Surprised' },
      confusion: { emoji: '🤔', color: '#6B7280', description: 'Confused' },
      anxiety: { emoji: '😰', color: '#EF4444', description: 'Anxious' },
      sadness: { emoji: '😔', color: '#6366F1', description: 'Sad' },
      anger: { emoji: '😠', color: '#DC2626', description: 'Angry' },
      fear: { emoji: '😨', color: '#7C2D12', description: 'Fearful' },
      neutral: { emoji: '😐', color: '#9CA3AF', description: 'Neutral' },
    };

    const indicator = emotionMap[emotion] || emotionMap.neutral;

    return {
      ...indicator,
      confidence,
    };
  }

  private calculateSessionStatistics(): void {
    if (!this.currentSession || this.currentSession.emotions.length === 0) return;

    const emotions = this.currentSession.emotions;
    
    // Calculate average confidence
    const totalConfidence = emotions.reduce((sum, e) => sum + e.confidence, 0);
    this.currentSession.averageConfidence = totalConfidence / emotions.length;

    // Calculate dominant emotions
    const emotionCounts: { [emotion: string]: number } = {};
    emotions.forEach(e => {
      emotionCounts[e.dominantEmotion] = (emotionCounts[e.dominantEmotion] || 0) + 1;
    });

    this.currentSession.dominantEmotions = emotionCounts;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Listener management
  addEmotionListener(listener: (emotion: EmotionAnalysis) => void): void {
    this.emotionListeners.push(listener);
  }

  removeEmotionListener(listener: (emotion: EmotionAnalysis) => void): void {
    this.emotionListeners = this.emotionListeners.filter(l => l !== listener);
  }

  addIndicatorListener(listener: (indicator: EmotionIndicatorState) => void): void {
    this.indicatorListeners.push(listener);
  }

  removeIndicatorListener(listener: (indicator: EmotionIndicatorState) => void): void {
    this.indicatorListeners = this.indicatorListeners.filter(l => l !== listener);
  }

  private notifyEmotionListeners(emotion: EmotionAnalysis): void {
    this.emotionListeners.forEach(listener => {
      try {
        listener(emotion);
      } catch (error) {
        console.error('[HumeEmotion] Error in emotion listener:', error);
      }
    });
  }

  private notifyIndicatorListeners(indicator: EmotionIndicatorState): void {
    this.indicatorListeners.forEach(listener => {
      try {
        listener(indicator);
      } catch (error) {
        console.error('[HumeEmotion] Error in indicator listener:', error);
      }
    });
  }

  // Utility methods
  isSessionActive(): boolean {
    return this.currentSession !== null;
  }

  getCurrentSessionId(): string | null {
    return this.currentSession?.sessionId || null;
  }

  getSessionEmotions(): EmotionAnalysis[] {
    return this.currentSession?.emotions || [];
  }

  // Get API key from environment
  static getApiKey(): string {
    return process.env.EXPO_PUBLIC_HUME_API_KEY || '';
  }
}

export default HumeEmotionService;
