import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Chip,
  Surface,
  Divider,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SessionReport, RootStackParamList } from '../types';
import { analyticsService } from '../services/analyticsService';

const { width: screenWidth } = Dimensions.get('window');

type SessionDetailScreenRouteProp = RouteProp<RootStackParamList, 'SessionDetail'>;
type SessionDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionDetail'>;

interface SessionDetailScreenProps {
  route: SessionDetailScreenRouteProp;
  navigation: SessionDetailScreenNavigationProp;
}

export default function SessionDetailScreen({ route }: SessionDetailScreenProps) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessionData = await analyticsService.getSessionById(sessionId);
      setSession(sessionData);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading session details...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium">Session not found</Text>
      </View>
    );
  }

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
      {/* Session Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.scriptTitle}>
            {session.scriptTitle}
          </Text>
          <Text variant="bodyMedium" style={styles.sessionDate}>
            {formatDate(session.startTime)}
          </Text>
          
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statValue}>
                {formatDuration(session.totalDuration)}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Duration
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statValue}>
                {session.averageWPM.toFixed(0)}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Avg WPM
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statValue}>
                {session.wordsSpoken}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Words Spoken
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Performance Metrics
          </Text>
          
          <View style={styles.chipContainer}>
            <Chip mode="outlined" style={styles.chip}>
              {session.scriptAdherence.accuracyScore.toFixed(1)}% Accuracy
            </Chip>
            <Chip mode="outlined" style={styles.chip}>
              {session.scriptAdherence.adherencePercentage.toFixed(1)}% Adherence
            </Chip>
            <Chip mode="outlined" style={styles.chip}>
              {session.fillerWordAnalysis.totalFillerWords} Filler Words
            </Chip>
            <Chip mode="outlined" style={styles.chip}>
              {session.fillerWordAnalysis.fillerRate.toFixed(1)} per minute
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* WPM Over Time */}
      {session.wpmHistory && session.wpmHistory.length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Speaking Pace Over Time
            </Text>
            <LineChart
              data={{
                labels: session.wpmHistory.map((_, index) => `${index * 10}s`),
                datasets: [{
                  data: session.wpmHistory.map(point => point.wpm),
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  strokeWidth: 3,
                }],
              }}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {/* Filler Words Details */}
      {session.fillerWordAnalysis.fillerInstances && session.fillerWordAnalysis.fillerInstances.length > 0 && (
        <Card style={styles.fillerCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Filler Words Detected
            </Text>
            {session.fillerWordAnalysis.fillerInstances.slice(0, 10).map((instance: any, index: number) => (
              <Surface key={index} style={styles.fillerInstance}>
                <Text variant="bodyMedium" style={styles.fillerWord}>
                  "{instance.word}"
                </Text>
                <Text variant="bodySmall" style={styles.fillerTime}>
                  at {Math.floor(instance.timestamp / 1000)}s
                </Text>
              </Surface>
            ))}
            {session.fillerWordAnalysis.fillerInstances.length > 10 && (
              <Text variant="bodySmall" style={styles.moreFillers}>
                + {session.fillerWordAnalysis.fillerInstances.length - 10} more instances
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Script Adherence Analysis */}
      <Card style={styles.adherenceCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Script Adherence Analysis
          </Text>
          
          <View style={styles.adherenceStats}>
            <View style={styles.adherenceStat}>
              <Text variant="titleMedium" style={styles.adherenceValue}>
                {session.scriptAdherence.wordsSpoken}
              </Text>
              <Text variant="bodySmall" style={styles.adherenceLabel}>
                Words Spoken
              </Text>
            </View>
            
            <View style={styles.adherenceStat}>
              <Text variant="titleMedium" style={styles.adherenceValue}>
                {session.scriptAdherence.skippedSections.length}
              </Text>
              <Text variant="bodySmall" style={styles.adherenceLabel}>
                Skipped Sections
              </Text>
            </View>
            
            <View style={styles.adherenceStat}>
              <Text variant="titleMedium" style={styles.adherenceValue}>
                {session.scriptAdherence.deviations.length}
              </Text>
              <Text variant="bodySmall" style={styles.adherenceLabel}>
                Deviations
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  scriptTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sessionDate: {
    color: '#6b7280',
    marginBottom: 16,
  },
  quickStats: {
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
    marginBottom: 4,
  },
  statLabel: {
    color: '#6b7280',
    textAlign: 'center',
  },
  metricsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  chartCard: {
    marginBottom: 16,
    elevation: 2,
  },
  fillerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  adherenceCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  chart: {
    borderRadius: 16,
    marginTop: 8,
  },
  fillerInstance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    marginBottom: 4,
    borderRadius: 4,
    elevation: 1,
  },
  fillerWord: {
    fontWeight: 'bold',
    color: '#ef4444',
  },
  fillerTime: {
    color: '#6b7280',
  },
  moreFillers: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  adherenceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adherenceStat: {
    alignItems: 'center',
    flex: 1,
  },
  adherenceValue: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  adherenceLabel: {
    color: '#6b7280',
    textAlign: 'center',
  },
});
