import { useState, useEffect, useRef } from 'react';
import { PrescriptionData, BloodTestReport } from '../types.ts';
import { useAuthSession } from './useAuthSession.ts';
import * as dbService from '../services/databaseService.ts';
import * as localDB from '../services/localDatabaseService.ts';
import { syncLocalToCloud } from '../services/syncService.ts';

export const useMedicalHistory = () => {
  const [history, setHistory] = useState<PrescriptionData[]>([]);
  const [labHistory, setLabHistory] = useState<BloodTestReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { isLoggedIn, user, loading: authLoading } = useAuthSession();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return; // Wait for terminal auth state

    let mounted = true;
    const loadData = async () => {
      setIsLoadingHistory(true);
      try {
        // 1. Load local/cached data immediately for responsiveness
        const initialData = await dbService.getAllPrescriptions();
        const initialLabs = isLoggedIn 
          ? await dbService.getAllLabReports() 
          : await localDB.getLabsFromLocalDB();
          
        if (mounted) {
          setHistory(initialData || []);
          setLabHistory(initialLabs || []);
        }
        
        // 2. Background sync if logged in
        if (isLoggedIn && !hasSyncedRef.current) {
            // Background sync: don't await to avoid blocking initial UI
            syncLocalToCloud().then(async () => {
                hasSyncedRef.current = true;
                const fresh = await dbService.getAllPrescriptions();
                const freshLabs = await dbService.getAllLabReports();
                if (mounted) {
                  setHistory(fresh || []);
                  setLabHistory(freshLabs || []);
                }
            }).catch(syncErr => console.warn("Background sync failed", syncErr));
        }
      } catch (e) {
        console.error("Critical Failure: Medical History Loader:", e);
      } finally {
        if (mounted) setIsLoadingHistory(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [isLoggedIn, user, authLoading]);

  const saveToHistory = async (dataToSave: PrescriptionData) => {
    const dataWithTimestamp = { ...dataToSave, timestamp: dataToSave.timestamp || new Date().toISOString() };
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
    } catch (e) { console.error("Database Save Failure:", e); }
  };

  const saveLabToHistory = async (dataToSave: BloodTestReport) => {
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
    } catch (e) { console.error("Lab Save Failure:", e); }
  };

  const deleteFromHistory = async (idToDelete: string) => {
    setHistory(prev => prev.filter(h => h.id !== idToDelete));
    try { await dbService.deletePrescription(idToDelete); } 
    catch (e) { console.error("Database Delete Failure:", e); }
  };

  const deleteLabFromHistory = async (idToDelete: string) => {
    setLabHistory(prev => prev.filter(h => h.id !== idToDelete));
    try { 
      if (isLoggedIn) {
        await dbService.deleteLabReport(idToDelete);
      } else {
        await localDB.deleteLabFromLocalDB(idToDelete);
      }
    }
    catch (e) { console.error("Lab Delete Failure:", e); }
  };

  return { 
    history, 
    labHistory, 
    saveToHistory, 
    saveLabToHistory, 
    deleteFromHistory, 
    deleteLabFromHistory, 
    isLoadingHistory 
  };
};
