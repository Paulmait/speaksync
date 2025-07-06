import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Card,
} from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import { AnalyticsFilters } from '../../types';

interface AnalyticsFiltersProps {
  currentFilters: AnalyticsFilters;
  onApplyFilters: (filters: AnalyticsFilters) => void;
  onClose: () => void;
}

export function AnalyticsFilters({
  currentFilters,
  onApplyFilters,
  onClose,
}: AnalyticsFiltersProps) {
  const [filters, setFilters] = useState<AnalyticsFilters>(currentFilters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const handleWPMMinChange = (text: string) => {
    const min = parseInt(text) || null;
    setFilters(prev => {
      const newFilters = { ...prev };
      if (min !== null) {
        newFilters.wpmRange = { ...prev.wpmRange, min };
      } else if (prev.wpmRange?.max) {
        newFilters.wpmRange = { max: prev.wpmRange.max };
      } else {
        delete newFilters.wpmRange;
      }
      return newFilters;
    });
  };

  const handleWPMMaxChange = (text: string) => {
    const max = parseInt(text) || null;
    setFilters(prev => {
      const newFilters = { ...prev };
      if (max !== null) {
        newFilters.wpmRange = { ...prev.wpmRange, max };
      } else if (prev.wpmRange?.min) {
        newFilters.wpmRange = { min: prev.wpmRange.min };
      } else {
        delete newFilters.wpmRange;
      }
      return newFilters;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Filter Analytics
        </Text>
      </View>

      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Date Range
          </Text>
          
          <View style={styles.dateSection}>
            <View style={styles.dateInput}>
              <Text variant="labelMedium">Start Date</Text>
              <Button
                mode="outlined"
                onPress={() => setShowStartDatePicker(true)}
                style={styles.dateButton}
              >
                {filters.dateRange?.start ? formatDate(filters.dateRange.start) : 'Select Start Date'}
              </Button>
            </View>

            <View style={styles.dateInput}>
              <Text variant="labelMedium">End Date</Text>
              <Button
                mode="outlined"
                onPress={() => setShowEndDatePicker(true)}
                style={styles.dateButton}
              >
                {filters.dateRange?.end ? formatDate(filters.dateRange.end) : 'Select End Date'}
              </Button>
            </View>
          </View>

          {filters.dateRange && (
            <Button
              mode="text"
              onPress={() => {
                const { dateRange, ...rest } = filters;
                setFilters(rest);
              }}
              style={styles.clearButton}
            >
              Clear Date Range
            </Button>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Performance Range
          </Text>
          
          <View style={styles.rangeSection}>
            <View style={styles.rangeInput}>
              <TextInput
                label="Min WPM"
                value={filters.wpmRange?.min?.toString() || ''}
                onChangeText={handleWPMMinChange}
                keyboardType="numeric"
                mode="outlined"
                style={styles.textInput}
              />
            </View>

            <View style={styles.rangeInput}>
              <TextInput
                label="Max WPM"
                value={filters.wpmRange?.max?.toString() || ''}
                onChangeText={handleWPMMaxChange}
                keyboardType="numeric"
                mode="outlined"
                style={styles.textInput}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Session Duration
          </Text>
          
          <View style={styles.rangeSection}>
            <View style={styles.rangeInput}>
              <TextInput
                label="Min Duration (minutes)"
                value={filters.minDuration ? (filters.minDuration / 60000).toString() : ''}
                onChangeText={(text) => {
                  const minutes = parseInt(text) || null;
                  setFilters(prev => {
                    const newFilters = { ...prev };
                    if (minutes !== null) {
                      newFilters.minDuration = minutes * 60000;
                    } else {
                      delete newFilters.minDuration;
                    }
                    return newFilters;
                  });
                }}
                keyboardType="numeric"
                mode="outlined"
                style={styles.textInput}
              />
            </View>

            <View style={styles.rangeInput}>
              <TextInput
                label="Max Duration (minutes)"
                value={filters.maxDuration ? (filters.maxDuration / 60000).toString() : ''}
                onChangeText={(text) => {
                  const minutes = parseInt(text) || null;
                  setFilters(prev => {
                    const newFilters = { ...prev };
                    if (minutes !== null) {
                      newFilters.maxDuration = minutes * 60000;
                    } else {
                      delete newFilters.maxDuration;
                    }
                    return newFilters;
                  });
                }}
                keyboardType="numeric"
                mode="outlined"
                style={styles.textInput}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Apply/Cancel buttons */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleClear}
          style={styles.actionButton}
        >
          Clear All
        </Button>
        <Button
          mode="outlined"
          onPress={onClose}
          style={styles.actionButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleApply}
          style={styles.actionButton}
        >
          Apply Filters
        </Button>
      </View>

      {/* Date Picker Modals */}
      <DatePicker
        modal
        open={showStartDatePicker}
        date={filters.dateRange?.start || new Date()}
        mode="date"
        onConfirm={(date) => {
          setFilters(prev => ({
            ...prev,
            dateRange: {
              start: date,
              end: prev.dateRange?.end || new Date(),
            },
          }));
          setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />

      <DatePicker
        modal
        open={showEndDatePicker}
        date={filters.dateRange?.end || new Date()}
        mode="date"
        onConfirm={(date) => {
          setFilters(prev => ({
            ...prev,
            dateRange: {
              start: prev.dateRange?.start || new Date(),
              end: date,
            },
          }));
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  dateSection: {
    gap: 12,
  },
  dateInput: {
    gap: 8,
  },
  dateButton: {
    justifyContent: 'flex-start',
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  rangeSection: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 80,
  },
});
