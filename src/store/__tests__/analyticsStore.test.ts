import { renderHook, act } from '@testing-library/react-native';
import { useAnalyticsStore } from '../analyticsStore';
import { analyticsService } from '../../services/analyticsService';
import { SessionReport } from '../../types';

// Mock the analytics service
jest.mock('../../services/analyticsService', () => ({
  analyticsService: {
    createSession: jest.fn(),
    endSession: jest.fn(),
    updateSessionMetrics: jest.fn(),
    getSessions: jest.fn(),
    getAnalyticsSummary: jest.fn(),
    compareSessions: jest.fn(),
    exportSessions: jest.fn(),
    deleteSession: jest.fn(),
  },
}));

// Mock AsyncStorage for persistence
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockSession: SessionReport = {
  id: 'test-session-id',
  scriptId: 'test-script-id',
  scriptTitle: 'Test Script',
  userId: 'test-user-id',
  startTime: new Date(),
  endTime: new Date(),
  totalDuration: 60000,
  totalWords: 100,
  wordsSpoken: 95,
  averageWPM: 150,
  targetWPM: 140,
  paceAnalysis: [],
  fillerWordAnalysis: {
    totalFillerWords: 3,
    fillerRate: 3,
    uniqueFillers: { um: 2, uh: 1 },
    fillerInstances: [],
    improvementSuggestions: [],
  },
  scriptAdherence: {
    totalScriptWords: 100,
    wordsSpoken: 95,
    adherencePercentage: 95,
    skippedSections: [],
    deviations: [],
    accuracyScore: 95,
  },
  wpmHistory: [],
  pauseAnalysis: [],
  createdAt: new Date(),
};

describe('AnalyticsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAnalyticsStore.getState().sessionReports = [];
    useAnalyticsStore.getState().currentSession = null;
    useAnalyticsStore.getState().error = null;
    useAnalyticsStore.getState().isLoading = false;
  });

  describe('Session Management', () => {
    it('should start a new session successfully', async () => {
      const mockSessionId = 'test-session-123';
      (analyticsService.createSession as jest.Mock).mockResolvedValue(mockSessionId);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        const sessionId = await result.current.startSession('script-123', 150);
        expect(sessionId).toBe(mockSessionId);
      });

      expect(analyticsService.createSession).toHaveBeenCalledWith('script-123', 'current-user', 150);
      expect(result.current.currentSession).toBeTruthy();
      expect(result.current.currentSession?.id).toBe(mockSessionId);
      expect(result.current.sessionReports).toHaveLength(1);
    });

    it('should handle session creation error', async () => {
      const mockError = new Error('Failed to create session');
      (analyticsService.createSession as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        try {
          await result.current.startSession('script-123', 150);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.error).toBe('Failed to create session');
      expect(result.current.isLoading).toBe(false);
    });

    it('should end a session successfully', async () => {
      (analyticsService.endSession as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAnalyticsStore());

      // First start a session
      await act(async () => {
        await result.current.startSession('script-123', 150);
      });

      const reportData = {
        totalDuration: 120000,
        totalWords: 200,
        wordsSpoken: 195,
        averageWPM: 145,
      };

      await act(async () => {
        await result.current.endSession('test-session-123', reportData);
      });

      expect(analyticsService.endSession).toHaveBeenCalledWith(
        'test-session-123',
        expect.objectContaining({
          totalDuration: 120000,
          totalWords: 200,
          wordsSpoken: 195,
          averageWPM: 145,
        })
      );

      expect(result.current.currentSession).toBe(null);
    });

    it('should update session successfully', async () => {
      (analyticsService.updateSessionMetrics as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAnalyticsStore());

      // Add a session to the store
      await act(async () => {
        await result.current.startSession('script-123', 150);
      });

      const updates = {
        averageWPM: 160,
        totalWords: 250,
      };

      await act(async () => {
        await result.current.updateSession('test-session-123', updates);
      });

      expect(analyticsService.updateSessionMetrics).toHaveBeenCalled();
      expect(result.current.sessionReports[0]).toMatchObject(updates);
    });

    it('should delete session successfully', async () => {
      (analyticsService.deleteSession as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAnalyticsStore());

      // Add a session to the store
      await act(async () => {
        await result.current.startSession('script-123', 150);
      });

      await act(async () => {
        await result.current.deleteSession('test-session-123');
      });

      expect(analyticsService.deleteSession).toHaveBeenCalledWith('test-session-123');
      expect(result.current.sessionReports).toHaveLength(0);
      expect(result.current.currentSession).toBe(null);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch sessions successfully', async () => {
      const mockSessions = [mockSession];
      (analyticsService.getSessions as jest.Mock).mockResolvedValue(mockSessions);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchSessions();
      });

      expect(analyticsService.getSessions).toHaveBeenCalledWith('current-user', expect.any(Object));
      expect(result.current.sessionReports).toEqual(mockSessions);
      expect(result.current.isLoading).toBe(false);
    });

    it('should respect cache when fetching sessions', async () => {
      const mockSessions = [mockSession];
      (analyticsService.getSessions as jest.Mock).mockResolvedValue(mockSessions);

      const { result } = renderHook(() => useAnalyticsStore());

      // First fetch
      await act(async () => {
        await result.current.fetchSessions();
      });

      // Second fetch within cache window
      await act(async () => {
        await result.current.fetchSessions();
      });

      // Should only call the service once due to caching
      expect(analyticsService.getSessions).toHaveBeenCalledTimes(1);
    });

    it('should fetch analytics summary successfully', async () => {
      const mockSummary = {
        totalSessions: 10,
        totalPracticeTime: 3600000,
        averageSessionDuration: 360000,
        averageWPM: 150,
        improvementTrend: 15,
        fillerWordTrend: -10,
        mostPracticedScript: {
          id: 'script-1',
          title: 'Test Script',
          sessionCount: 5,
        },
        performanceMetrics: {
          consistency: 85,
          accuracy: 92,
          fluency: 88,
        },
        weeklyStats: [],
      };

      (analyticsService.getAnalyticsSummary as jest.Mock).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchAnalyticsSummary();
      });

      expect(analyticsService.getAnalyticsSummary).toHaveBeenCalledWith('current-user', expect.any(Object));
      expect(result.current.analyticsSummary).toEqual(mockSummary);
    });

    it('should fetch comparison data successfully', async () => {
      const mockComparison = {
        sessions: [mockSession],
        metrics: {
          wpmProgress: 10,
          fillerWordImprovement: 20,
          adherenceImprovement: 5,
          consistencyScore: 85,
        },
        trends: {
          wpm: [],
          fillerWords: [],
          adherence: [],
        },
        insights: ['Great improvement in speaking pace'],
        recommendations: ['Focus on reducing filler words'],
      };

      (analyticsService.compareSessions as jest.Mock).mockResolvedValue(mockComparison);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.fetchComparisonData(['session-1', 'session-2']);
      });

      expect(analyticsService.compareSessions).toHaveBeenCalledWith(['session-1', 'session-2']);
      expect(result.current.comparisonData).toEqual(mockComparison);
    });
  });

  describe('Filter Management', () => {
    it('should update filters correctly', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      const newFilters = {
        wpmRange: { min: 100, max: 200 },
        scriptIds: ['script-1', 'script-2'],
      };

      act(() => {
        result.current.updateFilters(newFilters);
      });

      expect(result.current.filters).toMatchObject(newFilters);
      expect(result.current.lastFetchTime).toBe(null); // Cache should be invalidated
    });

    it('should clear filters correctly', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      // Set some filters first
      act(() => {
        result.current.updateFilters({ scriptIds: ['script-1'] });
      });

      // Clear filters
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.scriptIds).toEqual([]);
      expect(result.current.lastFetchTime).toBe(null);
    });
  });

  describe('Export Functionality', () => {
    it('should export sessions successfully', async () => {
      (analyticsService.exportSessions as jest.Mock).mockResolvedValue('export-url');

      const { result } = renderHook(() => useAnalyticsStore());

      const exportOptions = {
        format: 'csv' as const,
        includeCharts: true,
        sessionIds: ['session-1'],
      };

      await act(async () => {
        await result.current.exportSessions(exportOptions);
      });

      expect(analyticsService.exportSessions).toHaveBeenCalledWith('current-user', exportOptions);
      expect(result.current.exportInProgress).toBe(false);
      expect(result.current.exportError).toBe(null);
    });

    it('should handle export error', async () => {
      const mockError = new Error('Export failed');
      (analyticsService.exportSessions as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAnalyticsStore());

      const exportOptions = {
        format: 'csv' as const,
        sessionIds: ['session-1'],
      };

      await act(async () => {
        try {
          await result.current.exportSessions(exportOptions);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.exportError).toBe('Export failed');
      expect(result.current.exportInProgress).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should clear errors correctly', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      // Set an error
      act(() => {
        useAnalyticsStore.setState({ error: 'Test error', exportError: 'Export error' });
      });

      // Clear errors
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.exportError).toBe(null);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache correctly', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      // Set some cached data
      act(() => {
        useAnalyticsStore.setState({
          lastFetchTime: Date.now(),
          analyticsSummary: {} as any,
          comparisonData: {} as any,
        });
      });

      // Clear cache
      act(() => {
        result.current.clearCache();
      });

      expect(result.current.lastFetchTime).toBe(null);
      expect(result.current.analyticsSummary).toBe(null);
      expect(result.current.comparisonData).toBe(null);
    });

    it('should refresh data correctly', async () => {
      const mockSessions = [mockSession];
      const mockSummary = {
        totalSessions: 1,
        totalPracticeTime: 60000,
        averageSessionDuration: 60000,
        averageWPM: 150,
        improvementTrend: 0,
        fillerWordTrend: 0,
        mostPracticedScript: { id: 'test', title: 'Test', sessionCount: 1 },
        performanceMetrics: { consistency: 100, accuracy: 100, fluency: 100 },
        weeklyStats: [],
      };

      (analyticsService.getSessions as jest.Mock).mockResolvedValue(mockSessions);
      (analyticsService.getAnalyticsSummary as jest.Mock).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useAnalyticsStore());

      await act(async () => {
        await result.current.refreshData();
      });

      expect(analyticsService.getSessions).toHaveBeenCalled();
      expect(analyticsService.getAnalyticsSummary).toHaveBeenCalled();
      expect(result.current.sessionReports).toEqual(mockSessions);
      expect(result.current.analyticsSummary).toEqual(mockSummary);
    });
  });
});
