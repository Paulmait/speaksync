'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUsageTracking, useFeatureAccess } from '@/hooks/useUsageTracking';
import { FeatureGate, LockedButton, FeatureBadge } from '@/components/ui/FeatureGate';
import { UpgradeModal, LimitReachedBanner, InlineUpgradePrompt } from '@/components/ui/UpgradePrompts';
import { SpeakSyncLogo, BrandedButton, BrandedCard } from '@/components/ui/BrandedComponents';
import { CtaType, SubscriptionTier, FeatureFlags } from '@/types/subscription';
import {
  DocumentTextIcon,
  PlayIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  VideoCameraIcon,
  UsersIcon,
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function FeatureShowcase() {
  const subscription = useSubscription();
  const usageTracking = useUsageTracking();
  const featureAccess = useFeatureAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCtaType, setSelectedCtaType] = useState<CtaType>(CtaType.GENERAL_UPGRADE);

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Loading subscription data...</div>
      </div>
    );
  }

  const handleFeatureClick = (feature: keyof FeatureFlags) => {
    featureAccess.checkFeatureAccess(feature);
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    console.log(`Upgrading to ${tier}`);
    // In a real app, this would redirect to payment flow
    alert(`This would initiate upgrade to ${tier} tier`);
  };

  const handleCreateScript = async () => {
    const success = await usageTracking.handleScriptCreated();
    if (success) {
      alert('Script created successfully!');
    }
  };

  const handleStartSession = async () => {
    const success = await usageTracking.handleSessionStarted();
    if (success) {
      alert('Session started successfully!');
    }
  };

  const openUpgradeModal = (ctaType: CtaType) => {
    setSelectedCtaType(ctaType);
    setShowUpgradeModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SpeakSyncLogo size="xl" variant="full" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            SpeakSync Feature Showcase
          </h1>
          <p className="text-gray-600">
            Experience our feature gating and upgrade prompts
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
            <span className="font-medium">
              Current Plan: {subscription.subscription.subscriptionTier.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scripts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageTracking.scriptCount} / {usageTracking.scriptLimit === Infinity ? '∞' : usageTracking.scriptLimit}
                </p>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            </div>
            {!usageTracking.canCreateScript && (
              <LimitReachedBanner
                limitType="scripts"
                currentValue={usageTracking.scriptCount}
                maxValue={usageTracking.scriptLimit}
                onUpgrade={handleUpgrade}
                className="mt-4"
              />
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageTracking.sessionCount} / {usageTracking.sessionLimit === Infinity ? '∞' : usageTracking.sessionLimit}
                </p>
              </div>
              <PlayIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Session Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(usageTracking.sessionDuration / 60)}m / {Math.floor(usageTracking.sessionDurationLimit / 60)}m
                </p>
              </div>
              <SparklesIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Feature Demonstration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Basic Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Features</h3>
            <div className="space-y-4">
              <FeatureGate feature="basicTeleprompter">
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <PlayIcon className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-green-800">Basic Teleprompter</span>
                </div>
              </FeatureGate>

              <FeatureGate
                feature="scriptTemplates"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              >
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-blue-800">Script Templates</span>
                </div>
              </FeatureGate>

              <button
                onClick={handleCreateScript}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Script
              </button>
            </div>
          </div>

          {/* AI Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <FeatureBadge feature="aiFeedback">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Features</h3>
            </FeatureBadge>
            <div className="space-y-4">
              <LockedButton
                feature="aiFeedback"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
                className="w-full"
              >
                Get AI Feedback
              </LockedButton>

              <LockedButton
                feature="aiSuggestions"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
                className="w-full"
                variant="secondary"
              >
                AI Suggestions
              </LockedButton>

              <LockedButton
                feature="speechAnalysis"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
                className="w-full"
                variant="secondary"
              >
                Speech Analysis
              </LockedButton>
            </div>
          </div>

          {/* Cloud & Export */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cloud & Export</h3>
            <div className="space-y-4">
              <FeatureGate
                feature="cloudSync"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              >
                <button
                  onClick={() => handleFeatureClick('cloudSync')}
                  className="w-full flex items-center justify-center py-2 px-4 bg-blue-100 text-blue-800 rounded-lg"
                >
                  <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                  Cloud Sync
                </button>
              </FeatureGate>

              <FeatureGate
                feature="exportVideo"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              >
                <button
                  onClick={() => handleFeatureClick('exportVideo')}
                  className="w-full flex items-center justify-center py-2 px-4 bg-purple-100 text-purple-800 rounded-lg"
                >
                  <VideoCameraIcon className="w-5 h-5 mr-2" />
                  Export Video
                </button>
              </FeatureGate>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
            <div className="space-y-4">
              <FeatureGate
                feature="analytics"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              >
                <button
                  onClick={() => handleFeatureClick('analytics')}
                  className="w-full flex items-center justify-center py-2 px-4 bg-green-100 text-green-800 rounded-lg"
                >
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  View Analytics
                </button>
              </FeatureGate>

              <FeatureGate
                feature="performanceMetrics"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              >
                <button
                  onClick={() => handleFeatureClick('performanceMetrics')}
                  className="w-full flex items-center justify-center py-2 px-4 bg-yellow-100 text-yellow-800 rounded-lg"
                >
                  Performance Metrics
                </button>
              </FeatureGate>
            </div>
          </div>

          {/* Team Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Features</h3>
            <div className="space-y-4">
              <FeatureGate
                feature="teamCollaboration"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              >
                <button
                  onClick={() => handleFeatureClick('teamCollaboration')}
                  className="w-full flex items-center justify-center py-2 px-4 bg-indigo-100 text-indigo-800 rounded-lg"
                >
                  <UsersIcon className="w-5 h-5 mr-2" />
                  Team Collaboration
                </button>
              </FeatureGate>

              <FeatureGate
                feature="realTimeEditing"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              >
                <button
                  onClick={() => handleFeatureClick('realTimeEditing')}
                  className="w-full flex items-center justify-center py-2 px-4 bg-pink-100 text-pink-800 rounded-lg"
                >
                  Real-time Editing
                </button>
              </FeatureGate>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced</h3>
            <div className="space-y-4">
              <FeatureGate
                feature="customBranding"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              >
                <button
                  onClick={() => handleFeatureClick('customBranding')}
                  className="w-full flex items-center justify-center py-2 px-4 bg-gray-100 text-gray-800 rounded-lg"
                >
                  <Cog6ToothIcon className="w-5 h-5 mr-2" />
                  Custom Branding
                </button>
              </FeatureGate>

              <FeatureGate
                feature="apiAccess"
                onUpgradeClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              >
                <button
                  onClick={() => handleFeatureClick('apiAccess')}
                  className="w-full flex items-center justify-center py-2 px-4 bg-red-100 text-red-800 rounded-lg"
                >
                  API Access
                </button>
              </FeatureGate>
            </div>
          </div>
        </div>

        {/* Session Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Management</h3>
          <div className="flex gap-4">
            <button
              onClick={handleStartSession}
              className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
            >
              Start New Session
            </button>
            <button
              onClick={() => usageTracking.handleSessionDurationUpdate(60)}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add 1 Minute
            </button>
          </div>
        </div>

        {/* CTA Demonstrations */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">CTA Demonstrations</h3>
          
          <InlineUpgradePrompt
            ctaType={CtaType.SCRIPT_LIMIT}
            onUpgrade={handleUpgrade}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => openUpgradeModal(CtaType.SESSION_LIMIT)}
              className="bg-red-100 text-red-800 py-3 px-4 rounded-lg hover:bg-red-200 transition-colors"
            >
              Show Session Limit CTA
            </button>
            <button
              onClick={() => openUpgradeModal(CtaType.TIME_LIMIT)}
              className="bg-yellow-100 text-yellow-800 py-3 px-4 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              Show Time Limit CTA
            </button>
            <button
              onClick={() => openUpgradeModal(CtaType.FEATURE_LOCKED)}
              className="bg-blue-100 text-blue-800 py-3 px-4 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Show Feature Locked CTA
            </button>
            <button
              onClick={() => openUpgradeModal(CtaType.GENERAL_UPGRADE)}
              className="bg-purple-100 text-purple-800 py-3 px-4 rounded-lg hover:bg-purple-200 transition-colors"
            >
              Show General Upgrade CTA
            </button>
          </div>
        </div>

        {/* Upgrade Modals */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          ctaType={selectedCtaType}
          onUpgrade={handleUpgrade}
        />

        <UpgradeModal
          isOpen={usageTracking.isUpgradePromptOpen}
          onClose={usageTracking.closeUpgradePrompt}
          ctaType={usageTracking.upgradePromptType || CtaType.GENERAL_UPGRADE}
          onUpgrade={handleUpgrade}
        />

        <UpgradeModal
          isOpen={featureAccess.isUpgradePromptOpen}
          onClose={featureAccess.closeUpgradePrompt}
          ctaType={featureAccess.upgradePromptType || CtaType.FEATURE_LOCKED}
          onUpgrade={handleUpgrade}
        />
      </div>
    </div>
  );
}
