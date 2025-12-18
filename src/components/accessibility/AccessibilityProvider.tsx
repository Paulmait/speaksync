import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AccessibilityService } from '../../services/accessibilityService';
import { AccessibilitySettings, AccessibilityAuditResult } from '../../types/accessibilityTypes';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => Promise<void>;
  auditResults: AccessibilityAuditResult[];
  runAudit: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    enableHighContrast: false,
    enableDynamicTextScaling: true,
    enableScreenReader: false,
    enableKeyboardNavigation: true,
    enableFocusIndicators: true,
    enableReducedMotion: false,
    enableVoiceAnnouncements: true,
    textScaling: {
      scale: 1.0,
      minScale: 0.8,
      maxScale: 2.0,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    highContrast: {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      linkColor: '#00BFFF',
      buttonColor: '#FFD700',
      borderColor: '#FFFFFF',
      errorColor: '#FF4444',
      successColor: '#00FF00',
      warningColor: '#FFA500',
    },
    colors: {
      primary: '#007AFF',
      secondary: '#FF3B30',
      accent: '#5856D6',
      background: '#FFFFFF',
      surface: '#F2F2F7',
      text: '#000000',
      disabled: '#C7C7CC',
      placeholder: '#8E8E93',
      backdrop: 'rgba(0, 0, 0, 0.5)',
    },
    screenReader: {
      enableHints: true,
      enableRoleDescriptions: true,
      enableValueDescriptions: true,
      enableLiveRegions: true,
      announcementDelay: 500,
      readingSpeed: 1.0,
    },
    keyboardNavigation: {
      enableTabNavigation: true,
      enableArrowKeyNavigation: true,
      enableEscapeKey: true,
      enableEnterKey: true,
      focusRingColor: '#007AFF',
      focusRingWidth: 2,
      skipToContent: true,
    },
    touchTargets: {
      minimumSize: 44,
      spacing: 8,
      padding: 8,
    },
    animations: {
      enableAnimations: true,
      enableTransitions: true,
      duration: 300,
      easing: 'ease-out',
    },
    voiceControl: {
      enableVoiceCommands: false,
      enableVoiceNavigation: false,
      commandTimeout: 5000,
      confidenceThreshold: 0.7,
    },
  });

  const [auditResults, setAuditResults] = useState<AccessibilityAuditResult[]>([]);
  const accessibilityService = AccessibilityService.getInstance();

  const loadSettings = async (): Promise<void> => {
    try {
      const savedSettings = await accessibilityService.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      // Replace console with proper error handling when available
      // console.error('Failed to load accessibility settings:', error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (updates: Partial<AccessibilitySettings>): Promise<void> => {
    try {
      await accessibilityService.updateSettings(updates);
      setSettings(prev => ({ ...prev, ...updates }));
    } catch (error) {
      // Replace console with proper error handling when available
      // console.error('Failed to update accessibility settings:', error);
    }
  };

  const runAudit = async (): Promise<void> => {
    try {
      // Pass the current view/component as the component to audit
      const result = await accessibilityService.auditAccessibility('MainView');
      setAuditResults([result]);
    } catch (error) {
      // Replace console with proper error handling when available
      // console.error('Failed to run accessibility audit:', error);
    }
  };

  const resetToDefaults = async (): Promise<void> => {
    try {
      await accessibilityService.resetToDefaults();
      await loadSettings();
    } catch (error) {
      // Replace console with proper error handling when available
      // console.error('Failed to reset accessibility settings:', error);
    }
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    auditResults,
    runAudit,
    resetToDefaults,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
