import { KaraokeState, WordMatch, ScriptAnalysis, KaraokeHighlightSettings } from '../types';

/**
 * Advanced Karaoke Highlighting Service
 * Provides real-time word matching and highlighting for teleprompter scripts
 * with fuzzy matching, performance optimization, and smooth visual feedback
 */
export class KaraokeService {
  private scriptAnalysis: ScriptAnalysis | null = null;
  private state: KaraokeState = this.getInitialState();
  private settings: KaraokeHighlightSettings = this.getDefaultSettings();
  private onStateChange?: (state: KaraokeState) => void;
  private onHighlightChange?: (wordIndices: number[]) => void;
  private onScrollRequest?: (wordIndex: number) => void;

  // Performance optimization: Pre-computed word similarity cache
  private similarityCache = new Map<string, Map<string, number>>();
  
  // Real-time processing optimization
  private lastProcessedTime = 0;
  private processingQueue: Array<{ word: string; timestamp: number; confidence: number }> = [];
  private isProcessing = false;

  constructor() {
    this.setupPerformanceOptimizations();
  }

  /**
   * Initialize karaoke service with script content and settings
   */
  public initialize(
    scriptContent: string, 
    settings: Partial<KaraokeHighlightSettings> = {},
    onStateChange?: (state: KaraokeState) => void,
    onHighlightChange?: (wordIndices: number[]) => void,
    onScrollRequest?: (wordIndex: number) => void
  ): void {
    this.settings = { ...this.getDefaultSettings(), ...settings };
    this.onStateChange = onStateChange;
    this.onHighlightChange = onHighlightChange;
    this.onScrollRequest = onScrollRequest;
    
    // Analyze script for word-level processing
    this.scriptAnalysis = this.analyzeScript(scriptContent);
    
    // Reset state
    this.state = {
      ...this.getInitialState(),
      scriptWords: this.scriptAnalysis.words.map(w => w.word),
      totalSentences: this.scriptAnalysis.totalSentences,
      sessionStartTime: Date.now(),
    };

    // Pre-compute similarity cache for common words
    this.precomputeSimilarityCache();
    
    this.notifyStateChange();
  }

  /**
   * Process incoming speech recognition word with ultra-low latency
   */
  public processSpokenWord(
    word: string, 
    confidence: number, 
    timestamp: number = Date.now()
  ): WordMatch | null {
    if (!this.scriptAnalysis || !this.settings.enabled) {
      return null;
    }

    // Add to processing queue for batch processing if needed
    this.processingQueue.push({ word, timestamp, confidence });

    // Immediate processing for low latency
    const match = this.findBestMatch(word, confidence, timestamp);
    
    if (match && match.similarity >= this.settings.matchThreshold) {
      this.updateStateWithMatch(match);
      this.triggerHighlight(match);
      this.updateScrollPosition(match);
      return match;
    }

    // Process queue if not currently processing
    if (!this.isProcessing) {
      this.processQueueAsync();
    }

    return null;
  }

  /**
   * Ultra-fast fuzzy word matching with similarity scoring
   */
  private findBestMatch(
    spokenWord: string, 
    confidence: number, 
    timestamp: number
  ): WordMatch | null {
    if (!this.scriptAnalysis) return null;

    const normalizedSpoken = this.normalizeWord(spokenWord);
    const searchWindow = this.getSearchWindow();
    
    let bestMatch: WordMatch | null = null;
    let bestSimilarity = 0;

    // Search within optimal window around current position
    for (let i = searchWindow.start; i <= searchWindow.end; i++) {
      const scriptWord = this.scriptAnalysis.words[i];
      if (!scriptWord) continue;

      const normalizedScript = this.normalizeWord(scriptWord.word);
      
      // Check exact match first (fastest)
      if (normalizedSpoken === normalizedScript) {
        bestMatch = {
          wordIndex: i,
          scriptWord: scriptWord.word,
          spokenWord,
          confidence,
          timestamp,
          matched: true,
          isExact: true,
          similarity: 1.0,
        };
        break;
      }

      // Fuzzy matching with cached similarity
      const similarity = this.calculateSimilarity(normalizedSpoken, normalizedScript);
      
      if (similarity > bestSimilarity && similarity >= this.settings.matchThreshold) {
        bestSimilarity = similarity;
        bestMatch = {
          wordIndex: i,
          scriptWord: scriptWord.word,
          spokenWord,
          confidence,
          timestamp,
          isExact: false,
          similarity,
          matched: true,
        };
      }
    }

    return bestMatch;
  }

  /**
   * High-performance word similarity calculation with caching
   */
  private calculateSimilarity(word1: string, word2: string): number {
    // Check cache first
    const cached = this.similarityCache.get(word1)?.get(word2);
    if (cached !== undefined) {
      return cached;
    }

    let similarity: number;

    // Quick length-based filtering
    const lengthDiff = Math.abs(word1.length - word2.length);
    if (lengthDiff > Math.max(word1.length, word2.length) * 0.5) {
      similarity = 0;
    } else {
      // Advanced similarity calculation combining multiple algorithms
      const levenshtein = this.levenshteinSimilarity(word1, word2);
      const jaro = this.jaroSimilarity(word1, word2);
      const soundex = this.soundexSimilarity(word1, word2);
      
      // Weighted combination for optimal accuracy
      similarity = (levenshtein * 0.4) + (jaro * 0.4) + (soundex * 0.2);
    }

    // Cache result
    if (!this.similarityCache.has(word1)) {
      this.similarityCache.set(word1, new Map());
    }
    this.similarityCache.get(word1)!.set(word2, similarity);

    return similarity;
  }

  /**
   * Levenshtein distance-based similarity (0-1 scale)
   */
  private levenshteinSimilarity(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const substitution = matrix[j - 1][i - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          substitution
        );
      }
    }

    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : 1 - matrix[b.length][a.length] / maxLength;
  }

  /**
   * Jaro similarity algorithm for phonetic matching
   */
  private jaroSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    if (matchWindow < 0) return 0;

    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, s2.length);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    return (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
  }

  /**
   * Soundex-based phonetic similarity
   */
  private soundexSimilarity(word1: string, word2: string): number {
    const soundex1 = this.soundex(word1);
    const soundex2 = this.soundex(word2);
    return soundex1 === soundex2 ? 1 : 0;
  }

  private soundex(word: string): string {
    const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length === 0) return '0000';

    let soundex = clean[0];
    const codes = { B: '1', F: '1', P: '1', V: '1', C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2', D: '3', T: '3', L: '4', M: '5', N: '5', R: '6' };

    for (let i = 1; i < clean.length && soundex.length < 4; i++) {
      const code = codes[clean[i] as keyof typeof codes];
      if (code && code !== soundex[soundex.length - 1]) {
        soundex += code;
      }
    }

    return soundex.padEnd(4, '0').substring(0, 4);
  }

  /**
   * Get optimal search window around current position
   */
  private getSearchWindow(): { start: number; end: number } {
    if (!this.scriptAnalysis) return { start: 0, end: 0 };

    const currentPos = this.state.currentWordIndex;
    const windowSize = Math.min(20, Math.floor(this.scriptAnalysis.totalWords * 0.1));
    
    const start = Math.max(0, currentPos - Math.floor(windowSize / 2));
    const end = Math.min(this.scriptAnalysis.totalWords - 1, currentPos + Math.floor(windowSize / 2));

    return { start, end };
  }

  /**
   * Update state with successful match
   */
  private updateStateWithMatch(match: WordMatch): void {
    this.state.currentWordIndex = match.wordIndex;
    this.state.matchedWords.push(match);
    
    // Update accuracy calculation
    const totalMatches = this.state.matchedWords.length;
    const exactMatches = this.state.matchedWords.filter(m => m.isExact).length;
    this.state.accuracy = totalMatches > 0 ? exactMatches / totalMatches : 0;

    // Update words per minute
    const elapsed = (Date.now() - this.state.sessionStartTime) / 60000; // minutes
    this.state.wordsPerMinute = elapsed > 0 ? totalMatches / elapsed : 0;

    // Update sentence tracking
    if (this.scriptAnalysis) {
      const currentSentence = this.scriptAnalysis.words[match.wordIndex]?.sentence || 0;
      this.state.currentSentence = currentSentence;
    }

    this.notifyStateChange();
  }

  /**
   * Trigger visual highlighting with smooth animation
   */
  private triggerHighlight(match: WordMatch): void {
    if (!this.onHighlightChange) return;

    // Add word to highlighted words
    this.state.highlightedWords = [match.wordIndex];
    this.onHighlightChange(this.state.highlightedWords);

    // Schedule fade out
    setTimeout(() => {
      this.state.highlightedWords = this.state.highlightedWords.filter(i => i !== match.wordIndex);
      this.onHighlightChange?.(this.state.highlightedWords);
    }, this.settings.highlightDuration);
  }

  /**
   * Update scroll position to keep highlighted word in view
   */
  private updateScrollPosition(match: WordMatch): void {
    if (!this.settings.autoScroll || !this.onScrollRequest) return;
    
    this.onScrollRequest(match.wordIndex);
  }

  /**
   * Analyze script content for word-level processing
   */
  private analyzeScript(content: string): ScriptAnalysis {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const analysis: ScriptAnalysis = {
      scriptId: 'karaoke-script-' + Date.now(),
      words: [],
      sentences: [],
      paragraphs: [],
      totalWords: 0,
      totalSentences: 0,
      totalParagraphs: paragraphs.length,
      averageWordsPerSentence: 0,
      estimatedReadingTime: 0,
    };

    let wordIndex = 0;
    let sentenceIndex = 0;

    paragraphs.forEach((paragraph, pIndex) => {
      const paragraphStart = wordIndex;
      const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      sentences.forEach((sentence, sIndex) => {
        const sentenceStart = wordIndex;
        const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
        
        words.forEach((word, wIndex) => {
          analysis.words.push({
            word: this.cleanWord(word),
            index: wordIndex,
            position: { start: 0, end: 0 }, // Will be calculated when rendering
            sentence: sentenceIndex,
            paragraph: pIndex,
          });
          wordIndex++;
        });

        analysis.sentences.push({
          text: sentence.trim(),
          index: sentenceIndex,
          startIndex: sentenceStart,
          endIndex: wordIndex - 1,
          wordRange: {
            start: sentenceStart,
            end: wordIndex - 1,
          },
          paragraph: pIndex,
        });
        sentenceIndex++;
      });

      analysis.paragraphs.push({
        text: paragraph,
        index: pIndex,
        startIndex: paragraphStart,
        endIndex: wordIndex - 1,
        wordRange: {
          start: paragraphStart,
          end: wordIndex - 1,
        },
        sentenceRange: {
          start: sentenceIndex - sentences.length,
          end: sentenceIndex - 1,
        },
        wordCount: wordIndex - paragraphStart,
      });
    });

    analysis.totalWords = wordIndex;
    analysis.totalSentences = sentenceIndex;
    analysis.averageWordsPerSentence = sentenceIndex > 0 ? wordIndex / sentenceIndex : 0;
    analysis.estimatedReadingTime = wordIndex / 150; // Assuming 150 WPM reading speed

    return analysis;
  }

  /**
   * Clean word for comparison (remove punctuation, normalize case)
   */
  private cleanWord(word: string): string {
    return word.replace(/[^\w]/g, '').toLowerCase();
  }

  /**
   * Normalize word for matching
   */
  private normalizeWord(word: string): string {
    return word.toLowerCase().replace(/[^\w]/g, '');
  }

  /**
   * Pre-compute similarity cache for common words
   */
  private precomputeSimilarityCache(): void {
    if (!this.scriptAnalysis) return;

    // Cache similarities for frequently used words
    const commonWords = ['the', 'and', 'a', 'to', 'of', 'in', 'is', 'you', 'that', 'it'];
    const scriptWords = [...new Set(this.scriptAnalysis.words.map(w => this.normalizeWord(w.word)))];

    commonWords.forEach(common => {
      scriptWords.forEach(script => {
        this.calculateSimilarity(common, script);
      });
    });
  }

  /**
   * Async queue processing for performance optimization
   */
  private async processQueueAsync(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.processingQueue.length > 0) {
        const batch = this.processingQueue.splice(0, 5); // Process in small batches
        
        for (const item of batch) {
          // Additional processing if needed
          await new Promise(resolve => setTimeout(resolve, 0)); // Yield control
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Setup performance optimizations
   */
  private setupPerformanceOptimizations(): void {
    // Limit cache size to prevent memory issues
    setInterval(() => {
      if (this.similarityCache.size > 1000) {
        const entries = Array.from(this.similarityCache.entries());
        this.similarityCache.clear();
        // Keep most recent 500 entries
        entries.slice(-500).forEach(([key, value]) => {
          this.similarityCache.set(key, value);
        });
      }
    }, 30000);
  }

  /**
   * Get current karaoke state
   */
  public getState(): KaraokeState {
    return { ...this.state };
  }

  /**
   * Get script analysis
   */
  public getScriptAnalysis(): ScriptAnalysis | null {
    return this.scriptAnalysis;
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<KaraokeHighlightSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Reset karaoke state
   */
  public reset(): void {
    this.state = {
      ...this.getInitialState(),
      scriptWords: this.state.scriptWords,
      totalSentences: this.state.totalSentences,
      sessionStartTime: Date.now(),
    };
    this.notifyStateChange();
  }

  /**
   * Start karaoke session
   */
  public start(): void {
    this.state.isActive = true;
    this.state.sessionStartTime = Date.now();
    this.notifyStateChange();
  }

  /**
   * Stop karaoke session
   */
  public stop(): void {
    this.state.isActive = false;
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.onStateChange?.(this.getState());
  }

  private getInitialState(): KaraokeState {
    return {
      currentWordIndex: 0,
      highlightedWords: [],
      matchedWords: [],
      scriptWords: [],
      isActive: false,
      currentSentence: 0,
      totalSentences: 0,
      accuracy: 0,
      wordsPerMinute: 0,
      sessionStartTime: Date.now(),
    };
  }

  private getDefaultSettings(): KaraokeHighlightSettings {
    return {
      enabled: true,
      highlightColor: '#FFD700',
      highlightBackgroundColor: 'rgba(255, 215, 0, 0.3)',
      autoScroll: true,
      scrollOffset: 100,
      matchThreshold: 0.7,
      highlightDuration: 1500,
      animationDuration: 200,
      fadeOutDelay: 500,
    };
  }
}

export const karaokeService = new KaraokeService();
