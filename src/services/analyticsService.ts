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
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  SessionReport,
  AnalyticsFilters,
  AnalyticsSummary,
  ComparisonAnalytics,
  AnalyticsExportOptions,
  ScriptAdherenceMetrics,
  PaceAnalysisSegment,
  WPMDataPoint,
} from '../types';

class AnalyticsService {
  // Session Management
  async createSession(
    scriptId: string,
    userId: string,
    targetWPM: number = 150
  ): Promise<string> {
    try {
      const sessionData = {
        scriptId,
        userId,
        startTime: serverTimestamp(),
        targetWPM,
        status: 'active',
        createdAt: serverTimestamp(),
      };

      const sessionRef = await addDoc(collection(db, 'sessions'), sessionData);
      return sessionRef.id;
    } catch {
      throw new Error('Failed to create session');
    }
  }

  async endSession(
    sessionId: string,
    metrics: {
      totalDuration: number;
      totalWords: number;
      wordsSpoken: number;
      averageWPM: number;
      paceAnalysis: PaceAnalysisSegment[];
      fillerWordAnalysis: { fillerRate: number };
      scriptAdherence: ScriptAdherenceMetrics;
      wpmHistory: WPMDataPoint[];
      pauseAnalysis?: { duration: number }[];
    }
  ): Promise<void> {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      
      await updateDoc(sessionRef, {
        ...metrics,
        endTime: serverTimestamp(),
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
    } catch {
      throw new Error('Failed to end session');
    }
  }

  async updateSessionMetrics(
    sessionId: string,
    realTimeMetrics: {
      currentWPM?: number;
      currentWordIndex?: number;
      fillerWordCount?: number;
      currentTime?: number;
    }
  ): Promise<void> {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      
      await updateDoc(sessionRef, {
        realTimeMetrics,
        lastUpdated: serverTimestamp(),
      });
    } catch {
      // Don't throw error for real-time updates
    }
  }

  async getSessions(
    userId: string,
    filters?: AnalyticsFilters,
    limitCount: number = 50
  ): Promise<SessionReport[]> {
    try {
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const sessions: SessionReport[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const session: SessionReport = {
          id: doc.id,
          ...data,
          startTime: data['startTime']?.toDate() || new Date(),
          endTime: data['endTime']?.toDate() || new Date(),
          createdAt: data['createdAt']?.toDate() || new Date(),
        } as SessionReport;

        // Apply client-side filters if provided
        if (this.sessionMatchesFilters(session, filters)) {
          sessions.push(session);
        }
      });

      return sessions;
    } catch {
      throw new Error('Failed to get sessions');
    }
  }

  async getSessionById(sessionId: string): Promise<SessionReport | null> {
    try {
      const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
      
      if (!sessionDoc.exists()) {
        return null;
      }

      const data = sessionDoc.data();
      return {
        id: sessionDoc.id,
        ...data,
        startTime: data['startTime']?.toDate() || new Date(),
        endTime: data['endTime']?.toDate() || new Date(),
        createdAt: data['createdAt']?.toDate() || new Date(),
      } as SessionReport;
    } catch {
      throw new Error('Failed to get session');
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
    } catch {
      throw new Error('Failed to delete session');
    }
  }

  // Analytics Calculations
  async getAnalyticsSummary(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<AnalyticsSummary> {
    try {
      const sessions = await this.getSessions(userId, filters, 1000);
      
      if (sessions.length === 0) {
        return this.getEmptyAnalyticsSummary();
      }

      const totalPracticeTime = sessions.reduce((sum, session) => sum + session.totalDuration, 0);
      const totalSessions = sessions.length;
      const averageSessionDuration = totalPracticeTime / totalSessions;
      const averageWPM = sessions.reduce((sum, session) => sum + session.averageWPM, 0) / totalSessions;

      // Calculate improvement trends
      const recentSessions = sessions.slice(0, Math.min(10, sessions.length));
      const olderSessions = sessions.slice(-Math.min(10, sessions.length));
      
      const recentAvgWPM = recentSessions.reduce((sum, s) => sum + s.averageWPM, 0) / recentSessions.length;
      const olderAvgWPM = olderSessions.reduce((sum, s) => sum + s.averageWPM, 0) / olderSessions.length;
      const improvementTrend = ((recentAvgWPM - olderAvgWPM) / olderAvgWPM) * 100;

      // Calculate filler word trend
      const recentFillerRate = recentSessions.reduce((sum, s) => sum + s.fillerWordAnalysis.fillerRate, 0) / recentSessions.length;
      const olderFillerRate = olderSessions.reduce((sum, s) => sum + s.fillerWordAnalysis.fillerRate, 0) / olderSessions.length;
      const fillerWordTrend = ((olderFillerRate - recentFillerRate) / olderFillerRate) * 100; // Improvement is reduction

      // Find most practiced script
      const scriptCounts: { [scriptId: string]: { count: number; title?: string } } = {};
      sessions.forEach(session => {
        if (!scriptCounts[session.scriptId]) {
          scriptCounts[session.scriptId] = { count: 0, title: session.title || 'Untitled' };
        }
        scriptCounts[session.scriptId].count += 1; // Object is guaranteed to be defined here
      });

      const mostPracticedEntry = Object.entries(scriptCounts)
        .sort(([, a], [, b]) => b.count - a.count)[0];

      const mostPracticedScript = mostPracticedEntry
        ? {
            id: mostPracticedEntry[0],
            title: mostPracticedEntry[1].title || 'Untitled', // Ensure title is always a string
            sessionCount: mostPracticedEntry[1].count,
          }
        : { id: '', title: 'No scripts', sessionCount: 0 };

      // Calculate performance metrics
      const consistency = this.calculateConsistency(sessions);
      const accuracy = sessions.reduce((sum, s) => sum + s.scriptAdherence.accuracyScore, 0) / sessions.length;
      const fluency = this.calculateFluency(sessions);

      // Generate weekly stats
      const weeklyStats = this.generateWeeklyStats(sessions);

      return {
        totalSessions,
        totalPracticeTime,
        averageSessionDuration,
        averageWPM,
        improvementTrend,
        fillerWordTrend,
        mostPracticedScript,
        performanceMetrics: {
          consistency,
          accuracy,
          fluency,
        },
        weeklyStats,
      };
    } catch {
      throw new Error('Failed to get analytics summary');
    }
  }

  async compareSessions(sessionIds: string[]): Promise<ComparisonAnalytics> {
    try {
      const sessions = await Promise.all(
        sessionIds.map(id => this.getSessionById(id))
      );

      const validSessions = sessions.filter(session => session !== null) as SessionReport[];

      if (validSessions.length < 2) {
        throw new Error('Need at least 2 sessions for comparison');
      }

      // Sort by date
      validSessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      const firstSession = validSessions[0];
      const lastSession = validSessions[validSessions.length - 1];

      // Ensure sessions are defined
      if (!firstSession || !lastSession) {
        throw new Error('Sessions are undefined');
      }

      // Calculate progress metrics
      const wpmProgress = ((lastSession.averageWPM - firstSession.averageWPM) / firstSession.averageWPM) * 100;
      const fillerWordImprovement = ((firstSession.fillerWordAnalysis.fillerRate - lastSession.fillerWordAnalysis.fillerRate) / firstSession.fillerWordAnalysis.fillerRate) * 100;
      const adherenceImprovement = ((lastSession.scriptAdherence.adherencePercentage - firstSession.scriptAdherence.adherencePercentage) / firstSession.scriptAdherence.adherencePercentage) * 100;
      const consistencyScore = this.calculateConsistency(validSessions);

      // Generate trend data
      const wpmTrend = validSessions.map(session => ({
        date: session.startTime,
        value: session.averageWPM,
        sessionId: session.id,
      }));

      const fillerWordsTrend = validSessions.map(session => ({
        date: session.startTime,
        value: session.fillerWordAnalysis.fillerRate,
        sessionId: session.id,
      }));

      const adherenceTrend = validSessions.map(session => ({
        date: session.startTime,
        value: session.scriptAdherence.adherencePercentage,
        sessionId: session.id,
      }));

      // Generate insights and recommendations
      const insights = this.generateInsights(validSessions);
      const recommendations = this.generateRecommendations(validSessions);

      return {
        sessions: validSessions,
        metrics: {
          wpmProgress,
          fillerWordImprovement,
          adherenceImprovement,
          consistencyScore,
        },
        trends: {
          wpm: wpmTrend,
          fillerWords: fillerWordsTrend,
          adherence: adherenceTrend,
        },
        insights,
        recommendations,
      };
    } catch {
      throw new Error('Failed to compare sessions');
    }
  }

  // Export functionality
  async exportSessions(
    userId: string,
    options: AnalyticsExportOptions
  ): Promise<string> {
    try {
      const sessions = await this.getSessions(userId, {
        dateRange: options.dateRange || { start: new Date(), end: new Date() },
      });

      const sessionIds = options.sessionIds || [];
      const filteredSessions = sessions.filter(session => sessionIds.includes(session.id));

      switch (options.format) {
        case 'csv':
          return this.generateCSV(filteredSessions);
        case 'json':
          return JSON.stringify(filteredSessions, null, 2);
        case 'pdf':
          return this.generatePDF(filteredSessions, options);
        case 'excel':
          return this.generateExcel();
        default:
          throw new Error('Unsupported export format');
      }
    } catch {
      throw new Error('Failed to export sessions');
    }
  }

  // Real-time subscriptions
  subscribeToSession(
    sessionId: string,
    callback: () => void // Updated to indicate unused parameter
  ): Unsubscribe {
    return onSnapshot(
      doc(db, 'sessions', sessionId),
      (doc) => {
        if (!doc.exists()) {
          callback();
          return;
        }
        callback(doc.data() as SessionReport);
      },
      (error) => {
        // Removed unused variable 'error'
      }
    );
  }

  // Utility methods
  private sessionMatchesFilters(session: SessionReport, filters?: AnalyticsFilters): boolean {
    if (!filters) {
      return true;
    }

    // Date range filter
    if (filters.dateRange) {
      const sessionDate = session.startTime;
      if (sessionDate < filters.dateRange.start || sessionDate > filters.dateRange.end) {
        return false;
      }
    }

    // Script IDs filter
    if (filters.scriptIds && !filters.scriptIds.includes(session.scriptId)) {
      return false;
    }

    // Tags filter
    if (filters.tags && session.tags) {
      const hasMatchingTag = filters.tags.some(tag => session.tags?.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Duration filters
    if (filters.minDuration && session.totalDuration < filters.minDuration) {
      return false;
    }
    if (filters.maxDuration && session.totalDuration > filters.maxDuration) {
      return false;
    }

    // WPM range filter
    if (filters.wpmRange && filters.wpmRange.min !== undefined && filters.wpmRange.max !== undefined) {
      if (session.averageWPM < filters.wpmRange.min || session.averageWPM > filters.wpmRange.max) {
        return false;
      }
    }

    return true;
  }

  private calculateConsistency(sessions: SessionReport[]): number {
    if (sessions.length < 2) {
      return 100;
    }

    const wpmValues = sessions.map(session => session.averageWPM);
    const mean = wpmValues.reduce((sum, wpm) => sum + wpm, 0) / wpmValues.length;
    const variance = wpmValues.reduce((sum, wpm) => sum + Math.pow(wpm - mean, 2), 0) / wpmValues.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Convert to 0-100 scale (lower variation = higher consistency)
    return Math.max(0, 100 - (coefficientOfVariation * 100));
  }

  private calculateFluency(sessions: SessionReport[]): number {
    if (sessions.length === 0) {
      return 0;
    }

    const avgFillerRate = sessions.reduce((sum, s) => sum + s.fillerWordAnalysis.fillerRate, 0) / sessions.length;
    const avgPauseCount = sessions.reduce((sum, s) => sum + (s.pauseAnalysis?.length || 0), 0) / sessions.length;
    
    // Calculate fluency based on filler words and pauses (lower is better)
    const fillerScore = Math.max(0, 100 - (avgFillerRate * 10));
    const pauseScore = Math.max(0, 100 - (avgPauseCount * 2));
    
    return (fillerScore + pauseScore) / 2;
  }

  private generateWeeklyStats(sessions: SessionReport[]) {
    const weeklyData = new Map<string, {
      sessionCount: number;
      totalDuration: number;
      wpmSum: number;
      fillerRateSum: number;
      adherenceSum: number;
    }>();

    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const week = this.getISOWeek(date);

      // Added validation for 'week' to prevent potential injection vulnerabilities
      if (typeof week !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(week)) {
        throw new Error('Invalid week identifier');
      }

      if (!weeklyData.has(week)) {
        weeklyData.set(week, {
          sessionCount: 0,
          totalDuration: 0,
          wpmSum: 0,
          fillerRateSum: 0,
          adherenceSum: 0,
        });
      }

      const data = weeklyData.get(week);
      if (!data) {
        throw new Error('Data for the week is missing');
      }

      data.sessionCount++;
      data.totalDuration += session.totalDuration;
      data.wpmSum += session.averageWPM;
      data.fillerRateSum += session.fillerWordAnalysis.fillerRate;
      data.adherenceSum += session.scriptAdherence.adherencePercentage;
    });

    const weeklyStats = Array.from(weeklyData.entries()).map(([week, data]) => ({
      week,
      sessionCount: data.sessionCount,
      totalDuration: data.totalDuration,
      averageWPM: data.wpmSum / data.sessionCount,
      fillerWordRate: data.fillerRateSum / data.sessionCount,
      adherenceScore: data.adherenceSum / data.sessionCount,
    }));

    return weeklyStats;
  }

  private getISOWeek(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  private generateInsights(sessions: SessionReport[]): string[] {
    const insights: string[] = [];

    if (sessions.length < 2) {
      return insights;
    }

    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];

    // WPM insights
    const wpmImprovement = (lastSession?.averageWPM || 0) - (firstSession?.averageWPM || 0);
    if (wpmImprovement > 10) {
      insights.push(`Your speaking pace has improved by ${wpmImprovement.toFixed(1)} WPM over time!`);
    } else if (wpmImprovement < -10) {
      insights.push(`Your speaking pace has decreased by ${Math.abs(wpmImprovement).toFixed(1)} WPM. Consider practicing more regularly.`);
    }

    // Filler words insights
    const fillerImprovement = (firstSession?.fillerWordAnalysis?.fillerRate || 0) - (lastSession?.fillerWordAnalysis?.fillerRate || 0);
    if (fillerImprovement > 0.5) {
      insights.push(`Great progress! You've reduced filler words by ${fillerImprovement.toFixed(1)} per minute.`);
    }

    // Consistency insights
    const consistency = this.calculateConsistency(sessions);
    if (consistency > 80) {
      insights.push(`Excellent consistency! Your performance is very stable across sessions.`);
    } else if (consistency < 50) {
      insights.push(`Your performance varies significantly between sessions. Try practicing more regularly.`);
    }

    return insights;
  }

  private generateRecommendations(sessions: SessionReport[]): string[] {
    const recommendations: string[] = [];

    const avgWPM = sessions.reduce((sum, s) => sum + s.averageWPM, 0) / sessions.length;
    const avgFillerRate = sessions.reduce((sum, s) => sum + s.fillerWordAnalysis.fillerRate, 0) / sessions.length;
    const avgAdherence = sessions.reduce((sum, s) => sum + s.scriptAdherence.adherencePercentage, 0) / sessions.length;

    // WPM recommendations
    if (avgWPM < 120) {
      recommendations.push('Consider practicing at a slightly faster pace to improve your speaking rhythm.');
    } else if (avgWPM > 180) {
      recommendations.push('Try slowing down slightly to improve clarity and audience comprehension.');
    }

    // Filler words recommendations
    if (avgFillerRate > 3) {
      recommendations.push('Focus on reducing filler words by practicing with intentional pauses instead.');
    }

    // Script adherence recommendations
    if (avgAdherence < 70) {
      recommendations.push('Practice reading your scripts more closely to improve message delivery.');
    }

    // General recommendations
    if (sessions.length < 5) {
      recommendations.push('Regular practice leads to better results. Try to practice at least 3 times per week.');
    }

    return recommendations;
  }

  private getEmptyAnalyticsSummary(): AnalyticsSummary {
    return {
      totalSessions: 0,
      totalPracticeTime: 0,
      averageSessionDuration: 0,
      averageWPM: 0,
      improvementTrend: 0,
      fillerWordTrend: 0,
      mostPracticedScript: { id: '', title: 'No scripts', sessionCount: 0 },
      performanceMetrics: { consistency: 0, accuracy: 0, fluency: 0 },
      weeklyStats: [],
    };
  }

  // Export format generators
  private generateCSV(sessions: SessionReport[]): string {
    const headers = [
      'Date',
      'Script Title',
      'Duration (min)',
      'Average WPM',
      'Words Spoken',
      'Script Adherence (%)',
      'Filler Words',
      'Filler Rate (per min)',
    ];

    const rows = sessions.map(session => [
      session.startTime.toISOString().split('T')[0],
      session.scriptTitle,
      (session.totalDuration / 60000).toFixed(2),
      session.averageWPM.toFixed(1),
      session.wordsSpoken,
      session.scriptAdherence.adherencePercentage.toFixed(1),
      session.fillerWordAnalysis.totalFillerWords,
      session.fillerWordAnalysis.fillerRate.toFixed(2),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generatePDF(sessions: SessionReport[], options: AnalyticsExportOptions): string {
    // Placeholder logic to utilize parameters
    const sessionCount = sessions.length;
    const exportFormat = options.format;
    return `Generated PDF for ${sessionCount} sessions in ${exportFormat} format.`;
  }

  private generateExcel(): string {
    // This would integrate with an Excel generation library
    // For now, return a placeholder
    return 'Excel generation would be implemented here';
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
