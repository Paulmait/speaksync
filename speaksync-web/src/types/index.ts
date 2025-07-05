import { User as FirebaseUser } from 'firebase/auth';

// User Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

// Script Types
export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  version: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  isDeleted?: boolean;
  tags?: string[];
  wordCount?: number;
  estimatedDuration?: number; // in seconds
}

export interface ScriptVersion {
  id: string;
  scriptId: string;
  version: number;
  content: string;
  title: string;
  createdAt: string;
  changes?: string; // description of changes
}

// Sync Types
export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt?: string;
  pendingChanges: number;
  syncErrors: SyncError[];
}

export interface SyncError {
  id: string;
  message: string;
  timestamp: string;
  type: 'network' | 'auth' | 'conflict' | 'unknown';
  scriptId?: string;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export interface ScriptContextType {
  scripts: Script[];
  loading: boolean;
  syncStatus: SyncStatus;
  createScript: (title: string, content?: string) => Promise<Script>;
  updateScript: (id: string, updates: Partial<Script>) => Promise<void>;
  deleteScript: (id: string) => Promise<void>;
  getScript: (id: string) => Script | null;
  syncScripts: () => Promise<void>;
}

// UI Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Editor Types
export interface EditorSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  autosave: boolean;
  spellCheck: boolean;
  grammarCheck: boolean;
}

export interface WordCount {
  characters: number;
  charactersWithoutSpaces: number;
  words: number;
  paragraphs: number;
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
}
