/**
 * User Consent Service
 * Manages user consent for legal documents and AI data usage
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { legalDocumentService } from './legalDocumentService';
import { LegalDocumentType } from '../types/legalDocuments';
import { 
  UserConsentData, 
  ConsentStatus, 
  OnboardingConsentData,
  PolicyUpdateData,
  ConsentRequirement,
  ConsentHistoryEntry
} from '../types/userConsent';
import { LoggingService } from './loggingService';

const logger = LoggingService.getInstance();

class UserConsentService {
  private readonly COLLECTIONS = {
    USER_CONSENT: 'userConsent',
    CONSENT_HISTORY: 'consentHistory'
  } as const;

  private readonly CACHE_KEYS = {
    USER_CONSENT: 'user_consent_cache',
    LAST_CONSENT_CHECK: 'last_consent_check'
  } as const;

  /**
   * Initialize user consent on first app launch or registration
   */
  async initializeUserConsent(
    userId: string, 
    onboardingData: OnboardingConsentData
  ): Promise<void> {
    try {
      // Get current document versions
      const currentVersions = await this.getCurrentDocumentVersions();
      
      const consentData: UserConsentData = {
        userId,
        hasAgreedToTerms: onboardingData.agreedToTerms,
        hasAgreedToPrivacy: onboardingData.acknowledgedPrivacy,
        hasAcknowledgedAI: onboardingData.acknowledgedAI,
        agreedTermsVersion: currentVersions.terms,
        agreedPrivacyVersion: currentVersions.privacy,
        acknowledgedAIVersion: currentVersions.ai,
        termsAgreedAt: onboardingData.consentedAt,
        privacyAgreedAt: onboardingData.consentedAt,
        aiAcknowledgedAt: onboardingData.consentedAt,
        lastConsentCheck: Date.now(),
        aiDataUsageConsent: {
          allowDataCollection: onboardingData.aiDataUsageConsent,
          allowAIImprovement: onboardingData.aiDataUsageConsent,
          consentedAt: onboardingData.consentedAt,
          version: currentVersions.ai || '1.0'
        },
        consentHistory: []
      };

      // Save to Firestore
      await setDoc(doc(db, this.COLLECTIONS.USER_CONSENT, userId), {
        ...consentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Save consent history entries
      await this.recordConsentHistory(userId, [
        {
          documentType: 'terms',
          action: 'agreed',
          version: currentVersions.terms || '1.0',
          timestamp: onboardingData.consentedAt,
          ipAddress: onboardingData.ipAddress,
          userAgent: onboardingData.userAgent
        },
        {
          documentType: 'privacy',
          action: 'acknowledged',
          version: currentVersions.privacy || '1.0',
          timestamp: onboardingData.consentedAt,
          ipAddress: onboardingData.ipAddress,
          userAgent: onboardingData.userAgent
        },
        {
          documentType: 'ai',
          action: 'acknowledged',
          version: currentVersions.ai || '1.0',
          timestamp: onboardingData.consentedAt,
          ipAddress: onboardingData.ipAddress,
          userAgent: onboardingData.userAgent
        }
      ]);

      // Cache locally
      await this.cacheUserConsent(consentData);
      
      logger.info('User consent initialized', { userId });
      
    } catch (error) {
      logger.error('Failed to initialize user consent', error, { userId });
      throw error;
    }
  }

  /**
   * Check user consent status and determine if updates are needed
   */
  async checkConsentStatus(userId: string): Promise<ConsentStatus> {
    try {
      // Get current user consent
      const userConsent = await this.getUserConsent(userId);
      
      // Get current document versions
      const currentVersions = await this.getCurrentDocumentVersions();
      
      const requirements: ConsentRequirement[] = [
        {
          documentType: 'terms',
          currentVersion: currentVersions.terms || '1.0',
          userVersion: userConsent?.agreedTermsVersion,
          isRequired: true,
          hasConsented: userConsent?.hasAgreedToTerms || false,
          needsUpdate: this.needsVersionUpdate(userConsent?.agreedTermsVersion, currentVersions.terms)
        },
        {
          documentType: 'privacy',
          currentVersion: currentVersions.privacy || '1.0',
          userVersion: userConsent?.agreedPrivacyVersion,
          isRequired: true,
          hasConsented: userConsent?.hasAgreedToPrivacy || false,
          needsUpdate: this.needsVersionUpdate(userConsent?.agreedPrivacyVersion, currentVersions.privacy)
        },
        {
          documentType: 'ai',
          currentVersion: currentVersions.ai || '1.0',
          userVersion: userConsent?.acknowledgedAIVersion,
          isRequired: true,
          hasConsented: userConsent?.hasAcknowledgedAI || false,
          needsUpdate: this.needsVersionUpdate(userConsent?.acknowledgedAIVersion, currentVersions.ai)
        }
      ];

      const pendingConsents = requirements.filter(req => !req.hasConsented || req.needsUpdate);
      const hasAgreedToAll = requirements.every(req => req.hasConsented && !req.needsUpdate);
      const needsUpdate = pendingConsents.length > 0;

      const status: ConsentStatus = {
        isCompliant: hasAgreedToAll,
        pendingConsents,
        hasAgreedToAll,
        needsUpdate,
        lastChecked: Date.now()
      };

      // Update last consent check
      if (userConsent) {
        await this.updateLastConsentCheck(userId);
      }

      return status;
      
    } catch (error) {
      logger.error('Failed to check consent status', error, { userId });
      throw error;
    }
  }

  /**
   * Update user consent for policy changes
   */
  async updateUserConsent(
    userId: string,
    updateData: PolicyUpdateData,
    hasConsented: boolean
  ): Promise<void> {
    try {
      const userConsent = await this.getUserConsent(userId);
      if (!userConsent) {
        throw new Error('User consent not found');
      }

      const updateFields: Partial<UserConsentData> = {
        lastConsentCheck: Date.now()
      };

      const historyEntry: ConsentHistoryEntry = {
        documentType: updateData.documentType,
        action: hasConsented ? 'agreed' : 'declined',
        version: updateData.newVersion,
        timestamp: Date.now()
      };

      // Update specific consent fields
      switch (updateData.documentType) {
        case 'terms':
          updateFields.hasAgreedToTerms = hasConsented;
          updateFields.agreedTermsVersion = updateData.newVersion;
          updateFields.termsAgreedAt = Date.now();
          break;
        case 'privacy':
          updateFields.hasAgreedToPrivacy = hasConsented;
          updateFields.agreedPrivacyVersion = updateData.newVersion;
          updateFields.privacyAgreedAt = Date.now();
          break;
        case 'ai':
          updateFields.hasAcknowledgedAI = hasConsented;
          updateFields.acknowledgedAIVersion = updateData.newVersion;
          updateFields.aiAcknowledgedAt = Date.now();
          break;
      }

      // Update Firestore
      await updateDoc(doc(db, this.COLLECTIONS.USER_CONSENT, userId), {
        ...updateFields,
        updatedAt: serverTimestamp()
      });

      // Record consent history
      await this.recordConsentHistory(userId, [historyEntry]);

      // Update cache
      const updatedConsent = { ...userConsent, ...updateFields };
      await this.cacheUserConsent(updatedConsent);

      logger.info('User consent updated', { 
        userId, 
        documentType: updateData.documentType, 
        hasConsented 
      });
      
    } catch (error) {
      logger.error('Failed to update user consent', error, { userId });
      throw error;
    }
  }

  /**
   * Update AI data usage consent
   */
  async updateAIDataConsent(
    userId: string,
    allowDataCollection: boolean,
    allowAIImprovement: boolean
  ): Promise<void> {
    try {
      const currentVersions = await this.getCurrentDocumentVersions();
      
      const aiDataConsent = {
        allowDataCollection,
        allowAIImprovement,
        consentedAt: Date.now(),
        version: currentVersions.ai || '1.0'
      };

      await updateDoc(doc(db, this.COLLECTIONS.USER_CONSENT, userId), {
        aiDataUsageConsent: aiDataConsent,
        updatedAt: serverTimestamp()
      });

      // Record history
      await this.recordConsentHistory(userId, [{
        documentType: 'ai-data',
        action: allowDataCollection ? 'agreed' : 'declined',
        version: aiDataConsent.version,
        timestamp: Date.now()
      }]);

      logger.info('AI data consent updated', { 
        userId, 
        allowDataCollection, 
        allowAIImprovement 
      });
      
    } catch (error) {
      logger.error('Failed to update AI data consent', error, { userId });
      throw error;
    }
  }

  /**
   * Get user consent data
   */
  async getUserConsent(userId: string): Promise<UserConsentData | null> {
    try {
      // Try cache first
      const cached = await this.getCachedUserConsent();
      if (cached && cached.userId === userId) {
        return cached;
      }

      // Fetch from Firestore
      const docRef = doc(db, this.COLLECTIONS.USER_CONSENT, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data() as UserConsentData;
      
      // Cache the data
      await this.cacheUserConsent(data);
      
      return data;
      
    } catch (error) {
      logger.error('Failed to get user consent', error, { userId });
      return null;
    }
  }

  /**
   * Private helper methods
   */
  private async getCurrentDocumentVersions(): Promise<{
    terms?: string;
    privacy?: string;
    ai?: string;
  }> {
    try {
      const [termsDoc, privacyDoc, aiDoc] = await Promise.all([
        legalDocumentService.getActiveDocument(LegalDocumentType.TERMS_OF_USE),
        legalDocumentService.getActiveDocument(LegalDocumentType.PRIVACY_POLICY),
        legalDocumentService.getActiveDocument(LegalDocumentType.AI_DISCLAIMER)
      ]);

      return {
        terms: termsDoc?.version,
        privacy: privacyDoc?.version,
        ai: aiDoc?.version
      };
    } catch (error) {
      logger.error('Failed to get current document versions', error);
      return {};
    }
  }

  private needsVersionUpdate(userVersion?: string, currentVersion?: string): boolean {
    if (!userVersion || !currentVersion) return false;
    return userVersion !== currentVersion;
  }

  private async recordConsentHistory(
    userId: string, 
    entries: ConsentHistoryEntry[]
  ): Promise<void> {
    try {
      const batch = entries.map(entry => ({
        ...entry,
        userId,
        createdAt: serverTimestamp()
      }));

      // Add to collection
      for (const entry of batch) {
        await setDoc(doc(collection(db, this.COLLECTIONS.CONSENT_HISTORY)), entry);
      }
    } catch (error) {
      logger.error('Failed to record consent history', error, { userId });
    }
  }

  private async updateLastConsentCheck(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTIONS.USER_CONSENT, userId), {
        lastConsentCheck: Date.now(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logger.error('Failed to update last consent check', error, { userId });
    }
  }

  private async cacheUserConsent(consentData: UserConsentData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.CACHE_KEYS.USER_CONSENT,
        JSON.stringify(consentData)
      );
    } catch (error) {
      logger.error('Failed to cache user consent', error);
    }
  }

  private async getCachedUserConsent(): Promise<UserConsentData | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.USER_CONSENT);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Failed to get cached user consent', error);
      return null;
    }
  }

  /**
   * Clear user consent cache (on sign out)
   */
  async clearConsentCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.CACHE_KEYS.USER_CONSENT,
        this.CACHE_KEYS.LAST_CONSENT_CHECK
      ]);
    } catch (error) {
      logger.error('Failed to clear consent cache', error);
    }
  }
}

export const userConsentService = new UserConsentService();
