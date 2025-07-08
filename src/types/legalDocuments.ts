/**
 * Legal Documents Types for SpeakSync
 * Backend system for managing versioned legal documents
 */

export interface LegalDocument {
  id: string;
  name: string;
  version: string;
  effectiveDate: number; // Unix timestamp
  content: string;
  isActive: boolean;
  createdBy?: string; // Admin user ID
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  metadata?: LegalDocumentMetadata;
}

export interface LegalDocumentMetadata {
  wordCount?: number;
  estimatedReadingTime?: number; // in minutes
  language?: string;
  format?: 'markdown' | 'html' | 'plain';
  category?: 'privacy' | 'terms' | 'ai' | 'cookies' | 'dmca' | 'other';
  tags?: string[];
  lastReviewedBy?: string;
  nextReviewDate?: number;
}

export interface LegalDocumentVersion {
  id: string;
  documentId: string;
  version: string;
  content: string;
  effectiveDate: number;
  isActive: boolean;
  changelog?: string;
  createdBy: string;
  createdAt: number;
}

export interface LegalDocumentHistory {
  documentId: string;
  versions: LegalDocumentVersion[];
  totalVersions: number;
  firstVersion: string;
  latestVersion: string;
  lastUpdated: number;
}

// Predefined legal document types
export enum LegalDocumentType {
  TERMS_OF_USE = 'termsOfUse',
  PRIVACY_POLICY = 'privacyPolicy',
  AI_DISCLAIMER = 'aiDisclaimer',
  COOKIE_POLICY = 'cookiePolicy',
  DMCA_POLICY = 'dmcaPolicy',
  COMMUNITY_GUIDELINES = 'communityGuidelines',
  DATA_PROCESSING_AGREEMENT = 'dataProcessingAgreement',
  END_USER_LICENSE = 'endUserLicense'
}

// Legal document templates
export interface LegalDocumentTemplate {
  type: LegalDocumentType;
  name: string;
  description: string;
  requiredSections: string[];
  template: string;
  lastModified: number;
}

// Admin operations interface
export interface LegalDocumentAdmin {
  createDocument: (document: Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDocument: (documentId: string, updates: Partial<LegalDocument>) => Promise<void>;
  createNewVersion: (documentId: string, content: string, version: string, effectiveDate?: number) => Promise<void>;
  activateVersion: (documentId: string, version: string) => Promise<void>;
  deactivateDocument: (documentId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  getDocumentHistory: (documentId: string) => Promise<LegalDocumentHistory>;
}

// Public read-only interface
export interface LegalDocumentReader {
  getActiveDocument: (type: LegalDocumentType) => Promise<LegalDocument | null>;
  getAllActiveDocuments: () => Promise<LegalDocument[]>;
  getDocumentByVersion: (type: LegalDocumentType, version: string) => Promise<LegalDocument | null>;
  getDocumentEffectiveDate: (type: LegalDocumentType) => Promise<number | null>;
}

// User acceptance tracking
export interface UserLegalAcceptance {
  userId: string;
  documentType: LegalDocumentType;
  documentVersion: string;
  acceptedAt: number;
  ipAddress?: string;
  userAgent?: string;
  acceptanceMethod: 'explicit' | 'implicit' | 'registration' | 'update';
  isCurrentVersion: boolean;
}

export interface UserLegalStatus {
  userId: string;
  acceptances: UserLegalAcceptance[];
  lastUpdated: number;
  pendingAcceptances: LegalDocumentType[];
  isCompliant: boolean;
}
