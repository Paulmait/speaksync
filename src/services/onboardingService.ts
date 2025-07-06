/**
 * Onboarding Service for SpeakSync
 * Provides interactive onboarding experience with feature tours, tutorials, and help
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  OnboardingState,
  OnboardingStep,
  OnboardingTour,
  Tutorial,
  HelpArticle,
  OnboardingProgress,
  FeatureTooltip,
  OnboardingSettings
} from '../types/onboardingTypes';
import { errorHandlingService } from './errorHandlingService';
import { ErrorCategory, ErrorSeverity } from '../types/errorTypes';

const STORAGE_KEYS = {
  ONBOARDING_STATE: '@speaksync/onboarding_state',
  ONBOARDING_PROGRESS: '@speaksync/onboarding_progress',
  ONBOARDING_SETTINGS: '@speaksync/onboarding_settings',
  TUTORIAL_PROGRESS: '@speaksync/tutorial_progress',
  HELP_BOOKMARKS: '@speaksync/help_bookmarks'
};

const DEFAULT_SETTINGS: OnboardingSettings = {
  enableAutoStart: true,
  enableTooltips: true,
  enableProgressTracking: true,
  enableVideoGuides: true,
  enableInteractiveTutorials: true,
  tooltipDelay: 1000,
  tutorialAutoAdvance: false,
  showProgressIndicator: true,
  enableHelpSuggestions: true,
  enableContextualHelp: true,
  preferredLearningStyle: 'visual',
  skipCompletedSteps: true,
  enableOfflineHelp: true
};

const DEFAULT_TOURS: OnboardingTour[] = [
  {
    id: 'welcome_tour',
    name: 'Welcome to SpeakSync',
    description: 'Get started with the basics of SpeakSync',
    category: 'getting_started',
    difficulty: 'beginner',
    estimatedDuration: 300, // 5 minutes
    prerequisite: null,
    isRequired: true,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to SpeakSync!',
        content: 'SpeakSync is your AI-powered teleprompter and speech assistant. Let\'s explore the key features together.',
        type: 'modal',
        targetElement: null,
        position: 'center',
        actions: [
          { id: 'next', label: 'Get Started', type: 'primary' },
          { id: 'skip', label: 'Skip Tour', type: 'secondary' }
        ],
        media: {
          type: 'video',
          url: '/assets/videos/welcome.mp4',
          autoplay: true,
          controls: true
        },
        validation: null,
        isSkippable: true
      },
      {
        id: 'script_creation',
        title: 'Creating Your First Script',
        content: 'Tap the "+" button to create a new script. You can type, import, or use voice-to-text.',
        type: 'tooltip',
        targetElement: 'create-script-button',
        position: 'bottom',
        actions: [
          { id: 'next', label: 'Next', type: 'primary' },
          { id: 'try_it', label: 'Try It Now', type: 'secondary' }
        ],
        media: null,
        validation: {
          type: 'element_interaction',
          targetElement: 'create-script-button',
          requiredAction: 'tap'
        },
        isSkippable: false
      },
      {
        id: 'teleprompter_view',
        title: 'Teleprompter View',
        content: 'This is where your script comes to life. Adjust scrolling speed, text size, and more.',
        type: 'overlay',
        targetElement: 'teleprompter-view',
        position: 'center',
        actions: [
          { id: 'next', label: 'Next', type: 'primary' },
          { id: 'customize', label: 'Customize Now', type: 'secondary' }
        ],
        media: {
          type: 'animation',
          url: '/assets/animations/teleprompter-demo.json',
          autoplay: true,
          loop: true
        },
        validation: null,
        isSkippable: true
      },
      {
        id: 'speech_recognition',
        title: 'AI Speech Features',
        content: 'Enable speech recognition for real-time feedback, tone analysis, and pacing suggestions.',
        type: 'tooltip',
        targetElement: 'speech-recognition-toggle',
        position: 'top',
        actions: [
          { id: 'next', label: 'Next', type: 'primary' },
          { id: 'enable', label: 'Enable Now', type: 'secondary' }
        ],
        media: null,
        validation: null,
        isSkippable: true
      },
      {
        id: 'completion',
        title: 'You\'re All Set!',
        content: 'Great job! You\'re ready to start using SpeakSync. Check out more tutorials in the Help section.',
        type: 'modal',
        targetElement: null,
        position: 'center',
        actions: [
          { id: 'finish', label: 'Start Using SpeakSync', type: 'primary' },
          { id: 'help', label: 'Browse Help', type: 'secondary' }
        ],
        media: {
          type: 'image',
          url: '/assets/images/success-celebration.gif',
          autoplay: true
        },
        validation: null,
        isSkippable: false
      }
    ],
    tags: ['essential', 'quick-start', 'new-user'],
    metadata: {
      lastUpdated: Date.now(),
      version: '1.0.0',
      author: 'SpeakSync Team',
      language: 'en'
    }
  }
];

const DEFAULT_TUTORIALS: Tutorial[] = [
  {
    id: 'advanced_teleprompter',
    title: 'Advanced Teleprompter Features',
    description: 'Master advanced teleprompter customization and features',
    category: 'teleprompter',
    difficulty: 'intermediate',
    estimatedDuration: 600, // 10 minutes
    format: 'interactive',
    content: {
      sections: [
        {
          id: 'speed_control',
          title: 'Speed Control',
          content: 'Learn how to adjust scrolling speed dynamically',
          type: 'interactive',
          exercises: [
            {
              id: 'speed_exercise',
              instruction: 'Try adjusting the speed while reading',
              validation: 'user_completion'
            }
          ]
        }
      ]
    },
    prerequisites: ['welcome_tour'],
    tags: ['teleprompter', 'advanced', 'customization'],
    metadata: {
      lastUpdated: Date.now(),
      version: '1.0.0',
      author: 'SpeakSync Team',
      language: 'en'
    }
  }
];

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting_started',
    title: 'Getting Started with SpeakSync',
    content: 'Complete guide to getting started with SpeakSync',
    category: 'basics',
    tags: ['beginner', 'setup', 'tutorial'],
    searchTerms: ['start', 'begin', 'new', 'setup'],
    lastUpdated: Date.now(),
    relatedArticles: ['script_creation', 'teleprompter_basics'],
    videoUrl: '/assets/videos/getting-started.mp4',
    estimatedReadTime: 5,
    difficulty: 'beginner',
    views: 0,
    helpful: 0,
    notHelpful: 0
  }
];

export class OnboardingService {
  private static instance: OnboardingService;
  private state: OnboardingState;
  private settings: OnboardingSettings;
  private tours: OnboardingTour[] = [];
  private tutorials: Tutorial[] = [];
  private helpArticles: HelpArticle[] = [];
  private progress: OnboardingProgress;
  private isInitialized = false;
  private stateListeners: Array<(state: OnboardingState) => void> = [];
  private progressListeners: Array<(progress: OnboardingProgress) => void> = [];

  private constructor() {
    this.settings = DEFAULT_SETTINGS;
    this.state = {
      currentTour: null,
      currentStep: null,
      isActive: false,
      completedTours: [],
      completedTutorials: [],
      skippedSteps: [],
      userPreferences: {},
      lastActivity: Date.now()
    };
    this.progress = {
      toursCompleted: 0,
      tutorialsCompleted: 0,
      totalStepsCompleted: 0,
      helpArticlesViewed: 0,
      overallProgress: 0,
      skillLevel: 'beginner',
      achievements: [],
      timeSpent: 0,
      lastSession: Date.now()
    };
    this.initializeOnboarding().catch((error) => {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        context: { source: 'onboarding_service_init' }
      });
    });
  }

  static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  private async initializeOnboarding(): Promise<void> {
    try {
      // Load saved state
      const savedState = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STATE);
      if (savedState) {
        this.state = { ...this.state, ...JSON.parse(savedState) };
      }

      // Load saved progress
      const savedProgress = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
      if (savedProgress) {
        this.progress = { ...this.progress, ...JSON.parse(savedProgress) };
      }

      // Load saved settings
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SETTINGS);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }

      // Initialize tours and tutorials
      this.tours = [...DEFAULT_TOURS];
      this.tutorials = [...DEFAULT_TUTORIALS];
      this.helpArticles = [...HELP_ARTICLES];

      this.isInitialized = true;

      // Auto-start onboarding for new users
      if (this.settings.enableAutoStart && this.progress.toursCompleted === 0) {
        await this.startTour('welcome_tour');
      }
    } catch (error) {
      throw new Error(`Failed to initialize onboarding service: ${(error as Error).message}`);
    }
  }

  public async startTour(tourId: string): Promise<boolean> {
    try {
      const tour = this.tours.find(t => t.id === tourId);
      if (!tour) {
        throw new Error(`Tour not found: ${tourId}`);
      }

      // Check prerequisites
      if (tour.prerequisite && !this.state.completedTours.includes(tour.prerequisite)) {
        throw new Error(`Tour prerequisite not met: ${tour.prerequisite}`);
      }

      this.state = {
        ...this.state,
        currentTour: tour,
        currentStep: tour.steps[0],
        isActive: true,
        lastActivity: Date.now()
      };

      await this.saveState();
      this.notifyStateListeners();

      return true;
    } catch (error) {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        context: { source: 'start_tour', tourId }
      });
      return false;
    }
  }

  public async nextStep(): Promise<boolean> {
    try {
      if (!this.state.currentTour || !this.state.currentStep) {
        return false;
      }

      const currentStepIndex = this.state.currentTour.steps.findIndex(
        step => step.id === this.state.currentStep?.id
      );

      if (currentStepIndex === -1) {
        return false;
      }

      // Validate current step if required
      if (this.state.currentStep.validation) {
        const isValid = await this.validateStep(this.state.currentStep);
        if (!isValid) {
          return false;
        }
      }

      // Move to next step
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < this.state.currentTour.steps.length) {
        this.state.currentStep = this.state.currentTour.steps[nextStepIndex];
        this.state.lastActivity = Date.now();
        
        await this.saveState();
        this.notifyStateListeners();
        
        // Update progress
        await this.updateProgress({
          totalStepsCompleted: this.progress.totalStepsCompleted + 1
        });

        return true;
      } else {
        // Tour completed
        await this.completeTour();
        return true;
      }
    } catch (error) {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        context: { source: 'next_step' }
      });
      return false;
    }
  }

  public async previousStep(): Promise<boolean> {
    try {
      if (!this.state.currentTour || !this.state.currentStep) {
        return false;
      }

      const currentStepIndex = this.state.currentTour.steps.findIndex(
        step => step.id === this.state.currentStep?.id
      );

      if (currentStepIndex <= 0) {
        return false;
      }

      this.state.currentStep = this.state.currentTour.steps[currentStepIndex - 1];
      this.state.lastActivity = Date.now();
      
      await this.saveState();
      this.notifyStateListeners();

      return true;
    } catch (error) {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        context: { source: 'previous_step' }
      });
      return false;
    }
  }

  public async skipStep(): Promise<boolean> {
    try {
      if (!this.state.currentStep || !this.state.currentStep.isSkippable) {
        return false;
      }

      this.state.skippedSteps.push(this.state.currentStep.id);
      return await this.nextStep();
    } catch (error) {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        context: { source: 'skip_step' }
      });
      return false;
    }
  }

  public async skipTour(): Promise<boolean> {
    try {
      if (!this.state.currentTour) {
        return false;
      }

      this.state = {
        ...this.state,
        currentTour: null,
        currentStep: null,
        isActive: false,
        lastActivity: Date.now()
      };

      await this.saveState();
      this.notifyStateListeners();

      return true;
    } catch (error) {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        context: { source: 'skip_tour' }
      });
      return false;
    }
  }

  public async completeTour(): Promise<void> {
    if (!this.state.currentTour) {
      return;
    }

    const tourId = this.state.currentTour.id;
    
    this.state = {
      ...this.state,
      currentTour: null,
      currentStep: null,
      isActive: false,
      completedTours: [...this.state.completedTours, tourId],
      lastActivity: Date.now()
    };

    await this.saveState();
    this.notifyStateListeners();

    // Update progress
    await this.updateProgress({
      toursCompleted: this.progress.toursCompleted + 1,
      overallProgress: this.calculateOverallProgress()
    });

    // Check for achievements
    await this.checkAchievements();
  }

  private async validateStep(step: OnboardingStep): Promise<boolean> {
    if (!step.validation) {
      return true;
    }

    try {
      switch (step.validation.type) {
        case 'element_interaction':
          // In a real implementation, this would check if the user interacted with the element
          return true;
        case 'form_completion':
          // Check if required form fields are completed
          return true;
        case 'navigation':
          // Check if user navigated to the correct screen
          return true;
        case 'time_spent':
          // Check if user spent minimum time on step
          return true;
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  }

  public async startTutorial(tutorialId: string): Promise<boolean> {
    try {
      const tutorial = this.tutorials.find(t => t.id === tutorialId);
      if (!tutorial) {
        throw new Error(`Tutorial not found: ${tutorialId}`);
      }

      // Check prerequisites
      if (tutorial.prerequisites) {
        for (const prereq of tutorial.prerequisites) {
          if (!this.state.completedTours.includes(prereq) && 
              !this.state.completedTutorials.includes(prereq)) {
            throw new Error(`Tutorial prerequisite not met: ${prereq}`);
          }
        }
      }

      // Implementation would open tutorial interface
      return true;
    } catch (error) {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        context: { source: 'start_tutorial', tutorialId }
      });
      return false;
    }
  }

  public async searchHelp(query: string): Promise<HelpArticle[]> {
    try {
      const lowercaseQuery = query.toLowerCase();
      return this.helpArticles.filter(article => 
        article.title.toLowerCase().includes(lowercaseQuery) ||
        article.content.toLowerCase().includes(lowercaseQuery) ||
        article.searchTerms.some(term => term.toLowerCase().includes(lowercaseQuery)) ||
        article.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      ).sort((a, b) => {
        // Sort by relevance (simplified)
        const aScore = this.calculateRelevanceScore(a, lowercaseQuery);
        const bScore = this.calculateRelevanceScore(b, lowercaseQuery);
        return bScore - aScore;
      });
    } catch (error) {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.LOW,
        context: { source: 'search_help', query }
      });
      return [];
    }
  }

  private calculateRelevanceScore(article: HelpArticle, query: string): number {
    let score = 0;
    
    if (article.title.toLowerCase().includes(query)) score += 10;
    if (article.content.toLowerCase().includes(query)) score += 5;
    
    article.searchTerms.forEach(term => {
      if (term.toLowerCase().includes(query)) score += 3;
    });
    
    article.tags.forEach(tag => {
      if (tag.toLowerCase().includes(query)) score += 2;
    });
    
    return score;
  }

  public async showTooltip(elementId: string, content: string, position: 'top' | 'bottom' | 'left' | 'right' = 'top'): Promise<void> {
    try {
      if (!this.settings.enableTooltips) {
        return;
      }

      const tooltip: FeatureTooltip = {
        id: this.generateId(),
        elementId,
        content,
        position,
        timestamp: Date.now(),
        shown: false
      };

      // Implementation would show the tooltip
      // This would integrate with the UI layer
    } catch (error) {
      errorHandlingService.handleError(error as Error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.LOW,
        context: { source: 'show_tooltip', elementId }
      });
    }
  }

  private async updateProgress(updates: Partial<OnboardingProgress>): Promise<void> {
    this.progress = { ...this.progress, ...updates };
    this.progress.lastSession = Date.now();
    
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(this.progress));
    this.notifyProgressListeners();
  }

  private calculateOverallProgress(): number {
    const totalTours = this.tours.length;
    const totalTutorials = this.tutorials.length;
    const completedTours = this.progress.toursCompleted;
    const completedTutorials = this.progress.tutorialsCompleted;
    
    if (totalTours + totalTutorials === 0) return 0;
    
    return Math.round(((completedTours + completedTutorials) / (totalTours + totalTutorials)) * 100);
  }

  private async checkAchievements(): Promise<void> {
    const newAchievements: string[] = [];
    
    // Check for first tour completion
    if (this.progress.toursCompleted === 1 && 
        !this.progress.achievements.includes('first_tour')) {
      newAchievements.push('first_tour');
    }
    
    // Check for all tours completed
    if (this.progress.toursCompleted === this.tours.length && 
        !this.progress.achievements.includes('tour_master')) {
      newAchievements.push('tour_master');
    }
    
    if (newAchievements.length > 0) {
      this.progress.achievements.push(...newAchievements);
      await this.updateProgress({ achievements: this.progress.achievements });
    }
  }

  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STATE, JSON.stringify(this.state));
    } catch (error) {
      throw new Error(`Failed to save onboarding state: ${(error as Error).message}`);
    }
  }

  private generateId(): string {
    return `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getState(): OnboardingState {
    return this.state;
  }

  public getProgress(): OnboardingProgress {
    return this.progress;
  }

  public getSettings(): OnboardingSettings {
    return this.settings;
  }

  public async updateSettings(settings: Partial<OnboardingSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SETTINGS, JSON.stringify(this.settings));
  }

  public getTours(): OnboardingTour[] {
    return this.tours;
  }

  public getTutorials(): Tutorial[] {
    return this.tutorials;
  }

  public getHelpArticles(): HelpArticle[] {
    return this.helpArticles;
  }

  public async markHelpArticleViewed(articleId: string): Promise<void> {
    const article = this.helpArticles.find(a => a.id === articleId);
    if (article) {
      article.views += 1;
      await this.updateProgress({
        helpArticlesViewed: this.progress.helpArticlesViewed + 1
      });
    }
  }

  public async rateHelpArticle(articleId: string, helpful: boolean): Promise<void> {
    const article = this.helpArticles.find(a => a.id === articleId);
    if (article) {
      if (helpful) {
        article.helpful += 1;
      } else {
        article.notHelpful += 1;
      }
    }
  }

  public onStateChange(listener: (state: OnboardingState) => void): () => void {
    this.stateListeners.push(listener);
    return () => {
      const index = this.stateListeners.indexOf(listener);
      if (index > -1) {
        this.stateListeners.splice(index, 1);
      }
    };
  }

  public onProgressChange(listener: (progress: OnboardingProgress) => void): () => void {
    this.progressListeners.push(listener);
    return () => {
      const index = this.progressListeners.indexOf(listener);
      if (index > -1) {
        this.progressListeners.splice(index, 1);
      }
    };
  }

  private notifyStateListeners(): void {
    this.stateListeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        // Handle listener errors gracefully
      }
    });
  }

  private notifyProgressListeners(): void {
    this.progressListeners.forEach(listener => {
      try {
        listener(this.progress);
      } catch (error) {
        // Handle listener errors gracefully
      }
    });
  }

  public async resetOnboarding(): Promise<void> {
    this.state = {
      currentTour: null,
      currentStep: null,
      isActive: false,
      completedTours: [],
      completedTutorials: [],
      skippedSteps: [],
      userPreferences: {},
      lastActivity: Date.now()
    };

    this.progress = {
      toursCompleted: 0,
      tutorialsCompleted: 0,
      totalStepsCompleted: 0,
      helpArticlesViewed: 0,
      overallProgress: 0,
      skillLevel: 'beginner',
      achievements: [],
      timeSpent: 0,
      lastSession: Date.now()
    };

    await this.saveState();
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(this.progress));
    
    this.notifyStateListeners();
    this.notifyProgressListeners();
  }
}

export const onboardingService = OnboardingService.getInstance();
