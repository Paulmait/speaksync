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
  teamId?: string; // For team scripts
  folderId?: string; // For organization
  permissions?: ScriptPermissions;
}

export interface ScriptPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canMove: boolean;
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

// Team Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  plan: SubscriptionTier;
  settings: TeamSettings;
  stats: TeamStats;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  email: string;
  displayName?: string;
  photoURL?: string;
  joinedAt: string;
  lastActiveAt?: string;
  permissions: TeamPermissions;
}

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamPermissions {
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canEditTeamSettings: boolean;
  canCreateScripts: boolean;
  canEditScripts: boolean;
  canDeleteScripts: boolean;
  canCreateFolders: boolean;
  canManageFolders: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
}

export interface TeamSettings {
  allowGuestAccess: boolean;
  defaultScriptPermissions: ScriptPermissions;
  requireApprovalForNewMembers: boolean;
  allowMemberInvites: boolean;
  dataRetentionDays: number;
}

export interface TeamStats {
  memberCount: number;
  scriptCount: number;
  totalWordCount: number;
  storageUsed: number; // in bytes
  lastActivityAt: string;
}

export interface ScriptFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  teamId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
  scriptCount: number;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  action: TeamActivityAction;
  targetType: 'script' | 'folder' | 'member' | 'team';
  targetId: string;
  targetName: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export type TeamActivityAction = 
  | 'created' | 'updated' | 'deleted' | 'moved' | 'shared'
  | 'member_invited' | 'member_joined' | 'member_removed' | 'role_changed'
  | 'team_settings_updated';

// Subscription Types
export type SubscriptionTier = 'free' | 'pro' | 'business' | 'enterprise';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  features: SubscriptionFeatures;
  usage: SubscriptionUsage;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFeatures {
  maxScripts: number;
  maxTeamMembers: number;
  maxTeams: number;
  storageLimit: number; // in bytes
  hasAdvancedEditor: boolean;
  hasTeamCollaboration: boolean;
  hasAnalytics: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
  hasCustomBranding: boolean;
  hasAdvancedSecurity: boolean;
  hasDataExport: boolean;
}

export interface SubscriptionUsage {
  scriptsUsed: number;
  teamsUsed: number;
  teamMembersUsed: number;
  storageUsed: number;
  apiCallsUsed: number;
  lastUpdated: string;
}
