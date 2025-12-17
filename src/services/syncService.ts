import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { Script, SyncError } from '../types';
import { networkService } from './networkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CloudScript extends Omit<Script, 'createdAt' | 'updatedAt' | 'lastSyncedAt'> {
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  lastSyncedAt?: any; // Firestore Timestamp
}

export class SyncService {
  private static instance: SyncService;
  private user: User | null = null;
  private syncInProgress: boolean = false;
  private unsubscribeListener: (() => void) | null = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  setUser(user: User | null) {
    this.user = user;
    
    // Unsubscribe from previous user's data
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
      this.unsubscribeListener = null;
    }

    // Subscribe to new user's data if authenticated
    if (user) {
      this.subscribeToUserScripts();
    }
  }

  private subscribeToUserScripts() {
    if (!this.user) return;

    const scriptsRef = collection(db, 'scripts');
    const q = query(
      scriptsRef,
      where('userId', '==', this.user.uid),
      where('isDeleted', '!=', true),
      orderBy('updatedAt', 'desc')
    );

    this.unsubscribeListener = onSnapshot(q, (snapshot) => {
      // Handle real-time updates from Firestore
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          this.handleRemoteScriptChange(change.doc.data() as CloudScript);
        } else if (change.type === 'removed') {
          this.handleRemoteScriptDeletion(change.doc.id);
        }
      });
    }, (error) => {
      console.error('Error listening to script changes:', error);
    });
  }

  private async handleRemoteScriptChange(cloudScript: CloudScript) {
    try {
      const localScriptsStr = await AsyncStorage.getItem('script-storage');
      if (!localScriptsStr) return;

      const localData = JSON.parse(localScriptsStr);
      const localScripts: Script[] = localData.state?.scripts || [];
      
      const localScript = localScripts.find(s => s.id === cloudScript.id);
      
      if (!localScript) {
        // New script from remote - add to local
        const newScript: Script = this.convertCloudToLocalScript(cloudScript);
        localScripts.push(newScript);
        await this.saveLocalScripts(localScripts);
      } else if (cloudScript.version > localScript.version) {
        // Remote is newer - check for conflicts
        if (localScript.syncStatus === 'pending') {
          // Conflict detected
          localScript.syncStatus = 'conflict';
        } else {
          // Update local with remote data
          const updatedScript = this.convertCloudToLocalScript(cloudScript);
          const index = localScripts.findIndex(s => s.id === cloudScript.id);
          localScripts[index] = updatedScript;
        }
        await this.saveLocalScripts(localScripts);
      }
    } catch (error) {
      console.error('Error handling remote script change:', error);
    }
  }

  private async handleRemoteScriptDeletion(scriptId: string) {
    try {
      const localScriptsStr = await AsyncStorage.getItem('script-storage');
      if (!localScriptsStr) return;

      const localData = JSON.parse(localScriptsStr);
      const localScripts: Script[] = localData.state?.scripts || [];
      
      const filteredScripts = localScripts.filter(s => s.id !== scriptId);
      await this.saveLocalScripts(filteredScripts);
    } catch (error) {
      console.error('Error handling remote script deletion:', error);
    }
  }

  async syncScripts(): Promise<SyncError[]> {
    if (!this.user || this.syncInProgress || !networkService.isOnline()) {
      return [];
    }

    this.syncInProgress = true;
    const errors: SyncError[] = [];

    try {
      // Get local scripts
      const localScripts = await this.getLocalScripts();
      
      // Get remote scripts
      const remoteScripts = await this.getRemoteScripts();
      
      // Sync each local script
      for (const localScript of localScripts) {
        try {
          await this.syncLocalScript(localScript, remoteScripts);
        } catch (error) {
          errors.push({
            id: Date.now().toString(),
            operation: localScript.syncStatus === 'pending' ? 'update' : 'create',
            scriptId: localScript.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          });
        }
      }

      // Mark successful sync
      await this.updateLastSyncTime();
      
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }

    return errors;
  }

  private async syncLocalScript(localScript: Script, remoteScripts: CloudScript[]) {
    if (!this.user) return;

    const remoteScript = remoteScripts.find(s => s.id === localScript.id);

    if (localScript.isDeleted) {
      // Delete from remote
      if (remoteScript) {
        await deleteDoc(doc(db, 'scripts', localScript.id));
      }
      // Remove from local storage
      await this.removeLocalScript(localScript.id);
      return;
    }

    if (!remoteScript) {
      // Create new script in remote
      await this.createRemoteScript(localScript);
    } else if (localScript.version > remoteScript.version) {
      // Update remote script
      await this.updateRemoteScript(localScript);
    } else if (remoteScript.version > localScript.version) {
      // Remote is newer - potential conflict
      if (localScript.syncStatus === 'pending') {
        localScript.syncStatus = 'conflict';
        await this.updateLocalScript(localScript);
      }
    }

    // Mark as synced if no conflicts
    if (localScript.syncStatus !== 'conflict') {
      localScript.syncStatus = 'synced';
      localScript.lastSyncedAt = new Date();
      await this.updateLocalScript(localScript);
    }
  }

  private async createRemoteScript(script: Script) {
    if (!this.user) return;

    const cloudScript: CloudScript = {
      ...script,
      userId: this.user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSyncedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'scripts', script.id), cloudScript);
  }

  private async updateRemoteScript(script: Script) {
    const updateData = {
      title: script.title,
      content: script.content,
      updatedAt: serverTimestamp(),
      lastSyncedAt: serverTimestamp(),
      version: script.version
    };

    await updateDoc(doc(db, 'scripts', script.id), updateData);
  }

  async resolveConflict(scriptId: string, resolution: 'local' | 'remote'): Promise<void> {
    if (!this.user) return;

    const localScripts = await this.getLocalScripts();
    const localScript = localScripts.find(s => s.id === scriptId);
    
    if (!localScript || localScript.syncStatus !== 'conflict') {
      return;
    }

    if (resolution === 'local') {
      // Use local version, update remote
      localScript.version += 1;
      await this.updateRemoteScript(localScript);
      localScript.syncStatus = 'synced';
      localScript.lastSyncedAt = new Date();
      await this.updateLocalScript(localScript);
    } else {
      // Use remote version, update local
      const remoteScript = await this.getRemoteScript(scriptId);
      if (remoteScript) {
        const updatedScript = this.convertCloudToLocalScript(remoteScript);
        updatedScript.syncStatus = 'synced';
        updatedScript.lastSyncedAt = new Date();
        await this.updateLocalScript(updatedScript);
      }
    }
  }

  // Helper methods
  private async getLocalScripts(): Promise<Script[]> {
    try {
      const data = await AsyncStorage.getItem('script-storage');
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.state?.scripts || [];
    } catch (error) {
      console.warn('Failed to get local scripts:', error);
      return [];
    }
  }

  private async getRemoteScripts(): Promise<CloudScript[]> {
    if (!this.user) return [];

    const scriptsRef = collection(db, 'scripts');
    const q = query(
      scriptsRef,
      where('userId', '==', this.user.uid),
      where('isDeleted', '!=', true)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CloudScript));
  }

  private async getRemoteScript(scriptId: string): Promise<CloudScript | null> {
    const docRef = doc(db, 'scripts', scriptId);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as CloudScript;
    }
    return null;
  }

  private convertCloudToLocalScript(cloudScript: CloudScript): Script {
    return {
      ...cloudScript,
      createdAt: cloudScript.createdAt?.toDate?.() || new Date(),
      updatedAt: cloudScript.updatedAt?.toDate?.() || new Date(),
      lastSyncedAt: cloudScript.lastSyncedAt?.toDate?.() || new Date(),
      syncStatus: 'synced'
    };
  }

  private async saveLocalScripts(scripts: Script[]) {
    const data = {
      state: { scripts },
      version: 0
    };
    await AsyncStorage.setItem('script-storage', JSON.stringify(data));
  }

  private async updateLocalScript(script: Script) {
    const scripts = await this.getLocalScripts();
    const index = scripts.findIndex(s => s.id === script.id);
    if (index > -1) {
      scripts[index] = script;
      await this.saveLocalScripts(scripts);
    }
  }

  private async removeLocalScript(scriptId: string) {
    const scripts = await this.getLocalScripts();
    const filtered = scripts.filter(s => s.id !== scriptId);
    await this.saveLocalScripts(filtered);
  }

  private async updateLastSyncTime() {
    await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
  }
}

export const syncService = SyncService.getInstance();
