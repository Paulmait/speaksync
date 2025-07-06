'use client';

import React from 'react';
import { BRAND_COLORS } from '@/constants/branding';

interface SpeakSyncLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full' | 'text';
  className?: string;
}

export function SpeakSyncLogo({ 
  size = 'md', 
  variant = 'icon',
  className = '' 
}: SpeakSyncLogoProps) {
  const getIconSize = () => {
    switch (size) {
      case 'sm': return { width: 24, height: 24 };
      case 'md': return { width: 32, height: 32 };
      case 'lg': return { width: 48, height: 48 };
      case 'xl': return { width: 64, height: 64 };
      default: return { width: 32, height: 32 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-lg';
      case 'md': return 'text-xl';
      case 'lg': return 'text-2xl';
      case 'xl': return 'text-3xl';
      default: return 'text-xl';
    }
  };

  const iconSize = getIconSize();

  const SpeakSyncIcon = () => (
    <svg
      width={iconSize.width}
      height={iconSize.height}
      viewBox="0 0 100 100"
      className={className}
    >
      {/* Chat bubble background */}
      <path
        d="M15 20C15 13.373 20.373 8 27 8h46c6.627 0 12 5.373 12 12v36c0 6.627-5.373 12-12 12H45L25 80V68c-5.523 0-10-4.477-10-10V20z"
        fill={BRAND_COLORS.PRIMARY_BLUE}
        rx="12"
      />
      
      {/* Sound wave */}
      <path
        d="M30 35c0 0 5-10 10-5s8 15 15 10s12-20 15-10"
        stroke={BRAND_COLORS.SECONDARY_GREEN}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <SpeakSyncIcon />;
  }

  if (variant === 'text') {
    return (
      <span className={`${getTextSize()} font-bold text-brand-primary ${className}`}>
        SpeakSync
      </span>
    );
  }

  // Full logo with icon and text
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SpeakSyncIcon />
      <span className={`${getTextSize()} font-bold text-brand-primary`}>
        SpeakSync
      </span>
    </div>
  );
}

interface BrandedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function BrandedButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = ''
}: BrandedButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-brand-primary hover:bg-brand-blue-dark text-white focus:ring-brand-primary',
    secondary: 'bg-brand-secondary hover:bg-brand-green-dark text-white focus:ring-brand-secondary',
    outline: 'border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white focus:ring-brand-primary',
    ghost: 'text-brand-primary hover:bg-brand-blue-light focus:ring-brand-primary'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}

interface BrandedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'subtle';
  className?: string;
}

export function BrandedCard({ 
  children, 
  variant = 'default', 
  className = '' 
}: BrandedCardProps) {
  const baseClasses = 'rounded-lg shadow-lg border';
  
  const variantClasses = {
    default: 'bg-white border-gray-200',
    gradient: 'bg-gradient-brand text-white border-transparent',
    subtle: 'bg-gradient-subtle border-gray-100'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

interface BrandedBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

export function BrandedBadge({ 
  children, 
  variant = 'primary',
  size = 'sm',
  className = '' 
}: BrandedBadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  const variantClasses = {
    primary: 'bg-brand-blue-light text-brand-primary',
    secondary: 'bg-brand-green-light text-brand-green-dark',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
