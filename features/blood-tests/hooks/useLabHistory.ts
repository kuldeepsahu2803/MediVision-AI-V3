import { useState, useEffect, useRef } from 'react';
import { BloodTestReport } from '../types/bloodTest.types';
import { useAuthSession } from '@/hooks/useAuthSession.ts';
import * as dbService from '@/services/databaseService.ts';
import * as localDB from '@/services/localDatabaseService.ts';

/**
 * Feature-specific hook for managing lab report history.
 * Part of Batch 6 migration.
 */
export const useLabHistory = () => {
  const [labHistory, setLabHistory] = useState<BloodTestReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, user, loading: authLoading } = useAuthSession();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 1. Initial load (Cloud if logged in, Local if guest)
        const initialLabs = isLoggedIn 
          ? await dbService.getAllLabReports() 
          : await localDB.getLabsFromLocalDB();
          
        if (mounted) {
          setLabHistory(initialLabs || []);
        }

        // 2. Refresh/Sync logic if logged in
        if (isLoggedIn && !hasSyncedRef.current) {
          hasSyncedRef.current = true;
          const freshLabs = await dbService.getAllLabReports();
          if (mounted) {
            setLabHistory(freshLabs || []);
          }
        }
      } catch (e) {
        console.error("Lab History Loader Failure:", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [isLoggedIn, user, authLoading]);

  const saveLabToHistory = async (dataToSave: BloodTestReport) => {
    // Optimistic update
    setLabHistory(prev => [dataToSave, ...prev]);
    
    try {
      if (isLoggedIn) {
        await dbService.saveLabReport(dataToSave);
        const fresh = await dbService.getAllLabReports();
        setLabHistory(fresh || []);
      } else {
        await localDB.saveLabToLocalDB(dataToSave);
        const fresh = await localDB.getLabsFromLocalDB();
        setLabHistory(fresh || []);
      }
    } catch (e) { 
        console.error("Lab Save Failure:", e);
        throw e;
    }
  };

  const deleteLabFromHistory = async (idToDelete: string) => {
    // Optimistic update
    setLabHistory(prev => prev.filter(h => h.id !== idToDelete));
    
    try { 
      if (isLoggedIn) {
        await dbService.deleteLabReport(idToDelete);
      } else {
        await localDB.deleteLabFromLocalDB(idToDelete);
      }
    } catch (e) { 
        console.error("Lab Delete Failure:", e);
        // Re-fetch to restore state
        const fresh = isLoggedIn 
            ? await dbService.getAllLabReports() 
            : await localDB.getLabsFromLocalDB();
        setLabHistory(fresh || []);
        throw e;
    }
  };

  return { 
    labHistory, 
    saveLabToHistory, 
    deleteLabFromHistory, 
    isLoading 
  };
};
