import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';

export interface ScriptContext {
  fullScript: string;
  currentPosition: number;
  recentTranscript: string;
  pauseDuration: number;
  isDeviation: boolean;
  userRequestedHelp: boolean;
}

export interface AiSuggestion {
  type: 'next_phrase' | 'transition' | 'rephrase' | 'continuation';
  text: string;
  confidence: number;
  reasoning: string;
  timestamp: number;
}

export interface AiPromptingSettings {
  enabled: boolean;
  pauseThreshold: number; // seconds before triggering
  deviationThreshold: number; // similarity threshold for deviation detection
  suggestionDisplay: 'subtle' | 'prominent' | 'floating';
  autoTrigger: boolean;
  businessTierOnly: boolean;
}

export interface AiSessionData {
  sessionId: string;
  startTime: number;
  suggestions: AiSuggestion[];
  userAcceptanceRate: number;
  averageResponseTime: number;
  totalPauses: number;
  totalDeviations: number;
}

class GeminiAiService {
  private static instance: GeminiAiService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private chatSession: ChatSession | null = null;
  private isInitialized = false;
  private currentSession: AiSessionData | null = null;
  private suggestionListeners: Array<(suggestion: AiSuggestion) => void> = [];
  private settings: AiPromptingSettings = {
    enabled: true,
    pauseThreshold: 3, // 3 seconds
    deviationThreshold: 0.7, // 70% similarity
    suggestionDisplay: 'subtle',
    autoTrigger: true,
    businessTierOnly: true,
  };

  static getInstance(): GeminiAiService {
    if (!GeminiAiService.instance) {
      GeminiAiService.instance = new GeminiAiService();
    }
    return GeminiAiService.instance;
  }

  async initialize(apiKey: string): Promise<void> {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      
      // Use Gemini 1.5 Flash for low latency
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 150, // Keep responses concise for low latency
        },
      });

      this.isInitialized = true;
      console.log('[GeminiAI] Service initialized successfully');
    } catch (error) {
      console.error('[GeminiAI] Failed to initialize:', error);
      throw error;
    }
  }

  startAiSession(sessionId: string): void {
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      suggestions: [],
      userAcceptanceRate: 0,
      averageResponseTime: 0,
      totalPauses: 0,
      totalDeviations: 0,
    };

    // Start new chat session for context continuity
    if (this.model) {
      this.chatSession = this.model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "You are an AI assistant helping with teleprompter presentations. Your role is to provide subtle, helpful suggestions when the presenter pauses, deviates from script, or requests help. Keep responses very concise (1-2 sentences max) and contextually relevant." }],
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'll provide concise, contextual suggestions to help with your teleprompter presentation. I'll focus on natural transitions, next phrases, and helpful rephrasing when needed." }],
          },
        ],
      });
    }

    console.log(`[GeminiAI] Started AI session: ${sessionId}`);
  }

  endAiSession(): AiSessionData | null {
    if (!this.currentSession) return null;

    // Calculate final statistics
    this.calculateSessionStatistics();

    const sessionData = { ...this.currentSession };
    this.currentSession = null;
    this.chatSession = null;

    console.log(`[GeminiAI] Ended AI session: ${sessionData.sessionId}`);
    return sessionData;
  }

  async generateSuggestion(context: ScriptContext): Promise<AiSuggestion | null> {
    if (!this.isInitialized || !this.settings.enabled || !this.chatSession) {
      return null;
    }

    // Check if business tier is required
    if (this.settings.businessTierOnly) {
      // TODO: Integrate with subscription service to check tier
      // For now, assume access is granted
    }

    const startTime = Date.now();

    try {
      const prompt = this.buildContextualPrompt(context);
      const result = await this.chatSession.sendMessage(prompt);
      const response = result.response.text();

      const suggestion: AiSuggestion = {
        type: this.determineSuggestionType(context),
        text: response.trim(),
        confidence: this.calculateConfidence(context, response),
        reasoning: this.generateReasoning(context),
        timestamp: Date.now(),
      };

      // Add to current session
      if (this.currentSession) {
        this.currentSession.suggestions.push(suggestion);
        this.updateSessionMetrics(startTime);
      }

      // Notify listeners
      this.notifySuggestionListeners(suggestion);

      return suggestion;
    } catch (error) {
      console.error('[GeminiAI] Error generating suggestion:', error);
      return null;
    }
  }

  private buildContextualPrompt(context: ScriptContext): string {
    const { fullScript, currentPosition, recentTranscript, pauseDuration, isDeviation, userRequestedHelp } = context;

    // Extract surrounding context (100 characters before and after current position)
    const beforeContext = fullScript.substring(Math.max(0, currentPosition - 100), currentPosition);
    const afterContext = fullScript.substring(currentPosition, Math.min(fullScript.length, currentPosition + 100));

    let prompt = '';

    if (userRequestedHelp) {
      prompt = `User requested help. Script context: "${beforeContext}[CURRENT]${afterContext}". Recent speech: "${recentTranscript}". Provide a helpful suggestion.`;
    } else if (isDeviation) {
      prompt = `User deviated from script. Expected: "${afterContext.substring(0, 50)}". Actually said: "${recentTranscript}". Suggest how to get back on track naturally.`;
    } else if (pauseDuration > this.settings.pauseThreshold) {
      prompt = `User paused for ${pauseDuration}s. Next in script: "${afterContext.substring(0, 50)}". Suggest the next phrase or a natural continuation.`;
    } else {
      prompt = `General help request. Current script context: "${beforeContext}[CURRENT]${afterContext}". Provide a contextual suggestion.`;
    }

    return prompt + ' Keep response under 20 words and naturally flowing.';
  }

  private determineSuggestionType(context: ScriptContext): AiSuggestion['type'] {
    if (context.userRequestedHelp) return 'continuation';
    if (context.isDeviation) return 'rephrase';
    if (context.pauseDuration > this.settings.pauseThreshold) return 'next_phrase';
    return 'transition';
  }

  private calculateConfidence(context: ScriptContext, response: string): number {
    // Simple confidence calculation based on context quality and response length
    let confidence = 0.7; // Base confidence

    // Higher confidence for direct help requests
    if (context.userRequestedHelp) confidence += 0.2;
    
    // Lower confidence for very long pauses (might be intentional)
    if (context.pauseDuration > 10) confidence -= 0.1;
    
    // Adjust based on response length (sweet spot is 10-20 words)
    const wordCount = response.split(' ').length;
    if (wordCount >= 10 && wordCount <= 20) confidence += 0.1;
    else if (wordCount > 30) confidence -= 0.2;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private generateReasoning(context: ScriptContext): string {
    if (context.userRequestedHelp) return 'User explicitly requested assistance';
    if (context.isDeviation) return 'Detected deviation from script content';
    if (context.pauseDuration > this.settings.pauseThreshold) return `Extended pause detected (${context.pauseDuration}s)`;
    return 'Providing contextual assistance';
  }

  private calculateSessionStatistics(): void {
    if (!this.currentSession || this.currentSession.suggestions.length === 0) return;

    const suggestions = this.currentSession.suggestions;
    
    // Calculate average response time (mock data for now)
    this.currentSession.averageResponseTime = 1.2; // seconds

    // Count pauses and deviations
    this.currentSession.totalPauses = suggestions.filter(s => s.type === 'next_phrase').length;
    this.currentSession.totalDeviations = suggestions.filter(s => s.type === 'rephrase').length;

    // Mock user acceptance rate (would be tracked via user interactions)
    this.currentSession.userAcceptanceRate = 0.75;
  }

  private updateSessionMetrics(startTime: number): void {
    if (!this.currentSession) return;

    const responseTime = (Date.now() - startTime) / 1000;
    const suggestions = this.currentSession.suggestions;
    
    // Update running average
    this.currentSession.averageResponseTime = 
      (this.currentSession.averageResponseTime * (suggestions.length - 1) + responseTime) / suggestions.length;
  }

  // Settings management
  updateSettings(newSettings: Partial<AiPromptingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('[GeminiAI] Settings updated:', this.settings);
  }

  getSettings(): AiPromptingSettings {
    return { ...this.settings };
  }

  // Listener management
  addSuggestionListener(listener: (suggestion: AiSuggestion) => void): void {
    this.suggestionListeners.push(listener);
  }

  removeSuggestionListener(listener: (suggestion: AiSuggestion) => void): void {
    this.suggestionListeners = this.suggestionListeners.filter(l => l !== listener);
  }

  private notifySuggestionListeners(suggestion: AiSuggestion): void {
    this.suggestionListeners.forEach(listener => {
      try {
        listener(suggestion);
      } catch (error) {
        console.error('[GeminiAI] Error in suggestion listener:', error);
      }
    });
  }

  // Utility methods
  isSessionActive(): boolean {
    return this.currentSession !== null;
  }

  getCurrentSessionId(): string | null {
    return this.currentSession?.sessionId || null;
  }

  getSessionSuggestions(): AiSuggestion[] {
    return this.currentSession?.suggestions || [];
  }

  // Detection helpers
  detectScriptDeviation(expected: string, actual: string): boolean {
    // Simple similarity check - in production, use more sophisticated NLP
    const expectedWords = expected.toLowerCase().split(' ').slice(0, 10);
    const actualWords = actual.toLowerCase().split(' ');
    
    const commonWords = expectedWords.filter(word => actualWords.includes(word));
    const similarity = commonWords.length / expectedWords.length;
    
    return similarity < this.settings.deviationThreshold;
  }

  shouldTriggerSuggestion(pauseDuration: number, isDeviation: boolean, userRequested: boolean): boolean {
    if (!this.settings.enabled) return false;
    if (userRequested) return true;
    if (isDeviation && this.settings.autoTrigger) return true;
    if (pauseDuration >= this.settings.pauseThreshold && this.settings.autoTrigger) return true;
    
    return false;
  }

  // Get API key from environment
  static getApiKey(): string {
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  }
}

export default GeminiAiService;
