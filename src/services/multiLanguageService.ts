/**
 * Multi-Language Service for SpeakSync
 * Handles language detection, selection, and STT engine switching
 */

import { LanguageOption, ScriptLanguage, MultiLanguageSettings, ExtendedScript } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported languages with Deepgram model mappings
const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    rtl: false,
    flag: '🇺🇸',
    deepgramModel: 'general',
    supported: true
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    rtl: false,
    flag: '🇪🇸',
    deepgramModel: 'general-es',
    supported: true
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    rtl: false,
    flag: '🇫🇷',
    deepgramModel: 'general-fr',
    supported: true
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    rtl: false,
    flag: '🇩🇪',
    deepgramModel: 'general-de',
    supported: true
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    rtl: false,
    flag: '🇮🇹',
    deepgramModel: 'general-it',
    supported: true
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    rtl: false,
    flag: '🇵🇹',
    deepgramModel: 'general-pt',
    supported: true
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    rtl: false,
    flag: '🇷🇺',
    deepgramModel: 'general-ru',
    supported: true
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    rtl: false,
    flag: '🇯🇵',
    deepgramModel: 'general-ja',
    supported: true
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    rtl: false,
    flag: '🇰🇷',
    deepgramModel: 'general-ko',
    supported: true
  },
  {
    code: 'zh',
    name: 'Chinese (Mandarin)',
    nativeName: '中文',
    rtl: false,
    flag: '🇨🇳',
    deepgramModel: 'general-zh',
    supported: true
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true,
    flag: '🇸🇦',
    deepgramModel: 'general-ar',
    supported: true
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    rtl: true,
    flag: '🇮🇱',
    deepgramModel: 'general-he',
    supported: true
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    rtl: false,
    flag: '🇮🇳',
    deepgramModel: 'general-hi',
    supported: true
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    rtl: false,
    flag: '🇹🇷',
    deepgramModel: 'general-tr',
    supported: true
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    rtl: false,
    flag: '🇳🇱',
    deepgramModel: 'general-nl',
    supported: true
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    rtl: false,
    flag: '🇸🇪',
    deepgramModel: 'general-sv',
    supported: true
  },
  {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    rtl: false,
    flag: '🇳🇴',
    deepgramModel: 'general-no',
    supported: true
  },
  {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    rtl: false,
    flag: '🇩🇰',
    deepgramModel: 'general-da',
    supported: true
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    rtl: false,
    flag: '🇵🇱',
    deepgramModel: 'general-pl',
    supported: true
  },
  {
    code: 'cs',
    name: 'Czech',
    nativeName: 'Čeština',
    rtl: false,
    flag: '🇨🇿',
    deepgramModel: 'general-cs',
    supported: true
  }
];

class MultiLanguageService {
  private static instance: MultiLanguageService;
  private settings: MultiLanguageSettings;
  private scriptLanguages: Map<string, ScriptLanguage> = new Map();
  private languageDetectionCache: Map<string, LanguageOption> = new Map();

  private constructor() {
    this.settings = {
      autoDetectLanguage: true,
      defaultLanguage: SUPPORTED_LANGUAGES[0] || { code: 'en', name: 'English', nativeName: 'English' },
      fallbackLanguage: SUPPORTED_LANGUAGES[0] || { code: 'en', name: 'English', nativeName: 'English' },
      enableRTLSupport: true,
      showLanguageFlags: true,
      enableTranslationSuggestions: false
    };
    this.loadSettings();
  }

  static getInstance(): MultiLanguageService {
    if (!MultiLanguageService.instance) {
      MultiLanguageService.instance = new MultiLanguageService();
    }
    return MultiLanguageService.instance;
  }

  // Language Management
  getSupportedLanguages(): LanguageOption[] {
    return SUPPORTED_LANGUAGES.filter(lang => lang.supported);
  }

  getLanguageByCode(code: string): LanguageOption | null {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || null;
  }

  getDefaultLanguage(): LanguageOption {
    return this.settings.defaultLanguage;
  }

  getLanguagesByRegion(region: 'europe' | 'asia' | 'americas' | 'africa' | 'middle_east'): LanguageOption[] {
    const regionMap: { [key: string]: string[] } = {
      europe: ['en', 'es', 'fr', 'de', 'it', 'ru', 'nl', 'sv', 'no', 'da', 'pl', 'cs'],
      asia: ['ja', 'ko', 'zh', 'hi', 'tr'],
      americas: ['en', 'es', 'pt'],
      africa: ['ar', 'en', 'fr'],
      middle_east: ['ar', 'he', 'tr']
    };

    const codes = regionMap[region] || [];
    return SUPPORTED_LANGUAGES.filter(lang => codes.includes(lang.code) && lang.supported);
  }

  // Language Detection
  async detectLanguage(text: string): Promise<LanguageOption | null> {
    const cacheKey = this.hashText(text);
    
    if (this.languageDetectionCache.has(cacheKey)) {
      return this.languageDetectionCache.get(cacheKey)!;
    }

    try {
      const detectedLanguage = await this.performLanguageDetection(text);
      
      if (detectedLanguage) {
        this.languageDetectionCache.set(cacheKey, detectedLanguage);
      }
      
      return detectedLanguage;
    } catch (error) {
      console.error('Language detection failed:', error);
      return this.settings.defaultLanguage;
    }
  }

  private async performLanguageDetection(text: string): Promise<LanguageOption | null> {
    // Simple heuristic-based detection for common languages
    // In production, you might want to use a proper language detection library
    
    const cleanText = text.toLowerCase().trim();
    const words = cleanText.split(/\s+/).slice(0, 50); // Analyze first 50 words
    
    // Character-based detection for non-Latin scripts
    if (this.containsArabicScript(text)) {
      return this.getLanguageByCode('ar');
    }
    
    if (this.containsHebrewScript(text)) {
      return this.getLanguageByCode('he');
    }
    
    if (this.containsChineseScript(text)) {
      return this.getLanguageByCode('zh');
    }
    
    if (this.containsJapaneseScript(text)) {
      return this.getLanguageByCode('ja');
    }
    
    if (this.containsKoreanScript(text)) {
      return this.getLanguageByCode('ko');
    }
    
    if (this.containsHindiScript(text)) {
      return this.getLanguageByCode('hi');
    }
    
    if (this.containsRussianScript(text)) {
      return this.getLanguageByCode('ru');
    }
    
    // Word-based detection for Latin script languages
    const languageScores = this.calculateLanguageScores(words);
    const bestMatch = this.getBestLanguageMatch(languageScores);
    
    return bestMatch;
  }

  private containsArabicScript(text: string): boolean {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  }

  private containsHebrewScript(text: string): boolean {
    return /[\u0590-\u05FF\uFB1D-\uFB4F]/.test(text);
  }

  private containsChineseScript(text: string): boolean {
    return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text);
  }

  private containsJapaneseScript(text: string): boolean {
    return /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]/.test(text);
  }

  private containsKoreanScript(text: string): boolean {
    return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
  }

  private containsHindiScript(text: string): boolean {
    return /[\u0900-\u097F]/.test(text);
  }

  private containsRussianScript(text: string): boolean {
    return /[\u0400-\u04FF]/.test(text);
  }

  private calculateLanguageScores(words: string[]): Map<string, number> {
    // Common words and patterns for different languages
    const languagePatterns: { [key: string]: { words: string[], patterns: RegExp[] } } = {
      en: {
        words: ['the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are'],
        patterns: [/ing$/, /tion$/, /ly$/]
      },
      es: {
        words: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da'],
        patterns: [/ción$/, /mente$/, /ando$/]
      },
      fr: {
        words: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son'],
        patterns: [/tion$/, /ment$/, /eur$/]
      },
      de: {
        words: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im'],
        patterns: [/ung$/, /keit$/, /lich$/]
      },
      it: {
        words: ['il', 'di', 'che', 'e', 'la', 'un', 'a', 'per', 'non', 'in', 'una', 'sono', 'mi', 'ho', 'lo'],
        patterns: [/zione$/, /mente$/, /are$/]
      }
    };

    const scores = new Map<string, number>();

    Object.keys(languagePatterns).forEach(langCode => {
      let score = 0;
      const { words: commonWords, patterns } = languagePatterns[langCode] || { words: [], patterns: [] };

      // Score based on common words
      words.forEach(word => {
        if (commonWords.includes(word)) {
          score += 2;
        }
      });

      // Score based on patterns
      words.forEach(word => {
        patterns.forEach(pattern => {
          if (pattern.test(word)) {
            score += 1;
          }
        });
      });

      scores.set(langCode, score);
    });

    return scores;
  }

  private getBestLanguageMatch(scores: Map<string, number>): LanguageOption | null {
    let bestScore = 0;
    let bestLanguage: string | null = null;

    scores.forEach((score, langCode) => {
      if (score > bestScore) {
        bestScore = score;
        bestLanguage = langCode;
      }
    });

    if (bestLanguage && bestScore > 0) {
      return this.getLanguageByCode(bestLanguage);
    }

    return this.settings.defaultLanguage;
  }

  // Script Language Management
  async setScriptLanguage(scriptId: string, language: LanguageOption, userOverride: boolean = true): Promise<void> {
    const scriptLanguage: ScriptLanguage = {
      scriptId,
      language,
      userOverride
    };

    this.scriptLanguages.set(scriptId, scriptLanguage);
    await this.saveScriptLanguages();
  }

  getScriptLanguage(scriptId: string): ScriptLanguage | null {
    return this.scriptLanguages.get(scriptId) || null;
  }

  async autoDetectScriptLanguage(script: ExtendedScript): Promise<LanguageOption | null> {
    if (!this.settings.autoDetectLanguage) {
      return this.settings.defaultLanguage;
    }

    const detected = await this.detectLanguage(script.content);
    
    if (detected) {
      await this.setScriptLanguage(script.id, detected, false);
    }

    return detected;
  }

  // Text Direction and RTL Support
  getTextDirection(language: LanguageOption): 'ltr' | 'rtl' {
    return language.rtl ? 'rtl' : 'ltr';
  }

  isRTLLanguage(languageCode: string): boolean {
    const language = this.getLanguageByCode(languageCode);
    return language?.rtl || false;
  }

  // Character Set Analysis
  analyzeCharacterSet(text: string): string {
    const charSets: string[] = [];

    if (/[a-zA-Z]/.test(text)) charSets.push('Latin');
    if (/[\u0400-\u04FF]/.test(text)) charSets.push('Cyrillic');
    if (/[\u0600-\u06FF]/.test(text)) charSets.push('Arabic');
    if (/[\u0590-\u05FF]/.test(text)) charSets.push('Hebrew');
    if (/[\u4E00-\u9FFF]/.test(text)) charSets.push('CJK');
    if (/[\u0900-\u097F]/.test(text)) charSets.push('Devanagari');

    return charSets.join(', ') || 'Unknown';
  }

  // Deepgram Integration
  getDeepgramModel(language: LanguageOption): string {
    return language.deepgramModel;
  }

  getDeepgramConfig(language: LanguageOption): any {
    return {
      model: language.deepgramModel,
      language: language.code,
      punctuate: true,
      diarize: false,
      smart_format: true,
      utterances: true
    };
  }

  // Settings Management
  async updateSettings(settings: Partial<MultiLanguageSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();
  }

  getSettings(): MultiLanguageSettings {
    return { ...this.settings };
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem('multiLanguageSettings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Failed to load multi-language settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('multiLanguageSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save multi-language settings:', error);
    }
  }

  private async saveScriptLanguages(): Promise<void> {
    try {
      const data = Array.from(this.scriptLanguages.entries());
      await AsyncStorage.setItem('scriptLanguages', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save script languages:', error);
    }
  }

  async loadScriptLanguages(): Promise<void> {
    try {
      const savedData = await AsyncStorage.getItem('scriptLanguages');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.scriptLanguages = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load script languages:', error);
    }
  }

  // Utility Methods
  private hashText(text: string): string {
    // Simple hash function for caching
    let hash = 0;
    const subset = text.substring(0, 200); // Use first 200 chars for hash
    for (let i = 0; i < subset.length; i++) {
      const char = subset.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Statistics and Analytics
  getLanguageUsageStats(): { [languageCode: string]: number } {
    const stats: { [languageCode: string]: number } = {};
    
    this.scriptLanguages.forEach(scriptLang => {
      const code = scriptLang.language.code;
      stats[code] = (stats[code] || 0) + 1;
    });

    return stats;
  }

  getMostUsedLanguages(limit: number = 5): LanguageOption[] {
    const stats = this.getLanguageUsageStats();
    const sorted = Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    return sorted
      .map(([code]) => this.getLanguageByCode(code))
      .filter((lang): lang is LanguageOption => lang !== null);
  }
}

export default MultiLanguageService;
