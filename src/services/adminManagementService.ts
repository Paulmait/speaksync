/**
 * Admin Management for Legal Documents
 * This file contains functions for managing admin users who can update legal documents
 */

import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { LoggingService } from './loggingService';

interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: 'super_admin' | 'legal_admin';
  createdAt: number;
  createdBy: string;
  isActive: boolean;
}

class AdminManagementService {
  private logger = LoggingService.getInstance();

  /**
   * Add a new admin user
   * Note: This should be called by existing super admins or through Firebase Admin SDK
   */
  async addAdmin(adminData: Omit<AdminUser, 'createdAt' | 'isActive'>): Promise<void> {
    try {
      const adminDoc = doc(db, 'admins', adminData.userId);
      
      const newAdmin: AdminUser = {
        ...adminData,
        createdAt: Date.now(),
        isActive: true,
      };

      await setDoc(adminDoc, newAdmin);
      this.logger.info(`Admin user added: ${adminData.email}`);
    } catch (error) {
      this.logger.error('Failed to add admin user', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Check if a user is an admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const adminDoc = doc(db, 'admins', userId);
      const adminSnap = await getDoc(adminDoc);
      
      if (!adminSnap.exists()) {
        return false;
      }

      const adminData = adminSnap.data() as AdminUser;
      return adminData.isActive;
    } catch (error) {
      this.logger.error('Failed to check admin status', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }

  /**
   * Get admin user details
   */
  async getAdmin(userId: string): Promise<AdminUser | null> {
    try {
      const adminDoc = doc(db, 'admins', userId);
      const adminSnap = await getDoc(adminDoc);
      
      if (!adminSnap.exists()) {
        return null;
      }

      return adminSnap.data() as AdminUser;
    } catch (error) {
      this.logger.error('Failed to get admin details', error instanceof Error ? error : new Error('Unknown error'));
      return null;
    }
  }

  /**
   * Deactivate an admin user
   */
  async deactivateAdmin(userId: string, deactivatedBy: string): Promise<void> {
    try {
      const adminDoc = doc(db, 'admins', userId);
      await setDoc(adminDoc, {
        isActive: false,
        deactivatedAt: Date.now(),
        deactivatedBy,
      }, { merge: true });
      
      this.logger.info(`Admin user deactivated: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to deactivate admin', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * List all active admins
   */
  async listActiveAdmins(): Promise<AdminUser[]> {
    try {
      const adminsCollection = collection(db, 'admins');
      const adminsSnapshot = await getDocs(adminsCollection);
      
      const admins: AdminUser[] = [];
      adminsSnapshot.forEach((doc) => {
        const adminData = doc.data() as AdminUser;
        if (adminData.isActive) {
          admins.push(adminData);
        }
      });

      return admins;
    } catch (error) {
      this.logger.error('Failed to list admins', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Initialize first super admin (for setup only)
   * This function should be called once during initial setup
   */
  async initializeFirstAdmin(userId: string, email: string, name: string): Promise<void> {
    try {
      // Check if any admins exist
      const existingAdmins = await this.listActiveAdmins();
      
      if (existingAdmins.length > 0) {
        throw new Error('Admin users already exist. Use addAdmin() for additional admins.');
      }

      await this.addAdmin({
        userId,
        email,
        name,
        role: 'super_admin',
        createdBy: 'system_init',
      });

      this.logger.info(`First super admin initialized: ${email}`);
    } catch (error) {
      this.logger.error('Failed to initialize first admin', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
}

export const adminManagementService = new AdminManagementService();
export type { AdminUser };
