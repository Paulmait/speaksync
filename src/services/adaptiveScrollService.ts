import { 
  AdaptiveScrollSettings, 
  SpeechPaceMetrics, 
  WordTiming, 
  ScrollState,
  ScriptAnalysis 
} from '../types';

/**
 * Advanced Adaptive Scrolling Service
 * Dynamically adjusts scroll speed based on real-time speech pace analysis
 * with sophisticated smoothing algorithms for natural scrolling experience
 */
export class AdaptiveScrollService {
  private settings: AdaptiveScrollSettings = this.getDefaultSettings();
  private paceMetrics: SpeechPaceMetrics = this.getInitialMetrics();
  private scrollState: ScrollState = this.getInitialScrollState();
  private wordTimings: WordTiming[] = [];
  private scriptAnalysis: ScriptAnalysis | null = null;
  
  // Performance optimization
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private isActive = false;
  
  // Event callbacks
  private onScrollUpdate?: (position: number, velocity: number, metrics: SpeechPaceMetrics) => void;
  private onPaceChange?: (metrics: SpeechPaceMetrics) => void;
  private onScrollStateChange?: (state: ScrollState) => void;

  // Smoothing algorithms
  private velocityBuffer: number[] = [];
  private wpmBuffer: number[] = [];
  private confidenceBuffer: number[] = [];
  
  // Advanced timing analysis
  private pauseDetectionTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.initializePerformanceOptimizations();
  }

  /**
   * Initialize adaptive scrolling with script and settings
   */
  public initialize(
    scriptAnalysis: ScriptAnalysis,
    settings: Partial<AdaptiveScrollSettings> = {},
    onScrollUpdate?: (position: number, velocity: number, metrics: SpeechPaceMetrics) => void,
    onPaceChange?: (metrics: SpeechPaceMetrics) => void,
    onScrollStateChange?: (state: ScrollState) => void
  ): void {
    this.scriptAnalysis = scriptAnalysis;
    this.settings = { ...this.getDefaultSettings(), ...settings };
    this.onScrollUpdate = onScrollUpdate || (() => {});
    this.onPaceChange = onPaceChange || (() => {});
    this.onScrollStateChange = onScrollStateChange || (() => {});
    
    // Reset all state
    this.reset();
    
    console.log('Adaptive scroll initialized with', scriptAnalysis.totalWords, 'words');
  }

  /**
   * Process word timing from speech recognition with ultra-low latency
   */
  public processWordTiming(
    wordIndex: number,
    word: string,
    timestamp: number,
    confidence: number = 1.0
  ): void {
    if (!this.isActive || !this.scriptAnalysis) return;

    const wordTiming: WordTiming = {
      wordIndex,
      word,
      timestamp,
      confidence,
      cumulativeWPM: 0,
      instantWPM: 0,
    };

    // Calculate instantaneous WPM from recent words
    const recentTimings = this.getRecentWordTimings(5); // Last 5 words
    if (recentTimings.length >= 2) {
      const firstTiming = recentTimings[0];
      if (!firstTiming) return; // Safety check
      const timeDiff = (timestamp - firstTiming.timestamp) / 1000; // seconds
      const wordCount = recentTimings.length;
      wordTiming.instantWPM = timeDiff > 0 ? (wordCount / timeDiff) * 60 : 0;
    }

    // Calculate cumulative WPM
    if (this.wordTimings.length > 0) {
      const firstTiming = this.wordTimings[0];
      if (!firstTiming) return;
      const totalTime = (timestamp - firstTiming.timestamp) / 1000;
      wordTiming.cumulativeWPM = totalTime > 0 ? (this.wordTimings.length / totalTime) * 60 : 0;
    }

    this.wordTimings.push(wordTiming);
    this.updatePaceMetrics();
    this.updateScrollTarget(wordIndex);
    
    // Reset pause detection
    this.resetPauseDetection();
    
    console.log(`Word ${wordIndex}: "${word}" - Instant WPM: ${wordTiming.instantWPM.toFixed(1)}, Cumulative: ${wordTiming.cumulativeWPM.toFixed(1)}`);
  }

  /**
   * Start adaptive scrolling
   */
  public start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastFrameTime = performance.now();
    this.startAnimationLoop();
    this.startPauseDetection();
    
    console.log('Adaptive scrolling started');
  }

  /**
   * Stop adaptive scrolling
   */
  public stop(): void {
    this.isActive = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.pauseDetectionTimer) {
      clearTimeout(this.pauseDetectionTimer);
      this.pauseDetectionTimer = null;
    }
    
    console.log('Adaptive scrolling stopped');
  }

  /**
   * Update scroll target based on current word position
   */
  private updateScrollTarget(wordIndex: number): void {
    if (!this.scriptAnalysis) return;

    // Calculate target scroll position for current word
    const progressRatio = wordIndex / Math.max(this.scriptAnalysis.totalWords - 1, 1);
    const estimatedHeight = this.scrollState.currentPosition / Math.max(progressRatio, 0.01);
    
    // Look ahead based on current pace
    const lookAheadIndex = Math.min(
      wordIndex + this.settings.lookAheadWords,
      this.scriptAnalysis.totalWords - 1
    );
    
    const targetProgressRatio = lookAheadIndex / Math.max(this.scriptAnalysis.totalWords - 1, 1);
    this.scrollState.targetPosition = estimatedHeight * targetProgressRatio + this.settings.bufferZone;
  }

  /**
   * Advanced pace metrics calculation
   */
  private updatePaceMetrics(): void {
    const now = Date.now();
    
    if (this.wordTimings.length === 0) return;

    // Calculate current metrics
    const recentTimings = this.getRecentWordTimings(10);
    const instantTimings = this.getRecentWordTimings(3);
    
    // Current WPM (last 10 words)
    this.paceMetrics.currentWPM = this.calculateWPM(recentTimings);
    
    // Average WPM (all words)
    this.paceMetrics.averageWPM = this.calculateWPM(this.wordTimings);
    
    // Instantaneous WPM (last 3 words)
    this.paceMetrics.instantaneousWPM = this.calculateWPM(instantTimings);
    
    // Time since last word
    const lastTiming = this.wordTimings[this.wordTimings.length - 1];
    if (lastTiming) {
      this.paceMetrics.timeSinceLastWord = (now - lastTiming.timestamp) / 1000;
    }
    
    // Speech duration
    if (this.wordTimings.length > 1 && lastTiming) {
      const firstTiming = this.wordTimings[0];
      if (firstTiming) {
        this.paceMetrics.speechDuration = (lastTiming.timestamp - firstTiming.timestamp) / 1000;
      }
    }
    
    // Total words spoken
    this.paceMetrics.totalWordsSpoken = this.wordTimings.length;
    
    // Pace trend analysis
    this.analyzePaceTrend();
    
    // Confidence level based on recent word confidence
    this.updateConfidenceLevel();
    
    // Update smoothing buffers
    this.updateSmoothingBuffers();
    
    // Notify listeners
    this.onPaceChange?.(this.paceMetrics);
  }

  /**
   * Calculate WPM from word timings
   */
  private calculateWPM(timings: WordTiming[]): number {
    if (timings.length < 2) return 0;
    
    const firstTiming = timings[0];
    const lastTiming = timings[timings.length - 1];
    if (!firstTiming || !lastTiming) return 0;
    const duration = (lastTiming.timestamp - firstTiming.timestamp) / 1000; // seconds
    
    return duration > 0 ? (timings.length / duration) * 60 : 0;
  }

  /**
   * Get recent word timings within specified count
   */
  private getRecentWordTimings(count: number): WordTiming[] {
    return this.wordTimings.slice(-count);
  }

  /**
   * Analyze pace trend for intelligent adaptation
   */
  private analyzePaceTrend(): void {
    if (this.wpmBuffer.length < 3) return;
    
    const recent = this.wpmBuffer.slice(-3);
    if (recent.length < 3 || !recent[0] || !recent[2]) return;
    const trend = recent[2] - recent[0];
    const threshold = this.paceMetrics.averageWPM * 0.1; // 10% threshold
    
    if (trend > threshold) {
      this.paceMetrics.paceTrend = 'accelerating';
      this.paceMetrics.isAccelerating = true;
    } else if (trend < -threshold) {
      this.paceMetrics.paceTrend = 'decelerating';
      this.paceMetrics.isAccelerating = false;
    } else {
      this.paceMetrics.paceTrend = 'stable';
      this.paceMetrics.isAccelerating = false;
    }
  }

  /**
   * Update confidence level based on speech recognition confidence
   */
  private updateConfidenceLevel(): void {
    const recentTimings = this.getRecentWordTimings(5);
    const avgConfidence = recentTimings.reduce((sum, t) => sum + t.confidence, 0) / recentTimings.length;
    this.paceMetrics.confidenceLevel = avgConfidence || 0;
  }

  /**
   * Update smoothing buffers for noise reduction
   */
  private updateSmoothingBuffers(): void {
    const bufferSize = 10;
    
    // WPM buffer
    this.wpmBuffer.push(this.paceMetrics.currentWPM);
    if (this.wpmBuffer.length > bufferSize) {
      this.wpmBuffer.shift();
    }
    
    // Velocity buffer
    this.velocityBuffer.push(this.scrollState.velocity);
    if (this.velocityBuffer.length > bufferSize) {
      this.velocityBuffer.shift();
    }
    
    // Confidence buffer
    this.confidenceBuffer.push(this.paceMetrics.confidenceLevel);
    if (this.confidenceBuffer.length > bufferSize) {
      this.confidenceBuffer.shift();
    }
  }

  /**
   * Sophisticated animation loop with smoothing
   */
  private startAnimationLoop(): void {
    const animate = (currentTime: number) => {
      if (!this.isActive) return;
      
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;
      
      this.updateScrollPhysics(deltaTime);
      this.onScrollUpdate?.(this.scrollState.currentPosition, this.scrollState.velocity, this.paceMetrics);
      this.onScrollStateChange?.(this.scrollState);
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Advanced scroll physics with smoothing
   */
  private updateScrollPhysics(deltaTime: number): void {
    const dt = Math.min(deltaTime / 1000, 0.1); // Cap at 100ms to prevent large jumps
    
    // Calculate target velocity based on current pace
    const targetVelocity = this.calculateTargetVelocity();
    
    // Apply smoothing to velocity changes
    const smoothedTargetVelocity = this.applySmoothingToVelocity(targetVelocity);
    
    // Update velocity with responsive damping
    const velocityDiff = smoothedTargetVelocity - this.scrollState.velocity;
    const responsiveness = this.settings.responsiveness * this.paceMetrics.confidenceLevel;
    this.scrollState.velocity += velocityDiff * responsiveness * dt;
    
    // Apply velocity limits
    this.scrollState.velocity = Math.max(
      this.scrollState.velocity,
      this.settings.baseScrollSpeed * this.settings.decelerationLimit
    );
    this.scrollState.velocity = Math.min(
      this.scrollState.velocity,
      this.settings.baseScrollSpeed * this.settings.accelerationLimit
    );
    
    // Update position
    const positionDelta = this.scrollState.velocity * dt;
    this.scrollState.currentPosition += positionDelta;
    
    // Ensure we don't scroll past target
    if (this.scrollState.targetPosition > this.scrollState.currentPosition) {
      const distanceToTarget = this.scrollState.targetPosition - this.scrollState.currentPosition;
      if (distanceToTarget < this.settings.bufferZone && this.scrollState.velocity > 0) {
        // Slow down as we approach target
        this.scrollState.velocity *= 0.8;
      }
    }
    
    // Update smoothing buffer for position
    this.scrollState.smoothingBuffer.push(this.scrollState.currentPosition);
    if (this.scrollState.smoothingBuffer.length > 5) {
      this.scrollState.smoothingBuffer.shift();
    }
    
    this.scrollState.lastUpdateTime = Date.now();
  }

  /**
   * Calculate target velocity based on speech pace
   */
  private calculateTargetVelocity(): number {
    if (this.paceMetrics.isPaused) {
      return this.settings.baseScrollSpeed * 0.1; // Very slow when paused
    }
    
    if (this.wpmBuffer.length === 0) {
      return this.settings.baseScrollSpeed;
    }
    
    // Use smoothed WPM for stable velocity calculation
    const smoothedWPM = this.wpmBuffer.reduce((sum, wpm) => sum + wpm, 0) / this.wpmBuffer.length;
    
    // Normalize WPM to velocity multiplier
    const averageReadingWPM = 150; // Average reading speed
    const paceMultiplier = Math.max(smoothedWPM / averageReadingWPM, 0.1);
    
    // Apply acceleration/deceleration based on trend
    let trendMultiplier = 1;
    if (this.paceMetrics.paceTrend === 'accelerating') {
      trendMultiplier = 1.2;
    } else if (this.paceMetrics.paceTrend === 'decelerating') {
      trendMultiplier = 0.8;
    }
    
    return this.settings.baseScrollSpeed * paceMultiplier * trendMultiplier;
  }

  /**
   * Apply sophisticated smoothing to velocity changes
   */
  private applySmoothingToVelocity(targetVelocity: number): number {
    if (this.velocityBuffer.length === 0) {
      return targetVelocity;
    }
    
    // Exponential moving average for smoothing
    const alpha = this.settings.smoothingFactor;
    const previousVelocity = this.velocityBuffer[this.velocityBuffer.length - 1];
    
    return alpha * targetVelocity + (1 - alpha) * (previousVelocity || 0);
  }

  /**
   * Pause detection system
   */
  private startPauseDetection(): void {
    this.resetPauseDetection();
  }

  private resetPauseDetection(): void {
    if (this.pauseDetectionTimer) {
      clearTimeout(this.pauseDetectionTimer);
    }
    
    this.paceMetrics.isPaused = false;
    
    this.pauseDetectionTimer = setTimeout(() => {
      this.paceMetrics.isPaused = true;
      console.log('Speech pause detected');
      this.onPaceChange?.(this.paceMetrics);
    }, this.settings.pauseThreshold * 1000) as any;
  }

  /**
   * Update settings and recalculate if needed
   */
  public updateSettings(newSettings: Partial<AdaptiveScrollSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Adaptive scroll settings updated:', newSettings);
  }

  /**
   * Get current pace metrics
   */
  public getPaceMetrics(): SpeechPaceMetrics {
    return { ...this.paceMetrics };
  }

  /**
   * Get current scroll state
   */
  public getScrollState(): ScrollState {
    return { ...this.scrollState };
  }

  /**
   * Manual scroll override (user interaction)
   */
  public setUserScrollPosition(position: number): void {
    this.scrollState.currentPosition = position;
    this.scrollState.isUserControlled = true;
    
    // Resume adaptive control after a delay
    setTimeout(() => {
      this.scrollState.isUserControlled = false;
    }, 2000);
  }

  /**
   * Reset all state
   */
  public reset(): void {
    this.wordTimings = [];
    this.paceMetrics = this.getInitialMetrics();
    this.scrollState = this.getInitialScrollState();
    this.velocityBuffer = [];
    this.wpmBuffer = [];
    this.confidenceBuffer = [];
    
    if (this.pauseDetectionTimer) {
      clearTimeout(this.pauseDetectionTimer);
      this.pauseDetectionTimer = null;
    }
    
    console.log('Adaptive scroll state reset');
  }

  /**
   * Performance optimizations
   */
  private initializePerformanceOptimizations(): void {
    // Limit word timing history to prevent memory issues
    setInterval(() => {
      if (this.wordTimings.length > 1000) {
        this.wordTimings = this.wordTimings.slice(-500); // Keep most recent 500
        console.log('Word timing history trimmed for performance');
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): AdaptiveScrollSettings {
    return {
      enabled: true,
      baseScrollSpeed: 50,
      responsiveness: 0.7,
      smoothingFactor: 0.8,
      pauseThreshold: 2.0,
      accelerationLimit: 3.0,
      decelerationLimit: 0.1,
      lookAheadWords: 5,
      bufferZone: 100,
    };
  }

  /**
   * Get initial pace metrics
   */
  private getInitialMetrics(): SpeechPaceMetrics {
    return {
      currentWPM: 0,
      averageWPM: 0,
      instantaneousWPM: 0,
      timeSinceLastWord: 0,
      speechDuration: 0,
      totalWordsSpoken: 0,
      isPaused: false,
      isAccelerating: false,
      paceTrend: 'stable',
      confidenceLevel: 1.0,
    };
  }

  /**
   * Get initial scroll state
   */
  private getInitialScrollState(): ScrollState {
    return {
      currentPosition: 0,
      targetPosition: 0,
      velocity: 0,
      acceleration: 0,
      adaptiveSpeed: 50,
      isUserControlled: false,
      lastUpdateTime: Date.now(),
      smoothingBuffer: [],
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stop();
    console.log('Adaptive scroll service destroyed');
  }
}

export const adaptiveScrollService = new AdaptiveScrollService();
