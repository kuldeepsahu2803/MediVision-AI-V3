import React, { createContext, useContext, ReactNode } from 'react';
import { PrescriptionData } from '../types/prescription.types';
import { usePrescriptionHistory } from '../hooks/usePrescriptionHistory';
import { useAnalysisEngine } from '@/hooks/useAnalysisEngine';

interface PrescriptionContextType {
    prescriptionData: PrescriptionData | null;
    setPrescriptionData: (data: PrescriptionData | null) => void;
    isLoading: boolean;
    error: string | null;
    imageFiles: File[];
    imageUrls: string[];
    addImages: (files: File[]) => void;
    removeImage: (index: number) => void;
    clear: () => void;
    analyze: () => Promise<void>;
    history: PrescriptionData[];
    saveToHistory: (data: PrescriptionData) => Promise<void>;
    deleteFromHistory: (id: string) => Promise<void>;
    isLoadingHistory: boolean;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

export const PrescriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { history, saveToHistory, deleteFromHistory, isLoading: isLoadingHistory } = usePrescriptionHistory();
    const analysisEngine = useAnalysisEngine();

    const value = {
        ...analysisEngine,
        history,
        saveToHistory,
        deleteFromHistory,
        isLoadingHistory,
    };

    return (
        <PrescriptionContext.Provider value={value}>
            {children}
        </PrescriptionContext.Provider>
    );
};

export const usePrescription = () => {
    const context = useContext(PrescriptionContext);
    if (context === undefined) {
        throw new Error('usePrescription must be used within a PrescriptionProvider');
    }
    return context;
};
