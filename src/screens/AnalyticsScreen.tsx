import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  SegmentedButtons,
  FAB,
  Portal,
  Modal,
  Surface,
  Chip,
  IconButton,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import {
  SessionReport,
  AnalyticsSummary,
  AnalyticsFilters,
  ComparisonAnalytics,
  GamificationData,
  LanguageOption,
} from '../types';
import { analyticsService } from '../services/analyticsService';
import { useScriptStore } from '../store/scriptStore';
import {
  AnalyticsFilters as FiltersComponent,
  SessionList,
  PerformanceSummary,
  SessionComparison,
  ExportOptions,
} from '../components/analytics';
import { GamificationPanel } from '../components';
import { gamificationService, multiLanguageService } from '../services';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsScreenProps {
  navigation: any;
}

export default function AnalyticsScreen({ navigation }: AnalyticsScreenProps) {
  const { authState } = useScriptStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sessions, setSessions] = useState<SessionReport[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonAnalytics | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Gamification and language data
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [languageStats, setLanguageStats] = useState<{ [key: string]: number }>({});
  
  // Modal states
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showGamificationDetails, setShowGamificationDetails] = useState(false);

  const loadAnalytics = async (showLoader = true) => {
    if (!authState.user) return;

    try {
      if (showLoader) setLoading(true);
      
      const [summaryData, sessionsData] = await Promise.all([
        analyticsService.getAnalyticsSummary(authState.user.uid, filters),
        analyticsService.getSessions(authState.user.uid, filters),
      ]);

      setSummary(summaryData);
      setSessions(sessionsData);
      
      // Load gamification data
      const gamificationSvc = gamificationService.getInstance();
      const gamificationInfo = await gamificationSvc.getGamificationData();
      setGamificationData(gamificationInfo);
      
      // Load language usage stats
      const multiLangSvc = multiLanguageService.getInstance();
      const langStats = multiLangSvc.getLanguageUsageStats();
      setLanguageStats(langStats);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAnalytics();
    }, [authState.user, filters])
  );

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else if (prev.length < 5) { // Max 5 sessions for comparison
        return [...prev, sessionId];
      } else {
        Alert.alert('Limit Reached', 'You can compare up to 5 sessions at once.');
        return prev;
      }
    });
  };

  const handleCompareSelected = async () => {
    if (selectedSessions.length < 2) {
      Alert.alert('Selection Required', 'Please select at least 2 sessions to compare.');
      return;
    }

    try {
      setLoading(true);
      const comparisonData = await analyticsService.compareSessions(selectedSessions);
      setComparison(comparisonData);
      setShowComparison(true);
    } catch (error) {
      console.error('Error comparing sessions:', error);
      Alert.alert('Error', 'Failed to compare sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearSelection = () => {
    setSelectedSessions([]);
  };

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!sessions.length) return null;

    const recentSessions = sessions.slice(0, 10).reverse();
    
    return {
      wpmData: {
        labels: recentSessions.map((_, index) => `S${index + 1}`),
        datasets: [{
          data: recentSessions.map(s => s.averageWPM),
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 3,
        }],
      },
      fillerWordsData: {
        labels: recentSessions.map((_, index) => `S${index + 1}`),
        datasets: [{
          data: recentSessions.map(s => s.fillerWordAnalysis.fillerRate),
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 3,
        }],
      },
    };
  }, [sessions]);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#6366f1',
    },
  };

  if (loading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with filters and actions */}
      <Surface style={styles.headerSurface}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Analytics
          </Text>
          <View style={styles.headerActions}>
            <IconButton
              icon="filter"
              mode="contained"
              size={20}
              onPress={() => setShowFilters(true)}
            />
            <IconButton
              icon="export"
              mode="contained"
              size={20}
              onPress={() => setShowExport(true)}
            />
          </View>
        </View>

        {/* Active filters */}
        {Object.keys(filters).length > 0 && (
          <View style={styles.activeFilters}>
            <Text variant="labelMedium" style={styles.filtersLabel}>
              Active Filters:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {filters.dateRange && (
                  <Chip
                    mode="outlined"
                    onClose={() => setFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters.dateRange;
                      return newFilters;
                    })}
                  >
                    Date Range
                  </Chip>
                )}
                {filters.scriptIds?.length && (
                  <Chip
                    mode="outlined"
                    onClose={() => setFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters.scriptIds;
                      return newFilters;
                    })}
                  >
                    {filters.scriptIds.length} Scripts
                  </Chip>
                )}
                {filters.wpmRange && (
                  <Chip
                    mode="outlined"
                    onClose={() => setFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters.wpmRange;
                      return newFilters;
                    })}
                  >
                    WPM Range
                  </Chip>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Selection controls */}
        {selectedSessions.length > 0 && (
          <View style={styles.selectionControls}>
            <Text variant="labelMedium">
              {selectedSessions.length} session{selectedSessions.length > 1 ? 's' : ''} selected
            </Text>
            <View style={styles.selectionActions}>
              <Button
                mode="outlined"
                compact
                onPress={handleClearSelection}
              >
                Clear
              </Button>
              <Button
                mode="contained"
                compact
                onPress={handleCompareSelected}
                disabled={selectedSessions.length < 2}
              >
                Compare
              </Button>
            </View>
          </View>
        )}
      </Surface>

      {/* Tab Navigation */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'overview', label: 'Overview' },
          { value: 'sessions', label: 'Sessions' },
          { value: 'trends', label: 'Trends' },
          { value: 'progress', label: 'Progress' },
        ]}
        style={styles.tabs}
      />

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && (
          <View>
            {summary && <PerformanceSummary summary={summary} />}
            
            {/* Quick Stats */}
            {summary && (
              <Card style={styles.statsCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Quick Stats
                  </Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text variant="headlineMedium" style={styles.statValue}>
                        {summary.totalSessions}
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Total Sessions
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text variant="headlineMedium" style={styles.statValue}>
                        {(summary.totalPracticeTime / 3600000).toFixed(1)}h
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Practice Time
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text variant="headlineMedium" style={styles.statValue}>
                        {summary.averageWPM.toFixed(0)}
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Avg WPM
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text variant="headlineMedium" style={styles.statValue}>
                        {summary.improvementTrend > 0 ? '+' : ''}{summary.improvementTrend.toFixed(1)}%
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Improvement
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Recent Performance Chart */}
            {chartData && (
              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Recent Performance (WPM)
                  </Text>
                  <LineChart
                    data={chartData.wpmData}
                    width={screenWidth - 64}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'sessions' && (
          <SessionList
            sessions={sessions}
            selectedSessions={selectedSessions}
            onSessionSelect={handleSessionSelect}
            onSessionPress={(session: SessionReport) => navigation.navigate('SessionDetail', { sessionId: session.id })}
          />
        )}

        {activeTab === 'trends' && (
          <View>
            {/* WPM Trend Chart */}
            {chartData && (
              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Speaking Pace Trend
                  </Text>
                  <LineChart
                    data={chartData.wpmData}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </Card.Content>
              </Card>
            )}

            {/* Filler Words Trend */}
            {chartData && (
              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Filler Words Trend
                  </Text>
                  <LineChart
                    data={chartData.fillerWordsData}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                    }}
                    bezier
                    style={styles.chart}
                  />
                </Card.Content>
              </Card>
            )}

            {/* Weekly Stats */}
            {summary?.weeklyStats && summary.weeklyStats.length > 0 && (
              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Weekly Practice Sessions
                  </Text>
                  <BarChart
                    data={{
                      labels: summary.weeklyStats.slice(-8).map(w => w.week.split('-W')[1] || ''),
                      datasets: [{
                        data: summary.weeklyStats.slice(-8).map(w => w.sessionCount),
                      }],
                    }}
                    width={screenWidth - 64}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    style={styles.chart}
                  />
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'progress' && (
          <View>
            {/* Gamification Overview */}
            {gamificationData && (
              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Your Progress
                  </Text>
                  <View style={styles.progressOverview}>
                    <View style={styles.progressItem}>
                      <Text variant="headlineMedium" style={styles.progressValue}>
                        {gamificationData.currentLevel}
                      </Text>
                      <Text variant="bodyMedium" style={styles.progressLabel}>
                        Current Level
                      </Text>
                    </View>
                    <View style={styles.progressItem}>
                      <Text variant="headlineMedium" style={styles.progressValue}>
                        {gamificationData.totalXP}
                      </Text>
                      <Text variant="bodyMedium" style={styles.progressLabel}>
                        Total XP
                      </Text>
                    </View>
                    <View style={styles.progressItem}>
                      <Text variant="headlineMedium" style={styles.progressValue}>
                        {gamificationData.recentAchievements.length}
                      </Text>
                      <Text variant="bodyMedium" style={styles.progressLabel}>
                        Achievements
                      </Text>
                    </View>
                  </View>
                  <Button
                    mode="outlined"
                    onPress={() => setShowGamificationDetails(true)}
                    style={styles.detailsButton}
                  >
                    View Details
                  </Button>
                </Card.Content>
              </Card>
            )}

            {/* Language Usage Stats */}
            {Object.keys(languageStats).length > 0 && (
              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Language Usage
                  </Text>
                  <View style={styles.languageStats}>
                    {Object.entries(languageStats).map(([langCode, count]) => {
                      const multiLangSvc = multiLanguageService.getInstance();
                      const language = multiLangSvc.getLanguageByCode(langCode);
                      return (
                        <View key={langCode} style={styles.languageItem}>
                          <Text style={styles.languageFlag}>
                            {language?.flag || '🌐'}
                          </Text>
                          <Text style={styles.languageName}>
                            {language?.name || langCode}
                          </Text>
                          <Text style={styles.languageCount}>
                            {count} scripts
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Active Streaks */}
            {gamificationData?.activeStreaks && gamificationData.activeStreaks.length > 0 && (
              <Card style={styles.chartCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Active Streaks
                  </Text>
                  {gamificationData.activeStreaks.map((streak, index) => (
                    <View key={`${streak.streakType}-${index}`} style={styles.streakItem}>
                      <View style={styles.streakInfo}>
                        <Text variant="titleSmall" style={styles.streakType}>
                          {streak.streakType === 'daily' ? 'Daily Practice' : 'Weekly Practice'}
                        </Text>
                        <Text variant="bodyMedium" style={styles.streakDescription}>
                          {streak.currentStreak} {streak.streakType === 'daily' ? 'days' : 'weeks'} in a row
                        </Text>
                      </View>
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakCount}>{streak.currentStreak}</Text>
                      </View>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <Portal>
        <Modal
          visible={showFilters}
          onDismiss={() => setShowFilters(false)}
          contentContainerStyle={styles.modalContent}
        >
          <FiltersComponent
            currentFilters={filters}
            onApplyFilters={handleApplyFilters}
            onClose={() => setShowFilters(false)}
          />
        </Modal>

        <Modal
          visible={showExport}
          onDismiss={() => setShowExport(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ExportOptions
            sessions={sessions}
            filters={filters}
            onClose={() => setShowExport(false)}
          />
        </Modal>

        <Modal
          visible={showComparison}
          onDismiss={() => setShowComparison(false)}
          contentContainerStyle={styles.modalContent}
        >
          {comparison && (
            <SessionComparison
              comparison={comparison}
              onClose={() => setShowComparison(false)}
            />
          )}
        </Modal>

        <GamificationPanel
          visible={showGamificationDetails}
          onDismiss={() => setShowGamificationDetails(false)}
        />
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  headerSurface: {
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filtersLabel: {
    marginBottom: 8,
    color: '#6b7280',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tabs: {
    margin: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  chartCard: {
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    marginTop: 8,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  progressOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressValue: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  progressLabel: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  detailsButton: {
    marginTop: 16,
  },
  languageStats: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontWeight: '500',
    color: '#1f2937',
  },
  languageCount: {
    color: '#6b7280',
    fontSize: 14,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  streakInfo: {
    flex: 1,
  },
  streakType: {
    fontWeight: '600',
    color: '#1f2937',
  },
  streakDescription: {
    color: '#6b7280',
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  streakCount: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
