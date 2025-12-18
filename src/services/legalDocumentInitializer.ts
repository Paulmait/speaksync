/**
 * Initialize Legal Documents
 * This script creates the initial legal documents for SpeakSync
 */

import { legalDocumentService } from './legalDocumentService';
import { adminManagementService } from './adminManagementService';
import { LegalDocumentType } from '../types/legalDocuments';
import { LoggingService } from './loggingService';

interface InitialLegalDocument {
  type: LegalDocumentType;
  name: string;
  content: string;
  version: string;
}

const INITIAL_LEGAL_DOCUMENTS: InitialLegalDocument[] = [
  {
    type: LegalDocumentType.PRIVACY_POLICY,
    name: 'Privacy Policy',
    version: '1.0',
    content: `
# SpeakSync Privacy Policy

**Effective Date:** [DATE]

## Introduction

Welcome to SpeakSync. This Privacy Policy explains how we collect, use, and protect your information when you use our teleprompter application and services.

## Information We Collect

### Account Information
- Email address
- Name
- Profile information

### Content Data
- Scripts you create
- Teleprompter usage data
- App preferences and settings

### Technical Data
- Device information
- Usage analytics
- Performance metrics

## How We Use Your Information

We use your information to:
- Provide and improve our services
- Sync your data across devices
- Provide customer support
- Send important service updates

## Data Storage and Security

Your data is stored securely using industry-standard encryption and security measures. We implement appropriate safeguards to protect your personal information.

## Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your account and data
- Export your data

## Contact Us

If you have questions about this Privacy Policy, please contact us at privacy@speaksync.com.

This policy may be updated from time to time. We will notify you of any significant changes.
    `.trim(),
  },
  {
    type: LegalDocumentType.TERMS_OF_USE,
    name: 'Terms of Use',
    version: '1.0',
    content: `
# SpeakSync Terms of Use

**Effective Date:** [DATE]

## Acceptance of Terms

By using SpeakSync, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our service.

## Description of Service

SpeakSync is a professional teleprompter application that allows users to create, edit, and display scripts with cloud synchronization capabilities.

## User Accounts

- You must provide accurate information when creating an account
- You are responsible for maintaining the security of your account
- You must notify us immediately of any unauthorized use

## Acceptable Use

You agree to use SpeakSync only for lawful purposes and in accordance with these Terms. You may not:
- Use the service for any illegal activities
- Attempt to interfere with the service's security
- Upload malicious content or viruses
- Share your account credentials with others

## Intellectual Property

- You retain ownership of the content you create
- SpeakSync retains ownership of the application and its features
- You grant us a license to store and sync your content as part of the service

## Limitation of Liability

SpeakSync is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.

## Termination

We may terminate your account if you violate these terms. You may terminate your account at any time by contacting us.

## Changes to Terms

We may update these terms from time to time. We will notify you of any significant changes.

## Contact Information

For questions about these Terms of Use, please contact us at legal@speaksync.com.
    `.trim(),
  },
  {
    type: LegalDocumentType.AI_DISCLAIMER,
    name: 'AI Features Disclaimer',
    version: '1.0',
    content: `
# SpeakSync AI Features Disclaimer

**Effective Date:** [DATE]

## AI-Powered Features

SpeakSync includes AI-powered features designed to enhance your teleprompter experience. These features may include:
- Content suggestions
- Script optimization
- Performance analytics
- Smart formatting

## Important Disclaimers

### Accuracy and Reliability
- AI suggestions are provided for assistance only
- Users should review and verify all AI-generated content
- AI features may not always produce perfect results
- Final responsibility for content accuracy lies with the user

### Data Processing
- AI features may process your script content to provide suggestions
- Data is processed securely and in accordance with our Privacy Policy
- We do not use your content to train AI models without explicit consent

### Limitations
- AI features depend on internet connectivity
- Performance may vary based on content type and complexity
- Features may be unavailable during maintenance or updates

### User Responsibilities
- Review all AI suggestions before use
- Ensure content appropriateness for your intended use
- Understand that AI is a tool to assist, not replace human judgment

## Feedback and Improvement

We continuously work to improve our AI features based on user feedback and technological advances. Your feedback helps us provide better service.

## Contact Us

If you have questions about our AI features, please contact us at ai-support@speaksync.com.
    `.trim(),
  },
];

class LegalDocumentInitializer {
  private logger = LoggingService.getInstance();

  /**
   * Initialize all legal documents
   * This should be run once during initial setup by a super admin
   */
  async initializeAllDocuments(adminUserId: string): Promise<void> {
    try {
      // Verify admin permissions
      const isAdmin = await adminManagementService.isAdmin(adminUserId);
      if (!isAdmin) {
        throw new Error('Only admins can initialize legal documents');
      }

      this.logger.info('Starting legal documents initialization...');

      for (const docData of INITIAL_LEGAL_DOCUMENTS) {
        try {
          // Create the document (use type as the identifier name)
          const documentId = await legalDocumentService.createDocument({
            name: docData.type, // Use type enum value as document name/identifier
            content: docData.content,
            version: docData.version,
            effectiveDate: Date.now(),
            isActive: true,
            metadata: {
              format: 'markdown',
              category: 'privacy', // Default category
              language: 'en',
              wordCount: docData.content.split(/\s+/).length,
              estimatedReadingTime: Math.ceil(docData.content.split(/\s+/).length / 200), // 200 words per minute
            },
          });

          // Activate the document version
          await legalDocumentService.activateVersion(documentId, docData.version);

          this.logger.info(`✓ Initialized: ${docData.name} (${docData.type})`);
        } catch (error) {
          this.logger.error(`✗ Failed to initialize ${docData.name}:`, error instanceof Error ? error : new Error('Unknown error'));
        }
      }

      this.logger.info('Legal documents initialization completed!');
    } catch (error) {
      this.logger.error('Failed to initialize legal documents:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Update a specific legal document with a new version
   */
  async updateDocument(
    type: LegalDocumentType,
    newContent: string,
    newVersion: string,
    adminUserId: string,
    changelog?: string
  ): Promise<void> {
    try {
      const isAdmin = await adminManagementService.isAdmin(adminUserId);
      if (!isAdmin) {
        throw new Error('Only admins can update legal documents');
      }

      // Get the current active document
      const currentDoc = await legalDocumentService.getActiveDocument(type);
      if (!currentDoc) {
        throw new Error(`No active document found for type: ${type}`);
      }

      // Create new version
      await legalDocumentService.createNewVersion(
        currentDoc.id,
        newContent,
        newVersion,
        Date.now()
      );

      // Activate the new version
      await legalDocumentService.activateVersion(currentDoc.id, newVersion);

      this.logger.info(`✓ Updated ${type} to version ${newVersion}`);
    } catch (error) {
      this.logger.error(`Failed to update ${type}:`, error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
}

export const legalDocumentInitializer = new LegalDocumentInitializer();
export { INITIAL_LEGAL_DOCUMENTS };
