'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CheckIcon, 
  StarIcon,
  BoltIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useSubscription, getCtaMessage } from '@/contexts/SubscriptionContext';
import { CtaType, SubscriptionTier } from '@/types/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ctaType: CtaType;
  onUpgrade?: (tier: SubscriptionTier) => void;
  onSecondaryAction?: () => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  ctaType,
  onUpgrade,
  onSecondaryAction
}: UpgradeModalProps) {
  const subscription = useSubscription();
  const ctaMessage = getCtaMessage(ctaType);

  if (!subscription) return null;

  const handleUpgrade = (tier: SubscriptionTier) => {
    if (onUpgrade) {
      onUpgrade(tier);
    }
    onClose();
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    }
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <SparklesIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <Dialog.Title
                      as="h3"
                      className="ml-3 text-lg font-semibold text-gray-900"
                    >
                      {ctaMessage.title}
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 mb-4">{ctaMessage.description}</p>
                  
                  {ctaMessage.benefits && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">What you&apos;ll get:</h4>
                      <ul className="space-y-1">
                        {ctaMessage.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    onClick={() => handleUpgrade(SubscriptionTier.PRO)}
                  >
                    {ctaMessage.buttonText}
                  </button>
                  
                  {ctaMessage.secondaryButtonText && (
                    <button
                      type="button"
                      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      onClick={handleSecondaryAction}
                    >
                      {ctaMessage.secondaryButtonText}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

interface UpgradeToastProps {
  ctaType: CtaType;
  onUpgrade?: (tier: SubscriptionTier) => void;
  onDismiss?: () => void;
  className?: string;
}

export function UpgradeToast({
  ctaType,
  onUpgrade,
  onDismiss,
  className = ''
}: UpgradeToastProps) {
  const ctaMessage = getCtaMessage(ctaType);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade(SubscriptionTier.PRO);
    }
  };

  const getTierIcon = () => {
    switch (ctaType) {
      case CtaType.FEATURE_LOCKED:
        return <BoltIcon className="w-5 h-5 text-blue-600" />;
      case CtaType.TRIAL_ENDING:
        return <StarIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <SparklesIcon className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getTierIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{ctaMessage.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{ctaMessage.description}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleUpgrade}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {ctaMessage.buttonText}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface InlineUpgradePromptProps {
  ctaType: CtaType;
  onUpgrade?: (tier: SubscriptionTier) => void;
  className?: string;
  showIcon?: boolean;
}

export function InlineUpgradePrompt({
  ctaType,
  onUpgrade,
  className = '',
  showIcon = true
}: InlineUpgradePromptProps) {
  const ctaMessage = getCtaMessage(ctaType);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade(SubscriptionTier.PRO);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        {showIcon && (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-blue-600" />
          </div>
        )}
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{ctaMessage.title}</h3>
          <p className="text-sm text-gray-600">{ctaMessage.description}</p>
        </div>
        <button
          onClick={handleUpgrade}
          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {ctaMessage.buttonText}
        </button>
      </div>
    </div>
  );
}

interface LimitReachedBannerProps {
  limitType: 'scripts' | 'sessions' | 'time';
  currentValue: number;
  maxValue: number;
  onUpgrade?: (tier: SubscriptionTier) => void;
  onManage?: () => void;
  className?: string;
}

export function LimitReachedBanner({
  limitType,
  currentValue,
  maxValue,
  onUpgrade,
  onManage,
  className = ''
}: LimitReachedBannerProps) {
  const subscription = useSubscription();
  
  if (!subscription) return null;

  const isAtLimit = currentValue >= maxValue;
  const isNearLimit = currentValue >= maxValue * 0.8;
  
  if (!isNearLimit) return null;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade(SubscriptionTier.PRO);
    }
  };

  const bgColor = isAtLimit ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
  const textColor = isAtLimit ? 'text-red-800' : 'text-yellow-800';

  return (
    <div className={`border rounded-lg p-4 ${bgColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isAtLimit ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            {isAtLimit ? (
              <XMarkIcon className={`w-5 h-5 ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`} />
            ) : (
              <SparklesIcon className={`w-5 h-5 ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`} />
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-semibold ${textColor}`}>
              {isAtLimit 
                ? `You've reached your ${limitType} limit (${currentValue}/${maxValue})`
                : `You're near your ${limitType} limit (${currentValue}/${maxValue})`
              }
            </h3>
            <p className={`text-sm ${textColor.replace('800', '600')}`}>
              Upgrade to Pro for unlimited access
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onManage && (
            <button
              onClick={onManage}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Manage
            </button>
          )}
          <button
            onClick={handleUpgrade}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
