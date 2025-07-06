'use client';

import React, { ReactNode } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FeatureFlags } from '@/types/subscription';

interface FeatureGateProps {
  feature: keyof FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
  showLockIcon?: boolean;
  className?: string;
  onUpgradeClick?: () => void;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showLockIcon = true,
  className = '',
  onUpgradeClick
}: FeatureGateProps) {
  const subscription = useSubscription();
  
  if (!subscription) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-32" />;
  }

  const isAvailable = subscription.isFeatureAvailable(feature);
  
  if (isAvailable) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked state UI
  return (
    <div className={`relative ${className}`}>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      {showLockIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="bg-white rounded-lg shadow-lg p-3 border border-gray-200 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={onUpgradeClick}
          >
            <LockClosedIcon className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}

interface LockedButtonProps {
  feature: keyof FeatureFlags;
  children: ReactNode;
  onClick?: () => void;
  onUpgradeClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function LockedButton({
  feature,
  children,
  onClick,
  onUpgradeClick,
  className = '',
  variant = 'primary',
  size = 'md'
}: LockedButtonProps) {
  const subscription = useSubscription();
  
  if (!subscription) {
    return (
      <button disabled className={`opacity-50 cursor-not-allowed ${className}`}>
        {children}
      </button>
    );
  }

  const isAvailable = subscription.isFeatureAvailable(feature);
  
  const baseClasses = `inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`;
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const variantClasses = {
    primary: isAvailable 
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
      : 'bg-gray-300 text-gray-600 cursor-not-allowed',
    secondary: isAvailable 
      ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500' 
      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed',
    danger: isAvailable 
      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' 
      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
  };

  const handleClick = () => {
    if (isAvailable && onClick) {
      onClick();
    } else if (!isAvailable && onUpgradeClick) {
      onUpgradeClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isAvailable && !onUpgradeClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {!isAvailable && (
        <LockClosedIcon className="w-4 h-4 mr-2" />
      )}
      {children}
    </button>
  );
}

interface FeatureBadgeProps {
  feature: keyof FeatureFlags;
  children: ReactNode;
  proLabel?: string;
  className?: string;
}

export function FeatureBadge({ 
  feature, 
  children, 
  proLabel = 'PRO',
  className = '' 
}: FeatureBadgeProps) {
  const subscription = useSubscription();
  
  if (!subscription) {
    return <>{children}</>;
  }

  const isAvailable = subscription.isFeatureAvailable(feature);
  const upgradeNeeded = subscription.upgradeNeeded(feature);
  
  if (isAvailable) {
    return <>{children}</>;
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <span className="absolute -top-1 -right-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {upgradeNeeded?.toUpperCase() || proLabel}
      </span>
    </div>
  );
}
