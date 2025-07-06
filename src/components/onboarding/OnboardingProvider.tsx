import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { OnboardingService } from '../../services/onboardingService';
import { 
  OnboardingState, 
  OnboardingTour, 
  OnboardingTutorial, 
  OnboardingProgress,
  OnboardingSettings,
  OnboardingTooltip,
  HelpArticle,
  HelpSearchResult,
  OnboardingCategory
} from '../../types/onboardingTypes';

interface OnboardingContextType {
  state: OnboardingState;
  startTour: (tourId: string) => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  skipStep: () => Promise<void>;
  completeTour: () => Promise<void>;
  showTooltip: (tooltipId: string) => void;
  hideTooltip: (tooltipId: string) => void;
  markTutorialComplete: (tutorialId: string) => Promise<void>;
  searchHelp: (query: string) => Promise<HelpSearchResult[]>;
  updateSettings: (settings: Partial<OnboardingSettings>) => Promise<void>;
  resetProgress: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>({
    isActive: false,
    progress: {
      userId: '',
      completedTours: [],
      completedTutorials: [],
      dismissedTooltips: [],
      lastActivity: new Date(),
      onboardingScore: 0,
      preferredLearningStyle: 'mixed',
    },
    settings: {
      showTooltips: true,
      autoPlayTours: true,
      skipCompletedSteps: true,
      enableNotifications: true,
      preferredTutorialType: 'interactive',
      maxTooltipsPerSession: 5,
      tourPlaybackSpeed: 'normal',
    },
    availableTooltips: [],
    activeTooltips: [],
    tours: [],
    tutorials: [],
    helpArticles: [],
  });

  const onboardingService = OnboardingService.getInstance();

  const loadInitialData = async (): Promise<void> => {
    try {
      const [progress, settings, tours, tutorials, helpArticles] = await Promise.all([
        onboardingService.getProgress(),
        onboardingService.getSettings(),
        onboardingService.getTours(),
        onboardingService.getTutorials(),
        onboardingService.getHelpArticles(),
      ]);

      setState(prev => ({
        ...prev,
        progress,
        settings,
        tours,
        tutorials,
        helpArticles,
      }));
    } catch (_error) {
      // Handle error silently for now
      // TODO: Integrate with error handling service
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const startTour = async (tourId: string): Promise<void> => {
    try {
      await onboardingService.startTour(tourId);
      const tour = state.tours.find(t => t.id === tourId);
      if (tour) {
        setState(prev => ({
          ...prev,
          isActive: true,
          currentTour: tour,
          currentStep: 0,
        }));
      }
    } catch (_error) {
      // Handle error silently for now
    }
  };

  const nextStep = async (): Promise<void> => {
    try {
      await onboardingService.nextStep();
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep ? prev.currentStep + 1 : 1,
      }));
    } catch (_error) {
      // Handle error silently for now
    }
  };

  const previousStep = async (): Promise<void> => {
    try {
      await onboardingService.previousStep();
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep && prev.currentStep > 0 ? prev.currentStep - 1 : 0,
      }));
    } catch (_error) {
      // Handle error silently for now
    }
  };

  const skipStep = async (): Promise<void> => {
    try {
      await onboardingService.skipStep();
      await nextStep();
    } catch (_error) {
      // Handle error silently for now
    }
  };

  const completeTour = async (): Promise<void> => {
    try {
      if (state.currentTour) {
        await onboardingService.completeTour(state.currentTour.id);
        setState(prev => {
          const newState = { ...prev };
          newState.isActive = false;
          delete newState.currentTour;
          delete newState.currentStep;
          newState.progress = {
            ...prev.progress,
            completedTours: [...prev.progress.completedTours, state.currentTour!.id],
          };
          return newState;
        });
      }
    } catch (_error) {
      // Handle error silently for now
    }
  };

  const showTooltip = (tooltipId: string): void => {
    setState(prev => ({
      ...prev,
      activeTooltips: [...prev.activeTooltips, tooltipId],
    }));
  };

  const hideTooltip = (tooltipId: string): void => {
    setState(prev => ({
      ...prev,
      activeTooltips: prev.activeTooltips.filter(id => id !== tooltipId),
    }));
  };

  const markTutorialComplete = async (tutorialId: string): Promise<void> => {
    try {
      // TODO: Implement tutorial completion
      // await onboardingService.completeTutorial(tutorialId);
      setState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          completedTutorials: [...prev.progress.completedTutorials, tutorialId],
        },
      }));
    } catch (_error) {
      // Handle error silently for now
    }
  };

  const searchHelp = async (query: string): Promise<HelpSearchResult[]> => {
    try {
      // TODO: Implement help search
      // return await onboardingService.searchHelp(query);
      console.log('Search query:', query); // Avoid unused parameter warning
      return [];
    } catch (_error) {
      return [];
    }
  };

  const updateSettings = async (newSettings: Partial<OnboardingSettings>): Promise<void> => {
    try {
      await onboardingService.updateSettings(newSettings);
      setState(prev => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      }));
    } catch (_error) {
      // Handle error silently for now
    }
  };

  const resetProgress = async (): Promise<void> => {
    try {
      // TODO: Implement progress reset
      // await onboardingService.resetProgress();
      await loadInitialData();
    } catch (_error) {
      // Handle error silently for now
    }
  };

  const contextValue: OnboardingContextType = {
    state,
    startTour,
    nextStep,
    previousStep,
    skipStep,
    completeTour,
    showTooltip,
    hideTooltip,
    markTutorialComplete,
    searchHelp,
    updateSettings,
    resetProgress,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
