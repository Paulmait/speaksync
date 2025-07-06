/**
 * User Consent Types for Legal Documents
 */

export interface UserConsentData {
  userId: string;
  hasAgreedToTerms: boolean;
  hasAgreedToPrivacy: boolean;
  hasAcknowledgedAI: boolean;
  
  // Version tracking
  agreedTermsVersion?: string;
  agreedPrivacyVersion?: string;
  acknowledgedAIVersion?: string;
  
  // Consent timestamps
  termsAgreedAt?: number;
  privacyAgreedAt?: number;
  aiAcknowledgedAt?: number;
  
  // AI data usage consent (granular)
  aiDataUsageConsent?: {
    allowDataCollection: boolean;
    allowAIImprovement: boolean;
    consentedAt: number;
    version: string;
  };
  
  // Last consent check
  lastConsentCheck?: number;
  
  // Consent history
  consentHistory?: ConsentHistoryEntry[];
}

export interface ConsentHistoryEntry {
  documentType: 'terms' | 'privacy' | 'ai' | 'ai-data';
  action: 'agreed' | 'acknowledged' | 'declined' | 'updated';
  version: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentRequirement {
  documentType: 'terms' | 'privacy' | 'ai';
  currentVersion: string;
  userVersion?: string;
  isRequired: boolean;
  hasConsented: boolean;
  needsUpdate: boolean;
}

export interface ConsentStatus {
  isCompliant: boolean;
  pendingConsents: ConsentRequirement[];
  hasAgreedToAll: boolean;
  needsUpdate: boolean;
  lastChecked: number;
}

export interface OnboardingConsentData {
  agreedToTerms: boolean;
  acknowledgedPrivacy: boolean;
  acknowledgedAI: boolean;
  aiDataUsageConsent: boolean;
  consentedAt: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface PolicyUpdateData {
  documentType: 'terms' | 'privacy' | 'ai';
  previousVersion: string;
  newVersion: string;
  effectiveDate: number;
  requiresConsent: boolean;
  summary?: string;
  changes?: string[];
}
