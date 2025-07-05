'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { Script, ScriptContextType, SyncStatus } from '@/types';

const ScriptContext = createContext<ScriptContextType | undefined>(undefined);

export function useScripts() {
  const context = useContext(ScriptContext);
  if (context === undefined) {
    throw new Error('useScripts must be used within a ScriptProvider');
  }
  return context;
}

export function ScriptProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingChanges: 0,
    syncErrors: [],
  });

  // Listen for network status changes
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for scripts changes in real-time
  useEffect(() => {
    if (!user) {
      setScripts([]);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'scripts'),
      where('userId', '==', user.id),
      where('isDeleted', '!=', true),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const scriptsData: Script[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          scriptsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          } as Script);
        });
        
        setScripts(scriptsData);
        setLoading(false);
        setSyncStatus(prev => ({ 
          ...prev, 
          lastSyncAt: new Date().toISOString(),
          pendingChanges: 0,
        }));
      },
      (error) => {
        console.error('Error listening to scripts:', error);
        setLoading(false);
        setSyncStatus(prev => ({
          ...prev,
          syncErrors: [...prev.syncErrors, {
            id: Date.now().toString(),
            message: error.message,
            timestamp: new Date().toISOString(),
            type: 'network',
          }],
        }));
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createScript = async (title: string, content = ''): Promise<Script> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const scriptData = {
        title,
        content,
        userId: user.id,
        version: 1,
        syncStatus: 'synced' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
        estimatedDuration: Math.ceil(content.split(/\s+/).filter(word => word.length > 0).length / 150) * 60, // Assuming 150 WPM
      };

      const docRef = await addDoc(collection(db, 'scripts'), scriptData);
      
      const newScript: Script = {
        id: docRef.id,
        ...scriptData,
        createdAt: scriptData.createdAt.toDate().toISOString(),
        updatedAt: scriptData.updatedAt.toDate().toISOString(),
      };

      return newScript;
    } catch (error) {
      console.error('Error creating script:', error);
      throw error;
    }
  };

  const updateScript = async (id: string, updates: Partial<Script>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const scriptRef = doc(db, 'scripts', id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        version: (scripts.find(s => s.id === id)?.version || 1) + 1,
      };

      // Calculate word count and estimated duration if content is updated
      if (updates.content !== undefined) {
        const wordCount = updates.content.split(/\s+/).filter(word => word.length > 0).length;
        updateData.wordCount = wordCount;
        updateData.estimatedDuration = Math.ceil(wordCount / 150) * 60;
      }

      await updateDoc(scriptRef, updateData);
    } catch (error) {
      console.error('Error updating script:', error);
      throw error;
    }
  };

  const deleteScript = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const scriptRef = doc(db, 'scripts', id);
      await updateDoc(scriptRef, {
        isDeleted: true,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error deleting script:', error);
      throw error;
    }
  };

  const getScript = (id: string): Script | null => {
    return scripts.find(script => script.id === id) || null;
  };

  const syncScripts = async (): Promise<void> => {
    if (!user) return;

    try {
      setSyncStatus(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));
      
      // In a real implementation, this would handle offline changes and conflicts
      // For now, it's a placeholder that updates the last sync time
      
      setSyncStatus(prev => ({ 
        ...prev, 
        lastSyncAt: new Date().toISOString(),
        pendingChanges: Math.max(0, prev.pendingChanges - 1),
      }));
    } catch (error) {
      console.error('Error syncing scripts:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncErrors: [...prev.syncErrors, {
          id: Date.now().toString(),
          message: 'Failed to sync scripts',
          timestamp: new Date().toISOString(),
          type: 'network',
        }],
      }));
    }
  };

  const value: ScriptContextType = {
    scripts,
    loading,
    syncStatus,
    createScript,
    updateScript,
    deleteScript,
    getScript,
    syncScripts,
  };

  return <ScriptContext.Provider value={value}>{children}</ScriptContext.Provider>;
}
