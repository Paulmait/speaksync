export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'highlight' | 'none';
  duration?: number;
  skippable?: boolean;
  mandatory?: boolean;
}

export interface OnboardingTour {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  category: OnboardingCategory;
  estimatedDuration: number;
  prerequisites?: string[];
  isCompleted: boolean;
  lastAccessed?: Date;
}

export interface OnboardingTooltip {
  id: string;
  targetId: string;
  title: string;
  content: string;
  trigger: 'hover' | 'click' | 'focus' | 'contextual';
  position: 'top' | 'bottom' | 'left' | 'right';
  persistent?: boolean;
  dismissible?: boolean;
  maxWidth?: number;
}

export interface OnboardingTutorial {
  id: string;
  title: string;
  description: string;
  type: 'interactive' | 'video' | 'article' | 'walkthrough';
  category: OnboardingCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  content: string | OnboardingStep[];
  videoUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  isCompleted: boolean;
  completionRate?: number;
  lastAccessed?: Date;
}

export interface OnboardingProgress {
  userId: string;
  completedTours: string[];
  completedTutorials: string[];
  dismissedTooltips: string[];
  currentTour?: string;
  currentStep?: number;
  lastActivity: Date;
  onboardingScore: number;
  preferredLearningStyle: 'visual' | 'interactive' | 'reading' | 'mixed';
}

export interface OnboardingSettings {
  showTooltips: boolean;
  autoPlayTours: boolean;
  skipCompletedSteps: boolean;
  enableNotifications: boolean;
  preferredTutorialType: 'interactive' | 'video' | 'article' | 'all';
  maxTooltipsPerSession: number;
  tourPlaybackSpeed: 'slow' | 'normal' | 'fast';
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: OnboardingCategory;
  tags: string[];
  lastUpdated: Date;
  author: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  relatedArticles: string[];
  searchableKeywords: string[];
}

export interface HelpSearchResult {
  article: HelpArticle;
  score: number;
  matchedKeywords: string[];
  excerpt: string;
}

export interface OnboardingAnalytics {
  userId: string;
  eventType: 'tour_started' | 'tour_completed' | 'tour_abandoned' | 'tooltip_viewed' | 'tutorial_accessed' | 'help_searched';
  targetId: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  sessionId: string;
}

export type OnboardingCategory = 
  | 'getting_started'
  | 'script_management'
  | 'teleprompter_basics'
  | 'advanced_features'
  | 'ai_coaching'
  | 'collaboration'
  | 'settings'
  | 'troubleshooting';

export interface OnboardingState {
  isActive: boolean;
  currentTour?: OnboardingTour;
  currentStep?: number;
  progress: OnboardingProgress;
  settings: OnboardingSettings;
  availableTooltips: OnboardingTooltip[];
  activeTooltips: string[];
  tours: OnboardingTour[];
  tutorials: OnboardingTutorial[];
  helpArticles: HelpArticle[];
}

export interface OnboardingContextData {
  userRole: 'new_user' | 'returning_user' | 'power_user';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: 'ios' | 'android' | 'web';
  featureUsage: Record<string, number>;
  lastLoginDate?: Date;
  accountAge: number;
}
