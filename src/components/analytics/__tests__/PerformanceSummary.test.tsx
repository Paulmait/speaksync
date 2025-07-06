import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { PerformanceSummary } from '../PerformanceSummary';
import { AnalyticsSummary } from '../../../types';

const mockTheme = {
  colors: {
    primary: '#6200EE',
    surface: '#FFFFFF',
    background: '#F5F5F5',
    onSurface: '#000000',
  },
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <PaperProvider theme={mockTheme}>
      {component}
    </PaperProvider>
  );
};

const mockSummary: AnalyticsSummary = {
  totalSessions: 15,
  totalPracticeTime: 7200000, // 2 hours
  averageSessionDuration: 480000, // 8 minutes
  averageWPM: 152,
  improvementTrend: 12,
  fillerWordTrend: -8,
  mostPracticedScript: {
    id: 'script-1',
    title: 'Product Launch Presentation',
    sessionCount: 5,
  },
  performanceMetrics: {
    consistency: 85,
    accuracy: 92,
    fluency: 88,
  },
  weeklyStats: [
    {
      week: '2024-W01',
      sessionCount: 3,
      totalDuration: 1800000,
      averageWPM: 145,
      fillerWordRate: 2.5,
      adherenceScore: 88,
    },
    {
      week: '2024-W02',
      sessionCount: 4,
      totalDuration: 2400000,
      averageWPM: 155,
      fillerWordRate: 1.8,
      adherenceScore: 92,
    },
  ],
};

describe('PerformanceSummary', () => {
  it('should render summary data correctly', () => {
    const { getByText } = renderWithTheme(
      <PerformanceSummary summary={mockSummary} />
    );

    expect(getByText('15')).toBeTruthy(); // Total sessions
    expect(getByText('152')).toBeTruthy(); // Average WPM
    expect(getByText('Product Launch Presentation')).toBeTruthy(); // Most practiced script
  });

  it('should display improvement trends with correct styling', () => {
    const { getByText } = renderWithTheme(
      <PerformanceSummary summary={mockSummary} />
    );

    // Should show positive trend for WPM improvement
    expect(getByText(/12/)).toBeTruthy();
    
    // Should show negative trend for filler words (which is good)
    expect(getByText(/-8/)).toBeTruthy();
  });

  it('should render performance metrics', () => {
    const { getByText } = renderWithTheme(
      <PerformanceSummary summary={mockSummary} />
    );

    expect(getByText('Consistency')).toBeTruthy();
    expect(getByText('Accuracy')).toBeTruthy();
    expect(getByText('Fluency')).toBeTruthy();
  });

  it('should handle empty summary gracefully', () => {
    const emptySummary: AnalyticsSummary = {
      totalSessions: 0,
      totalPracticeTime: 0,
      averageSessionDuration: 0,
      averageWPM: 0,
      improvementTrend: 0,
      fillerWordTrend: 0,
      mostPracticedScript: {
        id: '',
        title: 'No scripts practiced yet',
        sessionCount: 0,
      },
      performanceMetrics: {
        consistency: 0,
        accuracy: 0,
        fluency: 0,
      },
      weeklyStats: [],
    };

    const { getByText } = renderWithTheme(
      <PerformanceSummary summary={emptySummary} />
    );

    expect(getByText('0')).toBeTruthy();
    expect(getByText('No scripts practiced yet')).toBeTruthy();
  });

  it('should format time duration correctly', () => {
    const summaryWithLongTime: AnalyticsSummary = {
      ...mockSummary,
      totalPracticeTime: 3661000, // 1 hour, 1 minute, 1 second
      averageSessionDuration: 3661000,
    };

    const { getByText } = renderWithTheme(
      <PerformanceSummary summary={summaryWithLongTime} />
    );

    expect(getByText(/1h 1m/)).toBeTruthy();
  });

  it('should handle very large numbers correctly', () => {
    const summaryWithLargeNumbers: AnalyticsSummary = {
      ...mockSummary,
      totalSessions: 1000,
      averageWPM: 999,
      totalPracticeTime: 36000000, // 10 hours
    };

    const { getByText } = renderWithTheme(
      <PerformanceSummary summary={summaryWithLargeNumbers} />
    );

    expect(getByText('1000')).toBeTruthy();
    expect(getByText('999')).toBeTruthy();
  });
});
