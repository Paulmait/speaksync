/**
 * Simple Legal Documents Setup
 * Basic initialization script for legal documents
 */

import { legalDocumentService } from './legalDocumentService';
import { LoggingService } from './loggingService';

const logger = LoggingService.getInstance();

/**
 * Create initial Privacy Policy
 */
export async function createPrivacyPolicy(): Promise<void> {
  try {
    const content = `# SpeakSync Privacy Policy

**Effective Date:** January 1, 2025  
**Last Updated:** January 1, 2025

## Introduction

Welcome to SpeakSync, your professional teleprompter application. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding your information.

By using SpeakSync, you agree to the collection and use of information in accordance with this policy.

## What Data We Collect

### Account Information
- **Email address** - Required for account creation and communication
- **Name** - For personalization and account identification
- **Profile information** - Optional profile details you choose to provide
- **Authentication data** - Secure login credentials and session information

### Script Content
- **Text content** - Scripts you create, edit, and store in the app
- **Script metadata** - Titles, creation dates, modification history, and organization details
- **Usage patterns** - How you interact with your scripts (editing frequency, time spent)

### Voice and Audio Data
- **Voice recordings** - Captured during speech recognition and teleprompter practice sessions
- **Speech-to-text data** - Transcribed text from your voice input for real-time highlighting
- **Voice analysis metrics** - Tone, emotion, pace, and clarity measurements
- **Audio processing data** - Technical data needed for real-time voice analysis

### Performance Analytics
- **Speaking metrics** - Words per minute (WPM), pause patterns, speech clarity scores
- **Filler word counts** - Detection and counting of "um," "uh," and other filler words
- **Tone analysis** - Emotional tone, confidence levels, and speaking style assessment
- **Practice session data** - Duration, frequency, and improvement trends over time

### Usage and Technical Data
- **App usage analytics** - Features used, session duration, navigation patterns
- **Device information** - Device type, operating system, app version
- **Performance data** - App crashes, errors, and technical diagnostics
- **Network information** - Connection type and quality for service optimization

## How We Collect Data

### Directly from You
- When you create an account or update your profile
- When you create, edit, or organize scripts
- When you provide feedback or contact our support team
- When you adjust app settings and preferences

### Through Microphone Access
- **Real-time processing** - Voice data captured during teleprompter practice for immediate speech recognition and analysis
- **Practice sessions** - Voice recordings during guided practice sessions for performance feedback
- **Tone analysis** - Voice data processed for emotional tone and speaking style assessment

### Automatically Through App Usage
- **Usage patterns** - How you navigate and use different features
- **Performance metrics** - Automatic calculation of speaking statistics
- **Error reporting** - Technical issues and app performance data
- **Analytics data** - Aggregated usage statistics for service improvement

## Data Sharing and Third-Party Services

### AI Service Providers
- **Deepgram** - Real-time speech-to-text processing for teleprompter highlighting
- **Hume AI** - Voice emotion and tone analysis for speaking feedback
- **Google Gemini** - Content suggestions and AI-powered script enhancement

**Important:** Voice data processed by these AI services is typically handled ephemerally (processed in real-time and not stored) by both SpeakSync and the AI providers beyond the immediate processing session.

### Payment Processing
- **Stripe** - Secure payment processing for subscriptions and purchases
- **RevenueCat** - Subscription management and billing operations

## Data Security and Your Rights

We implement industry-standard security measures including encryption in transit and at rest, multi-factor authentication, and regular security audits.

You have the right to access, correct, delete, and port your data. For GDPR and CCPA compliance, contact privacy@speaksync.com.

## Contact Information

For privacy inquiries: privacy@speaksync.com

*Full Privacy Policy available at speaksync.com/privacy*`;

    const documentId = await legalDocumentService.createDocument({
      name: 'Privacy Policy',
      version: '1.0',
      effectiveDate: Date.now(),
      content,
      isActive: true,
      metadata: {
        format: 'markdown',
        category: 'privacy',
        language: 'en',
        wordCount: content.split(/\s+/).length,
        estimatedReadingTime: Math.ceil(content.split(/\s+/).length / 200),
      },
    });

    logger.info(`Privacy Policy created with ID: ${documentId}`);
  } catch (error) {
    logger.error('Failed to create Privacy Policy', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

/**
 * Create initial Terms of Use
 */
export async function createTermsOfUse(): Promise<void> {
  try {
    const content = `# SpeakSync Terms of Use

**Effective Date:** January 1, 2025  
**Last Updated:** January 1, 2025

## Agreement to Terms

By accessing or using SpeakSync, you agree to be bound by these Terms of Use. If you do not agree to these Terms, you may not use our service.

## Description of Service

SpeakSync is a professional teleprompter application that provides script creation, real-time speech recognition, voice analysis, cloud synchronization, and AI-powered content suggestions.

## Acceptable Use Policy

### Permitted Uses
You may use SpeakSync for creating and practicing speeches, presentations, educational purposes, and legitimate business activities.

### Prohibited Uses
You may not use SpeakSync to:
- Create, store, or share illegal, harmful, or offensive content
- Violate any laws or regulations
- Infringe on intellectual property rights of others
- Harass, abuse, or harm other users
- Attempt to reverse engineer or compromise our service

## Intellectual Property Rights

### SpeakSync Ownership
SpeakSync owns all rights to the application, features, algorithms, and brand materials.

### Your Content Ownership
You retain ownership of scripts and content you create. You grant SpeakSync a limited license to process your content to provide our services.

## Subscription Terms and Billing

### Subscription Plans
- **Free Plan:** Limited features with usage restrictions
- **Premium Plans:** Full access with different pricing tiers

### Billing and Payments
- Subscription fees are billed in advance
- Subscriptions automatically renew unless cancelled
- No refunds for partial billing periods
- You can cancel anytime in account settings

### Payment Failures
Failed payments may result in suspension of premium features after 7 days, with account termination after 30 days of non-payment.

## Disclaimers and Limitations

- SpeakSync is provided "as is" without warranties
- Speech recognition may not be 100% accurate
- We are not liable for indirect or consequential damages
- Our liability is limited to the amount you paid for the service

## Account Termination

We may terminate accounts for Terms violations, non-payment, or fraudulent behavior. You may terminate your account anytime through account settings.

## Data Protection

Your use is governed by our Privacy Policy. We implement industry-standard security and comply with applicable data protection laws.

## Governing Law

These Terms are governed by [Your Jurisdiction] laws. Disputes will be resolved through informal resolution, mediation, or court proceedings as applicable.

## Changes to Terms

We may modify these Terms with 30 days' notice via email and in-app notifications. Continued use constitutes acceptance of changes.

## Contact Information

For questions: legal@speaksync.com

*Full Terms of Use available at speaksync.com/terms*`;

    const documentId = await legalDocumentService.createDocument({
      name: 'Terms of Use',
      version: '1.0',
      effectiveDate: Date.now(),
      content,
      isActive: true,
      metadata: {
        format: 'markdown',
        category: 'terms',
        language: 'en',
        wordCount: content.split(/\s+/).length,
        estimatedReadingTime: Math.ceil(content.split(/\s+/).length / 200),
      },
    });

    logger.info(`Terms of Use created with ID: ${documentId}`);
  } catch (error) {
    logger.error('Failed to create Terms of Use', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

/**
 * Create initial AI Disclaimer
 */
export async function createAIDisclaimer(): Promise<void> {
  try {
    const content = `# SpeakSync AI Features Disclaimer

**Effective Date:** January 1, 2025  
**Last Updated:** January 1, 2025

## Introduction

SpeakSync incorporates artificial intelligence (AI) technology to enhance your speaking and presentation experience. This AI Disclaimer explains the purpose, capabilities, and limitations of our AI features.

## Purpose of AI Features

SpeakSync's AI features provide **guidance, improvement suggestions, and informational feedback** including:

### Speech Analysis
- Real-time speech-to-text for teleprompter highlighting
- Pacing analysis and optimal speed recommendations
- Filler word detection and counting
- Pause pattern and rhythm analysis

### Voice and Tone Analysis
- Emotional tone detection (confidence, enthusiasm)
- Vocal clarity and articulation assessment
- Volume and projection analysis
- Speaking style feedback

### Content Enhancement
- AI-powered script suggestions and improvements
- Structure optimization recommendations
- Engagement tips and personalized coaching

**Important:** All AI features are intended for **educational and improvement purposes only**.

## Not a Professional Substitute

SpeakSync's AI features are **NOT a substitute** for:
- Professional speech coaching or therapy
- Medical advice for speech disorders
- Legal advice for presentations
- Academic instruction or professional consultation

Consider consulting qualified professionals for persistent speech difficulties, severe presentation anxiety, or professional speaking requirements.

## AI Accuracy and Limitations

### Recognition and Analysis Limitations
- Speech-to-text may have errors with accents or background noise
- Tone interpretation may miss cultural context or nuanced meanings
- Suggestions may not account for specific audiences or contexts
- Real-time analysis may experience delays or interruptions

### Technical Limitations
- Some features require stable internet connectivity
- Performance varies across devices and operating systems
- Features may be temporarily unavailable during maintenance

## User Responsibility

You are **solely responsible** for:
- All speech content accuracy, appropriateness, and legality
- How you use or ignore AI suggestions
- Ensuring content is suitable for your intended audience
- Meeting professional, academic, or legal presentation requirements

### Best Practices
- Critically evaluate all AI suggestions before implementation
- Use your professional judgment for presentation decisions
- Adapt feedback to your specific situation and goals
- Combine AI tools with other learning methods

## Data Use for AI Improvement

With your **explicit consent**, SpeakSync may use anonymized and aggregated data to improve AI models:

### Consent-Based Usage (Opt-in Only)
- Anonymized speech patterns with all identifying information removed
- Aggregated performance metrics across user base
- Error pattern analysis to improve recognition accuracy
- Feature usage data to enhance functionality

### Your Control
- Opt-in basis requiring explicit consent
- Withdraw consent anytime through privacy settings
- No impact on AI feature access if you decline data sharing
- Granular control over what data you're comfortable contributing

## Managing Expectations

- **Gradual improvement** - Speaking skills develop over time with practice
- **Individual variation** - Results vary significantly between users
- **Complementary tool** - Works best combined with other learning methods
- **Personal effort required** - Cannot replace dedicated practice and effort

## Contact Information

For AI feature questions: ai-support@speaksync.com  
For technical support: support@speaksync.com

*Full AI Disclaimer available at speaksync.com/ai-disclaimer*`;

    const documentId = await legalDocumentService.createDocument({
      name: 'AI Features Disclaimer',
      version: '1.0',
      effectiveDate: Date.now(),
      content,
      isActive: true,
      metadata: {
        format: 'markdown',
        category: 'ai',
        language: 'en',
        wordCount: content.split(/\s+/).length,
        estimatedReadingTime: Math.ceil(content.split(/\s+/).length / 200),
      },
    });

    logger.info(`AI Disclaimer created with ID: ${documentId}`);
  } catch (error) {
    logger.error('Failed to create AI Disclaimer', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

/**
 * Initialize all legal documents
 */
export async function initializeLegalDocuments(): Promise<void> {
  try {
    logger.info('Starting legal documents initialization...');
    
    await createPrivacyPolicy();
    await createTermsOfUse();
    await createAIDisclaimer();
    
    logger.info('Legal documents initialization completed successfully!');
  } catch (error) {
    logger.error('Failed to initialize legal documents', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}
