'use client';

import React from 'react';
import LegalDocuments from '@/components/LegalDocuments';
import AIDataConsentSettings from '@/components/AIDataConsentSettings';
import { useAuth } from '@/contexts/AuthContext';

export default function LegalPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Legal Documents */}
        <LegalDocuments />
        
        {/* AI Data Consent Settings (only show if user is logged in) */}
        {user && (
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy Settings</h2>
              <p className="text-gray-600">
                Manage your data privacy preferences and consent settings.
              </p>
            </div>
            <AIDataConsentSettings />
          </div>
        )}
      </div>
    </div>
  );
}
