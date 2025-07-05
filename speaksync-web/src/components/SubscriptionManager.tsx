'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  StarIcon,
  BoltIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export interface SubscriptionTier {
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface SubscriptionManagerProps {
  currentTier?: string;
  onUpgrade?: (tier: string) => void;
}

const tiers: SubscriptionTier[] = [
  {
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    description: 'Perfect for individuals getting started',
    features: [
      '5 scripts',
      '1 team (3 members)',
      'Basic editor',
      'Local storage',
      'Community support',
    ],
  },
  {
    name: 'Personal',
    price: 9.99,
    yearlyPrice: 99.99,
    description: 'For professionals who need more power',
    features: [
      '50 scripts',
      '3 teams (5 members each)',
      'Cloud sync',
      'Advanced editor',
      'Analytics dashboard',
      'Priority support',
      'Export options',
    ],
    popular: true,
  },
  {
    name: 'Business',
    price: 29.99,
    yearlyPrice: 299.99,
    description: 'For teams and growing businesses',
    features: [
      '500 scripts',
      '10 teams (50 members each)',
      'Team collaboration',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'SSO integration',
      'Priority support',
      'Bulk export',
    ],
  },
  {
    name: 'Enterprise',
    price: 99.99,
    yearlyPrice: 999.99,
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited scripts',
      'Unlimited teams',
      'Advanced team management',
      'Custom integrations',
      'Dedicated support',
      'On-premise deployment',
      'Advanced security',
      'Custom contracts',
      'Training & onboarding',
    ],
  },
];

export default function SubscriptionManager({ currentTier = 'Free', onUpgrade }: SubscriptionManagerProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showUsage, setShowUsage] = useState(false);
  
  // Mock usage data - would come from real subscription service
  const usageData = {
    scripts: { used: 12, limit: 50 },
    teams: { used: 2, limit: 3 },
    storage: { used: 1.2, limit: 5.0 }, // GB
    members: { used: 8, limit: 15 },
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free': return <GlobeAltIcon className="w-6 h-6" />;
      case 'personal': return <StarIcon className="w-6 h-6" />;
      case 'business': return <BoltIcon className="w-6 h-6" />;
      case 'enterprise': return <ShieldCheckIcon className="w-6 h-6" />;
      default: return <GlobeAltIcon className="w-6 h-6" />;
    }
  };

  const handleUpgrade = (tierName: string) => {
    if (onUpgrade) {
      onUpgrade(tierName);
    } else {
      // Default behavior - open Stripe checkout or similar
      console.log(`Upgrading to ${tierName}`);
      alert(`This would open the payment flow for ${tierName} tier`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Unlock the full potential of SpeakSync with the right plan for you
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-8">
          <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`ml-3 ${billingCycle === 'yearly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            Yearly
            <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Save 17%
            </span>
          </span>
        </div>
      </div>

      {/* Current Usage (if user has a subscription) */}
      {currentTier !== 'Free' && (
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Current Usage</h2>
              <button
                onClick={() => setShowUsage(!showUsage)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {showUsage ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {showUsage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {Object.entries(usageData).map(([key, value]) => {
                  const percentage = getUsagePercentage(value.used, value.limit);
                  const colorClass = getUsageColor(percentage);
                  
                  return (
                    <div key={key} className="text-center">
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {key === 'storage' ? `${value.used.toFixed(1)}GB` : value.used}
                        </span>
                        <span className="text-gray-500">
                          {' / '}{key === 'storage' ? `${value.limit}GB` : value.limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            percentage >= 90 ? 'bg-red-500' :
                            percentage >= 75 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {tiers.map((tier, index) => {
          const monthlyPrice = billingCycle === 'yearly' ? tier.yearlyPrice / 12 : tier.price;
          const isCurrentTier = tier.name === currentTier;
          
          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden ${
                tier.popular 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : isCurrentTier
                  ? 'border-green-500 ring-2 ring-green-200'
                  : 'border-gray-200'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              {isCurrentTier && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm font-medium">
                  Current Plan
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg ${
                    tier.popular ? 'bg-blue-100 text-blue-600' :
                    isCurrentTier ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getTierIcon(tier.name)}
                  </div>
                  <h3 className="ml-3 text-xl font-bold text-gray-900">{tier.name}</h3>
                </div>

                <p className="text-gray-600 mb-6">{tier.description}</p>

                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      ${monthlyPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-500 ml-1">/month</span>
                  </div>
                  {billingCycle === 'yearly' && tier.price > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Billed annually (${tier.yearlyPrice}/year)
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(tier.name)}
                  disabled={isCurrentTier}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    isCurrentTier
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : tier.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentTier 
                    ? 'Current Plan' 
                    : tier.name === 'Free' 
                    ? 'Downgrade' 
                    : `Upgrade to ${tier.name}`
                  }
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            {
              question: "Can I change my plan anytime?",
              answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, and at the end of your billing cycle for downgrades."
            },
            {
              question: "What happens to my data if I downgrade?",
              answer: "Your data is never deleted. If you exceed the limits of your new plan, you'll have read-only access until you upgrade again or remove some content."
            },
            {
              question: "Do you offer refunds?",
              answer: "We offer a 30-day money-back guarantee for annual plans. Monthly plans are billed in advance and are non-refundable."
            },
            {
              question: "Is there a discount for nonprofits?",
              answer: "Yes! We offer a 50% discount on all paid plans for qualified nonprofit organizations. Contact our support team to apply."
            }
          ].map((faq, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="mt-16 text-center">
        <div className="bg-gray-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need a Custom Solution?
          </h2>
          <p className="text-gray-600 mb-6">
            Looking for something specific? We offer custom enterprise solutions 
            tailored to your organization&apos;s needs.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}
