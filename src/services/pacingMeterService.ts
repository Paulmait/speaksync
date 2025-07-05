import { 
  PacingMeterSettings, 
  PacingMeterState, 
  WPMDataPoint, 
  PaceAnalysisSegment,
  SessionSummaryReport,
  ScriptAnalysis 
} from '../types';

/**
 * Pacing Meter Service
 * Real-time WPM analysis with target-based visual feedback
 * Generates session summary reports with pace analysis
 */
export class PacingMeterService {
  private settings: PacingMeterSettings = this.getDefaultSettings();
  private state: PacingMeterState = this.getInitialState();
  private scriptAnalysis: ScriptAnalysis | null = null;
  private isActive = false;
  
  // Event callbacks
  private onStateUpdate?: (state: PacingMeterState) => void;
  private onPaceChange?: (isOptimal: boolean, currentWPM: number) => void;
  
  constructor() {
    this.reset();
  }

  /**
   * Initialize pacing meter with script and settings
   */
  public initialize(
    scriptAnalysis: ScriptAnalysis,
    settings: Partial<PacingMeterSettings> = {},
    onStateUpdate?: (state: PacingMeterState) => void,
    onPaceChange?: (isOptimal: boolean, currentWPM: number) => void
  ): void {
    this.scriptAnalysis = scriptAnalysis;
    this.settings = { ...this.getDefaultSettings(), ...settings };
    this.onStateUpdate = onStateUpdate;
    this.onPaceChange = onPaceChange;
    
    this.reset();
    console.log('Pacing meter initialized with target WPM:', this.settings.targetWPM);
  }

  /**
   * Start pacing analysis session
   */
  public startSession(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.state.sessionStartTime = Date.now();
    this.state.wpmHistory = [];
    this.state.paceAnalysis = [];
    
    console.log('Pacing meter session started');
    this.notifyStateUpdate();
  }

  /**
   * End pacing analysis session
   */
  public endSession(): SessionSummaryReport | null {
    if (!this.isActive) return null;
    
    this.isActive = false;
    this.state.sessionEndTime = Date.now();
    
    const report = this.generateSessionReport();
    console.log('Pacing meter session ended. Report generated.');
    
    return report;
  }

  /**
   * Process word timing data for WPM calculation
   */
  public processWordTiming(
    wordIndex: number,
    word: string,
    timestamp: number,
    confidence: number = 1.0
  ): void {
    if (!this.isActive || !this.scriptAnalysis) return;

    // Calculate current WPM based on recent words
    const currentWPM = this.calculateCurrentWPM(timestamp);
    
    // Update state
    this.state.currentWPM = currentWPM;
    this.state.averageWPM = this.calculateAverageWPM();
    this.state.isInOptimalRange = this.isWPMOptimal(currentWPM);
    
    // Add data point to history
    const dataPoint: WPMDataPoint = {
      timestamp,
      wpm: currentWPM,
      wordIndex,
      isOptimal: this.state.isInOptimalRange,
    };
    
    this.state.wpmHistory.push(dataPoint);
    
    // Update pace analysis segments
    this.updatePaceAnalysis(wordIndex, currentWPM, timestamp);
    
    // Notify listeners
    this.notifyStateUpdate();
    this.onPaceChange?.(this.state.isInOptimalRange, currentWPM);
    
    console.log(`Pace: ${currentWPM.toFixed(0)} WPM (Target: ${this.settings.targetWPM}) - ${this.state.isInOptimalRange ? 'Optimal' : 'Off-pace'}`);
  }

  /**
   * Calculate current WPM from recent word timings
   */
  private calculateCurrentWPM(currentTimestamp: number): number {
    const recentDataPoints = this.state.wpmHistory.slice(-10); // Last 10 words
    
    if (recentDataPoints.length < 2) {
      return 0;
    }
    
    const firstPoint = recentDataPoints[0];
    const duration = (currentTimestamp - firstPoint.timestamp) / 1000; // seconds
    
    if (duration <= 0) return 0;
    
    const wordsCount = recentDataPoints.length;
    return (wordsCount / duration) * 60;
  }

  /**
   * Calculate session average WPM
   */
  private calculateAverageWPM(): number {
    if (this.state.wpmHistory.length === 0) return 0;
    
    const totalWPM = this.state.wpmHistory.reduce((sum, point) => sum + point.wpm, 0);
    return totalWPM / this.state.wpmHistory.length;
  }

  /**
   * Check if WPM is within optimal range
   */
  private isWPMOptimal(wpm: number): boolean {
    const target = this.settings.targetWPM;
    const tolerance = this.settings.toleranceRange;
    return wpm >= (target - tolerance) && wpm <= (target + tolerance);
  }

  /**
   * Get pace status (optimal, too-fast, too-slow)
   */
  private getPaceStatus(wpm: number): 'optimal' | 'too-fast' | 'too-slow' {
    const target = this.settings.targetWPM;
    const tolerance = this.settings.toleranceRange;
    
    if (wpm < target - tolerance) return 'too-slow';
    if (wpm > target + tolerance) return 'too-fast';
    return 'optimal';
  }

  /**
   * Update pace analysis segments
   */
  private updatePaceAnalysis(wordIndex: number, currentWPM: number, timestamp: number): void {
    const currentStatus = this.getPaceStatus(currentWPM);
    const lastSegment = this.state.paceAnalysis[this.state.paceAnalysis.length - 1];
    
    if (!lastSegment || lastSegment.status !== currentStatus) {
      // Start new segment
      const newSegment: PaceAnalysisSegment = {
        startWordIndex: wordIndex,
        endWordIndex: wordIndex,
        averageWPM: currentWPM,
        status: currentStatus,
        duration: 0,
      };
      
      this.state.paceAnalysis.push(newSegment);
    } else {
      // Update existing segment
      lastSegment.endWordIndex = wordIndex;
      lastSegment.averageWPM = (lastSegment.averageWPM + currentWPM) / 2;
      lastSegment.duration = timestamp - this.getSegmentStartTimestamp(lastSegment);
    }
  }

  /**
   * Get timestamp for segment start
   */
  private getSegmentStartTimestamp(segment: PaceAnalysisSegment): number {
    const startPoint = this.state.wpmHistory.find(point => point.wordIndex === segment.startWordIndex);
    return startPoint?.timestamp || Date.now();
  }

  /**
   * Generate comprehensive session report
   */
  private generateSessionReport(): SessionSummaryReport {
    const sessionDuration = (this.state.sessionEndTime || Date.now()) - this.state.sessionStartTime;
    const totalWords = this.state.wpmHistory.length;
    const optimalDataPoints = this.state.wpmHistory.filter(point => point.isOptimal);
    const optimalPercentage = totalWords > 0 ? (optimalDataPoints.length / totalWords) * 100 : 0;
    
    const recommendations = this.generateRecommendations();
    
    return {
      sessionId: `session_${Date.now()}`,
      scriptId: this.scriptAnalysis?.scriptId || 'unknown',
      startTime: this.state.sessionStartTime,
      endTime: this.state.sessionEndTime || Date.now(),
      totalWords,
      averageWPM: this.state.averageWPM,
      targetWPM: this.settings.targetWPM,
      optimalPercentage,
      segments: [...this.state.paceAnalysis],
      fillerWords: [], // Will be populated by filler word service
      recommendations,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const avgWPM = this.state.averageWPM;
    const targetWPM = this.settings.targetWPM;
    const tolerance = this.settings.toleranceRange;
    
    if (avgWPM < targetWPM - tolerance) {
      recommendations.push(`Try to speak faster. Your average pace (${avgWPM.toFixed(0)} WPM) is below the target (${targetWPM} WPM).`);
      recommendations.push('Practice with a metronome or backing track to maintain consistent pacing.');
    } else if (avgWPM > targetWPM + tolerance) {
      recommendations.push(`Try to slow down. Your average pace (${avgWPM.toFixed(0)} WPM) is above the target (${targetWPM} WPM).`);
      recommendations.push('Focus on clear enunciation and natural pauses between sentences.');
    } else {
      recommendations.push('Great job! Your pacing is within the optimal range.');
    }
    
    // Analyze consistency
    const wpmVariance = this.calculateWPMVariance();
    if (wpmVariance > 30) {
      recommendations.push('Work on maintaining more consistent pacing throughout your delivery.');
    }
    
    // Analyze problem segments
    const problematicSegments = this.state.paceAnalysis.filter(s => s.status !== 'optimal');
    if (problematicSegments.length > 0) {
      recommendations.push(`${problematicSegments.length} segments had pacing issues. Review the highlighted sections.`);
    }
    
    return recommendations;
  }

  /**
   * Calculate WPM variance for consistency analysis
   */
  private calculateWPMVariance(): number {
    if (this.state.wpmHistory.length < 2) return 0;
    
    const mean = this.state.averageWPM;
    const squaredDifferences = this.state.wpmHistory.map(point => 
      Math.pow(point.wpm - mean, 2)
    );
    
    return Math.sqrt(squaredDifferences.reduce((sum, sq) => sum + sq, 0) / squaredDifferences.length);
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<PacingMeterSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Pacing meter settings updated');
  }

  /**
   * Get current state
   */
  public getState(): PacingMeterState {
    return { ...this.state };
  }

  /**
   * Get current settings
   */
  public getSettings(): PacingMeterSettings {
    return { ...this.settings };
  }

  /**
   * Reset state
   */
  public reset(): void {
    this.state = this.getInitialState();
    this.isActive = false;
    console.log('Pacing meter reset');
  }

  /**
   * Notify state update
   */
  private notifyStateUpdate(): void {
    this.onStateUpdate?.(this.getState());
  }

  /**
   * Default settings
   */
  private getDefaultSettings(): PacingMeterSettings {
    return {
      enabled: true,
      targetWPM: 150,
      toleranceRange: 20,
      showVisualMeter: true,
      showSessionSummary: true,
      colorScheme: {
        optimal: '#10B981',    // Green
        acceptable: '#F59E0B', // Yellow
        poor: '#EF4444',       // Red
      },
    };
  }

  /**
   * Initial state
   */
  private getInitialState(): PacingMeterState {
    return {
      currentWPM: 0,
      targetWPM: this.settings.targetWPM,
      isInOptimalRange: false,
      sessionStartTime: Date.now(),
      averageWPM: 0,
      wpmHistory: [],
      paceAnalysis: [],
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.isActive = false;
    console.log('Pacing meter service destroyed');
  }
}

export const pacingMeterService = new PacingMeterService();
