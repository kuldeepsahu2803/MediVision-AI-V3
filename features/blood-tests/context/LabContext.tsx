import React, { createContext, useContext, ReactNode } from 'react';
import { BloodTestReport } from '../types/bloodTest.types';
import { useLabHistory } from '../hooks/useLabHistory';

interface LabContextType {
    labHistory: BloodTestReport[];
    saveLabToHistory: (data: BloodTestReport) => Promise<void>;
    deleteLabFromHistory: (id: string) => Promise<void>;
    isLoading: boolean;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const labHistoryHook = useLabHistory();

    return (
        <LabContext.Provider value={labHistoryHook}>
            {children}
        </LabContext.Provider>
    );
};

export const useLab = () => {
    const context = useContext(LabContext);
    if (context === undefined) {
        throw new Error('useLab must be used within a LabProvider');
    }
    return context;
};
