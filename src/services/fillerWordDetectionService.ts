import { 
  FillerWordSettings, 
  FillerWordState, 
  FillerWordDetection,
  ScriptAnalysis 
} from '../types';

/**
 * Filler Word Detection Service
 * Detects and tracks filler words using STT output and rule-based processing
 * Provides real-time visual cues and session analysis
 */
export class FillerWordDetectionService {
  private settings: FillerWordSettings = this.getDefaultSettings();
  private state: FillerWordState = this.getInitialState();
  private scriptAnalysis: ScriptAnalysis | null = null;
  private isActive = false;
  
  // Event callbacks
  private onFillerDetected?: (detection: FillerWordDetection) => void;
  private onStateUpdate?: (state: FillerWordState) => void;
  
  constructor() {
    this.reset();
  }

  /**
   * Initialize filler word detection with script and settings
   */
  public initialize(
    scriptAnalysis: ScriptAnalysis,
    settings: Partial<FillerWordSettings> = {},
    onFillerDetected?: (detection: FillerWordDetection) => void,
    onStateUpdate?: (state: FillerWordState) => void
  ): void {
    this.scriptAnalysis = scriptAnalysis;
    this.settings = { ...this.getDefaultSettings(), ...settings };
    this.onFillerDetected = onFillerDetected;
    this.onStateUpdate = onStateUpdate;
    
    this.reset();
    console.log('Filler word detection initialized with', this.settings.fillerWords.length, 'filler words');
  }

  /**
   * Start filler word detection session
   */
  public startSession(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.state.sessionStartTime = Date.now();
    this.state.detectedFillers = [];
    this.state.totalFillerCount = 0;
    this.state.commonFillers = {};
    
    console.log('Filler word detection session started');
    this.notifyStateUpdate();
  }

  /**
   * End filler word detection session
   */
  public endSession(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    console.log('Filler word detection session ended');
    console.log('Total fillers detected:', this.state.totalFillerCount);
    console.log('Filler rate:', this.state.fillerRate.toFixed(2), 'per minute');
  }

  /**
   * Process word from STT for filler detection
   */
  public processSTTWord(
    word: string,
    confidence: number,
    timestamp: number,
    wordIndex?: number
  ): FillerWordDetection | null {
    if (!this.isActive || !this.settings.enabled) return null;

    const normalizedWord = this.normalizeWord(word);
    
    // Check if word is a filler using STT-based detection
    const isFillerBySTT = this.isFillerWordSTT(normalizedWord, confidence);
    
    if (isFillerBySTT) {
      const detection = this.createFillerDetection(
        word,
        timestamp,
        wordIndex || -1,
        confidence,
        'stt'
      );
      
      this.addFillerDetection(detection);
      return detection;
    }
    
    return null;
  }

  /**
   * Process transcript text for rule-based filler detection
   */
  public processTranscriptText(
    text: string,
    timestamp: number,
    startWordIndex: number = 0
  ): FillerWordDetection[] {
    if (!this.isActive || !this.settings.enabled) return [];

    const detections: FillerWordDetection[] = [];
    const words = text.split(/\s+/);
    
    words.forEach((word, index) => {
      const normalizedWord = this.normalizeWord(word);
      
      if (this.isFillerWordRuleBased(normalizedWord)) {
        const detection = this.createFillerDetection(
          word,
          timestamp + (index * 200), // Estimate timing
          startWordIndex + index,
          0.8, // Rule-based confidence
          'rule-based'
        );
        
        detections.push(detection);
        this.addFillerDetection(detection);
      }
    });
    
    return detections;
  }

  /**
   * Check if word is filler using STT confidence and patterns
   */
  private isFillerWordSTT(word: string, confidence: number): boolean {
    // Lower confidence threshold for known fillers
    const fillerConfidenceThreshold = this.getConfidenceThreshold();
    
    if (confidence < fillerConfidenceThreshold) {
      return false;
    }
    
    // Check against known filler words
    return this.settings.fillerWords.some(filler => 
      this.fuzzyMatchFiller(word, filler)
    );
  }

  /**
   * Check if word is filler using rule-based detection
   */
  private isFillerWordRuleBased(word: string): boolean {
    // Exact match against filler word list
    if (this.settings.fillerWords.includes(word)) {
      return true;
    }
    
    // Pattern-based detection
    const fillerPatterns = [
      /^(um+|uh+|er+|ah+)$/i,           // Vocal hesitations
      /^(like|you know|so|well)$/i,      // Common fillers
      /^(basically|actually|literally)$/i, // Overused words
      /^(kinda|sorta|gonna|wanna)$/i,    // Informal contractions
    ];
    
    return fillerPatterns.some(pattern => pattern.test(word));
  }

  /**
   * Fuzzy match for filler words (handles variations)
   */
  private fuzzyMatchFiller(word: string, filler: string): boolean {
    // Exact match
    if (word === filler) return true;
    
    // Handle elongated versions (e.g., "umm", "uhhh")
    if (filler.length <= 3 && word.startsWith(filler)) {
      const extraChars = word.slice(filler.length);
      return extraChars.length <= 3 && /^[aeiou]*$/.test(extraChars);
    }
    
    // Levenshtein distance for typos
    return this.levenshteinDistance(word, filler) <= 1;
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get confidence threshold based on sensitivity setting
   */
  private getConfidenceThreshold(): number {
    switch (this.settings.sensitivity) {
      case 'low': return 0.8;
      case 'medium': return 0.6;
      case 'high': return 0.4;
      default: return 0.6;
    }
  }

  /**
   * Create filler detection object
   */
  private createFillerDetection(
    word: string,
    timestamp: number,
    wordIndex: number,
    confidence: number,
    method: 'stt' | 'rule-based'
  ): FillerWordDetection {
    return {
      word,
      timestamp,
      wordIndex,
      confidence,
      detectionMethod: method,
      position: {
        start: 0,
        end: word.length,
      },
    };
  }

  /**
   * Add filler detection to state and update metrics
   */
  private addFillerDetection(detection: FillerWordDetection): void {
    this.state.detectedFillers.push(detection);
    this.state.totalFillerCount++;
    
    // Update common fillers count
    const normalizedWord = this.normalizeWord(detection.word);
    this.state.commonFillers[normalizedWord] = 
      (this.state.commonFillers[normalizedWord] || 0) + 1;
    
    // Update filler rate
    this.updateFillerRate();
    
    // Notify listeners
    this.onFillerDetected?.(detection);
    this.notifyStateUpdate();
    
    console.log(`Filler detected: "${detection.word}" (${detection.detectionMethod})`);
  }

  /**
   * Update filler rate (fillers per minute)
   */
  private updateFillerRate(): void {
    const sessionDuration = (Date.now() - this.state.sessionStartTime) / 1000 / 60; // minutes
    if (sessionDuration > 0) {
      this.state.fillerRate = this.state.totalFillerCount / sessionDuration;
    }
  }

  /**
   * Normalize word for comparison
   */
  private normalizeWord(word: string): string {
    return word.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .trim();
  }

  /**
   * Get filler words detected in the last N seconds
   */
  public getRecentFillers(seconds: number = 10): FillerWordDetection[] {
    const cutoffTime = Date.now() - (seconds * 1000);
    return this.state.detectedFillers.filter(
      detection => detection.timestamp >= cutoffTime
    );
  }

  /**
   * Get most common filler words
   */
  public getMostCommonFillers(limit: number = 5): Array<{word: string, count: number}> {
    return Object.entries(this.state.commonFillers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<FillerWordSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Filler word detection settings updated');
  }

  /**
   * Get current state
   */
  public getState(): FillerWordState {
    return { ...this.state };
  }

  /**
   * Get current settings
   */
  public getSettings(): FillerWordSettings {
    return { ...this.settings };
  }

  /**
   * Reset state
   */
  public reset(): void {
    this.state = this.getInitialState();
    this.isActive = false;
    console.log('Filler word detection reset');
  }

  /**
   * Notify state update
   */
  private notifyStateUpdate(): void {
    this.onStateUpdate?.(this.getState());
  }

  /**
   * Default settings
   */
  private getDefaultSettings(): FillerWordSettings {
    return {
      enabled: true,
      fillerWords: [
        'um', 'uh', 'er', 'ah', 'hmm',
        'like', 'you know', 'so', 'well', 'basically',
        'actually', 'literally', 'totally', 'really',
        'kinda', 'sorta', 'gonna', 'wanna',
        'right', 'okay', 'alright', 'yeah'
      ],
      visualCueType: 'highlight',
      iconType: 'warning',
      cueColor: '#F59E0B',
      showInRealTime: true,
      trackInSession: true,
      sensitivity: 'medium',
    };
  }

  /**
   * Initial state
   */
  private getInitialState(): FillerWordState {
    return {
      detectedFillers: [],
      totalFillerCount: 0,
      fillerRate: 0,
      sessionStartTime: Date.now(),
      commonFillers: {},
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.isActive = false;
    console.log('Filler word detection service destroyed');
  }
}

export const fillerWordDetectionService = new FillerWordDetectionService();
