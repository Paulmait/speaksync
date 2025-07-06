import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Surface,
  Divider,
  Chip,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { ComparisonAnalytics } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

interface SessionComparisonProps {
  comparison: ComparisonAnalytics;
  onClose: () => void;
}

export function SessionComparison({ comparison, onClose }: SessionComparisonProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgressColor = (value: number) => {
    if (value > 10) return '#10b981'; // Green
    if (value > 0) return '#f59e0b'; // Yellow
    if (value > -10) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getProgressIcon = (value: number) => {
    if (value > 5) return '📈';
    if (value < -5) return '📉';
    return '➡️';
  };

  // Chart configuration
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Session Comparison
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Comparing {comparison.sessions.length} sessions
        </Text>
      </View>

      {/* Progress Metrics */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Progress Metrics
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text variant="bodySmall" style={styles.metricLabel}>
                WPM Progress
              </Text>
              <View style={styles.metricValue}>
                <Text style={{ fontSize: 20 }}>
                  {getProgressIcon(comparison.metrics.wpmProgress)}
                </Text>
                <Text 
                  variant="titleMedium" 
                  style={[
                    styles.metricNumber,
                    { color: getProgressColor(comparison.metrics.wpmProgress) }
                  ]}
                >
                  {comparison.metrics.wpmProgress > 0 ? '+' : ''}
                  {comparison.metrics.wpmProgress.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Filler Words
              </Text>
              <View style={styles.metricValue}>
                <Text style={{ fontSize: 20 }}>
                  {getProgressIcon(comparison.metrics.fillerWordImprovement)}
                </Text>
                <Text 
                  variant="titleMedium" 
                  style={[
                    styles.metricNumber,
                    { color: getProgressColor(comparison.metrics.fillerWordImprovement) }
                  ]}
                >
                  {comparison.metrics.fillerWordImprovement > 0 ? '+' : ''}
                  {comparison.metrics.fillerWordImprovement.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Adherence
              </Text>
              <View style={styles.metricValue}>
                <Text style={{ fontSize: 20 }}>
                  {getProgressIcon(comparison.metrics.adherenceImprovement)}
                </Text>
                <Text 
                  variant="titleMedium" 
                  style={[
                    styles.metricNumber,
                    { color: getProgressColor(comparison.metrics.adherenceImprovement) }
                  ]}
                >
                  {comparison.metrics.adherenceImprovement > 0 ? '+' : ''}
                  {comparison.metrics.adherenceImprovement.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Consistency
              </Text>
              <View style={styles.metricValue}>
                <Text variant="titleMedium" style={styles.metricNumber}>
                  {comparison.metrics.consistencyScore.toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* WPM Trend Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            WPM Trend
          </Text>
          <LineChart
            data={{
              labels: comparison.trends.wpm.map((_, index) => `S${index + 1}`),
              datasets: [{
                data: comparison.trends.wpm.map(point => point.value),
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                strokeWidth: 3,
              }],
            }}
            width={screenWidth - 80}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Filler Words Trend Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Filler Words Trend
          </Text>
          <LineChart
            data={{
              labels: comparison.trends.fillerWords.map((_, index) => `S${index + 1}`),
              datasets: [{
                data: comparison.trends.fillerWords.map(point => point.value),
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                strokeWidth: 3,
              }],
            }}
            width={screenWidth - 80}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Session Details */}
      <Card style={styles.sessionsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Sessions Compared
          </Text>
          {comparison.sessions.map((session, index) => (
            <View key={session.id}>
              <Surface style={styles.sessionItem}>
                <View style={styles.sessionHeader}>
                  <Text variant="bodyLarge" style={styles.sessionTitle}>
                    {session.scriptTitle}
                  </Text>
                  <Text variant="bodySmall" style={styles.sessionDate}>
                    {formatDate(session.startTime)}
                  </Text>
                </View>
                
                <View style={styles.sessionMetrics}>
                  <Chip mode="outlined" style={styles.sessionChip}>
                    {session.averageWPM.toFixed(0)} WPM
                  </Chip>
                  <Chip mode="outlined" style={styles.sessionChip}>
                    {session.fillerWordAnalysis.fillerRate.toFixed(1)} filler/min
                  </Chip>
                  <Chip mode="outlined" style={styles.sessionChip}>
                    {session.scriptAdherence.adherencePercentage.toFixed(1)}% adherence
                  </Chip>
                </View>
              </Surface>
              {index < comparison.sessions.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Insights */}
      {comparison.insights && comparison.insights.length > 0 && (
        <Card style={styles.insightsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Insights
            </Text>
            {comparison.insights.map((insight, index) => (
              <Text key={index} variant="bodyMedium" style={styles.insight}>
                • {insight}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Recommendations */}
      {comparison.recommendations && comparison.recommendations.length > 0 && (
        <Card style={styles.recommendationsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Recommendations
            </Text>
            {comparison.recommendations.map((recommendation, index) => (
              <Text key={index} variant="bodyMedium" style={styles.recommendation}>
                • {recommendation}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Close Button */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={onClose}
          style={styles.closeButton}
        >
          Close Comparison
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
  },
  metricsCard: {
    margin: 16,
    elevation: 2,
  },
  chartCard: {
    margin: 16,
    elevation: 2,
  },
  sessionsCard: {
    margin: 16,
    elevation: 2,
  },
  insightsCard: {
    margin: 16,
    elevation: 2,
  },
  recommendationsCard: {
    margin: 16,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricLabel: {
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricNumber: {
    fontWeight: 'bold',
  },
  chart: {
    borderRadius: 16,
    marginTop: 8,
  },
  sessionItem: {
    padding: 12,
    borderRadius: 8,
  },
  sessionHeader: {
    marginBottom: 8,
  },
  sessionTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  sessionDate: {
    color: '#6b7280',
  },
  sessionMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionChip: {
    height: 28,
  },
  divider: {
    marginVertical: 8,
  },
  insight: {
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendation: {
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  actions: {
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    minWidth: 200,
  },
});
