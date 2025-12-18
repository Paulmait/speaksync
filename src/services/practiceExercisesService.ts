/**
 * Practice Exercises Service
 * Comprehensive library of speech improvement exercises
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PracticeExercise,
  ExerciseCategory,
  ExerciseType,
  ExerciseResult,
  RecommendedExercise
} from '../types/speechCoachTypes';
import { logger } from './loggingService';

const STORAGE_KEYS = {
  EXERCISE_HISTORY: '@exercises/history',
  DAILY_PROGRESS: '@exercises/daily',
  FAVORITES: '@exercises/favorites'
};

// ============================================
// EXERCISE LIBRARY
// ============================================

const EXERCISE_LIBRARY: PracticeExercise[] = [
  // ============================================
  // WARMUP EXERCISES
  // ============================================
  {
    id: 'warmup_breathing',
    name: 'Diaphragmatic Breathing',
    category: 'warmup',
    type: 'breathing',
    difficulty: 'beginner',
    estimatedDuration: 3,
    content: {
      text: 'Breathe in through your nose for 4 counts, hold for 4 counts, exhale through your mouth for 6 counts. Repeat 5 times.',
      prompts: [
        'Feel your belly expand as you inhale',
        'Keep your shoulders relaxed',
        'Focus on slow, controlled exhales'
      ]
    },
    instructions: [
      'Sit or stand with good posture',
      'Place one hand on your chest and one on your belly',
      'Breathe in slowly through your nose (4 counts)',
      'Hold your breath gently (4 counts)',
      'Exhale slowly through your mouth (6 counts)',
      'Your belly should rise more than your chest'
    ],
    tips: [
      'This exercise calms nerves before speaking',
      'Practice daily for best results',
      'Use this technique before any presentation'
    ],
    scoring: {
      metrics: ['completion', 'breath_control'],
      passingScore: 70,
      bonusPoints: [
        { metric: 'consistency', threshold: 5, points: 10, description: '5 consistent breaths' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: false,
      pronunciationCheck: false,
      pacingGuidance: true,
      emotionTracking: false
    }
  },
  {
    id: 'warmup_humming',
    name: 'Vocal Humming Warmup',
    category: 'warmup',
    type: 'pitch_variation',
    difficulty: 'beginner',
    estimatedDuration: 2,
    content: {
      text: 'Hum a comfortable note. Slowly slide your hum from low to high and back down. Feel the vibration in your face.',
      prompts: [
        'Start at your natural speaking pitch',
        'Glide smoothly without breaks',
        'Feel the buzz in your lips and nose'
      ]
    },
    instructions: [
      'Close your lips gently',
      'Hum at a comfortable pitch',
      'Slowly slide up to a higher pitch',
      'Then slide back down to low',
      'Repeat 3-5 times'
    ],
    tips: [
      'This warms up your vocal cords',
      'Helps with pitch variety in speech',
      'Great for morning voice preparation'
    ],
    scoring: {
      metrics: ['completion', 'pitch_range'],
      passingScore: 70,
      bonusPoints: []
    },
    aiFeatures: {
      realTimeFeedback: false,
      pronunciationCheck: false,
      pacingGuidance: false,
      emotionTracking: false
    }
  },

  // ============================================
  // ARTICULATION EXERCISES
  // ============================================
  {
    id: 'articulation_tongue_twister_1',
    name: 'Classic Tongue Twisters',
    category: 'articulation',
    type: 'tongue_twister',
    difficulty: 'beginner',
    estimatedDuration: 5,
    content: {
      text: `Peter Piper picked a peck of pickled peppers.
A peck of pickled peppers Peter Piper picked.
If Peter Piper picked a peck of pickled peppers,
Where's the peck of pickled peppers Peter Piper picked?`,
      prompts: [
        'Start slowly, then increase speed',
        'Focus on crisp P sounds',
        'Keep your jaw relaxed'
      ],
      targetWPM: 120
    },
    instructions: [
      'Read the tongue twister slowly first',
      'Exaggerate each consonant sound',
      'Gradually increase your speed',
      'Maintain clarity even at faster speeds',
      'Repeat until you can say it clearly 3 times fast'
    ],
    tips: [
      'Tongue twisters improve articulation',
      "Don't sacrifice clarity for speed",
      'Practice problematic sounds in isolation first'
    ],
    scoring: {
      metrics: ['clarity', 'speed', 'accuracy'],
      passingScore: 75,
      bonusPoints: [
        { metric: 'speed', threshold: 150, points: 15, description: 'Fast and clear' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: true,
      pacingGuidance: true,
      emotionTracking: false
    }
  },
  {
    id: 'articulation_tongue_twister_2',
    name: 'S and SH Sounds',
    category: 'articulation',
    type: 'tongue_twister',
    difficulty: 'intermediate',
    estimatedDuration: 5,
    content: {
      text: `She sells seashells by the seashore.
The shells she sells are seashells, I'm sure.
So if she sells shells on the seashore,
Then I'm sure she sells seashore shells.`,
      prompts: [
        'Distinguish clearly between S and SH',
        'Keep tongue position consistent',
        'Breathe between lines'
      ],
      targetWPM: 110
    },
    instructions: [
      'Practice S sound: tongue behind teeth',
      'Practice SH sound: tongue slightly back',
      'Say each line slowly first',
      'Focus on the S/SH distinction',
      'Gradually speed up while maintaining clarity'
    ],
    tips: [
      'S and SH are commonly confused sounds',
      'Exaggerate the difference at first',
      'Record yourself to hear the distinction'
    ],
    scoring: {
      metrics: ['clarity', 'pronunciation_accuracy', 'speed'],
      passingScore: 70,
      bonusPoints: [
        { metric: 'pronunciation_accuracy', threshold: 90, points: 20, description: 'Perfect S/SH distinction' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: true,
      pacingGuidance: true,
      emotionTracking: false
    }
  },
  {
    id: 'articulation_consonant_drill',
    name: 'Consonant Clarity Drill',
    category: 'articulation',
    type: 'read_aloud',
    difficulty: 'intermediate',
    estimatedDuration: 5,
    content: {
      text: `The thick, thoughtful thrush thrust through the thorny thicket.
Big black bugs bit big black bears.
Red lorry, yellow lorry, red lorry, yellow lorry.
A proper copper coffee pot.
Unique New York, you know you need unique New York.`,
      prompts: [
        'Over-pronounce each consonant',
        'Feel your tongue and lips working',
        'Maintain energy throughout'
      ],
      targetWPM: 100
    },
    instructions: [
      'Read each line slowly and deliberately',
      'Exaggerate every consonant sound',
      'Pay attention to final consonants (often dropped)',
      'Practice each line 3 times before moving on',
      'Record and listen back'
    ],
    tips: [
      'Clear consonants make you easier to understand',
      'Most mumbling comes from lazy consonants',
      'Focus on ending sounds especially'
    ],
    scoring: {
      metrics: ['clarity', 'articulation_score', 'completion'],
      passingScore: 70,
      bonusPoints: [
        { metric: 'articulation_score', threshold: 85, points: 15, description: 'Crisp consonants' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: true,
      pacingGuidance: true,
      emotionTracking: false
    }
  },

  // ============================================
  // PACING EXERCISES
  // ============================================
  {
    id: 'pacing_metronome',
    name: 'Metronome Pacing',
    category: 'pacing',
    type: 'read_aloud',
    difficulty: 'beginner',
    estimatedDuration: 5,
    content: {
      text: `The ability to control your speaking pace is one of the most important skills for any public speaker. When you speak too fast, your audience struggles to keep up. When you speak too slow, they lose interest. The key is to find a rhythm that feels natural and engaging, typically between 130 and 160 words per minute for most contexts.`,
      prompts: [
        'Aim for 150 words per minute',
        'Match one word per beat',
        'Keep the rhythm steady'
      ],
      targetWPM: 150
    },
    instructions: [
      'Set a mental metronome at 150 BPM',
      'Read the passage aiming for 1 word per beat',
      'If you rush ahead, pause and reset',
      'Focus on consistency, not perfection',
      'Practice until the pace feels natural'
    ],
    tips: [
      '150 WPM is ideal for most presentations',
      'Slow down for important points',
      'Speed up slightly for lists or transitions'
    ],
    scoring: {
      metrics: ['wpm_accuracy', 'consistency', 'completion'],
      passingScore: 70,
      bonusPoints: [
        { metric: 'wpm_accuracy', threshold: 95, points: 20, description: 'Perfect pacing' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: true,
      emotionTracking: false
    }
  },
  {
    id: 'pacing_speed_variation',
    name: 'Speed Variation Practice',
    category: 'pacing',
    type: 'read_aloud',
    difficulty: 'intermediate',
    estimatedDuration: 7,
    content: {
      text: `[SLOW - 100 WPM] The most important thing I want you to understand... is this single idea. [NORMAL - 150 WPM] Once you grasp this concept, everything else will fall into place. You'll see patterns you never noticed before, connections that seemed invisible. [FAST - 180 WPM] Energy, momentum, excitement - these build when you increase pace. Lists work great at faster speeds: one, two, three, four, five! [SLOW - 100 WPM] But then... we slow down... for impact.`,
      prompts: [
        'Vary your speed intentionally',
        'Slow = importance, Fast = energy',
        'Transitions should feel smooth'
      ],
      targetWPM: 140
    },
    instructions: [
      'Follow the speed markers in brackets',
      'SLOW sections: 100 WPM - deliberate, weighty',
      'NORMAL sections: 150 WPM - conversational',
      'FAST sections: 180 WPM - energetic, excited',
      'Practice smooth transitions between speeds'
    ],
    tips: [
      'Speed variation keeps audiences engaged',
      'Slow down for key messages',
      'Speed up for lists and supporting details'
    ],
    scoring: {
      metrics: ['speed_variation', 'transition_smoothness', 'target_accuracy'],
      passingScore: 65,
      bonusPoints: [
        { metric: 'speed_variation', threshold: 80, points: 20, description: 'Excellent variation' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: true,
      emotionTracking: false
    }
  },

  // ============================================
  // FILLER WORD REDUCTION
  // ============================================
  {
    id: 'filler_pause_power',
    name: 'Pause Power Exercise',
    category: 'filler_reduction',
    type: 'impromptu',
    difficulty: 'intermediate',
    estimatedDuration: 5,
    content: {
      prompts: [
        'Tell me about your favorite hobby',
        'Describe your ideal vacation',
        'Explain how to make your favorite food',
        'Talk about a book or movie you enjoyed'
      ]
    },
    instructions: [
      'Choose a topic from the prompts',
      'Speak for 2 minutes on the topic',
      'When you feel a filler word coming, PAUSE instead',
      'Embrace 1-2 second silences',
      'Count your filler words at the end'
    ],
    tips: [
      'Pauses sound confident, fillers sound nervous',
      "It's okay to pause and think",
      'Audiences barely notice short pauses'
    ],
    scoring: {
      metrics: ['filler_count', 'pause_quality', 'fluency'],
      passingScore: 60,
      bonusPoints: [
        { metric: 'filler_count', threshold: 2, points: 25, description: 'Under 2 fillers!' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: true,
      emotionTracking: false
    }
  },
  {
    id: 'filler_awareness',
    name: 'Filler Word Awareness',
    category: 'filler_reduction',
    type: 'impromptu',
    difficulty: 'beginner',
    estimatedDuration: 3,
    content: {
      prompts: [
        'Describe what you see around you right now',
        'Explain your morning routine',
        'Talk about what you had for your last meal'
      ]
    },
    instructions: [
      'Speak on any topic for 1 minute',
      'Every time you say um, uh, like, you know, or so...',
      'CLAP your hands (or tap the table)',
      'This builds awareness of your filler habits',
      'Track your count over multiple sessions'
    ],
    tips: [
      'Awareness is the first step to change',
      "Don't try to eliminate fillers yet, just notice them",
      'Record yourself to catch fillers you miss'
    ],
    scoring: {
      metrics: ['awareness_accuracy', 'filler_count'],
      passingScore: 50,
      bonusPoints: [
        { metric: 'awareness_accuracy', threshold: 80, points: 15, description: 'High self-awareness' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: false,
      emotionTracking: false
    }
  },

  // ============================================
  // VOCAL VARIETY
  // ============================================
  {
    id: 'vocal_emotion_expression',
    name: 'Emotion Expression Practice',
    category: 'vocal_variety',
    type: 'emotion_expression',
    difficulty: 'intermediate',
    estimatedDuration: 7,
    content: {
      text: `I cannot believe this happened. This is absolutely incredible news. I have been waiting for this moment for so long. Everything is about to change.`,
      targetEmotions: ['excited', 'surprised', 'happy', 'determined'],
      prompts: [
        'Say it with EXCITEMENT - big smile, high energy',
        'Say it with SURPRISE - wide eyes, rising tone',
        'Say it with DETERMINATION - strong, grounded',
        'Say it with DISAPPOINTMENT - slower, lower'
      ]
    },
    instructions: [
      'Read the passage 4 different ways:',
      '1. Excited - like you won the lottery',
      '2. Surprised - like unexpected news',
      '3. Determined - like a rallying speech',
      '4. Disappointed - like plans fell through',
      'Notice how your voice changes with each emotion'
    ],
    tips: [
      'Your voice should match your message',
      'Exaggerate at first, then dial back',
      'Emotion makes content memorable'
    ],
    scoring: {
      metrics: ['emotional_range', 'authenticity', 'differentiation'],
      passingScore: 60,
      bonusPoints: [
        { metric: 'emotional_range', threshold: 80, points: 20, description: 'Clear emotional shifts' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: false,
      emotionTracking: true
    }
  },
  {
    id: 'vocal_pitch_range',
    name: 'Pitch Range Expansion',
    category: 'vocal_variety',
    type: 'pitch_variation',
    difficulty: 'intermediate',
    estimatedDuration: 5,
    content: {
      text: `Is this really happening? Yes, it absolutely is! I can hardly believe it. This changes everything. Everything!`,
      prompts: [
        'Questions go UP at the end',
        'Statements go DOWN at the end',
        'Excitement goes HIGH',
        'Emphasis uses pitch jumps'
      ]
    },
    instructions: [
      'Questions: pitch rises at the end',
      'Statements: pitch falls at the end',
      '"Everything!" - jump HIGH on "every"',
      'Exaggerate the pitch movements',
      'Record and listen for variety'
    ],
    tips: [
      'Monotone speaking loses audiences quickly',
      'Pitch variation signals meaning',
      'Higher pitch = excitement, surprise',
      'Lower pitch = seriousness, finality'
    ],
    scoring: {
      metrics: ['pitch_range', 'appropriate_inflection', 'engagement'],
      passingScore: 65,
      bonusPoints: [
        { metric: 'pitch_range', threshold: 75, points: 15, description: 'Excellent pitch variety' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: false,
      emotionTracking: true
    }
  },

  // ============================================
  // PAUSE MASTERY
  // ============================================
  {
    id: 'pause_dramatic',
    name: 'Dramatic Pause Practice',
    category: 'pause_mastery',
    type: 'read_aloud',
    difficulty: 'intermediate',
    estimatedDuration: 5,
    content: {
      text: `The answer... [PAUSE 2 SEC] ...is simpler than you think.

There's only one thing that matters... [PAUSE 2 SEC] ...and that is this.

I've made my decision... [PAUSE 3 SEC] ...I'm going to do it.

The results are in... [PAUSE 2 SEC] ...we succeeded.`,
      prompts: [
        'Count to 2 silently during pauses',
        'Maintain eye contact during pause',
        'Let the tension build'
      ]
    },
    instructions: [
      'Read each line with the marked pauses',
      'Actually COUNT during the pause (1 Mississippi, 2 Mississippi)',
      'The pause should feel uncomfortably long at first',
      'Maintain presence during the silence',
      'Notice how pauses create anticipation'
    ],
    tips: [
      'Pauses give audiences time to absorb',
      'They make speakers appear confident',
      '2-3 seconds feels longer to you than to them'
    ],
    scoring: {
      metrics: ['pause_duration', 'pause_placement', 'confidence'],
      passingScore: 70,
      bonusPoints: [
        { metric: 'pause_duration', threshold: 90, points: 15, description: 'Perfect pause timing' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: true,
      emotionTracking: false
    }
  },

  // ============================================
  // OPENING HOOKS
  // ============================================
  {
    id: 'hook_question',
    name: 'Question Hook Practice',
    category: 'opening_hooks',
    type: 'impromptu',
    difficulty: 'intermediate',
    estimatedDuration: 10,
    content: {
      prompts: [
        'Topic: Time management',
        'Topic: Healthy eating',
        'Topic: Learning new skills',
        'Topic: Work-life balance'
      ]
    },
    instructions: [
      'Choose a topic from the list',
      'Create an opening that starts with a question',
      'Examples:',
      '"What would you do with an extra hour every day?"',
      '"When was the last time you truly felt energized?"',
      'The question should make the audience think',
      'Follow up with 30 seconds of content'
    ],
    tips: [
      'Questions engage the brain immediately',
      'Rhetorical questions work best',
      'Pause after asking to let it land'
    ],
    scoring: {
      metrics: ['hook_strength', 'audience_engagement', 'follow_through'],
      passingScore: 65,
      bonusPoints: [
        { metric: 'hook_strength', threshold: 85, points: 20, description: 'Powerful hook!' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: true,
      emotionTracking: true
    }
  },
  {
    id: 'hook_story',
    name: 'Story Hook Practice',
    category: 'opening_hooks',
    type: 'storytelling',
    difficulty: 'advanced',
    estimatedDuration: 10,
    content: {
      prompts: [
        'Topic: Overcoming challenges',
        'Topic: The power of persistence',
        'Topic: Learning from mistakes',
        'Topic: Taking risks'
      ]
    },
    instructions: [
      'Choose a topic and think of a personal story',
      'Start with: "Three years ago..." or "I remember when..."',
      'Keep the story to 60-90 seconds',
      'Include: Setting, Challenge, Resolution',
      'End by connecting the story to your main message'
    ],
    tips: [
      'Stories are the most powerful hooks',
      'Personal stories create connection',
      'Start in the middle of the action',
      'Use sensory details'
    ],
    scoring: {
      metrics: ['story_structure', 'engagement', 'connection_to_topic'],
      passingScore: 60,
      bonusPoints: [
        { metric: 'engagement', threshold: 80, points: 20, description: 'Compelling story!' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: true,
      emotionTracking: true
    }
  },

  // ============================================
  // CONFIDENCE BUILDING
  // ============================================
  {
    id: 'confidence_power_stance',
    name: 'Power Stance Speaking',
    category: 'confidence',
    type: 'impromptu',
    difficulty: 'beginner',
    estimatedDuration: 5,
    content: {
      prompts: [
        'Introduce yourself as if to 1000 people',
        'Explain why you\'re an expert in something',
        'Give a 30-second motivational message',
        'Announce exciting news to an audience'
      ]
    },
    instructions: [
      'Stand up with feet shoulder-width apart',
      'Hands on hips (Wonder Woman pose) for 30 seconds',
      'Take 3 deep breaths',
      'Now speak on one of the prompts for 1 minute',
      'Keep your posture open and expansive'
    ],
    tips: [
      'Body language affects vocal confidence',
      'Standing tall projects authority',
      'Open posture reduces cortisol (stress hormone)'
    ],
    scoring: {
      metrics: ['confidence_projection', 'vocal_strength', 'presence'],
      passingScore: 60,
      bonusPoints: [
        { metric: 'confidence_projection', threshold: 80, points: 15, description: 'Strong presence!' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: false,
      emotionTracking: true
    }
  },

  // ============================================
  // VOLUME CONTROL
  // ============================================
  {
    id: 'volume_projection',
    name: 'Volume Projection Practice',
    category: 'volume_control',
    type: 'read_aloud',
    difficulty: 'intermediate',
    estimatedDuration: 5,
    content: {
      text: `[SOFT] Let me share a secret with you... [MEDIUM] Something important happened today. [LOUD] This changes everything! [MEDIUM] Let me explain what I mean. [SOFT] And here's the key insight...`,
      prompts: [
        'SOFT: Like sharing a secret',
        'MEDIUM: Normal conversation',
        'LOUD: Addressing a large room'
      ]
    },
    instructions: [
      'Follow the volume markers in brackets',
      'SOFT: Intimate, like sharing a secret',
      'MEDIUM: Natural speaking voice',
      'LOUD: Project to the back of a room',
      'Transitions should be smooth',
      'Never sacrifice clarity for volume'
    ],
    tips: [
      'Volume variation creates emphasis',
      'Soft can be more powerful than loud',
      'Project from your diaphragm, not throat'
    ],
    scoring: {
      metrics: ['volume_range', 'appropriate_modulation', 'clarity'],
      passingScore: 65,
      bonusPoints: [
        { metric: 'volume_range', threshold: 80, points: 15, description: 'Excellent dynamic range' }
      ]
    },
    aiFeatures: {
      realTimeFeedback: true,
      pronunciationCheck: false,
      pacingGuidance: false,
      emotionTracking: false
    }
  }
];

// ============================================
// PRACTICE EXERCISES SERVICE
// ============================================

class PracticeExercisesService {
  private static instance: PracticeExercisesService;
  private exerciseHistory: ExerciseResult[] = [];

  private constructor() {
    this.loadHistory();
  }

  static getInstance(): PracticeExercisesService {
    if (!PracticeExercisesService.instance) {
      PracticeExercisesService.instance = new PracticeExercisesService();
    }
    return PracticeExercisesService.instance;
  }

  private async loadHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_HISTORY);
      if (stored) {
        this.exerciseHistory = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load exercise history', error instanceof Error ? error : undefined);
    }
  }

  // Get all exercises
  getAllExercises(): PracticeExercise[] {
    return EXERCISE_LIBRARY;
  }

  // Get exercises by category
  getExercisesByCategory(category: ExerciseCategory): PracticeExercise[] {
    return EXERCISE_LIBRARY.filter(ex => ex.category === category);
  }

  // Get exercises by difficulty
  getExercisesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): PracticeExercise[] {
    return EXERCISE_LIBRARY.filter(ex => ex.difficulty === difficulty);
  }

  // Get a specific exercise
  getExercise(id: string): PracticeExercise | undefined {
    return EXERCISE_LIBRARY.find(ex => ex.id === id);
  }

  // Get recommended exercises based on weak areas
  getRecommendedExercises(weakAreas: ExerciseCategory[], limit: number = 5): PracticeExercise[] {
    const recommended: PracticeExercise[] = [];

    for (const area of weakAreas) {
      const areaExercises = this.getExercisesByCategory(area);
      // Prioritize exercises not recently completed
      const sorted = areaExercises.sort((a, b) => {
        const aLast = this.getLastCompleted(a.id);
        const bLast = this.getLastCompleted(b.id);
        return (aLast || 0) - (bLast || 0);
      });
      recommended.push(...sorted.slice(0, 2));
    }

    return recommended.slice(0, limit);
  }

  // Get daily exercise plan
  getDailyPlan(focusArea?: ExerciseCategory): PracticeExercise[] {
    const plan: PracticeExercise[] = [];

    // Always start with warmup
    const warmups = this.getExercisesByCategory('warmup');
    const randomWarmup = warmups[Math.floor(Math.random() * warmups.length)];
    if (randomWarmup) {
      plan.push(randomWarmup);
    }

    // Add focus area exercises
    if (focusArea) {
      const focusExercises = this.getExercisesByCategory(focusArea);
      plan.push(...focusExercises.slice(0, 2));
    } else {
      // Random variety
      const categories: ExerciseCategory[] = ['articulation', 'pacing', 'filler_reduction', 'vocal_variety'];
      for (const cat of categories.slice(0, 2)) {
        const exercises = this.getExercisesByCategory(cat);
        const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
        if (randomExercise) {
          plan.push(randomExercise);
        }
      }
    }

    return plan;
  }

  // Get the 7-day challenge
  getWeeklyChallenge(): { day: number; exercises: PracticeExercise[] }[] {
    return [
      { day: 1, exercises: this.getExercisesByCategory('warmup').concat(this.getExercisesByCategory('articulation').slice(0, 1)) },
      { day: 2, exercises: this.getExercisesByCategory('pacing').slice(0, 2) },
      { day: 3, exercises: this.getExercisesByCategory('filler_reduction').slice(0, 2) },
      { day: 4, exercises: this.getExercisesByCategory('vocal_variety').slice(0, 2) },
      { day: 5, exercises: this.getExercisesByCategory('pause_mastery').slice(0, 2) },
      { day: 6, exercises: this.getExercisesByCategory('opening_hooks').slice(0, 2) },
      { day: 7, exercises: this.getExercisesByCategory('confidence').concat(this.getExercisesByCategory('volume_control').slice(0, 1)) }
    ];
  }

  // Record exercise completion
  async recordCompletion(result: ExerciseResult): Promise<void> {
    this.exerciseHistory.push(result);

    // Keep last 500 results
    if (this.exerciseHistory.length > 500) {
      this.exerciseHistory = this.exerciseHistory.slice(-500);
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_HISTORY, JSON.stringify(this.exerciseHistory));
    } catch (error) {
      logger.error('Failed to save exercise result', error instanceof Error ? error : undefined);
    }
  }

  // Get last completed time for an exercise
  getLastCompleted(exerciseId: string): number | undefined {
    const results = this.exerciseHistory
      .filter(r => r.exerciseId === exerciseId)
      .sort((a, b) => b.completedAt - a.completedAt);
    return results[0]?.completedAt;
  }

  // Get exercise history
  getHistory(limit: number = 50): ExerciseResult[] {
    return this.exerciseHistory.slice(-limit);
  }

  // Get statistics for a category
  getCategoryStats(category: ExerciseCategory): {
    totalCompleted: number;
    averageScore: number;
    lastPracticed: number | undefined;
    improvement: number;
  } {
    const exercises = this.getExercisesByCategory(category);
    const exerciseIds = exercises.map(e => e.id);
    const results = this.exerciseHistory.filter(r => exerciseIds.includes(r.exerciseId));

    const totalCompleted = results.length;
    const averageScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0;
    const lastPracticed = results.length > 0
      ? Math.max(...results.map(r => r.completedAt))
      : undefined;

    // Calculate improvement (compare recent vs older)
    const recentResults = results.slice(-10);
    const olderResults = results.slice(-20, -10);
    const recentAvg = recentResults.length > 0
      ? recentResults.reduce((sum, r) => sum + r.score, 0) / recentResults.length
      : 0;
    const olderAvg = olderResults.length > 0
      ? olderResults.reduce((sum, r) => sum + r.score, 0) / olderResults.length
      : recentAvg;
    const improvement = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return { totalCompleted, averageScore, lastPracticed, improvement };
  }

  // Get all categories
  getCategories(): { category: ExerciseCategory; name: string; description: string; icon: string }[] {
    return [
      { category: 'warmup', name: 'Warmup', description: 'Prepare your voice', icon: '🔥' },
      { category: 'articulation', name: 'Articulation', description: 'Speak clearly', icon: '👄' },
      { category: 'pacing', name: 'Pacing', description: 'Control your speed', icon: '⏱️' },
      { category: 'filler_reduction', name: 'Filler Reduction', description: 'Eliminate ums and uhs', icon: '🚫' },
      { category: 'vocal_variety', name: 'Vocal Variety', description: 'Add expression', icon: '🎭' },
      { category: 'pause_mastery', name: 'Pause Mastery', description: 'Use silence powerfully', icon: '⏸️' },
      { category: 'opening_hooks', name: 'Opening Hooks', description: 'Capture attention', icon: '🎣' },
      { category: 'confidence', name: 'Confidence', description: 'Project authority', icon: '💪' },
      { category: 'volume_control', name: 'Volume Control', description: 'Dynamic range', icon: '🔊' },
      { category: 'storytelling', name: 'Storytelling', description: 'Engage with stories', icon: '📖' },
      { category: 'pronunciation', name: 'Pronunciation', description: 'Say it right', icon: '🗣️' },
      { category: 'breathing', name: 'Breathing', description: 'Breath support', icon: '💨' }
    ];
  }
}

export const practiceExercisesService = PracticeExercisesService.getInstance();
export default PracticeExercisesService;
