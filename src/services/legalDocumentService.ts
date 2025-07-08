/**
 * Firebase Legal Documents Service
 * Manages versioned legal documents in Firestore
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  LegalDocument, 
  LegalDocumentType, 
  LegalDocumentVersion, 
  LegalDocumentHistory,
  LegalDocumentAdmin,
  LegalDocumentReader,
  UserLegalAcceptance,
  UserLegalStatus
} from '../types/legalDocuments';

// Collection names
const COLLECTIONS = {
  LEGAL_DOCUMENTS: 'legalDocuments',
  LEGAL_VERSIONS: 'legalDocumentVersions', 
  USER_ACCEPTANCES: 'userLegalAcceptances',
  ADMIN_ACTIONS: 'legalAdminActions'
} as const;

class LegalDocumentService implements LegalDocumentAdmin, LegalDocumentReader {
  
  // ==================== PUBLIC READ METHODS ====================
  
  /**
   * Get the active version of a specific legal document
   */
  async getActiveDocument(type: LegalDocumentType): Promise<LegalDocument | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.LEGAL_DOCUMENTS),
        where('name', '==', type),
        where('isActive', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const firstDoc = snapshot.docs[0];
      if (!firstDoc) {
        return null;
      }

      const docData = firstDoc.data();
      return {
        id: firstDoc.id,
        ...docData,
        effectiveDate: docData['effectiveDate']?.toMillis?.() || docData['effectiveDate'],
        createdAt: docData['createdAt']?.toMillis?.() || docData['createdAt'],
        updatedAt: docData['updatedAt']?.toMillis?.() || docData['updatedAt']
      } as LegalDocument;
    } catch (error) {
      console.error('Error fetching active document:', error);
      return null;
    }
  }

  /**
   * Get all active legal documents
   */
  async getAllActiveDocuments(): Promise<LegalDocument[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.LEGAL_DOCUMENTS),
        where('isActive', '==', true),
        orderBy('name')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        effectiveDate: doc.data()['effectiveDate']?.toMillis?.() || doc.data()['effectiveDate'],
        createdAt: doc.data()['createdAt']?.toMillis?.() || doc.data()['createdAt'],
        updatedAt: doc.data()['updatedAt']?.toMillis?.() || doc.data()['updatedAt']
      })) as LegalDocument[];
    } catch (error) {
      console.error('Error fetching all active documents:', error);
      return [];
    }
  }

  /**
   * Get a specific version of a legal document
   */
  async getDocumentByVersion(type: LegalDocumentType, version: string): Promise<LegalDocument | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.LEGAL_DOCUMENTS),
        where('name', '==', type),
        where('version', '==', version),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const firstDoc = snapshot.docs[0];
      if (!firstDoc) {
        return null;
      }

      const docData = firstDoc.data();
      return {
        id: firstDoc.id,
        ...docData,
        effectiveDate: docData['effectiveDate']?.toMillis?.() || docData['effectiveDate'],
        createdAt: docData['createdAt']?.toMillis?.() || docData['createdAt'],
        updatedAt: docData['updatedAt']?.toMillis?.() || docData['updatedAt']
      } as LegalDocument;
    } catch (error) {
      console.error('Error fetching document by version:', error);
      return null;
    }
  }

  /**
   * Get the effective date of the active version of a document
   */
  async getDocumentEffectiveDate(type: LegalDocumentType): Promise<number | null> {
    const document = await this.getActiveDocument(type);
    return document?.effectiveDate || null;
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Create a new legal document
   */
  async createDocument(document: Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Ensure no other document of this type is active
      if (document.isActive) {
        await this.deactivateDocumentsByType(document.name as LegalDocumentType);
      }

      const docData = {
        ...document,
        effectiveDate: Timestamp.fromMillis(document.effectiveDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          ...document.metadata,
          wordCount: this.calculateWordCount(document.content),
          estimatedReadingTime: this.calculateReadingTime(document.content)
        }
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.LEGAL_DOCUMENTS), docData);
      
      // Log admin action
      await this.logAdminAction('create', docRef.id, document.createdBy);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create legal document');
    }
  }

  /**
   * Update an existing legal document
   */
  async updateDocument(documentId: string, updates: Partial<LegalDocument>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (updates.effectiveDate) {
        updateData.effectiveDate = Timestamp.fromMillis(updates.effectiveDate);
      }

      if (updates.content) {
        updateData.metadata = {
          ...updates.metadata,
          wordCount: this.calculateWordCount(updates.content),
          estimatedReadingTime: this.calculateReadingTime(updates.content)
        };
      }

      await updateDoc(doc(db, COLLECTIONS.LEGAL_DOCUMENTS, documentId), updateData);
      
      // Log admin action
      await this.logAdminAction('update', documentId, updates.createdBy);
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error('Failed to update legal document');
    }
  }

  /**
   * Create a new version of an existing document
   */
  async createNewVersion(
    documentId: string, 
    content: string, 
    version: string, 
    effectiveDate: number = Date.now()
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Get the current document
      const currentDocRef = doc(db, COLLECTIONS.LEGAL_DOCUMENTS, documentId);
      const currentDoc = await getDoc(currentDocRef);
      
      if (!currentDoc.exists()) {
        throw new Error('Document not found');
      }

      const currentData = currentDoc.data() as LegalDocument;
      
      // Create version history entry
      const versionData: Omit<LegalDocumentVersion, 'id'> = {
        documentId,
        version: currentData.version,
        content: currentData.content,
        effectiveDate: currentData.effectiveDate,
        isActive: false,
        createdBy: currentData.createdBy || 'system',
        createdAt: currentData.updatedAt || Date.now()
      };
      
      const versionRef = doc(collection(db, COLLECTIONS.LEGAL_VERSIONS));
      batch.set(versionRef, {
        ...versionData,
        effectiveDate: Timestamp.fromMillis(versionData.effectiveDate),
        createdAt: Timestamp.fromMillis(versionData.createdAt)
      });

      // Update the main document with new version
      batch.update(currentDocRef, {
        version,
        content,
        effectiveDate: Timestamp.fromMillis(effectiveDate),
        updatedAt: serverTimestamp(),
        metadata: {
          ...currentData.metadata,
          wordCount: this.calculateWordCount(content),
          estimatedReadingTime: this.calculateReadingTime(content)
        }
      });

      await batch.commit();
      
      // Log admin action
      await this.logAdminAction('version', documentId);
    } catch (error) {
      console.error('Error creating new version:', error);
      throw new Error('Failed to create new document version');
    }
  }

  /**
   * Activate a specific version of a document
   */
  async activateVersion(documentId: string, version: string): Promise<void> {
    try {
      // First, get the document to check its type
      const docRef = doc(db, COLLECTIONS.LEGAL_DOCUMENTS, documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }

      const docData = docSnap.data() as LegalDocument;
      
      // Deactivate all other documents of the same type
      await this.deactivateDocumentsByType(docData.name as LegalDocumentType);
      
      // Get the specific version from history
      const versionQuery = query(
        collection(db, COLLECTIONS.LEGAL_VERSIONS),
        where('documentId', '==', documentId),
        where('version', '==', version),
        limit(1)
      );
      
      const versionSnapshot = await getDocs(versionQuery);
      
      if (versionSnapshot.empty) {
        throw new Error('Version not found');
      }

      const versionData = versionSnapshot.docs[0].data() as LegalDocumentVersion;
      
      // Update the main document with the version data
      await updateDoc(docRef, {
        version: versionData.version,
        content: versionData.content,
        effectiveDate: versionData.effectiveDate,
        isActive: true,
        updatedAt: serverTimestamp()
      });
      
      // Log admin action
      await this.logAdminAction('activate', documentId);
    } catch (error) {
      console.error('Error activating version:', error);
      throw new Error('Failed to activate document version');
    }
  }

  /**
   * Deactivate a document
   */
  async deactivateDocument(documentId: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.LEGAL_DOCUMENTS, documentId), {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      
      // Log admin action
      await this.logAdminAction('deactivate', documentId);
    } catch (error) {
      console.error('Error deactivating document:', error);
      throw new Error('Failed to deactivate document');
    }
  }

  /**
   * Delete a document and its history
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete the main document
      batch.delete(doc(db, COLLECTIONS.LEGAL_DOCUMENTS, documentId));
      
      // Delete all versions
      const versionsQuery = query(
        collection(db, COLLECTIONS.LEGAL_VERSIONS),
        where('documentId', '==', documentId)
      );
      
      const versionsSnapshot = await getDocs(versionsQuery);
      versionsSnapshot.docs.forEach(versionDoc => {
        batch.delete(versionDoc.ref);
      });
      
      await batch.commit();
      
      // Log admin action
      await this.logAdminAction('delete', documentId);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Get document history
   */
  async getDocumentHistory(documentId: string): Promise<LegalDocumentHistory> {
    try {
      const versionsQuery = query(
        collection(db, COLLECTIONS.LEGAL_VERSIONS),
        where('documentId', '==', documentId),
        orderBy('createdAt', 'desc')
      );
      
      const versionsSnapshot = await getDocs(versionsQuery);
      
      const versions = versionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        effectiveDate: doc.data().effectiveDate?.toMillis?.() || doc.data().effectiveDate,
        createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt
      })) as LegalDocumentVersion[];

      return {
        documentId,
        versions,
        totalVersions: versions.length,
        firstVersion: versions[versions.length - 1]?.version || '1.0',
        latestVersion: versions[0]?.version || '1.0',
        lastUpdated: versions[0]?.createdAt || Date.now()
      };
    } catch (error) {
      console.error('Error fetching document history:', error);
      throw new Error('Failed to fetch document history');
    }
  }

  // ==================== USER ACCEPTANCE TRACKING ====================

  /**
   * Record user acceptance of a legal document
   */
  async recordUserAcceptance(acceptance: Omit<UserLegalAcceptance, 'isCurrentVersion'>): Promise<void> {
    try {
      // Check if this is the current version
      const activeDoc = await this.getActiveDocument(acceptance.documentType);
      const isCurrentVersion = activeDoc?.version === acceptance.documentVersion;

      const acceptanceData = {
        ...acceptance,
        isCurrentVersion,
        acceptedAt: Timestamp.fromMillis(acceptance.acceptedAt)
      };

      await addDoc(collection(db, COLLECTIONS.USER_ACCEPTANCES), acceptanceData);
    } catch (error) {
      console.error('Error recording user acceptance:', error);
      throw new Error('Failed to record user acceptance');
    }
  }

  /**
   * Get user's legal document compliance status
   */
  async getUserLegalStatus(userId: string): Promise<UserLegalStatus> {
    try {
      const acceptancesQuery = query(
        collection(db, COLLECTIONS.USER_ACCEPTANCES),
        where('userId', '==', userId),
        orderBy('acceptedAt', 'desc')
      );
      
      const acceptancesSnapshot = await getDocs(acceptancesQuery);
      
      const acceptances = acceptancesSnapshot.docs.map(doc => ({
        ...doc.data(),
        acceptedAt: doc.data().acceptedAt?.toMillis?.() || doc.data().acceptedAt
      })) as UserLegalAcceptance[];

      // Get all active documents to check compliance
      const activeDocuments = await this.getAllActiveDocuments();
      const requiredTypes = activeDocuments.map(doc => doc.name as LegalDocumentType);
      
      // Check which documents need acceptance
      const pendingAcceptances: LegalDocumentType[] = [];
      
      for (const type of requiredTypes) {
        const hasCurrentAcceptance = acceptances.some(
          acc => acc.documentType === type && acc.isCurrentVersion
        );
        
        if (!hasCurrentAcceptance) {
          pendingAcceptances.push(type);
        }
      }

      return {
        userId,
        acceptances,
        lastUpdated: Date.now(),
        pendingAcceptances,
        isCompliant: pendingAcceptances.length === 0
      };
    } catch (error) {
      console.error('Error fetching user legal status:', error);
      throw new Error('Failed to fetch user legal status');
    }
  }

  // ==================== HELPER METHODS ====================

  private async deactivateDocumentsByType(type: LegalDocumentType): Promise<void> {
    const q = query(
      collection(db, COLLECTIONS.LEGAL_DOCUMENTS),
      where('name', '==', type),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      batch.update(docSnapshot.ref, { 
        isActive: false, 
        updatedAt: serverTimestamp() 
      });
    });
    
    if (!snapshot.empty) {
      await batch.commit();
    }
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = this.calculateWordCount(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private async logAdminAction(action: string, documentId: string, adminId?: string): Promise<void> {
    try {
      await addDoc(collection(db, COLLECTIONS.ADMIN_ACTIONS), {
        action,
        documentId,
        adminId: adminId || 'system',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      // Don't throw on logging errors
      console.error('Error logging admin action:', error);
    }
  }
}

// Export singleton instance
export const legalDocumentService = new LegalDocumentService();
export default legalDocumentService;
