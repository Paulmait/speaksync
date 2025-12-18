/**
 * Exercise Player Component
 * Interactive exercise execution with real-time feedback
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  IconButton,
  ProgressBar,
  Chip,
  Card,
  useTheme,
} from 'react-native-paper';
import { PracticeExercise, ExerciseResult } from '../../types/speechCoachTypes';
import { practiceExercisesService } from '../../services/practiceExercisesService';
import { speechRecognitionService } from '../../services/speechRecognitionService';
import { pacingMeterService } from '../../services/pacingMeterService';
import { fillerWordDetectionService } from '../../services/fillerWordDetectionService';

interface ExercisePlayerProps {
  exercise: PracticeExercise;
  onComplete: (result: ExerciseResult) => void;
  onCancel: () => void;
}

type ExercisePhase = 'intro' | 'practice' | 'review';

export const ExercisePlayer: React.FC<ExercisePlayerProps> = ({
  exercise,
  onComplete,
  onCancel,
}) => {
  const theme = useTheme();
  const [phase, setPhase] = useState<ExercisePhase>('intro');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [currentWPM, setCurrentWPM] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [phase]);

  const startExercise = async () => {
    setPhase('practice');
    setIsRecording(true);
    setElapsedTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Start speech recognition if enabled
    if (exercise.aiFeatures.realTimeFeedback) {
      try {
        await speechRecognitionService.startListening();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }

    // Start pacing meter if enabled
    if (exercise.aiFeatures.pacingGuidance) {
      pacingMeterService.startSession();
    }
  };

  const stopExercise = async () => {
    setIsRecording(false);

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop speech recognition
    if (exercise.aiFeatures.realTimeFeedback) {
      speechRecognitionService.stopListening();
    }

    // Get pacing data
    if (exercise.aiFeatures.pacingGuidance) {
      const pacingState = pacingMeterService.getState();
      setCurrentWPM(pacingState.averageWPM);
    }

    // Get filler word count
    const fillerState = fillerWordDetectionService.getState();
    setFillerCount(fillerState.totalFillerCount);

    // Calculate score and generate feedback
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    setFeedback(generateFeedback(calculatedScore));

    setPhase('review');
  };

  const calculateScore = (): number => {
    let baseScore = 70;

    // Adjust based on completion
    const targetDuration = exercise.estimatedDuration * 60;
    const completionRatio = Math.min(1, elapsedTime / targetDuration);
    baseScore += completionRatio * 10;

    // Adjust based on WPM accuracy (if applicable)
    if (exercise.content.targetWPM && currentWPM > 0) {
      const wpmAccuracy = 1 - Math.abs(currentWPM - exercise.content.targetWPM) / exercise.content.targetWPM;
      baseScore += wpmAccuracy * 15;
    }

    // Penalize filler words
    const fillerPenalty = Math.min(20, fillerCount * 2);
    baseScore -= fillerPenalty;

    return Math.max(0, Math.min(100, Math.round(baseScore)));
  };

  const generateFeedback = (score: number): string[] => {
    const feedback: string[] = [];

    if (score >= 80) {
      feedback.push('Excellent work! You nailed this exercise.');
    } else if (score >= 60) {
      feedback.push('Good effort! Keep practicing for even better results.');
    } else {
      feedback.push('Nice try! This exercise takes practice to master.');
    }

    if (currentWPM > 0 && exercise.content.targetWPM) {
      const diff = currentWPM - exercise.content.targetWPM;
      if (Math.abs(diff) <= 10) {
        feedback.push('Your pacing was right on target!');
      } else if (diff > 0) {
        feedback.push(`Try slowing down a bit - you were ${diff} WPM above target.`);
      } else {
        feedback.push(`Try speeding up slightly - you were ${Math.abs(diff)} WPM below target.`);
      }
    }

    if (fillerCount > 0) {
      if (fillerCount <= 2) {
        feedback.push(`Good job keeping filler words low (${fillerCount} total).`);
      } else {
        feedback.push(`Work on reducing filler words - you used ${fillerCount} in this session.`);
      }
    }

    return feedback;
  };

  const completeExercise = () => {
    const result: ExerciseResult = {
      exerciseId: exercise.id,
      completedAt: Date.now(),
      duration: elapsedTime,
      score,
      metrics: {
        wpm: currentWPM,
        fillerCount,
        targetWPM: exercise.content.targetWPM || 0,
      },
      feedback,
      xpEarned: Math.round(score / 10) * 10,
    };

    practiceExercisesService.recordCompletion(result);
    onComplete(result);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner':
        return '#22C55E';
      case 'intermediate':
        return '#F59E0B';
      case 'advanced':
        return '#EF4444';
      default:
        return '#666';
    }
  };

  // Intro Phase
  const renderIntro = () => (
    <Animated.View style={[styles.phaseContainer, { opacity: fadeAnim }]}>
      <Surface style={styles.introCard} elevation={2}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Chip
            mode="flat"
            style={{ backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }}
            textStyle={{ color: getDifficultyColor(exercise.difficulty) }}
          >
            {exercise.difficulty}
          </Chip>
        </View>

        <Text style={styles.duration}>
          ⏱️ {exercise.estimatedDuration} minutes
        </Text>

        <Text style={styles.sectionTitle}>Instructions</Text>
        {exercise.instructions.map((instruction, index) => (
          <Text key={index} style={styles.instruction}>
            {index + 1}. {instruction}
          </Text>
        ))}

        {exercise.tips.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Tips</Text>
            {exercise.tips.map((tip, index) => (
              <Text key={index} style={styles.tip}>
                💡 {tip}
              </Text>
            ))}
          </>
        )}

        {exercise.content.text && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Practice Text</Text>
            <Surface style={styles.textCard} elevation={1}>
              <ScrollView style={styles.textScroll}>
                <Text style={styles.practiceText}>{exercise.content.text}</Text>
              </ScrollView>
            </Surface>
          </>
        )}

        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={onCancel} style={styles.button}>
            Cancel
          </Button>
          <Button mode="contained" onPress={startExercise} style={styles.button}>
            Start Exercise
          </Button>
        </View>
      </Surface>
    </Animated.View>
  );

  // Practice Phase
  const renderPractice = () => (
    <Animated.View style={[styles.phaseContainer, { opacity: fadeAnim }]}>
      <Surface style={styles.practiceCard} elevation={2}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Time</Text>
          <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
        </View>

        {exercise.aiFeatures.pacingGuidance && exercise.content.targetWPM && (
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Current WPM</Text>
              <Text style={styles.metricValue}>{currentWPM || '--'}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Target WPM</Text>
              <Text style={styles.metricValue}>{exercise.content.targetWPM}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Fillers</Text>
              <Text style={styles.metricValue}>{fillerCount}</Text>
            </View>
          </View>
        )}

        {exercise.content.text && (
          <Surface style={styles.activeTextCard} elevation={1}>
            <ScrollView style={styles.textScroll}>
              <Text style={styles.activePracticeText}>{exercise.content.text}</Text>
            </ScrollView>
          </Surface>
        )}

        {exercise.content.prompts && exercise.content.prompts.length > 0 && (
          <Surface style={styles.promptCard} elevation={1}>
            <Text style={styles.promptLabel}>Your Prompt:</Text>
            <Text style={styles.promptText}>
              {exercise.content.prompts[Math.floor(Math.random() * exercise.content.prompts.length)]}
            </Text>
          </Surface>
        )}

        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, isRecording && styles.recordingDotActive]} />
          <Text style={styles.recordingText}>
            {isRecording ? 'Recording...' : 'Ready'}
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={stopExercise}
          style={styles.stopButton}
          buttonColor="#EF4444"
          icon="stop"
        >
          Stop & Review
        </Button>
      </Surface>
    </Animated.View>
  );

  // Review Phase
  const renderReview = () => (
    <Animated.View style={[styles.phaseContainer, { opacity: fadeAnim }]}>
      <Surface style={styles.reviewCard} elevation={2}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Your Score</Text>
          <Text
            style={[
              styles.scoreValue,
              { color: score >= 70 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444' },
            ]}
          >
            {score}
          </Text>
          <Text style={styles.scoreSubtext}>out of 100</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          {currentWPM > 0 && (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{currentWPM}</Text>
              <Text style={styles.statLabel}>Avg WPM</Text>
            </View>
          )}
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fillerCount}</Text>
            <Text style={styles.statLabel}>Fillers</Text>
          </View>
        </View>

        <Text style={styles.feedbackTitle}>Feedback</Text>
        {feedback.map((item, index) => (
          <Text key={index} style={styles.feedbackItem}>
            {item}
          </Text>
        ))}

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{Math.round(score / 10) * 10} XP</Text>
        </View>

        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={() => setPhase('intro')} style={styles.button}>
            Try Again
          </Button>
          <Button mode="contained" onPress={completeExercise} style={styles.button}>
            Complete
          </Button>
        </View>
      </Surface>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {phase === 'intro' && renderIntro()}
      {phase === 'practice' && renderPractice()}
      {phase === 'review' && renderReview()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  phaseContainer: {
    flex: 1,
    padding: 16,
  },
  introCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  instruction: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    paddingLeft: 8,
  },
  tip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  textCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    maxHeight: 200,
  },
  textScroll: {
    maxHeight: 180,
  },
  practiceText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  practiceCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
  },
  timerValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  activeTextCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    marginBottom: 16,
  },
  activePracticeText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1E3A5F',
  },
  promptCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    marginBottom: 16,
  },
  promptLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#78350F',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CCC',
    marginRight: 8,
  },
  recordingDotActive: {
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 14,
    color: '#666',
  },
  stopButton: {
    marginTop: 'auto',
  },
  reviewCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  scoreSubtext: {
    fontSize: 14,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minWidth: 80,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  feedbackItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  xpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
});

export default ExercisePlayer;
