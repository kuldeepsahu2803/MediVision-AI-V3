import { useState, useEffect, useRef } from 'react';
import { PrescriptionData } from '../types/prescription.types';
import { useAuthSession } from '@/hooks/useAuthSession.ts';
import * as dbService from '@/services/databaseService.ts';
import { syncLocalToCloud } from '@/services/syncService.ts';

/**
 * Feature-specific hook for managing prescription history.
 * Part of Batch 5 migration.
 */
export const usePrescriptionHistory = () => {
  const [history, setHistory] = useState<PrescriptionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, user, loading: authLoading } = useAuthSession();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const initialData = await dbService.getAllPrescriptions();
        if (mounted) {
          setHistory(initialData || []);
        }
        
        if (isLoggedIn && !hasSyncedRef.current) {
            syncLocalToCloud().then(async () => {
                hasSyncedRef.current = true;
                const fresh = await dbService.getAllPrescriptions();
                if (mounted) {
                  setHistory(fresh || []);
                }
            }).catch(syncErr => console.warn("Prescription background sync failed", syncErr));
        }
      } catch {
        console.error("Prescription History Loader Failure");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [isLoggedIn, user, authLoading]);

  const saveToHistory = async (dataToSave: PrescriptionData) => {
    const dataWithTimestamp = { ...dataToSave, timestamp: dataToSave.timestamp || new Date().toISOString() };
    
    // Optimistic update
    setHistory(prev => {
        const idx = prev.findIndex(h => h.id === dataWithTimestamp.id);
        if (idx > -1) {
            const next = [...prev];
            next[idx] = dataWithTimestamp;
            return next;
        }
        return [dataWithTimestamp, ...prev];
    });

    try {
        await dbService.savePrescription(dataWithTimestamp);
        const fresh = await dbService.getAllPrescriptions();
        setHistory(fresh || []);
    } catch (e: any) { 
        console.error("Prescription Save Failure:", e);
        throw new Error(e.message || "Failed to save prescription", { cause: e });
    }
  };

  const deleteFromHistory = async (idToDelete: string) => {
    // Optimistic update
    setHistory(prev => prev.filter(h => h.id !== idToDelete));
    
    try { 
        await dbService.deletePrescription(idToDelete); 
    } catch (e: any) { 
        console.error("Prescription Delete Failure:", e);
        // Re-fetch on failure to restore state
        const fresh = await dbService.getAllPrescriptions();
        setHistory(fresh || []);
        throw new Error(e.message || "Failed to delete prescription", { cause: e });
    }
  };

  return { 
    history, 
    saveToHistory, 
    deleteFromHistory, 
    isLoading 
  };
};
