import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  IconButton,
  Chip,
  Portal,
  Modal,
  Divider,
  ProgressBar,
  useTheme,
} from 'react-native-paper';
import { SessionSummaryReport, PaceAnalysisSegment, FillerWordDetection } from '../types';

interface SessionSummaryProps {
  report: SessionSummaryReport;
  visible: boolean;
  onDismiss: () => void;
  onSaveReport?: (report: SessionSummaryReport) => void;
  onStartNewSession?: () => void;
}

const { width, height } = Dimensions.get('window');

export default function SessionSummary({
  report,
  visible,
  onDismiss,
  onSaveReport,
  onStartNewSession,
}: SessionSummaryProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'pace' | 'fillers'>('overview');

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPaceColor = (status: string) => {
    switch (status) {
      case 'optimal': return '#4CAF50';
      case 'too-fast': return '#FF9800';
      case 'too-slow': return '#F44336';
      default: return theme.colors.primary;
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Session metrics */}
      <Surface style={styles.metricsCard}>
        <Text variant="titleMedium" style={styles.cardTitle}>Session Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text variant="headlineSmall" style={styles.metricValue}>
              {Math.round(report.averageWPM)}
            </Text>
            <Text variant="bodySmall" style={styles.metricLabel}>Average WPM</Text>
          </View>
          <View style={styles.metricItem}>
            <Text variant="headlineSmall" style={styles.metricValue}>
              {report.targetWPM}
            </Text>
            <Text variant="bodySmall" style={styles.metricLabel}>Target WPM</Text>
          </View>
          <View style={styles.metricItem}>
            <Text variant="headlineSmall" style={[
              styles.metricValue,
              { color: report.optimalPercentage >= 70 ? '#4CAF50' : '#FF9800' }
            ]}>
              {Math.round(report.optimalPercentage)}%
            </Text>
            <Text variant="bodySmall" style={styles.metricLabel}>Optimal Pace</Text>
          </View>
        </View>
      </Surface>

      {/* Session info */}
      <Surface style={styles.infoCard}>
        <Text variant="titleMedium" style={styles.cardTitle}>Session Details</Text>
        <View style={styles.infoRow}>
          <Text variant="bodyMedium">Duration:</Text>
          <Text variant="bodyMedium" style={styles.infoValue}>
            {formatDuration(report.endTime - report.startTime)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="bodyMedium">Total Words:</Text>
          <Text variant="bodyMedium" style={styles.infoValue}>
            {report.totalWords}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="bodyMedium">Time:</Text>
          <Text variant="bodyMedium" style={styles.infoValue}>
            {formatTime(report.startTime)} - {formatTime(report.endTime)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="bodyMedium">Filler Words:</Text>
          <Text variant="bodyMedium" style={styles.infoValue}>
            {report.fillerWords.length} detected
          </Text>
        </View>
      </Surface>

      {/* Performance indicator */}
      <Surface style={styles.performanceCard}>
        <Text variant="titleMedium" style={styles.cardTitle}>Overall Performance</Text>
        <View style={styles.performanceIndicator}>
          <ProgressBar
            progress={report.optimalPercentage / 100}
            color={report.optimalPercentage >= 70 ? '#4CAF50' : 
                   report.optimalPercentage >= 50 ? '#FF9800' : '#F44336'}
            style={styles.performanceBar}
          />
          <Text variant="bodyMedium" style={styles.performanceText}>
            {report.optimalPercentage >= 80 ? 'Excellent!' :
             report.optimalPercentage >= 60 ? 'Good!' :
             report.optimalPercentage >= 40 ? 'Needs Improvement' : 'Practice More'}
          </Text>
        </View>
      </Surface>
    </View>
  );

  const renderPaceTab = () => (
    <View style={styles.tabContent}>
      <Surface style={styles.segmentsCard}>
        <Text variant="titleMedium" style={styles.cardTitle}>Pace Analysis</Text>
        <Text variant="bodySmall" style={styles.cardSubtitle}>
          Color-coded segments show where your pace was off-target
        </Text>
        
        <ScrollView style={styles.segmentsList} showsVerticalScrollIndicator={false}>
          {report.segments.map((segment, index) => (
            <View key={index} style={styles.segmentItem}>
              <View style={styles.segmentHeader}>
                <View style={[
                  styles.segmentStatusDot, 
                  { backgroundColor: getPaceColor(segment.status) }
                ]} />
                <Text variant="bodyMedium" style={styles.segmentTitle}>
                  Words {segment.startWordIndex + 1}-{segment.endWordIndex + 1}
                </Text>
                <Chip 
                  mode="outlined" 
                  textStyle={styles.chipText}
                  style={[styles.segmentChip, { borderColor: getPaceColor(segment.status) }]}
                >
                  {Math.round(segment.averageWPM)} WPM
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.segmentDuration}>
                Duration: {formatDuration(segment.duration)}
              </Text>
              <Text variant="bodySmall" style={[
                styles.segmentStatus,
                { color: getPaceColor(segment.status) }
              ]}>
                {segment.status === 'optimal' ? 'Perfect pace' :
                 segment.status === 'too-fast' ? 'Too fast - slow down' :
                 'Too slow - speed up'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Surface>
    </View>
  );

  const renderFillersTab = () => {
    const fillerCounts = report.fillerWords.reduce((acc, filler) => {
      acc[filler.word] = (acc[filler.word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedFillers = Object.entries(fillerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return (
      <View style={styles.tabContent}>
        <Surface style={styles.fillersCard}>
          <Text variant="titleMedium" style={styles.cardTitle}>Filler Words Detected</Text>
          <Text variant="bodySmall" style={styles.cardSubtitle}>
            {report.fillerWords.length} filler words detected during your session
          </Text>
          
          {sortedFillers.length > 0 ? (
            <>
              <View style={styles.fillersList}>
                {sortedFillers.map(([word, count], index) => (
                  <View key={word} style={styles.fillerItem}>
                    <Text variant="bodyLarge" style={styles.fillerWord}>
                      "{word}"
                    </Text>
                    <View style={styles.fillerCount}>
                      <Text variant="bodyMedium" style={styles.fillerCountText}>
                        {count} times
                      </Text>
                      <ProgressBar
                        progress={count / Math.max(...Object.values(fillerCounts))}
                        color={theme.colors.primary}
                        style={styles.fillerBar}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.noFillersContainer}>
              <Text variant="bodyMedium" style={styles.noFillersText}>
                🎉 Great job! No filler words detected.
              </Text>
            </View>
          )}
        </Surface>
      </View>
    );
  };

  const renderRecommendations = () => (
    <Surface style={styles.recommendationsCard}>
      <Text variant="titleMedium" style={styles.cardTitle}>Recommendations</Text>
      {report.recommendations.map((recommendation, index) => (
        <View key={index} style={styles.recommendationItem}>
          <Text variant="bodyMedium">• {recommendation}</Text>
        </View>
      ))}
    </Surface>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Session Summary
          </Text>
          <IconButton
            icon="close"
            onPress={onDismiss}
            style={styles.closeButton}
          />
        </View>

        {/* Tab navigation */}
        <View style={styles.tabNavigation}>
          <Button
            mode={activeTab === 'overview' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('overview')}
            style={styles.tabButton}
            compact
          >
            Overview
          </Button>
          <Button
            mode={activeTab === 'pace' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('pace')}
            style={styles.tabButton}
            compact
          >
            Pace Analysis
          </Button>
          <Button
            mode={activeTab === 'fillers' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('fillers')}
            style={styles.tabButton}
            compact
          >
            Filler Words
          </Button>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'pace' && renderPaceTab()}
          {activeTab === 'fillers' && renderFillersTab()}
          
          {/* Recommendations always shown at bottom */}
          {activeTab === 'overview' && renderRecommendations()}
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.modalActions}>
          {onSaveReport && (
            <Button
              mode="outlined"
              onPress={() => onSaveReport(report)}
              style={styles.actionButton}
            >
              Save Report
            </Button>
          )}
          {onStartNewSession && (
            <Button
              mode="contained"
              onPress={() => {
                onStartNewSession();
                onDismiss();
              }}
              style={styles.actionButton}
            >
              New Session
            </Button>
          )}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    maxHeight: height * 0.9,
    minHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  tabNavigation: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabContent: {
    gap: 16,
  },
  metricsCard: {
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardSubtitle: {
    opacity: 0.7,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontWeight: 'bold',
  },
  metricLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoValue: {
    fontWeight: '500',
  },
  performanceCard: {
    padding: 16,
    borderRadius: 12,
  },
  performanceIndicator: {
    alignItems: 'center',
  },
  performanceBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  performanceText: {
    fontWeight: '500',
  },
  segmentsCard: {
    padding: 16,
    borderRadius: 12,
  },
  segmentsList: {
    maxHeight: 300,
  },
  segmentItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  segmentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  segmentTitle: {
    flex: 1,
    fontWeight: '500',
  },
  segmentChip: {
    height: 24,
  },
  chipText: {
    fontSize: 12,
  },
  segmentDuration: {
    opacity: 0.7,
    marginLeft: 16,
  },
  segmentStatus: {
    fontWeight: '500',
    marginLeft: 16,
  },
  fillersCard: {
    padding: 16,
    borderRadius: 12,
  },
  fillersList: {
    gap: 12,
  },
  fillerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fillerWord: {
    fontWeight: '500',
    minWidth: 80,
  },
  fillerCount: {
    flex: 1,
  },
  fillerCountText: {
    marginBottom: 4,
  },
  fillerBar: {
    height: 4,
    borderRadius: 2,
  },
  noFillersContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFillersText: {
    textAlign: 'center',
    opacity: 0.8,
  },
  recommendationsCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  recommendationItem: {
    paddingVertical: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
  },
});
