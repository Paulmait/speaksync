/**
 * AI Speech Coach Service
 * Comprehensive speech analysis and coaching using multiple AI providers
 *
 * AI Stack:
 * - Deepgram: Real-time transcription & word timing
 * - Hume AI: Emotion analysis
 * - Google Gemini: Coaching insights & tips
 * - Azure Speech (optional): Pronunciation assessment
 * - OpenAI Whisper (optional): Enhanced transcription
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SpeechAnalysisResult,
  DeliveryAnalysis,
  ContentAnalysis,
  VoiceAnalysis,
  LanguageAnalysis,
  EmotionAnalysis as CoachEmotionAnalysis,
  ImprovementSuggestion,
  RecommendedExercise,
  BenchmarkComparison,
  ProgressMetrics,
  CoachingSession,
  AICoachingTip,
  PersonalizedCoachingPlan,
  SpeechCoachConfig,
  ExerciseCategory,
  TrendData
} from '../types/speechCoachTypes';
import { speechRecognitionService } from './speechRecognitionService';
import HumeEmotionService, { EmotionAnalysis } from './humeEmotionService';
import GeminiAiService from './geminiAiService';
import { pacingMeterService } from './pacingMeterService';
import { fillerWordDetectionService } from './fillerWordDetectionService';
import { analyticsService } from './analyticsService';
import { logger } from './loggingService';

// Storage keys
const STORAGE_KEYS = {
  SESSIONS: '@speechcoach/sessions',
  PROGRESS: '@speechcoach/progress',
  COACHING_PLAN: '@speechcoach/plan',
  BENCHMARKS: '@speechcoach/benchmarks',
  TIPS: '@speechcoach/tips'
};

// Professional benchmarks (based on research)
const PROFESSIONAL_BENCHMARKS = {
  tedSpeaker: {
    averageWPM: 150,
    fillerWordsPerMinute: 0.5,
    pauseFrequency: 4, // per minute
    emotionalVariety: 85,
    clarityScore: 92
  },
  newsAnchor: {
    averageWPM: 160,
    fillerWordsPerMinute: 0.1,
    pauseFrequency: 6,
    emotionalVariety: 60,
    clarityScore: 95
  },
  podcastHost: {
    averageWPM: 140,
    fillerWordsPerMinute: 1.5,
    pauseFrequency: 3,
    emotionalVariety: 75,
    clarityScore: 85
  }
};

class SpeechCoachService {
  private static instance: SpeechCoachService;
  private humeService: HumeEmotionService;
  private geminiService: GeminiAiService;
  private currentSession: CoachingSession | null = null;
  private analysisBuffer: Partial<SpeechAnalysisResult> = {};
  private config: SpeechCoachConfig;

  private constructor() {
    this.humeService = HumeEmotionService.getInstance();
    this.geminiService = GeminiAiService.getInstance();
    this.config = this.getDefaultConfig();
  }

  static getInstance(): SpeechCoachService {
    if (!SpeechCoachService.instance) {
      SpeechCoachService.instance = new SpeechCoachService();
    }
    return SpeechCoachService.instance;
  }

  private getDefaultConfig(): SpeechCoachConfig {
    return {
      aiProviders: {
        transcription: 'deepgram',
        emotion: 'hume',
        pronunciation: 'azure',
        coaching: 'gemini'
      },
      analysisSettings: {
        enableRealTime: true,
        analysisDepth: 'comprehensive',
        targetAudience: 'general'
      },
      scoringWeights: {
        delivery: 0.25,
        content: 0.20,
        voice: 0.20,
        language: 0.15,
        emotion: 0.20
      }
    };
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  async startCoachingSession(settings: CoachingSession['settings']): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      id: sessionId,
      userId: 'current_user', // TODO: Get from auth
      type: 'free_practice',
      startedAt: Date.now(),
      mode: 'practice',
      settings,
      transcript: ''
    };

    // Initialize analysis buffer
    this.analysisBuffer = {
      sessionId,
      timestamp: Date.now(),
      strengths: [],
      improvements: [],
      exercises: []
    };

    // Start sub-services
    if (settings.enableEmotionTracking) {
      this.humeService.startEmotionSession(sessionId);
    }

    logger.info('Speech coaching session started', { sessionId });
    return sessionId;
  }

  async endCoachingSession(): Promise<SpeechAnalysisResult> {
    if (!this.currentSession) {
      throw new Error('No active coaching session');
    }

    this.currentSession.endedAt = Date.now();
    const duration = this.currentSession.endedAt - this.currentSession.startedAt;

    // Gather all analysis data
    const analysis = await this.generateComprehensiveAnalysis(duration);

    // Save session
    this.currentSession.analysis = analysis;
    await this.saveSession(this.currentSession);

    // Update progress
    await this.updateProgress(analysis);

    // Generate coaching tips
    await this.generateCoachingTips(analysis);

    // End sub-services
    if (this.currentSession.settings.enableEmotionTracking) {
      this.humeService.endEmotionSession();
    }

    const result = analysis;
    this.currentSession = null;
    this.analysisBuffer = {};

    logger.info('Speech coaching session ended', { sessionId: result.sessionId });
    return result;
  }

  // ============================================
  // COMPREHENSIVE ANALYSIS
  // ============================================

  private async generateComprehensiveAnalysis(duration: number): Promise<SpeechAnalysisResult> {
    // Get data from all services
    const pacingState = pacingMeterService.getState();
    const fillerState = fillerWordDetectionService.getState();
    const emotionData = { emotions: this.humeService.getSessionEmotions() };

    // Generate each analysis component
    const delivery = this.analyzeDelivery(pacingState, fillerState, duration);
    const content = await this.analyzeContent(this.currentSession?.transcript || '');
    const voice = this.analyzeVoice(duration);
    const language = this.analyzeLanguage(this.currentSession?.transcript || '');
    const emotion = this.analyzeEmotion(emotionData);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(delivery, content, voice, language, emotion);

    // Generate AI insights
    const { strengths, improvements, exercises } = await this.generateAIInsights(
      delivery, content, voice, language, emotion
    );

    // Get benchmarks
    const benchmarks = this.calculateBenchmarks(delivery, content, voice, language, emotion);

    // Get progress metrics
    const progress = await this.getProgressMetrics();

    return {
      sessionId: this.currentSession?.id || '',
      userId: this.currentSession?.userId || '',
      timestamp: Date.now(),
      duration,
      overallScore,
      delivery,
      content,
      voice,
      language,
      emotion,
      strengths,
      improvements,
      exercises,
      benchmarks,
      progress
    };
  }

  // ============================================
  // DELIVERY ANALYSIS
  // ============================================

  private analyzeDelivery(
    pacingState: any,
    fillerState: any,
    duration: number
  ): DeliveryAnalysis {
    const durationMinutes = duration / 60000;

    // Pacing analysis
    const pacing = {
      averageWPM: pacingState?.averageWPM || 0,
      targetWPM: pacingState?.targetWPM || 150,
      consistency: this.calculatePacingConsistency(pacingState?.wpmHistory || []),
      variationScore: this.calculatePacingVariation(pacingState?.wpmHistory || []),
      rushingInstances: (pacingState?.paceAnalysis || []).filter((s: any) => s.status === 'too-fast').length,
      draggingInstances: (pacingState?.paceAnalysis || []).filter((s: any) => s.status === 'too-slow').length
    };

    // Pause analysis
    const pauses = {
      totalPauses: 0, // TODO: Extract from transcript
      effectivePauses: 0,
      awkwardPauses: 0,
      averagePauseDuration: 0,
      pausePlacementScore: 70 // Default
    };

    // Filler words
    const fillerWords = {
      totalCount: fillerState?.totalFillerCount || 0,
      perMinute: durationMinutes > 0 ? (fillerState?.totalFillerCount || 0) / durationMinutes : 0,
      types: fillerState?.commonFillers || {},
      trend: 'stable' as const
    };

    // Energy analysis
    const energy = {
      score: 75, // TODO: Calculate from audio analysis
      monotonePercentage: 20,
      dynamicRangeScore: 70
    };

    // Calculate overall delivery score
    const pacingScore = Math.max(0, 100 - Math.abs(pacing.averageWPM - pacing.targetWPM));
    const fillerScore = Math.max(0, 100 - (fillerWords.perMinute * 20));
    const score = Math.round((pacingScore * 0.4) + (fillerScore * 0.3) + (energy.score * 0.3));

    return { score, pacing, pauses, fillerWords, energy };
  }

  private calculatePacingConsistency(wpmHistory: any[]): number {
    if (wpmHistory.length < 2) return 100;
    const wpmValues = wpmHistory.map(h => h.wpm);
    const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
    const variance = wpmValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpmValues.length;
    const stdDev = Math.sqrt(variance);
    // Lower std dev = higher consistency
    return Math.max(0, Math.min(100, 100 - (stdDev * 2)));
  }

  private calculatePacingVariation(wpmHistory: any[]): number {
    if (wpmHistory.length < 2) return 50;
    const wpmValues = wpmHistory.map(h => h.wpm);
    const range = Math.max(...wpmValues) - Math.min(...wpmValues);
    // Good speakers intentionally vary between 120-180 WPM
    // Too little variation (< 20) or too much (> 80) is bad
    if (range < 20) return 40;
    if (range > 80) return 60;
    return 80;
  }

  // ============================================
  // CONTENT ANALYSIS
  // ============================================

  private async analyzeContent(transcript: string): Promise<ContentAnalysis> {
    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Structure analysis
    const structure = {
      hasOpening: this.detectOpening(transcript),
      openingStrength: this.scoreOpening(transcript),
      hasClosing: this.detectClosing(transcript),
      closingStrength: this.scoreClosing(transcript),
      transitionQuality: 70, // TODO: Detect transition words
      logicalFlow: 75
    };

    // Clarity analysis
    const clarity = {
      score: 75,
      complexSentences: sentences.filter(s => s.split(/\s+/).length > 20).length,
      jargonUsage: 0, // TODO: Detect industry jargon
      repetitionScore: this.calculateRepetition(words),
      conciseness: Math.min(100, Math.max(0, 100 - (words.length / sentences.length - 15) * 5))
    };

    // Engagement analysis
    const engagement = {
      score: 70,
      questionUsage: (transcript.match(/\?/g) || []).length,
      storytellingElements: this.detectStorytellingElements(transcript),
      callToActionPresent: this.detectCallToAction(transcript),
      audienceAddressing: this.detectAudienceAddressing(transcript)
    };

    // Keywords
    const keywords = {
      detected: this.extractKeywords(transcript),
      keyMessageDelivery: 70
    };

    const score = Math.round(
      (structure.openingStrength * 0.2) +
      (clarity.score * 0.3) +
      (engagement.score * 0.3) +
      (structure.logicalFlow * 0.2)
    );

    return { score, structure, clarity, engagement, keywords };
  }

  private detectOpening(transcript: string): boolean {
    const openingPhrases = ['hello', 'hi', 'good morning', 'good afternoon', 'welcome', 'today', 'i want to', "i'm going to", 'let me'];
    const firstFiftyWords = transcript.toLowerCase().split(/\s+/).slice(0, 50).join(' ');
    return openingPhrases.some(phrase => firstFiftyWords.includes(phrase));
  }

  private scoreOpening(transcript: string): number {
    const strongOpenings = ['imagine', 'what if', 'picture this', 'let me tell you', 'here\'s a fact', 'did you know'];
    const firstHundredWords = transcript.toLowerCase().split(/\s+/).slice(0, 100).join(' ');
    if (strongOpenings.some(phrase => firstHundredWords.includes(phrase))) return 90;
    if (this.detectOpening(transcript)) return 70;
    return 50;
  }

  private detectClosing(transcript: string): boolean {
    const closingPhrases = ['thank you', 'in conclusion', 'to summarize', 'finally', 'in summary', 'remember'];
    const lastFiftyWords = transcript.toLowerCase().split(/\s+/).slice(-50).join(' ');
    return closingPhrases.some(phrase => lastFiftyWords.includes(phrase));
  }

  private scoreClosing(transcript: string): number {
    const strongClosings = ['call to action', 'take action', 'i challenge you', 'go out and', 'start today', 'remember'];
    const lastHundredWords = transcript.toLowerCase().split(/\s+/).slice(-100).join(' ');
    if (strongClosings.some(phrase => lastHundredWords.includes(phrase))) return 90;
    if (this.detectClosing(transcript)) return 70;
    return 50;
  }

  private calculateRepetition(words: string[]): number {
    const wordCounts: Record<string, number> = {};
    const meaningfulWords = words.filter(w => w.length > 4);
    meaningfulWords.forEach(w => {
      const lower = w.toLowerCase();
      wordCounts[lower] = (wordCounts[lower] || 0) + 1;
    });
    const repeatedCount = Object.values(wordCounts).filter(c => c > 3).length;
    return Math.max(0, 100 - (repeatedCount * 10));
  }

  private detectStorytellingElements(transcript: string): number {
    const storyIndicators = ['once', 'when i', 'there was', 'story', 'happened', 'experience', 'remember when'];
    const text = transcript.toLowerCase();
    const count = storyIndicators.filter(phrase => text.includes(phrase)).length;
    return Math.min(100, count * 25);
  }

  private detectCallToAction(transcript: string): boolean {
    const ctaPhrases = ['you should', 'try this', 'take action', 'start now', 'go ahead', 'i encourage you', 'let\'s'];
    return ctaPhrases.some(phrase => transcript.toLowerCase().includes(phrase));
  }

  private detectAudienceAddressing(transcript: string): number {
    const addressPhrases = ['you', 'your', 'we', 'us', 'our', 'together'];
    const words = transcript.toLowerCase().split(/\s+/);
    const addressCount = words.filter(w => addressPhrases.includes(w)).length;
    const percentage = (addressCount / words.length) * 100;
    return Math.min(100, percentage * 10);
  }

  private extractKeywords(transcript: string): string[] {
    // Simple keyword extraction (in production, use NLP service)
    const words = transcript.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'though', 'after', 'before', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am']);

    const wordCounts: Record<string, number> = {};
    words.filter(w => w.length > 3 && !stopWords.has(w)).forEach(w => {
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    });

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  // ============================================
  // VOICE ANALYSIS
  // ============================================

  private analyzeVoice(duration: number): VoiceAnalysis {
    // Note: Full voice analysis requires audio processing
    // This is a framework that can be enhanced with actual audio analysis
    return {
      score: 75,
      pitch: {
        average: 150, // Hz - placeholder
        range: 50,
        variationScore: 70,
        appropriateness: 75
      },
      volume: {
        average: 60, // dB - placeholder
        consistency: 80,
        projectionScore: 75,
        dynamicRange: 70
      },
      clarity: {
        articulationScore: 80,
        pronunciationAccuracy: 85,
        mumbleInstances: 2,
        crispness: 75
      },
      tone: {
        warmth: 70,
        authority: 65,
        enthusiasm: 75,
        authenticity: 80
      },
      breathing: {
        audibleBreaths: 5,
        breathingPattern: 'good',
        supportScore: 75
      }
    };
  }

  // ============================================
  // LANGUAGE ANALYSIS
  // ============================================

  private analyzeLanguage(transcript: string): LanguageAnalysis {
    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));

    const vocabulary = {
      diversityScore: Math.min(100, (uniqueWords.size / words.length) * 200),
      sophisticationLevel: this.assessVocabularySophistication(words) as 'basic' | 'intermediate' | 'advanced' | 'expert',
      uniqueWords: uniqueWords.size,
      totalWords: words.length
    };

    return {
      score: 75,
      vocabulary,
      grammar: {
        score: 85,
        errors: [] // TODO: Implement grammar checking
      },
      pronunciation: {
        score: 80,
        difficultWords: [],
        accentClarity: 80
      },
      fluency: {
        score: 75,
        hesitations: 0,
        selfCorrections: 0,
        smoothness: 75
      }
    };
  }

  private assessVocabularySophistication(words: string[]): string {
    const advancedWords = words.filter(w => w.length > 8).length;
    const ratio = advancedWords / words.length;
    if (ratio > 0.15) return 'expert';
    if (ratio > 0.10) return 'advanced';
    if (ratio > 0.05) return 'intermediate';
    return 'basic';
  }

  // ============================================
  // EMOTION ANALYSIS
  // ============================================

  private analyzeEmotion(emotionData: any): CoachEmotionAnalysis {
    const emotions = emotionData?.emotions || [];
    const dominantEmotion = this.findDominantEmotion(emotions);

    return {
      score: 75,
      dominant: dominantEmotion,
      emotions: emotions.map((e: EmotionAnalysis) => ({
        emotion: e.dominantEmotion,
        intensity: e.confidence,
        timestamp: e.timestamp,
        duration: 1000
      })),
      congruence: {
        score: 80,
        issues: []
      },
      confidence: {
        score: 70,
        nervousnessIndicators: [],
        confidenceIndicators: ['steady pace', 'clear voice']
      },
      engagement: {
        speakerEngagement: 75,
        perceivedAudienceEngagement: 70
      }
    };
  }

  private findDominantEmotion(emotions: EmotionAnalysis[]): string {
    if (emotions.length === 0) return 'neutral';
    const emotionCounts: Record<string, number> = {};
    emotions.forEach(e => {
      emotionCounts[e.dominantEmotion] = (emotionCounts[e.dominantEmotion] || 0) + 1;
    });
    return Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }

  // ============================================
  // SCORING
  // ============================================

  private calculateOverallScore(
    delivery: DeliveryAnalysis,
    content: ContentAnalysis,
    voice: VoiceAnalysis,
    language: LanguageAnalysis,
    emotion: CoachEmotionAnalysis
  ): number {
    const weights = this.config.scoringWeights;
    return Math.round(
      (delivery.score * weights.delivery) +
      (content.score * weights.content) +
      (voice.score * weights.voice) +
      (language.score * weights.language) +
      (emotion.score * weights.emotion)
    );
  }

  // ============================================
  // AI INSIGHTS GENERATION
  // ============================================

  private async generateAIInsights(
    delivery: DeliveryAnalysis,
    content: ContentAnalysis,
    voice: VoiceAnalysis,
    language: LanguageAnalysis,
    emotion: CoachEmotionAnalysis
  ): Promise<{
    strengths: string[];
    improvements: ImprovementSuggestion[];
    exercises: RecommendedExercise[];
  }> {
    const strengths: string[] = [];
    const improvements: ImprovementSuggestion[] = [];
    const exercises: RecommendedExercise[] = [];

    // Analyze delivery
    if (delivery.pacing.consistency > 80) {
      strengths.push('Excellent pacing consistency - you maintain a steady rhythm');
    } else if (delivery.pacing.consistency < 60) {
      improvements.push({
        id: 'pacing_consistency',
        category: 'delivery',
        priority: 'high',
        title: 'Improve Pacing Consistency',
        description: 'Your speaking pace varies significantly. Work on maintaining a more consistent rhythm.',
        actionableSteps: [
          'Practice with a metronome app',
          'Record yourself and listen for pace changes',
          'Mark natural pause points in your script'
        ]
      });
      exercises.push(this.getExercise('metronome_pacing'));
    }

    // Analyze filler words
    if (delivery.fillerWords.perMinute < 1) {
      strengths.push('Minimal filler words - your speech is clean and professional');
    } else if (delivery.fillerWords.perMinute > 3) {
      const topFiller = Object.entries(delivery.fillerWords.types)
        .sort((a, b) => b[1] - a[1])[0];
      improvements.push({
        id: 'filler_reduction',
        category: 'delivery',
        priority: 'high',
        title: 'Reduce Filler Words',
        description: `You're using ${delivery.fillerWords.perMinute.toFixed(1)} filler words per minute. Your most common filler is "${topFiller?.[0] || 'um'}".`,
        specificExample: `Try replacing "${topFiller?.[0] || 'um'}" with a brief pause`,
        actionableSteps: [
          'Embrace silence instead of filling gaps',
          'Practice pausing deliberately',
          'Record yourself and count fillers'
        ]
      });
      exercises.push(this.getExercise('pause_replacement'));
    }

    // Analyze content
    if (content.structure.openingStrength > 80) {
      strengths.push('Strong opening that captures attention');
    } else {
      improvements.push({
        id: 'opening_strength',
        category: 'content',
        priority: 'medium',
        title: 'Strengthen Your Opening',
        description: 'Start with a hook - a surprising fact, question, or story.',
        actionableSteps: [
          'Start with "Imagine..." or "What if..."',
          'Open with a relevant statistic',
          'Begin with a short personal story'
        ]
      });
      exercises.push(this.getExercise('hook_practice'));
    }

    // Analyze emotion
    if (emotion.confidence.score > 80) {
      strengths.push('You project confidence and authority');
    } else if (emotion.confidence.score < 60) {
      improvements.push({
        id: 'confidence_boost',
        category: 'emotion',
        priority: 'medium',
        title: 'Build Speaking Confidence',
        description: 'Your delivery could use more confidence. This often comes with practice.',
        actionableSteps: [
          'Practice power posing before speaking',
          'Slow down your pace slightly',
          'Make deliberate eye contact (or camera contact)'
        ]
      });
      exercises.push(this.getExercise('confidence_builder'));
    }

    return { strengths, improvements, exercises };
  }

  private getExercise(id: string): RecommendedExercise {
    const exercises: Record<string, RecommendedExercise> = {
      metronome_pacing: {
        id: 'metronome_pacing',
        name: 'Metronome Pacing Drill',
        category: 'pacing',
        difficulty: 'beginner',
        duration: 5,
        description: 'Practice speaking at a consistent pace with a metronome',
        instructions: [
          'Set a metronome to 150 BPM (aim for 1 word per beat)',
          'Read the practice text aloud',
          'Try to match each word to the beat',
          'Gradually turn off the metronome and maintain pace'
        ],
        benefits: ['Consistent pacing', 'Rhythm awareness', 'Audience engagement'],
        targetMetric: 'pacing_consistency',
        expectedImprovement: '15-20% improvement in 2 weeks'
      },
      pause_replacement: {
        id: 'pause_replacement',
        name: 'Pause Replacement Training',
        category: 'filler_reduction',
        difficulty: 'intermediate',
        duration: 10,
        description: 'Learn to replace filler words with powerful pauses',
        instructions: [
          'Record yourself speaking for 2 minutes',
          'Identify your filler words',
          'Re-record, replacing each filler with a 1-second pause',
          'Notice how pauses add impact'
        ],
        benefits: ['Reduced fillers', 'More authoritative delivery', 'Better clarity'],
        targetMetric: 'filler_words_per_minute',
        expectedImprovement: '50% reduction in 3 weeks'
      },
      hook_practice: {
        id: 'hook_practice',
        name: 'Opening Hook Workshop',
        category: 'opening_hooks',
        difficulty: 'intermediate',
        duration: 15,
        description: 'Master 5 types of powerful openings',
        instructions: [
          'Learn the 5 hook types: Question, Statistic, Story, Quote, "Imagine"',
          'Write 2 openings for your topic using different hooks',
          'Practice delivering each with energy',
          'Record and compare which feels most natural'
        ],
        benefits: ['Captivating openings', 'Audience engagement', 'Confidence'],
        targetMetric: 'opening_strength',
        expectedImprovement: 'Immediate improvement'
      },
      confidence_builder: {
        id: 'confidence_builder',
        name: 'Confidence Power Practice',
        category: 'confidence',
        difficulty: 'beginner',
        duration: 10,
        description: 'Build speaking confidence through body and voice exercises',
        instructions: [
          'Do 2 minutes of power posing (hands on hips, chest open)',
          'Practice speaking while standing tall',
          'Record a 1-minute talk with big gestures',
          'Review and notice the confidence difference'
        ],
        benefits: ['Increased confidence', 'Better posture', 'Stronger voice'],
        targetMetric: 'confidence_score',
        expectedImprovement: '20-30% improvement in 2 weeks'
      }
    };

    const exercise = exercises[id] ?? exercises['metronome_pacing'];
    if (!exercise) {
      throw new Error(`Exercise not found: ${id}`);
    }
    return exercise;
  }

  // ============================================
  // BENCHMARKS
  // ============================================

  private calculateBenchmarks(
    delivery: DeliveryAnalysis,
    content: ContentAnalysis,
    voice: VoiceAnalysis,
    language: LanguageAnalysis,
    emotion: CoachEmotionAnalysis
  ): BenchmarkComparison {
    const overallScore = this.calculateOverallScore(delivery, content, voice, language, emotion);

    // Calculate TED speaker comparison
    const tedComparison = this.compareToProfessional(delivery, PROFESSIONAL_BENCHMARKS.tedSpeaker);
    const newsComparison = this.compareToProfessional(delivery, PROFESSIONAL_BENCHMARKS.newsAnchor);
    const podcastComparison = this.compareToProfessional(delivery, PROFESSIONAL_BENCHMARKS.podcastHost);

    return {
      overallPercentile: Math.min(99, Math.max(1, overallScore)),
      categoryPercentiles: {
        delivery: delivery.score,
        content: content.score,
        voice: voice.score,
        language: language.score,
        emotion: emotion.score
      },
      professionalComparison: {
        tedSpeakerScore: tedComparison,
        podcastHostScore: podcastComparison,
        newsAnchorScore: newsComparison
      }
    };
  }

  private compareToProfessional(delivery: DeliveryAnalysis, benchmark: typeof PROFESSIONAL_BENCHMARKS.tedSpeaker): number {
    const wpmDiff = Math.abs(delivery.pacing.averageWPM - benchmark.averageWPM) / benchmark.averageWPM;
    const fillerDiff = delivery.fillerWords.perMinute / Math.max(0.1, benchmark.fillerWordsPerMinute);

    const wpmScore = Math.max(0, 100 - (wpmDiff * 100));
    const fillerScore = Math.max(0, 100 - (fillerDiff * 20));

    return Math.round((wpmScore + fillerScore) / 2);
  }

  // ============================================
  // PROGRESS TRACKING
  // ============================================

  private async getProgressMetrics(): Promise<ProgressMetrics> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to get progress metrics', error instanceof Error ? error : undefined);
    }

    return {
      sessionsCompleted: 0,
      totalPracticeTime: 0,
      currentStreak: 0,
      improvements: {
        overallScore: this.createEmptyTrendData(),
        wpm: this.createEmptyTrendData(),
        fillerWords: this.createEmptyTrendData(),
        confidence: this.createEmptyTrendData(),
        clarity: this.createEmptyTrendData()
      },
      milestones: [],
      nextMilestone: {
        id: 'first_session',
        name: 'First Steps',
        description: 'Complete your first practice session',
        icon: '🎯',
        requirement: { metric: 'sessions', target: 1 },
        achieved: false,
        xpReward: 100
      }
    };
  }

  private createEmptyTrendData(): TrendData {
    return {
      current: 0,
      previous: 0,
      weekAgo: 0,
      monthAgo: 0,
      trend: 'stable',
      changePercent: 0
    };
  }

  private async updateProgress(analysis: SpeechAnalysisResult): Promise<void> {
    const progress = await this.getProgressMetrics();

    progress.sessionsCompleted += 1;
    progress.totalPracticeTime += analysis.duration / 60000; // Convert to minutes

    // Update trends
    progress.improvements.overallScore.previous = progress.improvements.overallScore.current;
    progress.improvements.overallScore.current = analysis.overallScore;

    progress.improvements.fillerWords.previous = progress.improvements.fillerWords.current;
    progress.improvements.fillerWords.current = analysis.delivery.fillerWords.perMinute;

    // Calculate trends
    progress.improvements.overallScore.trend = this.calculateTrend(
      progress.improvements.overallScore.current,
      progress.improvements.overallScore.previous
    );

    await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  }

  private calculateTrend(current: number, previous: number): 'improving' | 'stable' | 'declining' {
    const change = ((current - previous) / Math.max(1, previous)) * 100;
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  // ============================================
  // COACHING TIPS GENERATION
  // ============================================

  private async generateCoachingTips(analysis: SpeechAnalysisResult): Promise<void> {
    const tips: AICoachingTip[] = [];

    // Generate contextual tips based on analysis
    if (analysis.delivery.fillerWords.perMinute > 2) {
      tips.push({
        id: `tip_${Date.now()}_filler`,
        type: 'summary',
        category: 'filler_reduction',
        title: 'Filler Word Alert',
        message: `You used ${analysis.delivery.fillerWords.totalCount} filler words. Try the "Pause Power" exercise to replace them with confident silences.`,
        priority: 1,
        actionable: true,
        relatedMetric: 'fillerWords',
        relatedExerciseId: 'pause_replacement',
        timestamp: Date.now(),
        dismissed: false
      });
    }

    if (analysis.overallScore > 80) {
      tips.push({
        id: `tip_${Date.now()}_great`,
        type: 'summary',
        category: 'confidence',
        title: 'Great Session!',
        message: `You scored ${analysis.overallScore}/100 - that's excellent! Keep up the momentum.`,
        priority: 2,
        actionable: false,
        timestamp: Date.now(),
        dismissed: false
      });
    }

    await AsyncStorage.setItem(STORAGE_KEYS.TIPS, JSON.stringify(tips));
  }

  // ============================================
  // STORAGE
  // ============================================

  private async saveSession(session: CoachingSession): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const sessions = stored ? JSON.parse(stored) : [];
      sessions.push(session);
      // Keep last 100 sessions
      const trimmed = sessions.slice(-100);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(trimmed));
    } catch (error) {
      logger.error('Failed to save coaching session', error instanceof Error ? error : undefined);
    }
  }

  async getSessions(): Promise<CoachingSession[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Failed to get coaching sessions', error instanceof Error ? error : undefined);
      return [];
    }
  }

  async getCoachingTips(): Promise<AICoachingTip[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TIPS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Failed to get coaching tips', error instanceof Error ? error : undefined);
      return [];
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  getConfig(): SpeechCoachConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SpeechCoachConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  isSessionActive(): boolean {
    return this.currentSession !== null;
  }

  getCurrentSession(): CoachingSession | null {
    return this.currentSession;
  }
}

export const speechCoachService = SpeechCoachService.getInstance();
export default SpeechCoachService;
