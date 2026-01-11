
import { useState, useEffect } from 'react';
import { PrescriptionData } from '../types.ts';
import { useAuthSession } from './useAuthSession.ts';
import * as dbService from '../services/databaseService.ts';

export const useMedicalHistory = () => {
  const [history, setHistory] = useState<PrescriptionData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { isLoggedIn, user } = useAuthSession();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoadingHistory(true);
      try {
        // SECURE: Removed auto-sync on login. Users must explicitly import legacy data.
        const dbData = await dbService.getAllPrescriptions();
        if (mounted) setHistory(dbData);
      } catch (e) {
        console.error("Failed to load clinical history:", e);
      } finally {
        if (mounted) setIsLoadingHistory(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [isLoggedIn, user]);

  const saveToHistory = async (dataToSave: PrescriptionData) => {
    const dataWithTimestamp = { ...dataToSave, timestamp: dataToSave.timestamp || new Date().toISOString() };
    setHistory(prev => {
        const idx = prev.findIndex(h => h.id === dataWithTimestamp.id);
        return idx > -1 ? prev.map((h, i) => i === idx ? dataWithTimestamp : h) : [dataWithTimestamp, ...prev];
    });
    try {
        await dbService.savePrescription(dataWithTimestamp);
        const fresh = await dbService.getAllPrescriptions();
        setHistory(fresh);
    } catch (e) { console.error("Persistence failed:", e); }
  };

  const deleteFromHistory = async (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    try { await dbService.deletePrescription(id); } catch (e) { console.error("Delete failed:", e); }
  };

  return { history, saveToHistory, deleteFromHistory, isLoadingHistory };
};
