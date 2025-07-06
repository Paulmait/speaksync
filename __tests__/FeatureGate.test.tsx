import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { FeatureGate } from '../src/components/subscription/FeatureGate';
import { SubscriptionContext } from '../src/contexts/SubscriptionContext';
import { SubscriptionTier } from '../src/types/subscriptionTypes';

// Mock the subscription context
const mockSubscriptionContext = {
  isLoading: false,
  subscriptionContext: {
    subscription: {
      subscriptionTier: SubscriptionTier.FREE,
      subscriptionStatus: 'active' as const,
      subscriptionStartDate: Date.now(),
    },
    isFeatureAvailable: jest.fn(),
    hasReachedFreeLimit: jest.fn(),
    freeTierUsage: {
      freeSessionCount: 0,
      freeSessionDurationAccumulated: 0,
      savedScriptsCount: 0,
      lastUpdated: Date.now(),
    }
  },
  checkFeatureAccess: jest.fn(),
  checkFreeLimit: jest.fn(),
  getCtaMessage: jest.fn(),
  purchaseSubscription: jest.fn(),
  restorePurchases: jest.fn(),
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>
    <SubscriptionContext.Provider value={mockSubscriptionContext}>
      {children}
    </SubscriptionContext.Provider>
  </PaperProvider>
);

describe('FeatureGate Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when feature access is granted', () => {
    mockSubscriptionContext.checkFeatureAccess.mockReturnValue(true);

    const { getByText } = render(
      <TestWrapper>
        <FeatureGate feature="unlimitedTime">
          <div>Premium Feature Content</div>
        </FeatureGate>
      </TestWrapper>
    );

    expect(getByText('Premium Feature Content')).toBeTruthy();
  });

  it('should render upgrade CTA when feature access is denied', () => {
    mockSubscriptionContext.checkFeatureAccess.mockReturnValue(false);
    mockSubscriptionContext.getCtaMessage.mockReturnValue({
      title: 'Premium Feature',
      description: 'Upgrade to access this feature',
      buttonText: 'Upgrade Now'
    });

    const { getByText } = render(
      <TestWrapper>
        <FeatureGate feature="unlimitedTime">
          <div>Premium Feature Content</div>
        </FeatureGate>
      </TestWrapper>
    );

    expect(getByText('Premium Feature')).toBeTruthy();
    expect(getByText('Upgrade to access this feature')).toBeTruthy();
    expect(getByText('Upgrade Now')).toBeTruthy();
  });

  it('should call onUpgrade when upgrade button is pressed', () => {
    const mockOnUpgrade = jest.fn();
    mockSubscriptionContext.checkFeatureAccess.mockReturnValue(false);
    mockSubscriptionContext.getCtaMessage.mockReturnValue({
      title: 'Premium Feature',
      description: 'Upgrade to access this feature',
      buttonText: 'Upgrade Now'
    });

    const { getByText } = render(
      <TestWrapper>
        <FeatureGate feature="unlimitedTime" onUpgrade={mockOnUpgrade}>
          <div>Premium Feature Content</div>
        </FeatureGate>
      </TestWrapper>
    );

    fireEvent.press(getByText('Upgrade Now'));
    expect(mockOnUpgrade).toHaveBeenCalled();
  });

  it('should render fallback content when provided and access is denied', () => {
    mockSubscriptionContext.checkFeatureAccess.mockReturnValue(false);

    const { getByText } = render(
      <TestWrapper>
        <FeatureGate 
          feature="unlimitedTime" 
          fallback={<div>Feature Not Available</div>}
        >
          <div>Premium Feature Content</div>
        </FeatureGate>
      </TestWrapper>
    );

    expect(getByText('Feature Not Available')).toBeTruthy();
  });
});
