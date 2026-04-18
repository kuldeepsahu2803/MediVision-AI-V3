import React, { createContext, useContext, ReactNode } from 'react';
import { useClinicalAlerts } from '@/hooks/useClinicalAlerts';
import { usePrescription } from '@/features/prescriptions';
import { useLab } from '@/features/blood-tests';

interface ClinicalIntelligenceContextType {
    insight: any;
    isLoading: boolean;
    triggerAnalysis: () => void;
    dismissAlert: (id: string) => void;
}

const ClinicalIntelligenceContext = createContext<ClinicalIntelligenceContextType | undefined>(undefined);

export const ClinicalIntelligenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { history } = usePrescription();
    const { labHistory } = useLab();
    const clinicalAlerts = useClinicalAlerts(history, labHistory);

    return (
        <ClinicalIntelligenceContext.Provider value={clinicalAlerts}>
            {children}
        </ClinicalIntelligenceContext.Provider>
    );
};

export const useClinicalIntelligence = () => {
    const context = useContext(ClinicalIntelligenceContext);
    if (context === undefined) {
        throw new Error('useClinicalIntelligence must be used within a ClinicalIntelligenceProvider');
    }
    return context;
};
