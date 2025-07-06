import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  RadioButton,
  Checkbox,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { SessionReport, AnalyticsFilters, AnalyticsExportOptions } from '../../types';
import { analyticsService } from '../../services/analyticsService';
import { useScriptStore } from '../../store/scriptStore';

interface ExportOptionsProps {
  sessions: SessionReport[];
  filters: AnalyticsFilters;
  onClose: () => void;
}

export function ExportOptions({ sessions, filters, onClose }: ExportOptionsProps) {
  const { authState } = useScriptStore();
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf' | 'excel'>('csv');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleSessionToggle = (sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else {
        return [...prev, sessionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map(s => s.id));
    }
  };

  const handleExport = async () => {
    if (!authState.user) return;
    
    if (selectedSessions.length === 0) {
      Alert.alert('No Sessions Selected', 'Please select at least one session to export.');
      return;
    }

    try {
      setIsExporting(true);

      const exportOptions: AnalyticsExportOptions = {
        format: exportFormat,
        sessionIds: selectedSessions,
        ...(filters.dateRange && { dateRange: filters.dateRange }),
        includeCharts,
        includeSummary,
      };

      const exportData = await analyticsService.exportSessions(
        authState.user.uid,
        exportOptions
      );

      // For now, share the data as text
      // In production, you'd save to file system and share file
      await Share.share({
        message: exportData,
        title: `SpeakSync Analytics Export - ${exportFormat.toUpperCase()}`,
      });

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'There was an error exporting your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    { value: 'csv', label: 'CSV (Spreadsheet)', description: 'Compatible with Excel, Google Sheets' },
    { value: 'json', label: 'JSON (Data)', description: 'Raw data format for developers' },
    { value: 'pdf', label: 'PDF (Report)', description: 'Formatted report with charts' },
    { value: 'excel', label: 'Excel (Workbook)', description: 'Native Excel format' },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Export Analytics
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Export your analytics data for external analysis
        </Text>
      </View>

      {/* Format Selection */}
      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Export Format
          </Text>
          
          <RadioButton.Group
            onValueChange={(value) => setExportFormat(value as any)}
            value={exportFormat}
          >
            {formatOptions.map((option) => (
              <View key={option.value} style={styles.radioOption}>
                <RadioButton.Item
                  label={option.label}
                  value={option.value}
                  style={styles.radioItem}
                />
                <Text variant="bodySmall" style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Session Selection */}
      <Card style={styles.section}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select Sessions
            </Text>
            <Button
              mode="text"
              compact
              onPress={handleSelectAll}
            >
              {selectedSessions.length === sessions.length ? 'Deselect All' : 'Select All'}
            </Button>
          </View>

          <Text variant="bodySmall" style={styles.selectionInfo}>
            {selectedSessions.length} of {sessions.length} sessions selected
          </Text>

          <View style={styles.sessionsList}>
            {sessions.slice(0, 10).map((session) => (
              <View key={session.id} style={styles.sessionItem}>
                <Checkbox
                  status={selectedSessions.includes(session.id) ? 'checked' : 'unchecked'}
                  onPress={() => handleSessionToggle(session.id)}
                />
                <View style={styles.sessionInfo}>
                  <Text variant="bodyMedium" style={styles.sessionTitle}>
                    {session.scriptTitle}
                  </Text>
                  <Text variant="bodySmall" style={styles.sessionDate}>
                    {session.startTime.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
            
            {sessions.length > 10 && (
              <Text variant="bodySmall" style={styles.moreInfo}>
                + {sessions.length - 10} more sessions
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Export Options */}
      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Include Options
          </Text>

          <View style={styles.checkboxOption}>
            <Checkbox
              status={includeSummary ? 'checked' : 'unchecked'}
              onPress={() => setIncludeSummary(!includeSummary)}
            />
            <View style={styles.checkboxText}>
              <Text variant="bodyMedium">Summary Statistics</Text>
              <Text variant="bodySmall" style={styles.optionDescription}>
                Overall performance metrics and trends
              </Text>
            </View>
          </View>

          <View style={styles.checkboxOption}>
            <Checkbox
              status={includeCharts ? 'checked' : 'unchecked'}
              onPress={() => setIncludeCharts(!includeCharts)}
            />
            <View style={styles.checkboxText}>
              <Text variant="bodyMedium">Charts and Graphs</Text>
              <Text variant="bodySmall" style={styles.optionDescription}>
                Visual charts (PDF format only)
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={onClose}
          style={styles.actionButton}
          disabled={isExporting}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleExport}
          style={styles.actionButton}
          disabled={isExporting || selectedSessions.length === 0}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            'Export'
          )}
        </Button>
      </View>
    </View>
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
    textAlign: 'center',
  },
  section: {
    margin: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  radioOption: {
    marginBottom: 8,
  },
  radioItem: {
    paddingVertical: 0,
  },
  optionDescription: {
    color: '#6b7280',
    marginLeft: 40,
    marginTop: -8,
    marginBottom: 8,
  },
  selectionInfo: {
    color: '#6b7280',
    marginBottom: 12,
  },
  sessionsList: {
    maxHeight: 200,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sessionInfo: {
    marginLeft: 8,
    flex: 1,
  },
  sessionTitle: {
    fontWeight: '500',
    color: '#1f2937',
  },
  sessionDate: {
    color: '#6b7280',
  },
  moreInfo: {
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxText: {
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 100,
  },
});
