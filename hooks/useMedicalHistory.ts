import { useState, useEffect, useRef } from 'react';
import { PrescriptionData } from '../types.ts';
import { useAuthSession } from './useAuthSession.ts';
import * as dbService from '../services/databaseService.ts';
import { syncLocalToCloud } from '../services/syncService.ts';

export const useMedicalHistory = () => {
  const [history, setHistory] = useState<PrescriptionData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { isLoggedIn, user, loading: authLoading } = useAuthSession();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return; // Wait for terminal auth state

    let mounted = true;
    const loadData = async () => {
      setIsLoadingHistory(true);
      try {
        if (isLoggedIn && !hasSyncedRef.current) {
            try {
                await syncLocalToCloud();
                hasSyncedRef.current = true;
            } catch (syncErr) { console.warn("Sync failed, proceeding with local load."); }
        }
        
        const dbData = await dbService.getAllPrescriptions();
        if (mounted) setHistory(dbData || []);
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

  const deleteFromHistory = async (idToDelete: string) => {
    setHistory(prev => prev.filter(h => h.id !== idToDelete));
    try { await dbService.deletePrescription(idToDelete); } 
    catch (e) { console.error("Database Delete Failure:", e); }
  };

  return { history, saveToHistory, deleteFromHistory, isLoadingHistory };
};