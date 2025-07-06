import { useState, useEffect, useCallback } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { userConsentService } from '../services/userConsentService';
import { ConsentStatus, PolicyUpdateData } from '../types/userConsent';
import { LoggingService } from '../services/loggingService';

const logger = LoggingService.getInstance();

export function useConsentStatus() {
  const { authState } = useScriptStore();
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPolicyUpdate, setShowPolicyUpdate] = useState(false);
  const [policyUpdateData, setPolicyUpdateData] = useState<PolicyUpdateData | null>(null);

  const checkConsentStatus = useCallback(async () => {
    if (!authState.user?.uid) {
      return;
    }

    try {
      setLoading(true);
      const status = await userConsentService.checkConsentStatus(authState.user.uid);
      setConsentStatus(status);

      // If there are pending consents, show policy update modal
      if (status.needsUpdate && status.pendingConsents.length > 0) {
        const firstPending = status.pendingConsents[0];
        
        if (firstPending) {
          const updateData: PolicyUpdateData = {
            documentType: firstPending.documentType,
            previousVersion: firstPending.userVersion || '1.0',
            newVersion: firstPending.currentVersion,
            effectiveDate: Date.now(),
            requiresConsent: true,
            summary: `We've updated our ${firstPending.documentType} to better serve you and comply with current regulations.`,
          };

          setPolicyUpdateData(updateData);
          setShowPolicyUpdate(true);
        }
      }
    } catch (error) {
      logger.error('Failed to check consent status', error as Error);
    } finally {
      setLoading(false);
    }
  }, [authState.user?.uid]);

  const handleConsentUpdated = useCallback(async (hasConsented: boolean) => {
    if (hasConsented && policyUpdateData) {
      // Recheck consent status after update
      await checkConsentStatus();
      setShowPolicyUpdate(false);
      setPolicyUpdateData(null);
    }
  }, [checkConsentStatus, policyUpdateData]);

  const dismissPolicyUpdate = useCallback(() => {
    setShowPolicyUpdate(false);
    setPolicyUpdateData(null);
  }, []);

  // Check consent status when user logs in
  useEffect(() => {
    if (authState.user?.uid) {
      checkConsentStatus();
    } else {
      setConsentStatus(null);
      setShowPolicyUpdate(false);
      setPolicyUpdateData(null);
    }
  }, [authState.user?.uid, checkConsentStatus]);

  return {
    consentStatus,
    loading,
    showPolicyUpdate,
    policyUpdateData,
    handleConsentUpdated,
    dismissPolicyUpdate,
    recheckConsent: checkConsentStatus,
  };
}
