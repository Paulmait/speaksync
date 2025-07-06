import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Surface,
  ProgressBar,
  Button,
  IconButton,
  Portal,
  Modal,
  Chip,
  Divider,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import GamificationService from '../services/gamificationService';
import {
  UserProgress,
  Achievement,
  UserStreak,
  GamificationData,
  ProgressTrend,
  WeeklyGoal,
  SocialShare
} from '../types';

const { width } = Dimensions.get('window');

interface GamificationPanelProps {
  visible: boolean;
  onDismiss: () => void;
  onShare?: (shareData: SocialShare) => void;
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({
  visible,
  onDismiss,
  onShare
}) => {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streaks, setStreaks] = useState<UserStreak[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [progressTrends, setProgressTrends] = useState<ProgressTrend[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(false);

  const gamificationService = GamificationService.getInstance();

  useEffect(() => {
    if (visible) {
      loadGamificationData();
    }
  }, [visible]);

  const loadGamificationData = async () => {
    setLoading(true);
    try {
      const [data, achievementList, streakList, goals, trends] = await Promise.all([
        gamificationService.getGamificationData(),
        gamificationService.getAchievements(),
        gamificationService.getStreaks(),
        gamificationService.getWeeklyGoals(),
        gamificationService.getProgressTrends()
      ]);

      setGamificationData(data);
      setAchievements(achievementList);
      setStreaks(streakList);
      setWeeklyGoals(goals);
      setProgressTrends(trends);
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareAchievement = async (achievement: Achievement) => {
    if (!onShare) return;

    try {
      const shareData = await gamificationService.generateSocialShare(achievement.id, 'clipboard');
      onShare(shareData);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate share content');
    }
  };

  const renderProgressSection = () => {
    if (!gamificationData) return null;

    const progressPercent = (gamificationData.totalXP / (gamificationData.totalXP + 100)) * 100;

    return (
      <Card style={styles.progressCard}>
        <Card.Content>
          <View style={styles.levelHeader}>
            <Text style={styles.levelText}>Level {gamificationData.currentLevel}</Text>
            <Text style={styles.xpText}>{gamificationData.totalXP} XP</Text>
          </View>
          <ProgressBar 
            progress={progressPercent / 100} 
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            {100 - (gamificationData.totalXP % 100)} XP to next level
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderStreakSection = () => {
    if (streaks.length === 0) return null;

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>🔥 Practice Streaks</Text>
          {streaks.map((streak, index) => (
            <Surface key={index} style={styles.streakItem}>
              <View style={styles.streakContent}>
                <Text style={styles.streakType}>
                  {streak.streakType === 'daily' ? '📅' : '🗓️'} {streak.streakType.charAt(0).toUpperCase() + streak.streakType.slice(1)}
                </Text>
                <View style={styles.streakNumbers}>
                  <Text style={styles.currentStreak}>{streak.currentStreak}</Text>
                  <Text style={styles.streakLabel}>Current</Text>
                </View>
                <View style={styles.streakNumbers}>
                  <Text style={styles.longestStreak}>{streak.longestStreak}</Text>
                  <Text style={styles.streakLabel}>Best</Text>
                </View>
                {streak.isActive && (
                  <Chip mode="flat" style={styles.activeChip}>
                    Active
                  </Chip>
                )}
              </View>
            </Surface>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderAchievementsSection = () => {
    const recentAchievements = achievements
      .filter(a => a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 6);

    if (recentAchievements.length === 0) return null;

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>🏆 Recent Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentAchievements.map((achievement) => (
              <TouchableOpacity
                key={achievement.id}
                style={styles.achievementItem}
                onPress={() => setSelectedAchievement(achievement)}
              >
                <Surface style={[styles.achievementSurface, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementPoints}>{achievement.points} XP</Text>
                </Surface>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderWeeklyGoalsSection = () => {
    if (weeklyGoals.length === 0) return null;

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>🎯 Weekly Goals</Text>
          {weeklyGoals.map((goal) => (
            <Surface key={goal.id} style={styles.goalItem}>
              <View style={styles.goalContent}>
                <Text style={styles.goalDescription}>{goal.description}</Text>
                <View style={styles.goalProgress}>
                  <ProgressBar
                    progress={Math.min(goal.current / goal.target, 1)}
                    style={styles.goalProgressBar}
                  />
                  <Text style={styles.goalProgressText}>
                    {goal.current}/{goal.target}
                  </Text>
                </View>
                {goal.isCompleted && (
                  <Chip icon="check" mode="flat" style={styles.completedChip}>
                    Completed
                  </Chip>
                )}
              </View>
            </Surface>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderProgressTrendsSection = () => {
    if (progressTrends.length === 0) return null;

    const chartData = progressTrends[0]?.data || [];
    const labels = chartData.slice(-7).map((_, index) => `${index + 1}d`);
    const dataPoints = chartData.slice(-7).map(point => point.value);

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📈 Progress Trends</Text>
          {chartData.length > 0 && (
            <LineChart
              data={{
                labels,
                datasets: [{
                  data: dataPoints,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  strokeWidth: 2
                }]
              }}
              width={width - 80}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#4CAF50'
                }
              }}
              bezier
              style={styles.chart}
            />
          )}
          <View style={styles.trendsContainer}>
            {progressTrends.map((trend) => (
              <View key={trend.metric} style={styles.trendItem}>
                <Text style={styles.trendMetric}>{trend.metric.replace('_', ' ').toUpperCase()}</Text>
                <Text style={[
                  styles.trendValue,
                  { color: trend.trend === 'improving' ? '#4CAF50' : trend.trend === 'declining' ? '#F44336' : '#9E9E9E' }
                ]}>
                  {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return '#E8F5E8';
      case 'rare': return '#E3F2FD';
      case 'epic': return '#F3E5F5';
      case 'legendary': return '#FFF3E0';
      default: return '#F5F5F5';
    }
  };

  const renderAchievementModal = () => {
    if (!selectedAchievement) return null;

    return (
      <Portal>
        <Modal
          visible={!!selectedAchievement}
          onDismiss={() => setSelectedAchievement(null)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.achievementModal}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Text style={styles.modalIcon}>{selectedAchievement.icon}</Text>
                <IconButton
                  icon="close"
                  onPress={() => setSelectedAchievement(null)}
                  style={styles.closeButton}
                />
              </View>
              <Text style={styles.modalTitle}>{selectedAchievement.name}</Text>
              <Text style={styles.modalDescription}>{selectedAchievement.description}</Text>
              <View style={styles.modalDetails}>
                <Chip mode="outlined" style={styles.rarityChip}>
                  {selectedAchievement.rarity}
                </Chip>
                <Chip mode="outlined" style={styles.pointsChip}>
                  {selectedAchievement.points} XP
                </Chip>
              </View>
              {selectedAchievement.unlockedAt && (
                <Text style={styles.unlockedDate}>
                  Unlocked on {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                </Text>
              )}
              <Button
                mode="contained"
                onPress={() => handleShareAchievement(selectedAchievement)}
                style={styles.shareButton}
                icon="share"
              >
                Share Achievement
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.header}>
              <Text style={styles.title}>🎮 Your Progress</Text>
              <IconButton
                icon="close"
                onPress={onDismiss}
                style={styles.closeButton}
              />
            </View>
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {renderProgressSection()}
              {renderStreakSection()}
              {renderAchievementsSection()}
              {renderWeeklyGoalsSection()}
              {renderProgressTrendsSection()}
            </ScrollView>
          </Card.Content>
        </Card>
        {renderAchievementModal()}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
  },
  mainCard: {
    flex: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  progressCard: {
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#388E3C',
  },
  progressBar: {
    marginVertical: 8,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  streakItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakType: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  streakNumbers: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  currentStreak: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  longestStreak: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  streakLabel: {
    fontSize: 10,
    color: '#666',
  },
  activeChip: {
    backgroundColor: '#FFE0B2',
  },
  achievementItem: {
    marginRight: 12,
  },
  achievementSurface: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: 120,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementPoints: {
    fontSize: 10,
    color: '#666',
  },
  goalItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalDescription: {
    fontSize: 14,
    flex: 1,
    marginRight: 16,
  },
  goalProgress: {
    alignItems: 'center',
  },
  goalProgressBar: {
    marginBottom: 4,
  },
  goalProgressText: {
    fontSize: 12,
    color: '#666',
  },
  completedChip: {
    backgroundColor: '#C8E6C9',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  trendsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  trendItem: {
    alignItems: 'center',
  },
  trendMetric: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    margin: 20,
  },
  achievementModal: {
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 48,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modalDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rarityChip: {
    marginRight: 8,
  },
  pointsChip: {
    backgroundColor: '#E8F5E8',
  },
  unlockedDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
});

export default GamificationPanel;
