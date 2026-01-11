
import { useState, useEffect, useRef } from 'react';
import { PrescriptionData } from '../types.ts';
import { useAuthSession } from './useAuthSession.ts';
import * as dbService from '../services/databaseService.ts';
import { syncLocalToCloud } from '../services/syncService.ts';

export const useMedicalHistory = () => {
  const [history, setHistory] = useState<PrescriptionData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { isLoggedIn, user } = useAuthSession();
  const hasSyncedRef = useRef(false);

  // Load Data (Guest or User)
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoadingHistory(true);
      try {
        // 1. If Just Logged In -> Sync
        if (isLoggedIn && !hasSyncedRef.current) {
            await syncLocalToCloud();
            hasSyncedRef.current = true;
        }

        // 2. Load (will fetch from Supabase if logged in, Local if not)
        if (isLoggedIn && user) {
            console.log(`Fetching history for user: ${user.id}`);
        }
        
        const dbData = await dbService.getAllPrescriptions();
        
        if (mounted) {
            setHistory(dbData);
        }
      } catch (e) {
        console.error("Failed to load medical history:", e);
      } finally {
        if (mounted) {
            setIsLoadingHistory(false);
        }
      }
    };

    loadData();
    
    return () => { mounted = false; };
  }, [isLoggedIn, user]);

  const saveToHistory = async (dataToSave: PrescriptionData) => {
    // Add timestamp for correct sorting and display
    const dataWithTimestamp = {
        ...dataToSave,
        timestamp: dataToSave.timestamp || new Date().toISOString()
    };

    // 1. Optimistic Update (Immediate UI feedback)
    setHistory(prevHistory => {
        const existingIndex = prevHistory.findIndex(h => h.id === dataWithTimestamp.id);
        if (existingIndex > -1) {
            const newHistory = [...prevHistory];
            newHistory[existingIndex] = dataWithTimestamp;
            return newHistory;
        } else {
            return [dataWithTimestamp, ...prevHistory];
        }
    });

    // 2. Persist to DB (Auto-routes to Local or Cloud based on Auth)
    try {
        await dbService.savePrescription(dataWithTimestamp);
        
        // Reload to get true IDs (especially if Postgres generated UUIDs)
        const freshData = await dbService.getAllPrescriptions();
        setHistory(freshData);
    } catch (e) {
        console.error("Failed to save record to DB:", e);
        // Optional: Revert optimistic update here if critical
    }
  };

  const deleteFromHistory = async (idToDelete: string) => {
    if (!idToDelete) return;

    // 1. Optimistic Update
    setHistory(prevHistory => prevHistory.filter(h => h.id !== idToDelete));

    // 2. Persist to DB
    try {
        await dbService.deletePrescription(idToDelete);
    } catch (e) {
        console.error("Failed to delete record from DB:", e);
        // Optional: Fetch data again to revert if delete failed
        const freshData = await dbService.getAllPrescriptions();
        setHistory(freshData);
    }
  };

  return { history, saveToHistory, deleteFromHistory, isLoadingHistory };
};
