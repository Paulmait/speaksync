import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Checkbox,
  Chip,
  IconButton,
  Surface,
} from 'react-native-paper';
import { VirtualScrollView } from '../VirtualScrollView';
import { SessionReport } from '../../types';

interface SessionListProps {
  sessions: SessionReport[];
  selectedSessions: string[];
  onSessionSelect: (sessionId: string) => void;
  onSessionPress: (session: SessionReport) => void;
}

export function SessionList({
  sessions,
  selectedSessions,
  onSessionSelect,
  onSessionPress,
}: SessionListProps) {
  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPerformanceColor = (wpm: number) => {
    if (wpm >= 160) return '#10b981'; // Green
    if (wpm >= 130) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getFillerWordColor = (rate: number) => {
    if (rate <= 1) return '#10b981'; // Green
    if (rate <= 3) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const renderSessionItem = ({ item }: { item: SessionReport }) => {
    const isSelected = selectedSessions.includes(item.id);
    
    return (
      <Card style={[styles.sessionCard, isSelected && styles.selectedCard]}>
        <TouchableOpacity
          onPress={() => onSessionPress(item)}
          style={styles.cardTouchable}
        >
          <Card.Content>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionInfo}>
                <Text variant="titleMedium" style={styles.scriptTitle}>
                  {item.scriptTitle}
                </Text>
                <Text variant="bodySmall" style={styles.sessionDate}>
                  {formatDate(item.startTime)}
                </Text>
              </View>
              <View style={styles.sessionActions}>
                <Checkbox
                  status={isSelected ? 'checked' : 'unchecked'}
                  onPress={() => onSessionSelect(item.id)}
                />
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  Duration
                </Text>
                <Text variant="bodyLarge" style={styles.metricValue}>
                  {formatDuration(item.totalDuration)}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  WPM
                </Text>
                <Text 
                  variant="bodyLarge" 
                  style={[
                    styles.metricValue,
                    { color: getPerformanceColor(item.averageWPM) }
                  ]}
                >
                  {item.averageWPM.toFixed(0)}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  Words
                </Text>
                <Text variant="bodyLarge" style={styles.metricValue}>
                  {item.wordsSpoken}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  Accuracy
                </Text>
                <Text variant="bodyLarge" style={styles.metricValue}>
                  {item.scriptAdherence.accuracyScore.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.chipsContainer}>
              <Chip
                mode="outlined"
                style={[
                  styles.chip,
                  { borderColor: getFillerWordColor(item.fillerWordAnalysis.fillerRate) }
                ]}
                textStyle={{ 
                  color: getFillerWordColor(item.fillerWordAnalysis.fillerRate),
                  fontSize: 12,
                }}
              >
                {item.fillerWordAnalysis.fillerRate.toFixed(1)} filler/min
              </Chip>
              
              <Chip
                mode="outlined"
                style={styles.chip}
                textStyle={{ fontSize: 12 }}
              >
                {item.scriptAdherence.adherencePercentage.toFixed(1)}% adherence
              </Chip>
            </View>
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text variant="titleMedium" style={styles.emptyTitle}>
          No Sessions Found
        </Text>
        <Text variant="bodyMedium" style={styles.emptyDescription}>
          Start practicing with your scripts to see analytics data here.
        </Text>
      </View>
    );
  }

  return (
    <VirtualScrollView
      data={sessions}
      itemHeight={120} // Estimated height for each session item
      renderItem={(item: SessionReport, index: number) => renderSessionItem({ item })}
      keyExtractor={(item: SessionReport) => item.id}
      containerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 16,
  },
  sessionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  cardTouchable: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  scriptTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sessionDate: {
    color: '#6b7280',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: '#6b7280',
    marginBottom: 2,
  },
  metricValue: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 28,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#6b7280',
    textAlign: 'center',
  },
});
