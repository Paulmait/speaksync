export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  lastSyncedAt?: Date;
  isDeleted?: boolean;
  version: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingOperations: number;
  syncErrors: SyncError[];
}

export interface SyncError {
  id: string;
  operation: 'create' | 'update' | 'delete';
  scriptId: string;
  error: string;
  timestamp: Date;
}

export interface ScriptStore {
  // State
  scripts: Script[];
  currentScript: Script | null;
  authState: AuthState;
  syncState: SyncState;
  
  // Script operations
  addScript: (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>) => Promise<void>;
  updateScript: (id: string, updates: Partial<Pick<Script, 'title' | 'content'>>) => Promise<void>;
  deleteScript: (id: string) => Promise<void>;
  setCurrentScript: (script: Script | null) => void;
  getScriptById: (id: string) => Script | undefined;
  
  // Authentication
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Sync operations
  syncScripts: () => Promise<void>;
  resolveConflict: (scriptId: string, resolution: 'local' | 'remote') => Promise<void>;
  retryFailedOperations: () => Promise<void>;
  
  // Network state
  setOnlineStatus: (isOnline: boolean) => void;
}

export type RootStackParamList = {
  Home: undefined;
  ScriptEditor: { scriptId?: string };
  Teleprompter: { scriptId: string };
  Auth: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Profile: undefined;
};

export interface TeleprompterSettings {
  speed: number;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  isScrolling: boolean;
  isMirrored: boolean;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  padding: number;
}

export interface TeleprompterState {
  currentPosition: number;
  totalHeight: number;
  currentParagraph: number;
  totalParagraphs: number;
}

// Pacing Meter Types
export interface PacingMeterSettings {
  enabled: boolean;
  targetWPM: number;
  toleranceRange: number; // +/- WPM for green zone
  showVisualMeter: boolean;
  showSessionSummary: boolean;
  colorScheme: {
    optimal: string;    // Green zone
    acceptable: string; // Yellow zone
    poor: string;       // Red zone
  };
}

export interface PacingMeterState {
  currentWPM: number;
  targetWPM: number;
  isInOptimalRange: boolean;
  sessionStartTime: number;
  sessionEndTime?: number;
  averageWPM: number;
  wpmHistory: WPMDataPoint[];
  paceAnalysis: PaceAnalysisSegment[];
}

export interface WPMDataPoint {
  timestamp: number;
  wpm: number;
  wordIndex: number;
  isOptimal: boolean;
}

export interface PaceAnalysisSegment {
  startWordIndex: number;
  endWordIndex: number;
  averageWPM: number;
  status: 'optimal' | 'too-fast' | 'too-slow';
  duration: number;
}

export interface SessionSummaryReport {
  sessionId: string;
  scriptId: string;
  startTime: number;
  endTime: number;
  totalWords: number;
  averageWPM: number;
  targetWPM: number;
  optimalPercentage: number;
  segments: PaceAnalysisSegment[];
  fillerWords: FillerWordDetection[];
  recommendations: string[];
}

// Filler Word Detection Types
export interface FillerWordSettings {
  enabled: boolean;
  fillerWords: string[];
  visualCueType: 'icon' | 'highlight' | 'underline' | 'shake';
  iconType: 'warning' | 'alert' | 'circle' | 'dot';
  cueColor: string;
  showInRealTime: boolean;
  trackInSession: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

export interface FillerWordDetection {
  word: string;
  timestamp: number;
  wordIndex: number;
  confidence: number;
  detectionMethod: 'stt' | 'rule-based';
  position: {
    start: number;
    end: number;
  };
}

export interface FillerWordState {
  detectedFillers: FillerWordDetection[];
  totalFillerCount: number;
  fillerRate: number; // Fillers per minute
  sessionStartTime: number;
  commonFillers: {
    [word: string]: number;
  };
}

// Script Analysis Types
export interface ScriptAnalysis {
  scriptId: string;
  totalWords: number;
  totalSentences: number;
  totalParagraphs: number;
  words: ScriptWord[];
  sentences: ScriptSentence[];
  paragraphs: ScriptParagraph[];
  averageWordsPerSentence: number;
  estimatedReadingTime: number; // in minutes
}

export interface ScriptWord {
  word: string;
  index: number;
  position: {
    start: number;
    end: number;
  };
  sentence: number;
  paragraph: number;
}

export interface ScriptSentence {
  text: string;
  index: number;
  wordRange: {
    start: number;
    end: number;
  };
  paragraph: number;
  startIndex: number;
  endIndex: number;
}

export interface ScriptParagraph {
  text: string;
  index: number;
  wordRange: {
    start: number;
    end: number;
  };
  sentenceRange: {
    start: number;
    end: number;
  };
  startIndex: number;
  endIndex: number;
  wordCount: number;
}

// Karaoke Types (legacy compatibility)
export interface KaraokeState {
  currentWordIndex: number;
  highlightedWords: number[];
  matchedWords: WordMatch[];
  scriptWords: string[];
  isActive: boolean;
  currentSentence: number;
  totalSentences: number;
  accuracy: number;
  wordsPerMinute: number;
  sessionStartTime: number;
}

export interface KaraokeHighlightSettings {
  enabled: boolean;
  highlightColor: string;
  highlightBackgroundColor: string;
  autoScroll: boolean;
  scrollOffset: number;
  matchThreshold: number;
  highlightDuration: number;
  animationDuration: number;
  fadeOutDelay: number;
}

export interface WordMatch {
  wordIndex: number;
  confidence: number;
  timestamp: number;
  matched: boolean;
  similarity: number;
  scriptWord: string;
  spokenWord: string;
  isExact: boolean;
}

// Adaptive Scroll Types (legacy compatibility)
export interface AdaptiveScrollSettings {
  enabled: boolean;
  baseScrollSpeed: number;
  responsiveness: number;
  smoothingFactor: number;
  pauseThreshold: number;
  accelerationLimit: number;
  decelerationLimit: number;
  lookAheadWords: number;
  bufferZone: number;
}

export interface SpeechPaceMetrics {
  currentWPM: number;
  averageWPM: number;
  instantaneousWPM: number;
  timeSinceLastWord: number;
  speechDuration: number;
  totalWordsSpoken: number;
  isPaused: boolean;
  isAccelerating: boolean;
  paceTrend: 'stable' | 'accelerating' | 'decelerating';
  confidenceLevel: number;
}

export interface ScrollState {
  currentPosition: number;
  targetPosition: number;
  velocity: number;
  acceleration: number;
  adaptiveSpeed: number;
  isUserControlled: boolean;
  lastUpdateTime: number;
  smoothingBuffer: number[];
}

// Speech Recognition Types
export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  error: string | null;
  isEnabled: boolean;
  language: string;
  isProcessing: boolean;
  isRecording: boolean;
  lastWordTimestamp: number;
  hasPermission: boolean;
  isConnected: boolean;
  mode: 'deepgram' | 'device';
}

export interface AudioPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  words?: Array<{
    word: string;
    confidence: number;
    startTime: number;
    endTime: number;
  }>;
}

export interface SpeechConfig {
  language: string;
  model: string;
  punctuate: boolean;
  profanityFilter: boolean;
  keywords: string[];
  enableWordTimestamps: boolean;
  smartFormat: boolean;
  deepgramApiKey: string;
  redact: string[];
  detectLanguage: boolean;
  enableUtteranceEndMarker: boolean;
}

// Word Timing Types
export interface WordTiming {
  wordIndex: number;
  word: string;
  timestamp: number;
  confidence: number;
  estimatedPosition?: number;
  cumulativeWPM: number;
  instantWPM: number;
}

// Team Management Types
export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  settings: TeamSettings;
  stats: TeamStats;
  subscriptionTier: SubscriptionTier;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  email: string;
  displayName?: string;
  role: TeamRole;
  joinedAt: Date;
  lastActiveAt: Date;
  invitedBy: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedByName: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
}

export interface TeamSettings {
  allowMemberInvites: boolean;
  defaultMemberRole: TeamRole;
  requireApprovalForJoining: boolean;
  allowPublicScripts: boolean;
  maxMembers: number;
  enableActivityLog: boolean;
  enableRealTimeCollaboration: boolean;
}

export interface TeamStats {
  memberCount: number;
  scriptCount: number;
  folderCount: number;
  totalStorageUsed: number; // in bytes
  lastActivityAt: Date;
  activeMembers: number; // members active in last 30 days
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  userDisplayName: string;
  action: TeamActivityAction;
  targetType: 'script' | 'folder' | 'member' | 'team' | 'invitation';
  targetId: string;
  targetName: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export type TeamActivityAction = 
  | 'created'
  | 'updated' 
  | 'deleted'
  | 'shared'
  | 'moved'
  | 'invited'
  | 'joined'
  | 'left'
  | 'role_changed'
  | 'permissions_changed';

export interface ScriptFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  teamId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  scriptIds: string[];
  permissions?: FolderPermissions;
  color?: string;
  icon?: string;
}

export interface FolderPermissions {
  canRead: TeamRole[];
  canWrite: TeamRole[];
  canDelete: TeamRole[];
  canShare: TeamRole[];
}

// Subscription Management Types
export type SubscriptionTier = 'free' | 'personal' | 'business' | 'enterprise';

export type SubscriptionStatus = 
  | 'active'
  | 'canceled' 
  | 'past_due'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'paused';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  revenueCatUserId?: string;
  features: SubscriptionFeatures;
  usage: SubscriptionUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionFeatures {
  maxScripts: number;
  maxTeams: number;
  maxTeamMembers: number;
  maxStorageGB: number;
  cloudSync: boolean;
  teamCollaboration: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  exportOptions: string[];
  integrations: string[];
}

export interface SubscriptionUsage {
  scriptsUsed: number;
  teamsUsed: number;
  storageUsedGB: number;
  teamMembersUsed: number;
  lastUpdated: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId?: string;
}

export interface BillingInfo {
  customerId: string;
  email: string;
  name?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  taxId?: string;
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId?: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  createdAt: Date;
  dueDate: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  stripeInvoiceId?: string;
}

// Feature Gate Types
export interface FeatureGate {
  feature: string;
  enabled: boolean;
  tier: SubscriptionTier;
  reason?: string;
  upgradeUrl?: string;
}

export type FeatureName = 
  | 'unlimited_scripts'
  | 'team_collaboration'
  | 'advanced_analytics'
  | 'priority_support'
  | 'custom_branding'
  | 'api_access'
  | 'bulk_export'
  | 'integrations'
  | 'real_time_collaboration'
  | 'version_history';

// Enhanced Script type with team support
export interface ScriptWithTeam extends Script {
  teamId?: string;
  folderId?: string;
  permissions?: ScriptPermissions;
  sharedWith?: string[];
  isPublic?: boolean;
  teamName?: string;
  folderName?: string;
}

export interface ScriptPermissions {
  canRead: TeamRole[];
  canWrite: TeamRole[];
  canDelete: TeamRole[];
  canShare: TeamRole[];
}

// Store Extensions for Team Support
export interface TeamStore {
  // Team state
  currentTeam: Team | null;
  teams: Team[];
  teamMembers: TeamMember[];
  teamInvitations: TeamInvitation[];
  teamActivity: TeamActivity[];
  scriptFolders: ScriptFolder[];
  
  // Team operations
  createTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  
  // Member management
  inviteMember: (teamId: string, email: string, role: TeamRole, message?: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  updateMemberRole: (teamId: string, userId: string, role: TeamRole) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  
  // Folder management
  createFolder: (folder: Omit<ScriptFolder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFolder: (folderId: string, updates: Partial<ScriptFolder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveScriptToFolder: (scriptId: string, folderId: string | null) => Promise<void>;
  
  // Activity and sync
  logActivity: (activity: Omit<TeamActivity, 'id' | 'timestamp'>) => Promise<void>;
  subscribeToTeamUpdates: (teamId: string) => () => void;
}

export interface SubscriptionStore {
  // Subscription state
  subscription: Subscription | null;
  billingInfo: BillingInfo | null;
  invoices: Invoice[];
  isLoading: boolean;
  
  // Subscription operations
  getSubscription: () => Promise<void>;
  updateSubscription: (tier: SubscriptionTier) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  
  // Payment operations
  addPaymentMethod: (paymentMethodId: string) => Promise<void>;
  removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  
  // Feature gating
  checkFeature: (feature: FeatureName) => FeatureGate;
  canUseFeature: (feature: FeatureName) => boolean;
  getUpgradeUrl: (feature: FeatureName) => string | null;
  
  // Usage tracking
  updateUsage: () => Promise<void>;
  checkUsageLimits: () => Promise<void>;
}
