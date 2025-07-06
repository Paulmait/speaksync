import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PerformanceOptimizer } from '../services/performanceOptimizer';
import { 
  SessionReport, 
  AnalyticsFilters, 
  AnalyticsSummary, 
  ComparisonAnalytics,
  AnalyticsExportOptions,
  FillerWordInstance,
  ScriptAdherenceMetrics,
  PaceAnalysisSegment,
  WPMDataPoint
} from '../types';
import { analyticsService } from '../services/analyticsService';

export interface AnalyticsState {
  // Session reports
  sessionReports: SessionReport[];
  currentSession: SessionReport | null;
  
  // Analytics data
  analyticsSummary: AnalyticsSummary | null;
  comparisonData: ComparisonAnalytics | null;
  
  // UI state
  filters: AnalyticsFilters;
  isLoading: boolean;
  error: string | null;
  
  // Cache management
  lastFetchTime: number | null;
  cacheExpiry: number; // 5 minutes
  
  // Export state
  exportInProgress: boolean;
  exportError: string | null;
}

export interface AnalyticsActions {
  // Session management
  startSession: (scriptId: string, targetWPM?: number) => Promise<string>;
  endSession: (sessionId: string, reportData: Partial<SessionReport>) => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<SessionReport>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Data fetching
  fetchSessions: (filters?: AnalyticsFilters) => Promise<void>;
  fetchAnalyticsSummary: (filters?: AnalyticsFilters) => Promise<void>;
  fetchComparisonData: (sessionIds: string[]) => Promise<void>;
  
  // Real-time updates
  subscribeToSessions: (userId: string, callback?: (reports: SessionReport[]) => void) => () => void;
  
  // Filtering and search
  updateFilters: (filters: Partial<AnalyticsFilters>) => void;
  clearFilters: () => void;
  
  // Export functionality
  exportSessions: (options: AnalyticsExportOptions) => Promise<void>;
  
  // Cache management
  clearCache: () => void;
  refreshData: () => Promise<void>;
  
  // Error handling
  clearError: () => void;
}

export type AnalyticsStore = AnalyticsState & AnalyticsActions;

const getDefaultFilters = (): AnalyticsFilters => ({
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date(),
  },
  wpmRange: {
    min: 0,
    max: 300,
  },
  scriptIds: [],
  tags: [],
  minDuration: 0,
  maxDuration: undefined,
});

// Performance optimizer instance
const performanceOptimizer = PerformanceOptimizer.getInstance();

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sessionReports: [],
      currentSession: null,
      analyticsSummary: null,
      comparisonData: null,
      filters: getDefaultFilters(),
      isLoading: false,
      error: null,
      lastFetchTime: null,
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
      exportInProgress: false,
      exportError: null,

      // Session management
      startSession: async (scriptId: string, targetWPM: number = 150) => {
        set({ isLoading: true, error: null });
        try {
          const sessionId = await analyticsService.createSession(scriptId, 'current-user', targetWPM);
          
          const newSession: SessionReport = {
            id: sessionId,
            scriptId,
            scriptTitle: '', // Will be populated when script data is available
            userId: 'current-user',
            startTime: new Date(),
            endTime: new Date(), // Will be updated when session ends
            totalDuration: 0,
            targetWPM,
            totalWords: 0,
            wordsSpoken: 0,
            averageWPM: 0,
            paceAnalysis: [],
            fillerWordAnalysis: {
              totalFillerWords: 0,
              fillerRate: 0,
              uniqueFillers: {},
              fillerInstances: [],
              improvementSuggestions: [],
            },
            scriptAdherence: {
              totalScriptWords: 0,
              wordsSpoken: 0,
              adherencePercentage: 0,
              skippedSections: [],
              deviations: [],
              accuracyScore: 0,
            },
            wpmHistory: [],
            pauseAnalysis: [],
            createdAt: new Date(),
          };
          
          set((state) => ({
            currentSession: newSession,
            sessionReports: [newSession, ...state.sessionReports],
            isLoading: false,
          }));
          
          return sessionId;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to start session',
            isLoading: false 
          });
          throw error;
        }
      },

      endSession: async (sessionId: string, reportData: Partial<SessionReport>) => {
        set({ isLoading: true, error: null });
        try {
          // Transform reportData to match the endSession interface
          const metrics = {
            totalDuration: reportData.totalDuration || 0,
            totalWords: reportData.totalWords || 0,
            wordsSpoken: reportData.wordsSpoken || 0,
            averageWPM: reportData.averageWPM || 0,
            paceAnalysis: reportData.paceAnalysis || [],
            fillerWordAnalysis: reportData.fillerWordAnalysis || {
              totalFillerWords: 0,
              fillerRate: 0,
              uniqueFillers: {},
              fillerInstances: [],
              improvementSuggestions: [],
            },
            scriptAdherence: reportData.scriptAdherence || {
              totalScriptWords: 0,
              wordsSpoken: 0,
              adherencePercentage: 0,
              skippedSections: [],
              deviations: [],
              accuracyScore: 0,
            },
            wpmHistory: reportData.wpmHistory || [],
            pauseAnalysis: reportData.pauseAnalysis || [],
          };
          
          await analyticsService.endSession(sessionId, metrics);
          
          set((state) => ({
            sessionReports: state.sessionReports.map(session =>
              session.id === sessionId 
                ? { ...session, ...reportData, endTime: new Date() }
                : session
            ),
            currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
            isLoading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to end session',
            isLoading: false 
          });
          throw error;
        }
      },

      updateSession: async (sessionId: string, updates: Partial<SessionReport>) => {
        try {
          // For now, use updateSessionMetrics with real-time data
          // This is a temporary solution until updateSession is implemented
          await analyticsService.updateSessionMetrics(sessionId, {
            currentWPM: updates.averageWPM,
            currentTime: Date.now(),
          });
          
          set((state) => ({
            sessionReports: state.sessionReports.map(session =>
              session.id === sessionId 
                ? { ...session, ...updates }
                : session
            ),
            currentSession: state.currentSession?.id === sessionId 
              ? { ...state.currentSession, ...updates }
              : state.currentSession,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update session'
          });
          throw error;
        }
      },

      deleteSession: async (sessionId: string) => {
        set({ isLoading: true, error: null });
        try {
          await analyticsService.deleteSession(sessionId);
          
          set((state) => ({
            sessionReports: state.sessionReports.filter(session => session.id !== sessionId),
            currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
            isLoading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete session',
            isLoading: false 
          });
          throw error;
        }
      },

      fetchSessions: performanceOptimizer.debounce(async (filters?: AnalyticsFilters) => {
        const currentFilters = filters || get().filters;
        const { lastFetchTime, cacheExpiry } = get();
        
        // Check cache validity
        if (lastFetchTime && Date.now() - lastFetchTime < cacheExpiry) {
          return;
        }
        
        set({ isLoading: true, error: null });
        try {
          const sessions = await analyticsService.getSessions('current-user', currentFilters);
          
          set({
            sessionReports: sessions,
            lastFetchTime: Date.now(),
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch sessions',
            isLoading: false 
          });
          throw error;
        }
      }, 300),

      fetchAnalyticsSummary: async (filters?: AnalyticsFilters) => {
        const currentFilters = filters || get().filters;
        set({ isLoading: true, error: null });
        
        try {
          const summary = await analyticsService.getAnalyticsSummary('current-user', currentFilters);
          
          set({
            analyticsSummary: summary,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch analytics summary',
            isLoading: false 
          });
          throw error;
        }
      },

      fetchComparisonData: async (sessionIds: string[]) => {
        set({ isLoading: true, error: null });
        
        try {
          const comparison = await analyticsService.compareSessions(sessionIds);
          
          set({
            comparisonData: comparison,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch comparison data',
            isLoading: false 
          });
          throw error;
        }
      },

      subscribeToSessions: (userId: string, callback?: (reports: SessionReport[]) => void) => {
        // For now, return a stub unsubscribe function
        // This would need to be implemented in the analytics service
        console.warn('subscribeToSessions not fully implemented yet');
        
        // Return a dummy unsubscribe function
        return () => {
          console.log('Unsubscribed from session updates');
        };
      },

      updateFilters: (filters: Partial<AnalyticsFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
          lastFetchTime: null, // Invalidate cache
        }));
      },

      clearFilters: () => {
        set({
          filters: getDefaultFilters(),
          lastFetchTime: null,
        });
      },

      exportSessions: async (options: AnalyticsExportOptions) => {
        set({ exportInProgress: true, exportError: null });
        
        try {
          await analyticsService.exportSessions('current-user', options);
          set({ exportInProgress: false });
        } catch (error) {
          set({ 
            exportError: error instanceof Error ? error.message : 'Failed to export sessions',
            exportInProgress: false 
          });
          throw error;
        }
      },

      clearCache: () => {
        set({
          lastFetchTime: null,
          analyticsSummary: null,
          comparisonData: null,
        });
      },

      refreshData: async () => {
        const { filters } = get();
        set({ lastFetchTime: null });
        
        await Promise.all([
          get().fetchSessions(filters),
          get().fetchAnalyticsSummary(filters),
        ]);
      },

      clearError: () => {
        set({ error: null, exportError: null });
      },
    }),
    {
      name: 'analytics-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessionReports: state.sessionReports,
        filters: state.filters,
        lastFetchTime: state.lastFetchTime,
      }),
    }
  )
);
