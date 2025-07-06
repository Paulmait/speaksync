# SpeakSync Subscription & Feature Gating System

This document outlines the subscription system architecture and implementation for the SpeakSync mobile app.

## Overview

SpeakSync offers a tiered subscription model with Free, Pro, and Studio plans. The system manages feature access, tracks usage limits for free users, and displays contextual CTAs when limits are reached.

## Key Components

### 1. Subscription Types and Models

- Located in `src/types/subscriptionTypes.ts`
- Defines subscription tiers (FREE, PRO, STUDIO) and feature flags
- Maps features to each tier
- Defines free tier usage limits
- Provides types for tracking usage and managing CTAs

### 2. Subscription Service

- Located in `src/services/subscriptionService.ts`
- Singleton service for managing all subscription operations
- Integrates with Firebase Firestore for data persistence
- Syncs with RevenueCat for in-app purchases
- Tracks usage limits for free tier users
- Provides methods to check feature availability
- Generates appropriate CTA messages

### 3. Firebase Cloud Functions

- Located in `functions/src/index.ts`
- Handles atomic operations for tracking usage
- Secures subscription data from client-side manipulation
- Implements rate limits and security for free tier
- Functions:
  - `trackScriptCreation`: Tracks script count for free users
  - `trackSessionStart`: Tracks session count for free users
  - `trackSessionDuration`: Tracks accumulated session time
  - `resetFreeTierUsage`: Resets limits when upgrading
  - `enforceScriptLimits`: Prevents exceeding free tier limits

### 4. Firebase Security Rules

- Located in `firestore.rules`
- Enforces subscription-based access control
- Prevents users from bypassing free tier limits
- Ensures only Cloud Functions can update usage data
- Protects subscription data from unauthorized modification

## User Flow

1. User creates account (default Free tier)
2. System tracks script/session creation and duration
3. When limits are reached, contextual CTAs are displayed
4. User can purchase Pro/Studio subscription through RevenueCat
5. Upon upgrade, limits are removed and usage counters reset

## Integration Points

- `App.tsx`: Initializes subscription service on app start
- `scriptStore.ts`: Checks subscription status before script creation
- UI Components: Check `isFeatureAvailable()` before rendering premium features
- Session screens: Track session start/duration for free tier users

## Security Considerations

- All usage tracking is performed server-side via Cloud Functions
- Firebase security rules prevent direct manipulation of usage data
- Client-side checks are for UX only; server enforces actual limits
- RevenueCat receipts are validated server-side before upgrading users

## Testing

To test the subscription system:
1. Create a free account and verify feature limitations
2. Create scripts until reaching the free limit
3. Start sessions until reaching the free limit
4. Test the purchase flow using RevenueCat sandbox mode
5. Verify that limits are removed after upgrade
6. Test receipt validation and restore purchases functionality

## Extending the System

To add new premium features:
1. Add the feature flag to `FeatureFlags` interface
2. Update `TierFeatureMapping` to specify which tiers have access
3. Use `subscriptionService.isFeatureAvailable()` in UI components
4. Add appropriate CTAs using `getCtaMessage()`
