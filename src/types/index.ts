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
  language?: LanguageOption; // Language option with full details
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
  Analytics: undefined;
  SessionDetail: { sessionId: string };
  Auth: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Profile: undefined;
  Subscription: undefined;
  LegalDocuments: undefined;
  OnboardingConsent: undefined;
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

// Analytics Types
export interface SessionReport {
  id: string;
  scriptId: string;
  scriptTitle: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number; // milliseconds
  totalWords: number;
  wordsSpoken: number;
  averageWPM: number;
  targetWPM: number;
  paceAnalysis: PaceAnalysisSegment[];
  fillerWordAnalysis: FillerWordAnalysis;
  scriptAdherence: ScriptAdherenceMetrics;
  wpmHistory: WPMDataPoint[];
  pauseAnalysis: PauseAnalysis[];
  createdAt: Date;
  tags?: string[];
  notes?: string;
}

export interface ScriptAdherenceMetrics {
  totalScriptWords: number;
  wordsSpoken: number;
  adherencePercentage: number;
  skippedSections: SkippedSection[];
  deviations: ScriptDeviation[];
  accuracyScore: number;
}

export interface SkippedSection {
  startWordIndex: number;
  endWordIndex: number;
  text: string;
  duration: number;
}

export interface ScriptDeviation {
  scriptWordIndex: number;
  expectedWord: string;
  spokenWord: string;
  confidence: number;
  timestamp: number;
  type: 'substitution' | 'insertion' | 'deletion' | 'improvisation';
}

export interface FillerWordAnalysis {
  totalFillerWords: number;
  fillerRate: number; // fillers per minute
  uniqueFillers: { [word: string]: number };
  fillerInstances: FillerWordInstance[];
  improvementSuggestions: string[];
}

export interface FillerWordInstance {
  word: string;
  timestamp: number;
  wordIndex: number;
  context: string;
  confidence: number;
}

export interface PauseAnalysis {
  startTime: number;
  endTime: number;
  duration: number;
  type: 'natural' | 'hesitation' | 'technical';
  context: string;
  wordIndex: number;
}

export interface AnalyticsFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  scriptIds?: string[];
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
  wpmRange?: {
    min?: number;
    max?: number;
  };
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalPracticeTime: number; // milliseconds
  averageSessionDuration: number;
  averageWPM: number;
  improvementTrend: number; // percentage change
  fillerWordTrend: number;
  mostPracticedScript: {
    id: string;
    title: string;
    sessionCount: number;
  };
  performanceMetrics: {
    consistency: number; // 0-100
    accuracy: number; // 0-100
    fluency: number; // 0-100
  };
  weeklyStats: WeeklyAnalytics[];
}

export interface WeeklyAnalytics {
  week: string; // ISO week
  sessionCount: number;
  totalDuration: number;
  averageWPM: number;
  fillerWordRate: number;
  adherenceScore: number;
}

export interface AnalyticsExportOptions {
  format: 'csv' | 'pdf' | 'json' | 'excel';
  includeCharts?: boolean;
  includeRawData?: boolean;
  includeSummary?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sessionIds?: string[];
}

export interface ComparisonAnalytics {
  sessions: SessionReport[];
  metrics: {
    wpmProgress: number;
    fillerWordImprovement: number;
    adherenceImprovement: number;
    consistencyScore: number;
  };
  trends: {
    wpm: TrendData[];
    fillerWords: TrendData[];
    adherence: TrendData[];
  };
  insights: string[];
  recommendations: string[];
}

export interface TrendData {
  date: Date;
  value: number;
  sessionId: string;
}

export interface AnalyticsStore {
  // State
  sessions: SessionReport[];
  currentSession: SessionReport | null;
  summary: AnalyticsSummary | null;
  filters: AnalyticsFilters;
  loading: boolean;
  
  // Session operations
  createSession: (scriptId: string, targetWPM: number) => Promise<SessionReport>;
  updateSession: (sessionId: string, updates: Partial<SessionReport>) => Promise<void>;
  endSession: (sessionId: string, metrics: Partial<SessionReport>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Analytics operations
  getSessions: (filters?: AnalyticsFilters) => Promise<SessionReport[]>;
  getSessionById: (sessionId: string) => Promise<SessionReport | null>;
  getSummary: (filters?: AnalyticsFilters) => Promise<AnalyticsSummary>;
  compareSessions: (sessionIds: string[]) => Promise<ComparisonAnalytics>;
  
  // Export operations
  exportSessions: (options: AnalyticsExportOptions) => Promise<string>;
  generateReport: (sessionId: string, format: 'pdf' | 'html') => Promise<string>;
  
  // Filtering and search
  setFilters: (filters: Partial<AnalyticsFilters>) => void;
  clearFilters: () => void;
  searchSessions: (query: string) => Promise<SessionReport[]>;
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

// Multi-language Support Types
export interface LanguageOption {
  code: string; // ISO 639-1 language code (e.g., 'en', 'es', 'fr')
  name: string; // Display name (e.g., 'English', 'Español', 'Français')
  nativeName: string; // Native name (e.g., 'English', 'Español', 'Français')
  rtl: boolean; // Right-to-left text direction
  flag: string; // Unicode flag emoji or country code
  deepgramModel: string; // Deepgram model identifier
  supported: boolean; // Whether this language is currently supported
}

export interface ScriptLanguage {
  scriptId: string;
  language: LanguageOption;
  detectedLanguage?: LanguageOption; // Auto-detected language
  confidence?: number; // Detection confidence (0-1)
  userOverride: boolean; // Whether user manually selected language
}

export interface MultiLanguageSettings {
  autoDetectLanguage: boolean;
  defaultLanguage: LanguageOption;
  fallbackLanguage: LanguageOption;
  enableRTLSupport: boolean;
  showLanguageFlags: boolean;
  enableTranslationSuggestions: boolean;
}

// Gamification Types
export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Date;
  streakType: 'daily' | 'weekly';
  isActive: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  category: 'sessions' | 'performance' | 'consistency' | 'milestones' | 'language';
  requirement: AchievementRequirement;
  unlockedAt?: Date;
  isSecret: boolean; // Hidden until unlocked
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number; // XP points awarded
}

export interface AchievementRequirement {
  type: 'sessions_count' | 'wpm_target' | 'filler_reduction' | 'streak_days' | 'languages_used' | 'total_time' | 'consistency_score';
  target: number;
  timeframe?: 'all_time' | 'monthly' | 'weekly' | 'daily';
  conditions?: { [key: string]: any }; // Additional conditions
}

export interface UserProgress {
  level: number;
  totalXP: number;
  xpToNextLevel: number;
  totalSessions: number;
  totalTimeMinutes: number;
  achievements: Achievement[];
  streaks: UserStreak[];
  stats: ProgressStats;
}

export interface ProgressStats {
  averageWPM: number;
  bestWPM: number;
  fillerWordRate: number; // Filler words per minute
  consistencyScore: number; // 0-100 consistency rating
  languagesUsed: string[]; // Language codes
  improvementTrends: ProgressTrend[];
}

export interface ProgressTrend {
  metric: 'wpm' | 'filler_rate' | 'consistency' | 'session_length';
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  data: ProgressDataPoint[];
  trend: 'improving' | 'stable' | 'declining';
  changePercent: number;
}

export interface ProgressDataPoint {
  timestamp: number;
  value: number;
  sessionCount: number;
  note?: string;
}

export interface SocialShare {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'clipboard';
  achievementId: string;
  customMessage?: string;
  includeStats: boolean;
  imageUrl?: string;
}

// Feedback System Types
export interface FeedbackSubmission {
  id: string;
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'improvement_suggestion';
  category: 'ui_ux' | 'performance' | 'features' | 'content' | 'technical' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  attachments?: FeedbackAttachment[];
  diagnostics?: DiagnosticInfo;
  userContact?: UserContactInfo;
  status: 'submitted' | 'reviewing' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  isAnonymous: boolean;
}

export interface FeedbackAttachment {
  id: string;
  type: 'screenshot' | 'video' | 'log_file' | 'other';
  filename: string;
  size: number;
  url?: string;
  localPath?: string;
  description?: string;
}

export interface DiagnosticInfo {
  appVersion: string;
  buildNumber: string;
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  deviceModel: string;
  deviceId: string; // Anonymized device identifier
  memoryUsage: number;
  diskSpace: number;
  networkStatus: 'online' | 'offline' | 'poor';
  lastError?: ErrorInfo;
  recentActions: UserAction[];
  performance: PerformanceInfo;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  context: string; // Which screen/feature
  userAction: string; // What user was trying to do
}

export interface UserAction {
  action: string;
  screen: string;
  timestamp: number;
  data?: { [key: string]: any };
}

export interface PerformanceInfo {
  averageFPS: number;
  memoryLeaks: boolean;
  crashCount: number;
  slowOperations: string[];
  renderTimes: number[];
}

export interface UserContactInfo {
  email?: string;
  preferredContactMethod: 'email' | 'in_app' | 'none';
  allowFollowUp: boolean;
  timezone: string;
}

export interface FeedbackSettings {
  enableAutoSubmission: boolean;
  includeDiagnostics: boolean;
  allowScreenshots: boolean;
  shareUsageData: boolean;
  contactPreferences: UserContactInfo;
  categories: FeedbackCategory[];
}

export interface FeedbackCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  isDefault: boolean;
  requiresAttachment: boolean;
  suggestedActions: string[];
}

// Extended Script interface with language support
export interface ExtendedScript extends Script {
  language: LanguageOption;
  detectedLanguage?: LanguageOption;
  languageConfidence?: number;
  isMultilingual: boolean;
  textDirection: 'ltr' | 'rtl' | 'auto';
  characterSet: string; // Unicode character set info
}

// Enhanced Analytics with Gamification
export interface EnhancedAnalytics {
  sessions: SessionSummaryReport[];
  progress: UserProgress;
  achievements: Achievement[];
  trends: ProgressTrend[];
  languageUsage: LanguageUsageStats[];
  gamificationData: GamificationData;
}

export interface LanguageUsageStats {
  language: LanguageOption;
  sessionCount: number;
  totalTime: number;
  averageWPM: number;
  accuracyRate: number;
  lastUsed: Date;
}

export interface GamificationData {
  currentLevel: number;
  totalXP: number;
  weeklyXP: number;
  monthlyXP: number;
  recentAchievements: Achievement[];
  activeStreaks: UserStreak[];
  leaderboardPosition?: number;
  weeklyGoals: WeeklyGoal[];
}

export interface WeeklyGoal {
  id: string;
  type: 'sessions' | 'time' | 'improvement' | 'languages';
  target: number;
  current: number;
  description: string;
  xpReward: number;
  isCompleted: boolean;
  weekStart: Date;
}

export interface SyncUser {
  uid: string;
  email: string | null;
}
