/**
 * Speech Coach Type Definitions
 * Comprehensive types for AI-powered speech coaching and analysis
 */

// ============================================
// CORE SPEECH ANALYSIS TYPES
// ============================================

export interface SpeechAnalysisResult {
  sessionId: string;
  userId: string;
  timestamp: number;
  duration: number; // milliseconds

  // Core Metrics
  overallScore: number; // 0-100

  // Detailed Analysis
  delivery: DeliveryAnalysis;
  content: ContentAnalysis;
  voice: VoiceAnalysis;
  language: LanguageAnalysis;
  emotion: EmotionAnalysis;

  // AI Coaching
  strengths: string[];
  improvements: ImprovementSuggestion[];
  exercises: RecommendedExercise[];

  // Comparison
  benchmarks: BenchmarkComparison;
  progress: ProgressMetrics;
}

export interface DeliveryAnalysis {
  score: number; // 0-100

  pacing: {
    averageWPM: number;
    targetWPM: number;
    consistency: number; // 0-100, how steady the pace
    variationScore: number; // Good speakers vary pace intentionally
    rushingInstances: number;
    draggingInstances: number;
  };

  pauses: {
    totalPauses: number;
    effectivePauses: number; // Strategic pauses
    awkwardPauses: number; // Hesitation pauses
    averagePauseDuration: number;
    pausePlacementScore: number; // 0-100
  };

  fillerWords: {
    totalCount: number;
    perMinute: number;
    types: Record<string, number>; // {"um": 5, "uh": 3, "like": 8}
    trend: 'improving' | 'stable' | 'worsening';
  };

  energy: {
    score: number; // 0-100
    monotonePercentage: number;
    dynamicRangeScore: number;
  };
}

export interface ContentAnalysis {
  score: number; // 0-100

  structure: {
    hasOpening: boolean;
    openingStrength: number; // 0-100
    hasClosing: boolean;
    closingStrength: number;
    transitionQuality: number;
    logicalFlow: number;
  };

  clarity: {
    score: number;
    complexSentences: number;
    jargonUsage: number;
    repetitionScore: number;
    conciseness: number;
  };

  engagement: {
    score: number;
    questionUsage: number;
    storytellingElements: number;
    callToActionPresent: boolean;
    audienceAddressing: number;
  };

  keywords: {
    detected: string[];
    keyMessageDelivery: number; // How well key points were emphasized
  };
}

export interface VoiceAnalysis {
  score: number; // 0-100

  pitch: {
    average: number; // Hz
    range: number; // Hz variation
    variationScore: number; // 0-100
    appropriateness: number; // For context
  };

  volume: {
    average: number; // dB
    consistency: number;
    projectionScore: number;
    dynamicRange: number;
  };

  clarity: {
    articulationScore: number; // 0-100
    pronunciationAccuracy: number;
    mumbleInstances: number;
    crispness: number;
  };

  tone: {
    warmth: number; // 0-100
    authority: number;
    enthusiasm: number;
    authenticity: number;
  };

  breathing: {
    audibleBreaths: number;
    breathingPattern: 'good' | 'rushed' | 'irregular';
    supportScore: number;
  };
}

export interface LanguageAnalysis {
  score: number;

  vocabulary: {
    diversityScore: number;
    sophisticationLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
    uniqueWords: number;
    totalWords: number;
  };

  grammar: {
    score: number;
    errors: GrammarError[];
  };

  pronunciation: {
    score: number;
    difficultWords: PronunciationIssue[];
    accentClarity: number;
  };

  fluency: {
    score: number;
    hesitations: number;
    selfCorrections: number;
    smoothness: number;
  };
}

export interface EmotionAnalysis {
  score: number;

  dominant: string;
  emotions: EmotionReading[];

  congruence: {
    score: number; // Does emotion match content?
    issues: string[];
  };

  confidence: {
    score: number;
    nervousnessIndicators: string[];
    confidenceIndicators: string[];
  };

  engagement: {
    speakerEngagement: number;
    perceivedAudienceEngagement: number;
  };
}

export interface EmotionReading {
  emotion: string;
  intensity: number;
  timestamp: number;
  duration: number;
}

// ============================================
// IMPROVEMENT & COACHING TYPES
// ============================================

export interface ImprovementSuggestion {
  id: string;
  category: 'delivery' | 'content' | 'voice' | 'language' | 'emotion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  specificExample?: string;
  timestamp?: number; // When in the speech this occurred
  actionableSteps: string[];
  relatedExercise?: string;
}

export interface RecommendedExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  description: string;
  instructions: string[];
  benefits: string[];
  targetMetric: string;
  expectedImprovement: string;
}

export type ExerciseCategory =
  | 'pacing'
  | 'articulation'
  | 'breathing'
  | 'filler_reduction'
  | 'confidence'
  | 'vocal_variety'
  | 'pause_mastery'
  | 'opening_hooks'
  | 'storytelling'
  | 'pronunciation'
  | 'volume_control'
  | 'warmup';

// ============================================
// PRACTICE EXERCISES
// ============================================

export interface PracticeExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  type: ExerciseType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes

  content: ExerciseContent;
  instructions: string[];
  tips: string[];

  scoring: ExerciseScoring;

  aiFeatures: {
    realTimeFeedback: boolean;
    pronunciationCheck: boolean;
    pacingGuidance: boolean;
    emotionTracking: boolean;
  };
}

export type ExerciseType =
  | 'read_aloud'
  | 'impromptu'
  | 'tongue_twister'
  | 'breathing'
  | 'pitch_variation'
  | 'pause_practice'
  | 'speed_drill'
  | 'emotion_expression'
  | 'question_response'
  | 'storytelling';

export interface ExerciseContent {
  text?: string;
  prompts?: string[];
  targetWPM?: number;
  targetEmotions?: string[];
  audioGuide?: string; // URL to audio example
  videoGuide?: string; // URL to video example
}

export interface ExerciseScoring {
  metrics: string[];
  passingScore: number;
  bonusPoints: BonusPoint[];
}

export interface BonusPoint {
  metric: string;
  threshold: number;
  points: number;
  description: string;
}

export interface ExerciseResult {
  exerciseId: string;
  completedAt: number;
  duration: number;
  score: number;
  metrics: Record<string, number>;
  feedback: string[];
  xpEarned: number;
}

// ============================================
// PROGRESS & BENCHMARKS
// ============================================

export interface BenchmarkComparison {
  overallPercentile: number; // vs other users

  categoryPercentiles: {
    delivery: number;
    content: number;
    voice: number;
    language: number;
    emotion: number;
  };

  professionalComparison: {
    tedSpeakerScore: number; // How close to TED speaker average
    podcastHostScore: number;
    newsAnchorScore: number;
  };
}

export interface ProgressMetrics {
  sessionsCompleted: number;
  totalPracticeTime: number; // minutes
  currentStreak: number;

  improvements: {
    overallScore: TrendData;
    wpm: TrendData;
    fillerWords: TrendData;
    confidence: TrendData;
    clarity: TrendData;
  };

  milestones: Milestone[];
  nextMilestone: Milestone;
}

export interface TrendData {
  current: number;
  previous: number;
  weekAgo: number;
  monthAgo: number;
  trend: 'improving' | 'stable' | 'declining';
  changePercent: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    metric: string;
    target: number;
  };
  achieved: boolean;
  achievedAt?: number;
  xpReward: number;
}

// ============================================
// COACHING SESSION TYPES
// ============================================

export interface CoachingSession {
  id: string;
  userId: string;
  type: SessionType;
  startedAt: number;
  endedAt?: number;

  mode: 'practice' | 'presentation' | 'exercise';

  settings: SessionSettings;

  transcript: string;
  audioUrl?: string;
  videoUrl?: string;

  analysis?: SpeechAnalysisResult;

  notes?: string;
  tags?: string[];
}

export type SessionType =
  | 'free_practice'
  | 'script_practice'
  | 'exercise'
  | 'assessment'
  | 'challenge';

export interface SessionSettings {
  targetWPM: number;
  enableRealTimeFeedback: boolean;
  enableEmotionTracking: boolean;
  enablePronunciationCheck: boolean;
  recordAudio: boolean;
  recordVideo: boolean;
  language: string;
  focusAreas: ExerciseCategory[];
}

// ============================================
// AI COACHING TIPS
// ============================================

export interface AICoachingTip {
  id: string;
  type: 'immediate' | 'summary' | 'daily' | 'weekly';
  category: ExerciseCategory;
  title: string;
  message: string;
  priority: number;
  actionable: boolean;
  relatedMetric?: string;
  relatedExerciseId?: string;
  timestamp: number;
  dismissed: boolean;
}

export interface PersonalizedCoachingPlan {
  userId: string;
  createdAt: number;
  updatedAt: number;

  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  focusAreas: {
    primary: ExerciseCategory;
    secondary: ExerciseCategory[];
  };

  weeklyGoals: WeeklyGoal[];

  recommendedExercises: PracticeExercise[];

  estimatedTimeToNextLevel: number; // days

  adaptiveSchedule: DailyPlan[];
}

export interface WeeklyGoal {
  id: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  deadline: number;
  xpReward: number;
  completed: boolean;
}

export interface DailyPlan {
  date: string;
  exercises: {
    exerciseId: string;
    scheduledTime?: string;
    completed: boolean;
    duration: number;
  }[];
  estimatedDuration: number;
  focusArea: ExerciseCategory;
}

// ============================================
// GRAMMAR & PRONUNCIATION
// ============================================

export interface GrammarError {
  text: string;
  correction: string;
  rule: string;
  severity: 'minor' | 'moderate' | 'major';
  position: { start: number; end: number };
}

export interface PronunciationIssue {
  word: string;
  phonetic: string; // How it should sound
  userPhonetic: string; // How user pronounced it
  score: number;
  timestamp: number;
  suggestion: string;
}

// ============================================
// SERVICE CONFIGURATION
// ============================================

export interface SpeechCoachConfig {
  aiProviders: {
    transcription: 'deepgram' | 'whisper' | 'azure';
    emotion: 'hume' | 'azure';
    pronunciation: 'azure' | 'google';
    coaching: 'gemini' | 'openai' | 'claude';
  };

  analysisSettings: {
    enableRealTime: boolean;
    analysisDepth: 'basic' | 'standard' | 'comprehensive';
    targetAudience: 'general' | 'business' | 'academic' | 'entertainment';
  };

  scoringWeights: {
    delivery: number;
    content: number;
    voice: number;
    language: number;
    emotion: number;
  };
}
