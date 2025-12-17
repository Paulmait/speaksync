/**
 * AI Ethics Service for SpeakSync
 * Handles bias detection, mitigation, and ethical AI practices
 */

import { AIEthicsSettings, BiasDetectionResult, EthicsAuditResult, AIFeedback } from '../types/aiEthicsTypes';
import { ErrorHandlingService } from './errorHandlingService';
import { ErrorCategory, ErrorSeverity } from '../types/errorTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AI_ETHICS_SETTINGS: '@speaksync/ai_ethics_settings',
  BIAS_REPORTS: '@speaksync/bias_reports',
  FEEDBACK_DATA: '@speaksync/ai_feedback'
};

const DEFAULT_ETHICS_SETTINGS: AIEthicsSettings = {
  enableBiasDetection: true,
  enableFairnessTesting: true,
  enableUserFeedback: true,
  enableAuditLogging: true,
  biasThreshold: 0.7,
  diversityRequirement: 0.8,
  transparencyLevel: 'high',
  explainabilityMode: 'detailed',
  userConsentRequired: true,
  dataPrivacyEnabled: true,
  algorithmicAccountability: true,
  humanOversightEnabled: true,
  continuousMonitoring: true,
  ethicalReviewRequired: true,
  stakeholderEngagement: true,
  impactAssessment: true,
  remedialActions: true,
  reportingFrequency: 'weekly',
  complianceStandards: ['IEEE', 'ISO', 'GDPR'],
  ethicalPrinciples: [
    'fairness',
    'transparency',
    'accountability',
    'privacy',
    'safety',
    'reliability',
    'inclusivity',
    'sustainability'
  ]
};

export class AIEthicsService {
  private static instance: AIEthicsService;
  private settings: AIEthicsSettings;
  private errorHandler: ErrorHandlingService;
  private feedbackData: AIFeedback[] = [];
  private biasReports: BiasDetectionResult[] = [];

  private constructor() {
    this.settings = DEFAULT_ETHICS_SETTINGS;
    this.errorHandler = ErrorHandlingService.getInstance();
    this.initialize();
  }

  static getInstance(): AIEthicsService {
    if (!AIEthicsService.instance) {
      AIEthicsService.instance = new AIEthicsService();
    }
    return AIEthicsService.instance;
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      await this.loadFeedbackData();
      await this.loadBiasReports();
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.MEDIUM,
        context: { method: 'initialize' }
      });
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.AI_ETHICS_SETTINGS);
      if (saved) {
        this.settings = { ...DEFAULT_ETHICS_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.LOW,
        context: { method: 'loadSettings' }
      });
    }
  }

  private async loadFeedbackData(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.FEEDBACK_DATA);
      if (saved) {
        this.feedbackData = JSON.parse(saved);
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.LOW,
        context: { method: 'loadFeedbackData' }
      });
    }
  }

  private async loadBiasReports(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.BIAS_REPORTS);
      if (saved) {
        this.biasReports = JSON.parse(saved);
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.LOW,
        context: { method: 'loadBiasReports' }
      });
    }
  }

  public async updateSettings(newSettings: Partial<AIEthicsSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(STORAGE_KEYS.AI_ETHICS_SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.MEDIUM,
        context: { method: 'updateSettings' }
      });
    }
  }

  public getSettings(): AIEthicsSettings {
    return { ...this.settings };
  }

  // Speech-to-Text Bias Detection
  public async detectSpeechBias(
    transcript: string,
    confidence: number,
    userDemographics: {
      age?: string;
      gender?: string;
      accent?: string;
      language?: string;
      dialect?: string;
    }
  ): Promise<BiasDetectionResult> {
    try {
      const result: BiasDetectionResult = {
        id: `bias_${Date.now()}_${Math.random()}`,
        timestamp: new Date(),
        aiComponent: 'speech_to_text',
        inputData: {
          transcript,
          confidence,
          demographics: userDemographics
        },
        biasScore: 0,
        biasType: [],
        detectedIssues: [],
        recommendations: [],
        confidence: confidence,
        severity: 'low',
        mitigationApplied: false,
        userFeedback: null,
        reviewStatus: 'pending'
      };

      // Detect potential bias based on confidence patterns
      if (confidence < 0.7) {
        result.biasScore += 0.3;
        result.detectedIssues.push('Low confidence transcription may indicate accent or dialect bias');
        result.recommendations.push('Consider using accent-adaptive models');
      }

      // Check for demographic-specific patterns
      if (userDemographics.accent && userDemographics.accent !== 'neutral') {
        result.biasScore += 0.2;
        result.detectedIssues.push('Non-neutral accent detected - monitor for accuracy disparities');
        result.recommendations.push('Ensure diverse accent training data');
      }

      // Analyze transcript for potentially biased interpretations
      const biasKeywords = ['um', 'uh', 'like', 'you know'];
      const biasCount = biasKeywords.reduce((count, keyword) => {
        return count + (transcript.toLowerCase().split(keyword).length - 1);
      }, 0);

      if (biasCount > 3) {
        result.biasScore += 0.1;
        result.detectedIssues.push('High filler word count may indicate speech pattern bias');
        result.recommendations.push('Consider filler word normalization');
      }

      // Determine bias type and severity
      if (result.biasScore > 0.5) {
        result.biasType.push('demographic_bias');
        result.severity = 'high';
      } else if (result.biasScore > 0.3) {
        result.biasType.push('representation_bias');
        result.severity = 'medium';
      }

      // Store the result
      this.biasReports.push(result);
      await this.saveBiasReports();

      return result;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.MEDIUM,
        context: { method: 'detectSpeechBias' }
      });
      throw error;
    }
  }

  // Tone Analysis Bias Detection
  public async detectToneBias(
    audioData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    toneResult: {
      emotions: Record<string, number>;
      confidence: number;
    },
    userDemographics: {
      age?: string;
      gender?: string;
      culturalBackground?: string;
    }
  ): Promise<BiasDetectionResult> {
    try {
      const result: BiasDetectionResult = {
        id: `tone_bias_${Date.now()}_${Math.random()}`,
        timestamp: new Date(),
        aiComponent: 'tone_analysis',
        inputData: {
          toneResult,
          demographics: userDemographics
        },
        biasScore: 0,
        biasType: [],
        detectedIssues: [],
        recommendations: [],
        confidence: toneResult.confidence,
        severity: 'low',
        mitigationApplied: false,
        userFeedback: null,
        reviewStatus: 'pending'
      };

      // Check for cultural bias in emotion interpretation
      if (userDemographics.culturalBackground) {
        const culturalBiasRisk = this.assessCulturalBias(
          toneResult.emotions,
          userDemographics.culturalBackground
        );
        result.biasScore += culturalBiasRisk;
        
        if (culturalBiasRisk > 0.3) {
          result.detectedIssues.push('Cultural bias detected in emotion interpretation');
          result.recommendations.push('Consider cultural context in emotion analysis');
        }
      }

      // Check for gender bias in tone interpretation
      if (userDemographics.gender) {
        const genderBiasRisk = this.assessGenderBias(
          toneResult.emotions,
          userDemographics.gender
        );
        result.biasScore += genderBiasRisk;
        
        if (genderBiasRisk > 0.3) {
          result.detectedIssues.push('Gender bias detected in tone analysis');
          result.recommendations.push('Ensure gender-neutral tone interpretation');
        }
      }

      // Determine severity and type
      if (result.biasScore > 0.5) {
        result.biasType.push('cultural_bias', 'gender_bias');
        result.severity = 'high';
      } else if (result.biasScore > 0.3) {
        result.biasType.push('representation_bias');
        result.severity = 'medium';
      }

      this.biasReports.push(result);
      await this.saveBiasReports();

      return result;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.MEDIUM,
        context: { method: 'detectToneBias' }
      });
      throw error;
    }
  }

  // LLM Suggestions Bias Detection
  public async detectLLMBias(
    prompt: string,
    suggestions: string[],
    userContext: {
      role?: string;
      industry?: string;
      experience?: string;
    }
  ): Promise<BiasDetectionResult> {
    try {
      const result: BiasDetectionResult = {
        id: `llm_bias_${Date.now()}_${Math.random()}`,
        timestamp: new Date(),
        aiComponent: 'llm_suggestions',
        inputData: {
          prompt,
          suggestions,
          context: userContext
        },
        biasScore: 0,
        biasType: [],
        detectedIssues: [],
        recommendations: [],
        confidence: 0.8,
        severity: 'low',
        mitigationApplied: false,
        userFeedback: null,
        reviewStatus: 'pending'
      };

      // Check for stereotypical language
      const stereotypeWords = this.detectStereotypicalLanguage(suggestions);
      if (stereotypeWords.length > 0) {
        result.biasScore += 0.4;
        result.detectedIssues.push(`Stereotypical language detected: ${stereotypeWords.join(', ')}`);
        result.recommendations.push('Review and replace stereotypical language');
      }

      // Check for inclusive language
      const inclusivityScore = this.assessInclusivity(suggestions);
      if (inclusivityScore < 0.7) {
        result.biasScore += 0.3;
        result.detectedIssues.push('Low inclusivity score in suggestions');
        result.recommendations.push('Enhance inclusive language in suggestions');
      }

      // Check for professional bias
      if (userContext.role) {
        const professionalBias = this.assessProfessionalBias(suggestions, userContext.role);
        result.biasScore += professionalBias;
        
        if (professionalBias > 0.3) {
          result.detectedIssues.push('Professional stereotyping detected');
          result.recommendations.push('Ensure role-neutral language');
        }
      }

      // Determine severity and type
      if (result.biasScore > 0.5) {
        result.biasType.push('language_bias', 'professional_bias');
        result.severity = 'high';
      } else if (result.biasScore > 0.3) {
        result.biasType.push('representation_bias');
        result.severity = 'medium';
      }

      this.biasReports.push(result);
      await this.saveBiasReports();

      return result;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.MEDIUM,
        context: { method: 'detectLLMBias' }
      });
      throw error;
    }
  }

  // User Feedback Collection
  public async collectUserFeedback(
    aiComponent: 'speech_to_text' | 'tone_analysis' | 'llm_suggestions',
    feedback: {
      rating: number;
      comment?: string;
      biasReport?: boolean;
      specificIssues?: string[];
      suggestions?: string[];
    },
    sessionId: string
  ): Promise<void> {
    try {
      const feedbackEntry: AIFeedback = {
        id: `feedback_${Date.now()}_${Math.random()}`,
        timestamp: new Date(),
        aiComponent,
        sessionId,
        rating: feedback.rating,
        comment: feedback.comment,
        biasReport: feedback.biasReport || false,
        specificIssues: feedback.specificIssues || [],
        suggestions: feedback.suggestions || [],
        userId: 'anonymous', // TODO: Get actual user ID
        context: {},
        resolved: false,
        priority: feedback.rating < 3 ? 'high' : 'medium'
      };

      this.feedbackData.push(feedbackEntry);
      await this.saveFeedbackData();

      // If bias is reported, create a bias report
      if (feedback.biasReport) {
        await this.createBiasReport(feedbackEntry);
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.MEDIUM,
        context: { method: 'collectUserFeedback' }
      });
    }
  }

  // Ethics Audit
  public async runEthicsAudit(): Promise<EthicsAuditResult> {
    try {
      const auditResult: EthicsAuditResult = {
        id: `audit_${Date.now()}`,
        timestamp: new Date(),
        overallScore: 0,
        complianceStatus: 'compliant',
        findings: [],
        recommendations: [],
        riskLevel: 'low',
        actionItems: [],
        nextAuditDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        auditedComponents: ['speech_to_text', 'tone_analysis', 'llm_suggestions'],
        reviewer: 'automated_system',
        approved: false
      };

      // Audit bias detection systems
      const biasFindings = await this.auditBiasDetection();
      auditResult.findings.push(...biasFindings);

      // Audit user feedback handling
      const feedbackFindings = await this.auditFeedbackHandling();
      auditResult.findings.push(...feedbackFindings);

      // Calculate overall score
      auditResult.overallScore = Math.max(0, 100 - (auditResult.findings.length * 10));

      // Determine compliance status
      if (auditResult.overallScore >= 80) {
        auditResult.complianceStatus = 'compliant';
        auditResult.riskLevel = 'low';
      } else if (auditResult.overallScore >= 60) {
        auditResult.complianceStatus = 'partially_compliant';
        auditResult.riskLevel = 'medium';
      } else {
        auditResult.complianceStatus = 'non_compliant';
        auditResult.riskLevel = 'high';
      }

      return auditResult;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.HIGH,
        context: { method: 'runEthicsAudit' }
      });
      throw error;
    }
  }

  // Helper methods
  private assessCulturalBias(emotions: Record<string, number>, culturalBackground: string): number {
    // Simplified cultural bias assessment
    // In practice, this would use more sophisticated cultural emotion mapping
    let biasRisk = 0;
    
    if (culturalBackground === 'east_asian' && emotions['anger'] && emotions['anger'] > 0.7) {
      biasRisk += 0.2; // May misinterpret cultural expression norms
    }
    
    if (culturalBackground === 'latin' && emotions['joy'] && emotions['joy'] < 0.3) {
      biasRisk += 0.1; // May under-detect positive emotions
    }
    
    return Math.min(biasRisk, 1.0);
  }

  private assessGenderBias(emotions: Record<string, number>, gender: string): number {
    // Simplified gender bias assessment
    let biasRisk = 0;
    
    if (gender === 'female' && emotions['assertiveness'] && emotions['assertiveness'] > 0.7) {
      biasRisk += 0.2; // May misinterpret assertiveness as aggression
    }
    
    if (gender === 'male' && emotions['sadness'] && emotions['sadness'] > 0.7) {
      biasRisk += 0.1; // May under-detect emotional expression
    }
    
    return Math.min(biasRisk, 1.0);
  }

  private detectStereotypicalLanguage(suggestions: string[]): string[] {
    const stereotypeWords = [
      'bossy', 'emotional', 'aggressive', 'weak', 'too sensitive',
      'naturally good at', 'not suited for', 'typical', 'obviously'
    ];
    
    const found: string[] = [];
    suggestions.forEach(suggestion => {
      stereotypeWords.forEach(word => {
        if (suggestion.toLowerCase().includes(word.toLowerCase())) {
          found.push(word);
        }
      });
    });
    
    return [...new Set(found)];
  }

  private assessInclusivity(suggestions: string[]): number {
    const inclusiveWords = [
      'everyone', 'all people', 'diverse', 'inclusive', 'accessible',
      'welcoming', 'respectful', 'considerate', 'understanding'
    ];
    
    let inclusiveCount = 0;
    suggestions.forEach(suggestion => {
      inclusiveWords.forEach(word => {
        if (suggestion.toLowerCase().includes(word.toLowerCase())) {
          inclusiveCount++;
        }
      });
    });
    
    return Math.min(inclusiveCount / suggestions.length, 1.0);
  }

  private assessProfessionalBias(suggestions: string[], role: string): number {
    // Simplified professional bias assessment
    // This would be more sophisticated in practice
    let biasRisk = 0;
    
    const roleStereotypes: Record<string, string[]> = {
      'engineer': ['technical', 'logical', 'antisocial'],
      'teacher': ['nurturing', 'patient', 'underpaid'],
      'doctor': ['authoritative', 'busy', 'wealthy'],
      'nurse': ['caring', 'subordinate', 'female']
    };
    
    const stereotypes = roleStereotypes[role.toLowerCase()] || [];
    suggestions.forEach(suggestion => {
      stereotypes.forEach(stereotype => {
        if (suggestion.toLowerCase().includes(stereotype.toLowerCase())) {
          biasRisk += 0.1;
        }
      });
    });
    
    return Math.min(biasRisk, 1.0);
  }

  private async auditBiasDetection(): Promise<string[]> {
    const findings: string[] = [];
    
    if (this.biasReports.length === 0) {
      findings.push('No bias detection reports generated - monitoring may be insufficient');
    }
    
    const highSeverityReports = this.biasReports.filter(r => r.severity === 'high');
    if (highSeverityReports.length > 0) {
      findings.push(`${highSeverityReports.length} high-severity bias issues detected`);
    }
    
    return findings;
  }

  private async auditFeedbackHandling(): Promise<string[]> {
    const findings: string[] = [];
    
    if (this.feedbackData.length === 0) {
      findings.push('No user feedback collected - engagement may be low');
    }
    
    const unresolved = this.feedbackData.filter(f => !f.resolved);
    if (unresolved.length > 0) {
      findings.push(`${unresolved.length} unresolved user feedback items`);
    }
    
    return findings;
  }

  private async createBiasReport(feedback: AIFeedback): Promise<void> {
    const biasReport: BiasDetectionResult = {
      id: `user_reported_${Date.now()}`,
      timestamp: new Date(),
      aiComponent: feedback.aiComponent,
      inputData: { userFeedback: feedback },
      biasScore: 0.8, // High score for user-reported bias
      biasType: ['user_reported'],
      detectedIssues: feedback.specificIssues || ['User reported bias'],
      recommendations: feedback.suggestions || ['Review and address user concerns'],
      confidence: 0.9,
      severity: 'high',
      mitigationApplied: false,
      userFeedback: feedback,
      reviewStatus: 'pending'
    };
    
    this.biasReports.push(biasReport);
    await this.saveBiasReports();
  }

  private async saveBiasReports(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BIAS_REPORTS, JSON.stringify(this.biasReports));
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.MEDIUM,
        context: { method: 'saveBiasReports' }
      });
    }
  }

  private async saveFeedbackData(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK_DATA, JSON.stringify(this.feedbackData));
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        category: ErrorCategory.AI_ETHICS,
        severity: ErrorSeverity.MEDIUM,
        context: { method: 'saveFeedbackData' }
      });
    }
  }

  // Public getters
  public getBiasReports(): BiasDetectionResult[] {
    return [...this.biasReports];
  }

  public getFeedbackData(): AIFeedback[] {
    return [...this.feedbackData];
  }

  public getEthicsMetrics(): {
    totalBiasReports: number;
    highSeverityIssues: number;
    averageUserRating: number;
    complianceScore: number;
  } {
    const highSeverityIssues = this.biasReports.filter(r => r.severity === 'high').length;
    const averageRating = this.feedbackData.length > 0 
      ? this.feedbackData.reduce((sum, f) => sum + f.rating, 0) / this.feedbackData.length
      : 0;
    
    return {
      totalBiasReports: this.biasReports.length,
      highSeverityIssues,
      averageUserRating: averageRating,
      complianceScore: Math.max(0, 100 - (highSeverityIssues * 10))
    };
  }
}

export const aiEthicsService = AIEthicsService.getInstance();
