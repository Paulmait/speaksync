/**
 * AI Ethics type definitions for SpeakSync
 */

export interface AIEthicsSettings {
  enableBiasDetection: boolean;
  enableFairnessTesting: boolean;
  enableUserFeedback: boolean;
  enableAuditLogging: boolean;
  biasThreshold: number;
  diversityRequirement: number;
  transparencyLevel: 'basic' | 'detailed' | 'high';
  explainabilityMode: 'simple' | 'detailed' | 'technical';
  userConsentRequired: boolean;
  dataPrivacyEnabled: boolean;
  algorithmicAccountability: boolean;
  humanOversightEnabled: boolean;
  continuousMonitoring: boolean;
  ethicalReviewRequired: boolean;
  stakeholderEngagement: boolean;
  impactAssessment: boolean;
  remedialActions: boolean;
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
  complianceStandards: string[];
  ethicalPrinciples: string[];
}

export interface BiasDetectionResult {
  id: string;
  timestamp: Date;
  aiComponent: 'speech_to_text' | 'tone_analysis' | 'llm_suggestions';
  inputData: Record<string, unknown>;
  biasScore: number;
  biasType: BiasType[];
  detectedIssues: string[];
  recommendations: string[];
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigationApplied: boolean;
  userFeedback: AIFeedback | null;
  reviewStatus: 'pending' | 'reviewed' | 'resolved' | 'escalated';
}

export interface EthicsAuditResult {
  id: string;
  timestamp: Date;
  overallScore: number;
  complianceStatus: 'compliant' | 'partially_compliant' | 'non_compliant';
  findings: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  actionItems: ActionItem[];
  nextAuditDate: Date;
  auditedComponents: string[];
  reviewer: string;
  approved: boolean;
}

export interface AIFeedback {
  id: string;
  timestamp: Date;
  aiComponent: 'speech_to_text' | 'tone_analysis' | 'llm_suggestions';
  sessionId: string;
  rating: number;
  comment?: string;
  biasReport: boolean;
  specificIssues: string[];
  suggestions: string[];
  userId: string;
  context: Record<string, unknown>;
  resolved: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ActionItem {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  category: 'bias_mitigation' | 'compliance' | 'user_feedback' | 'system_improvement';
}

export type BiasType = 
  | 'demographic_bias'
  | 'representation_bias'
  | 'cultural_bias'
  | 'gender_bias'
  | 'age_bias'
  | 'language_bias'
  | 'accent_bias'
  | 'professional_bias'
  | 'socioeconomic_bias'
  | 'algorithmic_bias'
  | 'training_data_bias'
  | 'confirmation_bias'
  | 'selection_bias'
  | 'user_reported';

export interface BiasReport {
  id: string;
  userId: string;
  timestamp: Date;
  aiComponent: 'speech_to_text' | 'tone_analysis' | 'llm_suggestions';
  description: string;
  evidence?: string;
  impact: 'low' | 'medium' | 'high';
  status: 'submitted' | 'under_review' | 'resolved' | 'rejected';
  response?: string;
  actionTaken?: string[];
}

export interface FairnessMetric {
  metric: string;
  value: number;
  threshold: number;
  passed: boolean;
  description: string;
  recommendation?: string;
}

export interface DiversityMetric {
  category: string;
  representation: Record<string, number>;
  target: Record<string, number>;
  gaps: string[];
  recommendations: string[];
}

export interface TransparencyReport {
  id: string;
  timestamp: Date;
  aiComponent: 'speech_to_text' | 'tone_analysis' | 'llm_suggestions';
  modelInfo: {
    name: string;
    version: string;
    trainingData: string;
    limitations: string[];
    capabilities: string[];
  };
  decisionProcess: string;
  dataUsage: {
    dataTypes: string[];
    retentionPeriod: string;
    anonymization: boolean;
    sharingPolicy: string;
  };
  userRights: string[];
  contactInfo: string;
}

export interface EthicsPolicy {
  id: string;
  title: string;
  version: string;
  lastUpdated: Date;
  principles: EthicalPrinciple[];
  guidelines: Guideline[];
  procedures: Procedure[];
  complianceRequirements: ComplianceRequirement[];
}

export interface EthicalPrinciple {
  name: string;
  description: string;
  implementation: string[];
  metrics: string[];
}

export interface Guideline {
  category: string;
  rules: string[];
  examples: string[];
  exceptions: string[];
}

export interface Procedure {
  name: string;
  steps: string[];
  frequency: string;
  responsible: string[];
  documentation: string[];
}

export interface ComplianceRequirement {
  standard: string;
  requirements: string[];
  evidence: string[];
  assessmentFrequency: string;
  lastAssessment?: Date;
  nextAssessment: Date;
  status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'pending';
}

export interface AIImpactAssessment {
  id: string;
  timestamp: Date;
  aiComponent: 'speech_to_text' | 'tone_analysis' | 'llm_suggestions';
  scope: string;
  stakeholders: Stakeholder[];
  riskAssessment: RiskAssessment[];
  benefitAnalysis: BenefitAnalysis[];
  mitigationStrategies: MitigationStrategy[];
  monitoringPlan: MonitoringPlan;
  approver: string;
  approved: boolean;
}

export interface Stakeholder {
  group: string;
  interests: string[];
  concerns: string[];
  engagement: string;
}

export interface RiskAssessment {
  risk: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string[];
}

export interface BenefitAnalysis {
  benefit: string;
  stakeholders: string[];
  measurement: string;
  timeline: string;
}

export interface MitigationStrategy {
  risk: string;
  strategy: string;
  implementation: string[];
  timeline: string;
  responsible: string;
  metrics: string[];
}

export interface MonitoringPlan {
  metrics: string[];
  frequency: string;
  thresholds: Record<string, number>;
  alerts: AlertConfig[];
  reporting: ReportingConfig;
}

export interface AlertConfig {
  condition: string;
  recipients: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  escalation: string[];
}

export interface ReportingConfig {
  frequency: string;
  recipients: string[];
  format: string;
  content: string[];
  distribution: string;
}
