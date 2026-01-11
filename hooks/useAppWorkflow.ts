
import { PrescriptionData, AuditEntry } from '../types.ts';
import { getTreatmentSuggestions } from '../services/geminiService.ts';
import { generateAuditTrail } from '../lib/auditUtils.ts';
import { AppTab, TransitionMode } from '../constants/navigation.ts';

// Defined types to avoid circular dependencies or undefined types
type UserRole = 'guest' | 'professional' | null;

interface UseAppWorkflowProps {
    userRole: UserRole;
    user: any;
    analysisEngine: any;
    medicalHistory: any;
    triggerHaptic: (type: string) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    setShowLoginModal: (show: boolean) => void;
    navigateToTab: (tab: AppTab, mode: TransitionMode) => void;
}

export const useAppWorkflow = ({
    userRole,
    user,
    analysisEngine,
    medicalHistory,
    triggerHaptic,
    showToast,
    setShowLoginModal,
    navigateToTab
}: UseAppWorkflowProps) => {
    
    const { analyze, prescriptionData, setPrescriptionData } = analysisEngine;
    const { saveToHistory, deleteFromHistory } = medicalHistory;

    const handleAnalyzeClick = async () => {
        triggerHaptic('medium');
        try {
            await analyze();
            triggerHaptic('success');
        } catch (e: any) {
            triggerHaptic('error');
            showToast(e.message, "error");
            if (e.message.includes("log in") && userRole === 'professional') setShowLoginModal(true);
        }
    };

    const handleSaveReview = async (updatedData: PrescriptionData): Promise<void> => {
        if (!updatedData.id || !prescriptionData) return;
      
        if (userRole === 'guest') {
            setPrescriptionData(updatedData);
            triggerHaptic('success');
            showToast('Changes applied (Temporary Session).', 'info');
            
            return new Promise(resolve => {
                setTimeout(() => {
                    navigateToTab(AppTab.TREATMENTS, TransitionMode.DRILL);
                    resolve();
                }, 500);
            });
        }
    
        if (!user) {
            setShowLoginModal(true);
            return;
        }
    
        let dataToSave = { ...updatedData };
        
        const auditEntries = generateAuditTrail(prescriptionData, updatedData, user.name);
        dataToSave.auditTrail = [...(prescriptionData.auditTrail || []), ...auditEntries];
        
        if (dataToSave.status === 'AI-Extracted' && auditEntries.length > 0) {
            dataToSave.status = 'User-Corrected';
        }
    
        if (!dataToSave.aiSuggestions) {
            try {
                const suggestions = await getTreatmentSuggestions(dataToSave);
                dataToSave.aiSuggestions = suggestions;
            } catch (e) {
                console.error("Could not fetch AI suggestions, saving without them.", e);
                showToast("Warning: Could not fetch AI suggestions.", "error");
                triggerHaptic('warning');
            }
        }
      
        setPrescriptionData(dataToSave);
        saveToHistory(dataToSave);
      
        triggerHaptic('success');
        showToast('Report saved successfully!', 'success');
        
        return new Promise(resolve => {
            setTimeout(() => {
                navigateToTab(AppTab.TREATMENTS, TransitionMode.DRILL);
                resolve();
            }, 1500);
        });
    };
    
    const handleVerify = async (verifiedData: PrescriptionData): Promise<void> => {
        if (userRole === 'guest') {
            setPrescriptionData({ ...verifiedData, status: 'Clinically-Verified' });
            triggerHaptic('success');
            showToast('Verified locally (Temporary).', 'success');
            navigateToTab(AppTab.TREATMENTS, TransitionMode.DRILL);
            return;
        }
    
        if (!verifiedData.id || !user) {
            triggerHaptic('error');
            showToast('User or prescription ID is missing.', 'error');
            throw new Error("User or prescription ID is missing.");
        }
        
        try {
            const dataToSave: PrescriptionData = { 
                ...verifiedData, 
                status: 'Clinically-Verified' 
            };
            
            const finalAudit: AuditEntry = {
                field: 'status',
                originalValue: verifiedData.status,
                newValue: 'Clinically-Verified',
                userId: user.name,
                timestamp: new Date().toISOString(),
            };
            dataToSave.auditTrail = [...(dataToSave.auditTrail || []), finalAudit];
    
            setPrescriptionData(dataToSave);
            saveToHistory(dataToSave);
            
            triggerHaptic('success');
            showToast('✅ Prescription clinically verified and locked successfully.', 'success');
    
            return new Promise(resolve => {
                setTimeout(() => {
                    navigateToTab(AppTab.TREATMENTS, TransitionMode.DRILL);
                    resolve();
                }, 1500);
            });
        } catch (e) {
            console.error("Failed to verify and lock prescription:", e);
            triggerHaptic('error');
            showToast('❌ Failed to lock prescription. Please try again.', 'error');
            throw e;
        }
    };

    const handleDeleteReport = (id: string) => {
        triggerHaptic('heavy');
        deleteFromHistory(id);
        showToast("Report deleted.", "info");
    };

    return {
        handleAnalyzeClick,
        handleSaveReview,
        handleVerify,
        handleDeleteReport
    };
};
