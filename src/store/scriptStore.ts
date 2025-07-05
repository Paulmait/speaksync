import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Script, ScriptStore, AuthState, SyncState, User } from '../types';
import { authService } from '../services/authService';
import { syncService } from '../services/syncService';
import { networkService } from '../services/networkService';

export const useScriptStore = create<ScriptStore>()(
  persist(
    (set, get) => ({
      // State
      scripts: [],
      currentScript: null,
      authState: {
        user: null,
        isLoading: false,
        error: null
      },
      syncState: {
        isOnline: true,
        isSyncing: false,
        lastSyncAt: null,
        pendingOperations: 0,
        syncErrors: []
      },
      
      // Script operations with optimistic updates
      addScript: async (scriptData) => {
        const newScript: Script = {
          ...scriptData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: get().authState.user?.uid,
          syncStatus: 'pending',
          version: 1,
          lastSyncedAt: undefined,
          isDeleted: false
        };
        
        // Optimistic update
        set((state) => ({
          scripts: [newScript, ...state.scripts],
          syncState: {
            ...state.syncState,
            pendingOperations: state.syncState.pendingOperations + 1
          }
        }));

        // Sync to cloud if online
        if (get().syncState.isOnline && get().authState.user) {
          try {
            await get().syncScripts();
          } catch (error) {
            console.error('Failed to sync new script:', error);
            // Mark as error but keep local copy
            set((state) => ({
              scripts: state.scripts.map(s => 
                s.id === newScript.id 
                  ? { ...s, syncStatus: 'error' as const }
                  : s
              )
            }));
          }
        }
      },
      
      updateScript: async (id, updates) => {
        const currentScript = get().scripts.find(s => s.id === id);
        if (!currentScript) return;

        const updatedScript = {
          ...currentScript,
          ...updates,
          updatedAt: new Date(),
          syncStatus: 'pending' as const,
          version: currentScript.version + 1
        };

        // Optimistic update
        set((state) => ({
          scripts: state.scripts.map((script) =>
            script.id === id ? updatedScript : script
          ),
          currentScript:
            state.currentScript?.id === id ? updatedScript : state.currentScript,
          syncState: {
            ...state.syncState,
            pendingOperations: state.syncState.pendingOperations + 1
          }
        }));

        // Sync to cloud if online
        if (get().syncState.isOnline && get().authState.user) {
          try {
            await get().syncScripts();
          } catch (error) {
            console.error('Failed to sync script update:', error);
            set((state) => ({
              scripts: state.scripts.map(s => 
                s.id === id 
                  ? { ...s, syncStatus: 'error' as const }
                  : s
              )
            }));
          }
        }
      },
      
      deleteScript: async (id) => {
        const scriptToDelete = get().scripts.find(s => s.id === id);
        if (!scriptToDelete) return;

        // Optimistic update - mark as deleted
        const deletedScript = {
          ...scriptToDelete,
          isDeleted: true,
          syncStatus: 'pending' as const,
          updatedAt: new Date()
        };

        set((state) => ({
          scripts: state.scripts.map(s => s.id === id ? deletedScript : s),
          currentScript: state.currentScript?.id === id ? null : state.currentScript,
          syncState: {
            ...state.syncState,
            pendingOperations: state.syncState.pendingOperations + 1
          }
        }));

        // Sync deletion to cloud if online
        if (get().syncState.isOnline && get().authState.user) {
          try {
            await get().syncScripts();
            // Remove from local storage after successful sync
            set((state) => ({
              scripts: state.scripts.filter(s => s.id !== id)
            }));
          } catch (error) {
            console.error('Failed to sync script deletion:', error);
            set((state) => ({
              scripts: state.scripts.map(s => 
                s.id === id 
                  ? { ...s, syncStatus: 'error' as const }
                  : s
              )
            }));
          }
        } else {
          // If offline, keep marked as deleted for later sync
          console.log('Offline: Script marked for deletion');
        }
      },
      
      setCurrentScript: (script) => {
        set({ currentScript: script });
      },
      
      getScriptById: (id) => {
        return get().scripts.find((script) => script.id === id && !script.isDeleted);
      },
      
      // Authentication
      signIn: async (email, password) => {
        set((state) => ({
          authState: { ...state.authState, isLoading: true, error: null }
        }));

        try {
          const user = await authService.signIn(email, password);
          set((state) => ({
            authState: { user, isLoading: false, error: null }
          }));
          
          // Initialize sync service with user
          syncService.setUser({ uid: user.uid, email: user.email } as any);
          
          // Trigger initial sync
          await get().syncScripts();
        } catch (error) {
          set((state) => ({
            authState: {
              ...state.authState,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Sign in failed'
            }
          }));
          throw error;
        }
      },
      
      signUp: async (email, password, displayName) => {
        set((state) => ({
          authState: { ...state.authState, isLoading: true, error: null }
        }));

        try {
          const user = await authService.signUp(email, password, displayName);
          set((state) => ({
            authState: { user, isLoading: false, error: null }
          }));
          
          // Initialize sync service with user
          syncService.setUser({ uid: user.uid, email: user.email } as any);
        } catch (error) {
          set((state) => ({
            authState: {
              ...state.authState,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Sign up failed'
            }
          }));
          throw error;
        }
      },
      
      signOut: async () => {
        try {
          await authService.signOut();
          
          // Clear user data and reset sync service
          syncService.setUser(null);
          
          set({
            authState: { user: null, isLoading: false, error: null },
            scripts: [],
            currentScript: null,
            syncState: {
              isOnline: true,
              isSyncing: false,
              lastSyncAt: null,
              pendingOperations: 0,
              syncErrors: []
            }
          });
        } catch (error) {
          set((state) => ({
            authState: {
              ...state.authState,
              error: error instanceof Error ? error.message : 'Sign out failed'
            }
          }));
          throw error;
        }
      },
      
      // Sync operations
      syncScripts: async () => {
        if (get().syncState.isSyncing || !get().authState.user) {
          return;
        }

        set((state) => ({
          syncState: { ...state.syncState, isSyncing: true }
        }));

        try {
          const errors = await syncService.syncScripts();
          
          set((state) => ({
            syncState: {
              ...state.syncState,
              isSyncing: false,
              lastSyncAt: new Date(),
              syncErrors: errors,
              pendingOperations: Math.max(0, state.syncState.pendingOperations - 1)
            }
          }));
        } catch (error) {
          console.error('Sync failed:', error);
          set((state) => ({
            syncState: {
              ...state.syncState,
              isSyncing: false,
              syncErrors: [
                ...state.syncState.syncErrors,
                {
                  id: Date.now().toString(),
                  operation: 'update',
                  scriptId: 'unknown',
                  error: error instanceof Error ? error.message : 'Sync failed',
                  timestamp: new Date()
                }
              ]
            }
          }));
        }
      },
      
      resolveConflict: async (scriptId, resolution) => {
        try {
          await syncService.resolveConflict(scriptId, resolution);
          
          // Update local script status
          set((state) => ({
            scripts: state.scripts.map(s => 
              s.id === scriptId 
                ? { ...s, syncStatus: 'synced' as const }
                : s
            )
          }));
        } catch (error) {
          console.error('Failed to resolve conflict:', error);
        }
      },
      
      retryFailedOperations: async () => {
        const failedScripts = get().scripts.filter(s => s.syncStatus === 'error');
        
        for (const script of failedScripts) {
          // Reset status and retry sync
          set((state) => ({
            scripts: state.scripts.map(s => 
              s.id === script.id 
                ? { ...s, syncStatus: 'pending' as const }
                : s
            )
          }));
        }
        
        await get().syncScripts();
      },
      
      // Network state
      setOnlineStatus: (isOnline) => {
        set((state) => ({
          syncState: { ...state.syncState, isOnline }
        }));
        
        // Attempt sync when coming back online
        if (isOnline && get().authState.user && get().syncState.pendingOperations > 0) {
          get().syncScripts();
        }
      }
    }),
    {
      name: 'script-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        scripts: state.scripts.filter(s => !s.isDeleted), // Only persist non-deleted scripts
      }),
    }
  )
);

// Initialize network and auth listeners
const store = useScriptStore.getState();

// Listen for network changes
networkService.addListener((isOnline) => {
  store.setOnlineStatus(isOnline);
});

// Listen for auth changes
authService.addAuthStateListener((user) => {
  useScriptStore.setState((state) => ({
    authState: { ...state.authState, user }
  }));
  
  // Set user in sync service
  syncService.setUser(user ? { uid: user.uid, email: user.email } as any : null);
  
  // Sync when user signs in
  if (user) {
    store.syncScripts();
  }
});
