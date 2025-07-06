import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  Card,
  Text,
  ProgressBar,
} from 'react-native-paper';
import { AnalyticsSummary } from '../../types';

interface PerformanceSummaryProps {
  summary: AnalyticsSummary;
}

export function PerformanceSummary({ summary }: PerformanceSummaryProps) {
  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return '📈';
    if (trend < -5) return '📉';
    return '➡️';
  };

  const getTrendColor = (trend: number) => {
    if (trend > 5) return '#10b981';
    if (trend < -5) return '#ef4444';
    return '#6b7280';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      {/* Main Performance Card */}
      <Card style={styles.performanceCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Performance Overview
          </Text>
          
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text variant="headlineMedium" style={styles.metricValue}>
                {summary.totalSessions}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Total Sessions
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text variant="headlineMedium" style={styles.metricValue}>
                {formatTime(summary.totalPracticeTime)}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Practice Time
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text variant="headlineMedium" style={styles.metricValue}>
                {summary.averageWPM.toFixed(0)}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Avg WPM
              </Text>
            </View>
          </View>

          <View style={styles.trendsSection}>
            <View style={styles.trendItem}>
              <View style={styles.trendHeader}>
                <Text variant="bodyMedium" style={styles.trendLabel}>
                  Speaking Pace
                </Text>
                <Text style={{ fontSize: 16 }}>
                  {getTrendIcon(summary.improvementTrend)}
                </Text>
              </View>
              <Text 
                variant="titleMedium" 
                style={[
                  styles.trendValue,
                  { color: getTrendColor(summary.improvementTrend) }
                ]}
              >
                {summary.improvementTrend > 0 ? '+' : ''}{summary.improvementTrend.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.trendItem}>
              <View style={styles.trendHeader}>
                <Text variant="bodyMedium" style={styles.trendLabel}>
                  Filler Words
                </Text>
                <Text style={{ fontSize: 16 }}>
                  {getTrendIcon(-summary.fillerWordTrend)}
                </Text>
              </View>
              <Text 
                variant="titleMedium" 
                style={[
                  styles.trendValue,
                  { color: getTrendColor(-summary.fillerWordTrend) }
                ]}
              >
                {summary.fillerWordTrend > 0 ? '+' : ''}{summary.fillerWordTrend.toFixed(1)}%
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Performance Scores */}
      <Card style={styles.scoresCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Performance Scores
          </Text>

          <View style={styles.scoreItem}>
            <View style={styles.scoreHeader}>
              <Text variant="bodyMedium">Consistency</Text>
              <Text 
                variant="titleSmall" 
                style={[
                  styles.scoreValue,
                  { color: getScoreColor(summary.performanceMetrics.consistency) }
                ]}
              >
                {summary.performanceMetrics.consistency.toFixed(0)}%
              </Text>
            </View>
            <ProgressBar
              progress={summary.performanceMetrics.consistency / 100}
              color={getScoreColor(summary.performanceMetrics.consistency)}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.scoreItem}>
            <View style={styles.scoreHeader}>
              <Text variant="bodyMedium">Accuracy</Text>
              <Text 
                variant="titleSmall" 
                style={[
                  styles.scoreValue,
                  { color: getScoreColor(summary.performanceMetrics.accuracy) }
                ]}
              >
                {summary.performanceMetrics.accuracy.toFixed(0)}%
              </Text>
            </View>
            <ProgressBar
              progress={summary.performanceMetrics.accuracy / 100}
              color={getScoreColor(summary.performanceMetrics.accuracy)}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.scoreItem}>
            <View style={styles.scoreHeader}>
              <Text variant="bodyMedium">Fluency</Text>
              <Text 
                variant="titleSmall" 
                style={[
                  styles.scoreValue,
                  { color: getScoreColor(summary.performanceMetrics.fluency) }
                ]}
              >
                {summary.performanceMetrics.fluency.toFixed(0)}%
              </Text>
            </View>
            <ProgressBar
              progress={summary.performanceMetrics.fluency / 100}
              color={getScoreColor(summary.performanceMetrics.fluency)}
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Most Practiced Script */}
      {summary.mostPracticedScript.sessionCount > 0 && (
        <Card style={styles.scriptCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Most Practiced Script
            </Text>
            <View style={styles.scriptInfo}>
              <Text variant="bodyLarge" style={styles.scriptTitle}>
                {summary.mostPracticedScript.title}
              </Text>
              <Text variant="bodyMedium" style={styles.scriptSessions}>
                {summary.mostPracticedScript.sessionCount} session
                {summary.mostPracticedScript.sessionCount > 1 ? 's' : ''}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  performanceCard: {
    elevation: 2,
  },
  scoresCard: {
    elevation: 2,
  },
  scriptCard: {
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#6b7280',
    textAlign: 'center',
  },
  trendsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  trendLabel: {
    color: '#6b7280',
  },
  trendValue: {
    fontWeight: 'bold',
  },
  scoreItem: {
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreValue: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  scriptInfo: {
    alignItems: 'center',
  },
  scriptTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  scriptSessions: {
    color: '#6b7280',
  },
});
