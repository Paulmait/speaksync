import { analyticsService } from '../analyticsService';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { SessionReport, AnalyticsFilters } from '../../types';

// Mock Firebase Firestore
jest.mock('firebase/firestore');
jest.mock('../firebase', () => ({
  db: {},
}));

const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockLimit = limit as jest.MockedFunction<typeof limit>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServerTimestamp.mockReturnValue(new Date() as any);
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const mockSessionRef = { id: 'new-session-id' };
      mockAddDoc.mockResolvedValue(mockSessionRef as any);

      const sessionId = await analyticsService.createSession('script-123', 'user-456', 150);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          scriptId: 'script-123',
          userId: 'user-456',
          targetWPM: 150,
          status: 'active',
        })
      );
      expect(sessionId).toBe('new-session-id');
    });

    it('should handle creation error', async () => {
      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(
        analyticsService.createSession('script-123', 'user-456', 150)
      ).rejects.toThrow('Failed to create session');
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const metrics = {
        totalDuration: 120000,
        totalWords: 200,
        wordsSpoken: 195,
        averageWPM: 145,
        paceAnalysis: [],
        fillerWordAnalysis: {
          totalFillerWords: 3,
          fillerRate: 1.5,
          uniqueFillers: { um: 2, uh: 1 },
          fillerInstances: [],
          improvementSuggestions: [],
        },
        scriptAdherence: {
          totalScriptWords: 200,
          wordsSpoken: 195,
          adherencePercentage: 97.5,
          skippedSections: [],
          deviations: [],
          accuracyScore: 97.5,
        },
        wpmHistory: [],
      };

      await analyticsService.endSession('session-123', metrics);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...metrics,
          status: 'completed',
        })
      );
    });

    it('should handle end session error', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

      const metrics = {
        totalDuration: 120000,
        totalWords: 200,
        wordsSpoken: 195,
        averageWPM: 145,
        paceAnalysis: [],
        fillerWordAnalysis: { fillerRate: 0 },
        scriptAdherence: {
          totalScriptWords: 200,
          wordsSpoken: 195,
          adherencePercentage: 97.5,
          skippedSections: [],
          deviations: [],
          accuracyScore: 97.5,
        },
        wpmHistory: [],
      };

      await expect(
        analyticsService.endSession('session-123', metrics)
      ).rejects.toThrow('Failed to end session');
    });
  });

  describe('getSessions', () => {
    it('should get sessions successfully', async () => {
      const mockSessionData = {
        id: 'session-123',
        scriptId: 'script-456',
        scriptTitle: 'Test Script',
        userId: 'user-789',
        startTime: { toDate: () => new Date('2024-01-01') },
        endTime: { toDate: () => new Date('2024-01-01') },
        totalDuration: 60000,
        totalWords: 100,
        wordsSpoken: 95,
        averageWPM: 150,
        targetWPM: 140,
        paceAnalysis: [],
        fillerWordAnalysis: {
          totalFillerWords: 2,
          fillerRate: 2,
          uniqueFillers: { um: 2 },
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
        createdAt: { toDate: () => new Date('2024-01-01') },
        status: 'completed',
      };

      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'session-123',
            data: () => mockSessionData,
          });
        }),
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const sessions = await analyticsService.getSessions('user-789');

      expect(mockGetDocs).toHaveBeenCalled();
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({
        id: 'session-123',
        scriptId: 'script-456',
        userId: 'user-789',
      });
    });

    it('should handle get sessions error', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      await expect(
        analyticsService.getSessions('user-789')
      ).rejects.toThrow('Failed to get sessions');
    });

    it('should apply filters correctly', async () => {
      const filters: AnalyticsFilters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        wpmRange: {
          min: 100,
          max: 200,
        },
        scriptIds: ['script-1', 'script-2'],
      };

      const mockSessionData = {
        id: 'session-123',
        scriptId: 'script-1',
        startTime: { toDate: () => new Date('2024-01-15') },
        endTime: { toDate: () => new Date('2024-01-15') },
        averageWPM: 150,
        status: 'completed',
      };

      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'session-123',
            data: () => mockSessionData,
          });
        }),
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const sessions = await analyticsService.getSessions('user-789', filters);

      expect(sessions).toHaveLength(1);
    });
  });

  describe('getSessionById', () => {
    it('should get session by ID successfully', async () => {
      const mockSessionData = {
        scriptId: 'script-456',
        scriptTitle: 'Test Script',
        userId: 'user-789',
        startTime: { toDate: () => new Date() },
        endTime: { toDate: () => new Date() },
        createdAt: { toDate: () => new Date() },
      };

      const mockDocSnapshot = {
        exists: () => true,
        data: () => mockSessionData,
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const session = await analyticsService.getSessionById('session-123');

      expect(mockGetDoc).toHaveBeenCalled();
      expect(session).toMatchObject({
        id: 'session-123',
        scriptId: 'script-456',
        userId: 'user-789',
      });
    });

    it('should return null for non-existent session', async () => {
      const mockDocSnapshot = {
        exists: () => false,
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const session = await analyticsService.getSessionById('non-existent');

      expect(session).toBeNull();
    });

    it('should handle get session by ID error', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(
        analyticsService.getSessionById('session-123')
      ).rejects.toThrow('Failed to get session');
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      await analyticsService.deleteSession('session-123');

      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should handle delete session error', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(
        analyticsService.deleteSession('session-123')
      ).rejects.toThrow('Failed to delete session');
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should calculate analytics summary correctly', async () => {
      const mockSessions = [
        {
          totalDuration: 60000,
          averageWPM: 150,
          fillerWordAnalysis: { fillerRate: 2 },
          scriptAdherence: { adherencePercentage: 95 },
          createdAt: { toDate: () => new Date('2024-01-01') },
        },
        {
          totalDuration: 120000,
          averageWPM: 160,
          fillerWordAnalysis: { fillerRate: 1 },
          scriptAdherence: { adherencePercentage: 98 },
          createdAt: { toDate: () => new Date('2024-01-02') },
        },
      ];

      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          mockSessions.forEach((session, index) => {
            callback({
              id: `session-${index}`,
              data: () => ({ ...session, status: 'completed' }),
            });
          });
        }),
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const summary = await analyticsService.getAnalyticsSummary('user-789');

      expect(summary.totalSessions).toBe(2);
      expect(summary.totalPracticeTime).toBe(180000); // 60s + 120s
      expect(summary.averageSessionDuration).toBe(90000); // (60s + 120s) / 2
      expect(summary.averageWPM).toBe(155); // (150 + 160) / 2
    });

    it('should handle analytics summary error', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      await expect(
        analyticsService.getAnalyticsSummary('user-789')
      ).rejects.toThrow('Failed to get analytics summary');
    });
  });

  describe('compareSessions', () => {
    it('should compare sessions correctly', async () => {
      const mockSession1 = {
        id: 'session-1',
        averageWPM: 140,
        fillerWordAnalysis: { fillerRate: 3 },
        scriptAdherence: { adherencePercentage: 90 },
        createdAt: { toDate: () => new Date('2024-01-01') },
      };

      const mockSession2 = {
        id: 'session-2',
        averageWPM: 160,
        fillerWordAnalysis: { fillerRate: 1 },
        scriptAdherence: { adherencePercentage: 95 },
        createdAt: { toDate: () => new Date('2024-01-02') },
      };

      const mockDocSnapshot1 = {
        exists: () => true,
        data: () => mockSession1,
      };

      const mockDocSnapshot2 = {
        exists: () => true,
        data: () => mockSession2,
      };

      mockGetDoc
        .mockResolvedValueOnce(mockDocSnapshot1 as any)
        .mockResolvedValueOnce(mockDocSnapshot2 as any);

      const comparison = await analyticsService.compareSessions(['session-1', 'session-2']);

      expect(comparison.sessions).toHaveLength(2);
      expect(comparison.metrics.wpmProgress).toBe(20); // 160 - 140
      expect(comparison.metrics.fillerWordImprovement).toBe(2); // 3 - 1
      expect(comparison.metrics.adherenceImprovement).toBe(5); // 95 - 90
    });

    it('should handle compare sessions error', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(
        analyticsService.compareSessions(['session-1', 'session-2'])
      ).rejects.toThrow('Failed to compare sessions');
    });
  });

  describe('exportSessions', () => {
    it('should export sessions in CSV format', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          scriptTitle: 'Test Script',
          startTime: { toDate: () => new Date('2024-01-01') },
          endTime: { toDate: () => new Date('2024-01-01') },
          totalDuration: 60000,
          averageWPM: 150,
          status: 'completed',
        },
      ];

      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          mockSessions.forEach((session, index) => {
            callback({
              id: session.id,
              data: () => session,
            });
          });
        }),
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await analyticsService.exportSessions('user-789', {
        format: 'csv',
      });

      expect(result).toContain('Session ID,Script Title,Start Time');
      expect(result).toContain('session-1,Test Script');
    });

    it('should export sessions in JSON format', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          scriptTitle: 'Test Script',
          averageWPM: 150,
          status: 'completed',
        },
      ];

      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          mockSessions.forEach((session, index) => {
            callback({
              id: session.id,
              data: () => session,
            });
          });
        }),
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await analyticsService.exportSessions('user-789', {
        format: 'json',
      });

      const exportedData = JSON.parse(result);
      expect(exportedData).toHaveLength(1);
      expect(exportedData[0].id).toBe('session-1');
    });

    it('should handle export error', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      await expect(
        analyticsService.exportSessions('user-789', { format: 'csv' })
      ).rejects.toThrow('Failed to export sessions');
    });
  });

  describe('updateSessionMetrics', () => {
    it('should update session metrics successfully', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const realTimeMetrics = {
        currentWPM: 155,
        currentWordIndex: 50,
        fillerWordCount: 2,
        currentTime: Date.now(),
      };

      await analyticsService.updateSessionMetrics('session-123', realTimeMetrics);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          realTimeMetrics,
        })
      );
    });

    it('should handle update metrics error gracefully', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

      const realTimeMetrics = {
        currentWPM: 155,
      };

      // Should not throw error for real-time updates
      await expect(
        analyticsService.updateSessionMetrics('session-123', realTimeMetrics)
      ).resolves.toBeUndefined();
    });
  });
});
