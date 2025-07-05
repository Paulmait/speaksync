export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  lastSyncedAt?: Date;
  isDeleted?: boolean;
  version: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingOperations: number;
  syncErrors: SyncError[];
}

export interface SyncError {
  id: string;
  operation: 'create' | 'update' | 'delete';
  scriptId: string;
  error: string;
  timestamp: Date;
}

export interface ScriptStore {
  // State
  scripts: Script[];
  currentScript: Script | null;
  authState: AuthState;
  syncState: SyncState;
  
  // Script operations
  addScript: (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>) => Promise<void>;
  updateScript: (id: string, updates: Partial<Pick<Script, 'title' | 'content'>>) => Promise<void>;
  deleteScript: (id: string) => Promise<void>;
  setCurrentScript: (script: Script | null) => void;
  getScriptById: (id: string) => Script | undefined;
  
  // Authentication
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Sync operations
  syncScripts: () => Promise<void>;
  resolveConflict: (scriptId: string, resolution: 'local' | 'remote') => Promise<void>;
  retryFailedOperations: () => Promise<void>;
  
  // Network state
  setOnlineStatus: (isOnline: boolean) => void;
}

export type RootStackParamList = {
  Home: undefined;
  ScriptEditor: { scriptId?: string };
  Teleprompter: { scriptId: string };
  Auth: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Profile: undefined;
};

export interface TeleprompterSettings {
  speed: number;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  isScrolling: boolean;
  isMirrored: boolean;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  padding: number;
}

export interface TeleprompterState {
  currentPosition: number;
  totalHeight: number;
  currentParagraph: number;
  totalParagraphs: number;
}

// Pacing Meter Types
export interface PacingMeterSettings {
  enabled: boolean;
  targetWPM: number;
  toleranceRange: number; // +/- WPM for green zone
  showVisualMeter: boolean;
  showSessionSummary: boolean;
  colorScheme: {
    optimal: string;    // Green zone
    acceptable: string; // Yellow zone
    poor: string;       // Red zone
  };
}

export interface PacingMeterState {
  currentWPM: number;
  targetWPM: number;
  isInOptimalRange: boolean;
  sessionStartTime: number;
  sessionEndTime?: number;
  averageWPM: number;
  wpmHistory: WPMDataPoint[];
  paceAnalysis: PaceAnalysisSegment[];
}

export interface WPMDataPoint {
  timestamp: number;
  wpm: number;
  wordIndex: number;
  isOptimal: boolean;
}

export interface PaceAnalysisSegment {
  startWordIndex: number;
  endWordIndex: number;
  averageWPM: number;
  status: 'optimal' | 'too-fast' | 'too-slow';
  duration: number;
}

export interface SessionSummaryReport {
  sessionId: string;
  scriptId: string;
  startTime: number;
  endTime: number;
  totalWords: number;
  averageWPM: number;
  targetWPM: number;
  optimalPercentage: number;
  segments: PaceAnalysisSegment[];
  fillerWords: FillerWordDetection[];
  recommendations: string[];
}

// Filler Word Detection Types
export interface FillerWordSettings {
  enabled: boolean;
  fillerWords: string[];
  visualCueType: 'icon' | 'highlight' | 'underline' | 'shake';
  iconType: 'warning' | 'alert' | 'circle' | 'dot';
  cueColor: string;
  showInRealTime: boolean;
  trackInSession: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

export interface FillerWordDetection {
  word: string;
  timestamp: number;
  wordIndex: number;
  confidence: number;
  detectionMethod: 'stt' | 'rule-based';
  position: {
    start: number;
    end: number;
  };
}

export interface FillerWordState {
  detectedFillers: FillerWordDetection[];
  totalFillerCount: number;
  fillerRate: number; // Fillers per minute
  sessionStartTime: number;
  commonFillers: {
    [word: string]: number;
  };
}

// Script Analysis Types
export interface ScriptAnalysis {
  scriptId: string;
  totalWords: number;
  totalSentences: number;
  totalParagraphs: number;
  words: ScriptWord[];
  sentences: ScriptSentence[];
  paragraphs: ScriptParagraph[];
  averageWordsPerSentence: number;
  estimatedReadingTime: number; // in minutes
}

export interface ScriptWord {
  word: string;
  index: number;
  position: {
    start: number;
    end: number;
  };
  sentence: number;
  paragraph: number;
}

export interface ScriptSentence {
  text: string;
  index: number;
  wordRange: {
    start: number;
    end: number;
  };
  paragraph: number;
  startIndex: number;
  endIndex: number;
}

export interface ScriptParagraph {
  text: string;
  index: number;
  wordRange: {
    start: number;
    end: number;
  };
  sentenceRange: {
    start: number;
    end: number;
  };
  startIndex: number;
  endIndex: number;
  wordCount: number;
}

// Karaoke Types (legacy compatibility)
export interface KaraokeState {
  currentWordIndex: number;
  highlightedWords: number[];
  matchedWords: WordMatch[];
  scriptWords: string[];
  isActive: boolean;
  currentSentence: number;
  totalSentences: number;
  accuracy: number;
  wordsPerMinute: number;
  sessionStartTime: number;
}

export interface KaraokeHighlightSettings {
  enabled: boolean;
  highlightColor: string;
  highlightBackgroundColor: string;
  autoScroll: boolean;
  scrollOffset: number;
  matchThreshold: number;
  highlightDuration: number;
  animationDuration: number;
  fadeOutDelay: number;
}

export interface WordMatch {
  wordIndex: number;
  confidence: number;
  timestamp: number;
  matched: boolean;
  similarity: number;
  scriptWord: string;
  spokenWord: string;
  isExact: boolean;
}

// Adaptive Scroll Types (legacy compatibility)
export interface AdaptiveScrollSettings {
  enabled: boolean;
  baseScrollSpeed: number;
  responsiveness: number;
  smoothingFactor: number;
  pauseThreshold: number;
  accelerationLimit: number;
  decelerationLimit: number;
  lookAheadWords: number;
  bufferZone: number;
}

export interface SpeechPaceMetrics {
  currentWPM: number;
  averageWPM: number;
  instantaneousWPM: number;
  timeSinceLastWord: number;
  speechDuration: number;
  totalWordsSpoken: number;
  isPaused: boolean;
  isAccelerating: boolean;
  paceTrend: 'stable' | 'accelerating' | 'decelerating';
  confidenceLevel: number;
}

export interface ScrollState {
  currentPosition: number;
  targetPosition: number;
  velocity: number;
  acceleration: number;
  adaptiveSpeed: number;
  isUserControlled: boolean;
  lastUpdateTime: number;
  smoothingBuffer: number[];
}

// Speech Recognition Types
export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  error: string | null;
  isEnabled: boolean;
  language: string;
  isProcessing: boolean;
  isRecording: boolean;
  lastWordTimestamp: number;
  hasPermission: boolean;
  isConnected: boolean;
  mode: 'deepgram' | 'device';
}

export interface AudioPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  words?: Array<{
    word: string;
    confidence: number;
    startTime: number;
    endTime: number;
  }>;
}

export interface SpeechConfig {
  language: string;
  model: string;
  punctuate: boolean;
  profanityFilter: boolean;
  keywords: string[];
  enableWordTimestamps: boolean;
  smartFormat: boolean;
  deepgramApiKey: string;
  redact: string[];
  detectLanguage: boolean;
  enableUtteranceEndMarker: boolean;
}

// Word Timing Types
export interface WordTiming {
  wordIndex: number;
  word: string;
  timestamp: number;
  confidence: number;
  estimatedPosition?: number;
  cumulativeWPM: number;
  instantWPM: number;
}
