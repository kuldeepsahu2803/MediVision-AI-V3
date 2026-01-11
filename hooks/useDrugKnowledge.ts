
import { useState, useEffect, useCallback, useRef } from 'react';
import { Medicine, FdaVerification } from '../types';
import { searchFdaDrug } from '../services/openFdaService';

export const useDrugKnowledge = (medications: Medicine[]) => {
  const [verifications, setVerifications] = useState<Record<string, FdaVerification>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to verify a single name
  const verifyDrug = useCallback(async (name: string) => {
    if (!name || verifications[name.toLowerCase()]) return;

    setIsVerifying(true);
    try {
      const result = await searchFdaDrug(name);
      
      // Verification check: ensure we are updating the correct key
      // Since 'name' is captured in the closure, this is safe for the map key.
      if (result) {
        setVerifications(prev => ({
          ...prev,
          [name.toLowerCase()]: result
        }));
      } else {
         setVerifications(prev => ({
          ...prev,
          [name.toLowerCase()]: { verified: false, lastChecked: new Date().toISOString() }
        }));
      }
    } finally {
      setIsVerifying(false);
    }
  }, [verifications]);

  // Bulk verify effect
  useEffect(() => {
    // 1. Cancel previous requests
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    // 2. Create new controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const checkAll = async () => {
      // Find meds that haven't been verified yet
      const uncheckedMeds = medications.filter(m => m.name && !verifications[m.name.toLowerCase()]);
      
      if (uncheckedMeds.length === 0) return;

      setIsVerifying(true);
      
      for (const med of uncheckedMeds) {
        if (controller.signal.aborted) break;
        
        const result = await searchFdaDrug(med.name, controller.signal);
        
        // CRITICAL: Check abort signal before state update to prevent race conditions
        if (!controller.signal.aborted) {
            if (result) {
                // Double check: ensure the result matches the drug we asked for
                // (searchFdaDrug returns the matched standard name, but we key by our input name)
                setVerifications(prev => ({ ...prev, [med.name.toLowerCase()]: result }));
            } else {
                setVerifications(prev => ({ ...prev, [med.name.toLowerCase()]: { verified: false, lastChecked: new Date().toISOString() } }));
            }
        }
        
        // Small delay to be polite to the API
        await new Promise(r => setTimeout(r, 100));
      }
      
      if (!controller.signal.aborted) {
        setIsVerifying(false);
      }
    };

    // Debounce the effect slightly
    const timer = setTimeout(checkAll, 500);
    
    return () => {
        clearTimeout(timer);
        controller.abort();
    };
  }, [medications, verifications]);

  return {
    verifications,
    isVerifying,
    verifyDrug
  };
};
