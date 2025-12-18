/**
 * Coaching Dashboard Component
 * Main dashboard for AI Speech Coach showing progress, insights, and recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ProgressBar,
  Chip,
  Surface,
  IconButton,
  useTheme,
  Divider,
  List,
  Avatar,
  Badge,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { speechCoachService } from '../../services/speechCoachService';
import { practiceExercisesService } from '../../services/practiceExercisesService';
import {
  SpeechAnalysisResult,
  AICoachingTip,
  PracticeExercise,
  ExerciseCategory,
} from '../../types/speechCoachTypes';

const { width: screenWidth } = Dimensions.get('window');

interface CoachingDashboardProps {
  onStartPractice: () => void;
  onStartExercise: (exerciseId: string) => void;
  onViewProgress: () => void;
}

export const CoachingDashboard: React.FC<CoachingDashboardProps> = ({
  onStartPractice,
  onStartExercise,
  onViewProgress,
}) => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [lastSession, setLastSession] = useState<SpeechAnalysisResult | null>(null);
  const [tips, setTips] = useState<AICoachingTip[]>([]);
  const [dailyExercises, setDailyExercises] = useState<PracticeExercise[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weakAreas, setWeakAreas] = useState<ExerciseCategory[]>([]);

  const loadData = useCallback(async () => {
    try {
      // Load sessions
      const sessions = await speechCoachService.getSessions();
      if (sessions.length > 0) {
        const latest = sessions[sessions.length - 1];
        if (latest && latest.analysis) {
          const analysis = latest.analysis;
          setLastSession(analysis);
          setOverallScore(analysis.overallScore);

          // Identify weak areas
          const areas: ExerciseCategory[] = [];
          if (analysis.delivery.score < 70) areas.push('pacing', 'filler_reduction');
          if (analysis.content.score < 70) areas.push('opening_hooks', 'storytelling');
          if (analysis.voice.score < 70) areas.push('vocal_variety', 'volume_control');
          if (analysis.emotion.score < 70) areas.push('confidence');
          setWeakAreas(areas);
        }
      }

      // Load tips
      const loadedTips = await speechCoachService.getCoachingTips();
      setTips(loadedTips.filter(t => !t.dismissed).slice(0, 3));

      // Get daily exercises
      const daily = practiceExercisesService.getDailyPlan(weakAreas[0]);
      setDailyExercises(daily);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [weakAreas]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getCategoryIcon = (category: ExerciseCategory): string => {
    const icons: Record<string, string> = {
      warmup: 'fire',
      articulation: 'microphone',
      pacing: 'speedometer',
      filler_reduction: 'close-circle',
      vocal_variety: 'music-note',
      pause_mastery: 'pause',
      opening_hooks: 'hook',
      confidence: 'arm-flex',
      volume_control: 'volume-high',
      storytelling: 'book-open',
      pronunciation: 'text-to-speech',
      breathing: 'weather-windy',
    };
    return icons[category] || 'star';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <Surface style={styles.headerCard} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Speaking Score</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
              {overallScore || '--'}
            </Text>
            <Text style={styles.scoreSubtext}>out of 100</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {lastSession?.delivery.fillerWords.perMinute.toFixed(1) || '--'}
              </Text>
              <Text style={styles.statLabel}>Fillers/min</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {lastSession?.delivery.pacing.averageWPM || '--'}
              </Text>
              <Text style={styles.statLabel}>Avg WPM</Text>
            </View>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={onStartPractice}
          style={styles.practiceButton}
          icon="microphone"
        >
          Start Practice Session
        </Button>
      </Surface>

      {/* AI Coaching Tips */}
      {tips.length > 0 && (
        <Card style={styles.card}>
          <Card.Title
            title="AI Coaching Tips"
            titleStyle={styles.cardTitle}
            left={(props) => <Avatar.Icon {...props} icon="lightbulb" size={40} />}
          />
          <Card.Content>
            {tips.map((tip, index) => (
              <Surface key={tip.id} style={styles.tipCard} elevation={1}>
                <View style={styles.tipHeader}>
                  <Chip
                    mode="flat"
                    style={[styles.tipChip, { backgroundColor: theme.colors.primaryContainer }]}
                  >
                    {tip.category.replace('_', ' ')}
                  </Chip>
                  {tip.actionable && (
                    <Badge style={styles.actionBadge}>Action</Badge>
                  )}
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipMessage}>{tip.message}</Text>
                {tip.relatedExerciseId && (
                  <Button
                    mode="text"
                    onPress={() => onStartExercise(tip.relatedExerciseId!)}
                    compact
                  >
                    Try Exercise →
                  </Button>
                )}
              </Surface>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Today's Practice Plan */}
      <Card style={styles.card}>
        <Card.Title
          title="Today's Practice Plan"
          titleStyle={styles.cardTitle}
          subtitle={`${dailyExercises.reduce((sum, e) => sum + e.estimatedDuration, 0)} minutes total`}
          left={(props) => <Avatar.Icon {...props} icon="calendar-today" size={40} />}
        />
        <Card.Content>
          {dailyExercises.map((exercise, index) => (
            <List.Item
              key={exercise.id}
              title={exercise.name}
              description={`${exercise.estimatedDuration} min • ${exercise.difficulty}`}
              left={() => (
                <Avatar.Icon
                  icon={getCategoryIcon(exercise.category)}
                  size={40}
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                />
              )}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => onStartExercise(exercise.id)}
                >
                  Start
                </Button>
              )}
              style={styles.exerciseItem}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Last Session Summary */}
      {lastSession && (
        <Card style={styles.card}>
          <Card.Title
            title="Last Session Analysis"
            titleStyle={styles.cardTitle}
            left={(props) => <Avatar.Icon {...props} icon="chart-bar" size={40} />}
          />
          <Card.Content>
            {/* Score Breakdown */}
            <View style={styles.scoreBreakdown}>
              {[
                { label: 'Delivery', score: lastSession.delivery.score, icon: 'truck-delivery' },
                { label: 'Content', score: lastSession.content.score, icon: 'file-document' },
                { label: 'Voice', score: lastSession.voice.score, icon: 'waveform' },
                { label: 'Language', score: lastSession.language.score, icon: 'translate' },
                { label: 'Emotion', score: lastSession.emotion.score, icon: 'emoticon' },
              ].map((item) => (
                <View key={item.label} style={styles.scoreItem}>
                  <View style={styles.scoreItemHeader}>
                    <Text style={styles.scoreItemLabel}>{item.label}</Text>
                    <Text style={[styles.scoreItemValue, { color: getScoreColor(item.score) }]}>
                      {item.score}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={item.score / 100}
                    color={getScoreColor(item.score)}
                    style={styles.progressBar}
                  />
                </View>
              ))}
            </View>

            <Divider style={styles.divider} />

            {/* Strengths */}
            {lastSession.strengths.length > 0 && (
              <View style={styles.insightsSection}>
                <Text style={styles.insightTitle}>💪 Strengths</Text>
                {lastSession.strengths.map((strength, index) => (
                  <Text key={index} style={styles.insightText}>• {strength}</Text>
                ))}
              </View>
            )}

            {/* Areas to Improve */}
            {lastSession.improvements.length > 0 && (
              <View style={styles.insightsSection}>
                <Text style={styles.insightTitle}>🎯 Focus Areas</Text>
                {lastSession.improvements.slice(0, 3).map((improvement, index) => (
                  <View key={improvement.id} style={styles.improvementItem}>
                    <Text style={styles.improvementTitle}>{improvement.title}</Text>
                    <Text style={styles.improvementDesc}>{improvement.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
          <Card.Actions>
            <Button onPress={onViewProgress}>View Full Analysis</Button>
          </Card.Actions>
        </Card>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Practice</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {practiceExercisesService.getCategories().slice(0, 6).map((cat) => (
            <Surface key={cat.category} style={styles.quickActionCard} elevation={1}>
              <Text style={styles.quickActionIcon}>{cat.icon}</Text>
              <Text style={styles.quickActionName}>{cat.name}</Text>
              <Button
                mode="text"
                compact
                onPress={() => {
                  const exercises = practiceExercisesService.getExercisesByCategory(cat.category);
                  const firstExercise = exercises[0];
                  if (firstExercise) {
                    onStartExercise(firstExercise.id);
                  }
                }}
              >
                Start
              </Button>
            </Surface>
          ))}
        </ScrollView>
      </View>

      {/* Professional Benchmark */}
      {lastSession?.benchmarks && (
        <Card style={styles.card}>
          <Card.Title
            title="Professional Comparison"
            titleStyle={styles.cardTitle}
            subtitle="How you compare to professionals"
            left={(props) => <Avatar.Icon {...props} icon="trophy" size={40} />}
          />
          <Card.Content>
            <View style={styles.benchmarkContainer}>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>TED Speaker</Text>
                <View style={styles.benchmarkBar}>
                  <View
                    style={[
                      styles.benchmarkFill,
                      {
                        width: `${lastSession.benchmarks.professionalComparison.tedSpeakerScore}%`,
                        backgroundColor: getScoreColor(lastSession.benchmarks.professionalComparison.tedSpeakerScore),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.benchmarkValue}>
                  {lastSession.benchmarks.professionalComparison.tedSpeakerScore}%
                </Text>
              </View>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>Podcast Host</Text>
                <View style={styles.benchmarkBar}>
                  <View
                    style={[
                      styles.benchmarkFill,
                      {
                        width: `${lastSession.benchmarks.professionalComparison.podcastHostScore}%`,
                        backgroundColor: getScoreColor(lastSession.benchmarks.professionalComparison.podcastHostScore),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.benchmarkValue}>
                  {lastSession.benchmarks.professionalComparison.podcastHostScore}%
                </Text>
              </View>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>News Anchor</Text>
                <View style={styles.benchmarkBar}>
                  <View
                    style={[
                      styles.benchmarkFill,
                      {
                        width: `${lastSession.benchmarks.professionalComparison.newsAnchorScore}%`,
                        backgroundColor: getScoreColor(lastSession.benchmarks.professionalComparison.newsAnchorScore),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.benchmarkValue}>
                  {lastSession.benchmarks.professionalComparison.newsAnchorScore}%
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Empty State */}
      {!lastSession && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text style={styles.emptyIcon}>🎤</Text>
            <Text style={styles.emptyTitle}>Ready to Become a Better Speaker?</Text>
            <Text style={styles.emptySubtitle}>
              Start your first practice session to get personalized AI coaching
            </Text>
            <Button
              mode="contained"
              onPress={onStartPractice}
              style={styles.emptyButton}
              icon="microphone"
            >
              Start First Session
            </Button>
          </Card.Content>
        </Card>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreSubtext: {
    fontSize: 12,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  practiceButton: {
    marginTop: 8,
  },
  card: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tipCard: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipChip: {
    height: 24,
  },
  actionBadge: {
    backgroundColor: '#22C55E',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  exerciseItem: {
    paddingVertical: 8,
  },
  scoreBreakdown: {
    gap: 12,
  },
  scoreItem: {
    marginBottom: 8,
  },
  scoreItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreItemLabel: {
    fontSize: 14,
    color: '#666',
  },
  scoreItemValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  divider: {
    marginVertical: 16,
  },
  insightsSection: {
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },
  improvementItem: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  improvementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  improvementDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  quickActions: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionCard: {
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
    backgroundColor: '#FFFFFF',
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  benchmarkContainer: {
    gap: 16,
  },
  benchmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benchmarkLabel: {
    width: 100,
    fontSize: 13,
    color: '#666',
  },
  benchmarkBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E5E5',
    borderRadius: 6,
    overflow: 'hidden',
  },
  benchmarkFill: {
    height: '100%',
    borderRadius: 6,
  },
  benchmarkValue: {
    width: 40,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyCard: {
    margin: 16,
    borderRadius: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  bottomPadding: {
    height: 32,
  },
});

export default CoachingDashboard;
