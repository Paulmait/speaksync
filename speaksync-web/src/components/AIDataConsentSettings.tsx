import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { useAuth } from '../contexts/AuthContext';

interface AIDataConsentProps {
  className?: string;
}

export default function AIDataConsentSettings({ className = '' }: AIDataConsentProps) {
  const { user } = useAuth();
  const [allowDataCollection, setAllowDataCollection] = useState(false);
  const [allowAIImprovement, setAllowAIImprovement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadConsentSettings = useCallback(async () => {
    if (!user) return;

    try {
      // In a real implementation, you would load from your user consent service
      // For now, we'll use localStorage as a placeholder
      const savedConsent = localStorage.getItem(`ai_consent_${user.id}`);
      if (savedConsent) {
        const consent = JSON.parse(savedConsent);
        setAllowDataCollection(consent.allowDataCollection || false);
        setAllowAIImprovement(consent.allowAIImprovement || false);
      }
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to load consent settings:', error);
      setHasLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    loadConsentSettings();
  }, [loadConsentSettings]);

  const updateConsentSetting = async (type: 'collection' | 'improvement', value: boolean) => {
    if (!user) return;

    try {
      setLoading(true);

      // Update the appropriate setting
      if (type === 'collection') {
        setAllowDataCollection(value);
      } else {
        setAllowAIImprovement(value);
      }

      // Save to localStorage (in a real app, this would be saved to your backend)
      const newConsent = {
        allowDataCollection: type === 'collection' ? value : allowDataCollection,
        allowAIImprovement: type === 'improvement' ? value : allowAIImprovement,
        updatedAt: Date.now(),
      };

      localStorage.setItem(`ai_consent_${user.id}`, JSON.stringify(newConsent));

      // In a real implementation, you would call your user consent service:
      // await userConsentService.updateAIDataConsent(user.id, newConsent.allowDataCollection, newConsent.allowAIImprovement);

    } catch (error) {
      console.error('Failed to update consent setting:', error);
      // Revert the change if it failed
      if (type === 'collection') {
        setAllowDataCollection(!value);
      } else {
        setAllowAIImprovement(!value);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasLoaded) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI Data Usage Preferences
          </h3>
          <p className="text-gray-600 text-sm">
            Control how your data is used to improve SpeakSync&apos;s AI features. 
            All data is anonymized and aggregated before analysis.
          </p>
        </div>

        <div className="space-y-6">
          {/* Data Collection Consent */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-6">
              <h4 className="text-base font-medium text-gray-900 mb-1">
                Voice Data Collection
              </h4>
              <p className="text-sm text-gray-600">
                Allow anonymized voice patterns to be used for improving speech recognition 
                and analysis accuracy. No personal identifying information is collected.
              </p>
            </div>
            <Switch
              checked={allowDataCollection}
              onChange={(value) => updateConsentSetting('collection', value)}
              disabled={loading}
              className={`${
                allowDataCollection ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
            >
              <span
                className={`${
                  allowDataCollection ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          {/* AI Improvement Consent */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-6">
              <h4 className="text-base font-medium text-gray-900 mb-1">
                AI Model Training
              </h4>
              <p className="text-sm text-gray-600">
                Allow aggregated usage patterns to help train and improve AI coaching 
                suggestions, tone analysis, and other intelligent features.
              </p>
            </div>
            <Switch
              checked={allowAIImprovement}
              onChange={(value) => updateConsentSetting('improvement', value)}
              disabled={loading}
              className={`${
                allowAIImprovement ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
            >
              <span
                className={`${
                  allowAIImprovement ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>
              Your privacy is protected. You can change these settings at any time.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
