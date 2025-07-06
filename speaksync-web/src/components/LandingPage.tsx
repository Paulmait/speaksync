'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  PencilIcon, 
  CloudIcon, 
  DevicePhoneMobileIcon,
  CheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import AuthModal from '@/components/AuthModal';

const features = [
  {
    icon: PencilIcon,
    title: 'Rich Text Editor',
    description: 'Write and format your scripts with our powerful editor featuring spell check and grammar assistance.',
  },
  {
    icon: CloudIcon,
    title: 'Cloud Sync',
    description: 'Your scripts are automatically synced across all devices with real-time collaboration features.',
  },
  {
    icon: PlayIcon,
    title: 'Teleprompter Mode',
    description: 'Professional teleprompter with customizable speed, font size, and auto-scroll functionality.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Mobile Ready',
    description: 'Access your scripts anywhere with our responsive web app and dedicated mobile application.',
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'News Anchor',
    content: 'SpeakSync has revolutionized how I prepare for broadcasts. The seamless sync between my phone and computer is incredible.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Content Creator',
    content: 'The teleprompter feature is so smooth and professional. My video quality has improved dramatically since using SpeakSync.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Public Speaker',
    content: 'Being able to edit my speeches on the web and present them on mobile has made my workflow so much more efficient.',
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Up to 5 scripts',
      'Basic teleprompter',
      'Cloud sync',
      'Mobile app access',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    description: 'For professionals and content creators',
    features: [
      'Unlimited scripts',
      'Advanced teleprompter settings',
      'Real-time collaboration',
      'Priority support',
      'Export options',
      'Analytics dashboard',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$24.99',
    period: '/month',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Team management',
      'Shared script libraries',
      'Advanced analytics',
      'Custom branding',
      'API access',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">SpeakSync</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6"
            >
              Professional Teleprompter
              <span className="text-blue-600"> Anywhere</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Create, edit, and present your scripts with our powerful web editor and mobile teleprompter.
              Perfect for content creators, speakers, and professionals.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-x-4"
            >
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
              >
                Start Creating
              </button>
              <button className="text-blue-600 hover:text-blue-700 px-8 py-3 rounded-lg text-lg font-medium border border-blue-600 hover:border-blue-700">
                Watch Demo
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to create and present
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for modern content creators
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Loved by creators worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our users have to say about SpeakSync
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm border"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that&apos;s right for you
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-white p-8 rounded-lg shadow-sm border ${
                  plan.highlighted ? 'ring-2 ring-blue-600' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="text-center mb-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    plan.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to elevate your presentations?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of creators who trust SpeakSync for their content creation needs.
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
          >
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">SpeakSync</h3>
            <p className="text-gray-400 mb-6">
              Professional teleprompter solutions for modern creators
            </p>
            
            {/* Legal Links */}
            <div className="flex justify-center space-x-6 mb-6 text-sm">
              <a 
                href="/legal" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Legal Documents
              </a>
              <span className="text-gray-600">•</span>
              <a 
                href="/legal#privacy-policy" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-gray-600">•</span>
              <a 
                href="/legal#terms-of-use" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms of Use
              </a>
              <span className="text-gray-600">•</span>
              <a 
                href="/legal#ai-disclaimer" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                AI Disclaimer
              </a>
            </div>
            
            <p className="text-gray-500 text-sm">
              © 2024 SpeakSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
