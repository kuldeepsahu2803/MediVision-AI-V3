
import { PrescriptionData, AuditEntry } from '../types.ts';
import { getTreatmentSuggestions } from '../services/geminiService.ts';
import { generateAuditTrail } from '../lib/auditUtils.ts';
import { AppTab, TransitionMode } from '../constants/navigation.ts';
import { ToastType } from '../App.tsx';

type UserRole = 'guest' | 'professional' | null;

interface UseAppWorkflowProps {
    userRole: UserRole;
    user: any;
    analysisEngine: any;
    medicalHistory: any;
    triggerHaptic: (type: string) => void;
    showToast: (message: string, type: ToastType) => void;
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
            showToast('Analysis complete. Ready for clinical review.', 'success');
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
            showToast('Changes applied to temporary session.', 'info');
            navigateToTab(AppTab.TREATMENTS, TransitionMode.DRILL);
            return;
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
                console.error("Could not fetch AI suggestions.", e);
                showToast("Warning: AI clinical suggestions unavailable.", "warning");
            }
        }
      
        try {
            showToast('Synchronizing clinical record...', 'info');
            setPrescriptionData(dataToSave);
            await saveToHistory(dataToSave);
            
            triggerHaptic('success');
            showToast('Record archived successfully.', 'success');
            navigateToTab(AppTab.TREATMENTS, TransitionMode.DRILL);
        } catch (e: any) {
            console.error("Save failure:", e);
            triggerHaptic('error');
            showToast(`Critical Sync Error: ${e.message}`, 'critical');
        }
    };
    
    const handleVerify = async (verifiedData: PrescriptionData): Promise<void> => {
        if (userRole === 'guest') {
            setPrescriptionData({ ...verifiedData, status: 'Clinically-Verified' });
            triggerHaptic('success');
            showToast('Verified locally (Not Archived).', 'success');
            navigateToTab(AppTab.TREATMENTS, TransitionMode.DRILL);
            return;
        }
    
        if (!verifiedData.id || !user) {
            triggerHaptic('error');
            showToast('Session expired or record ID missing.', 'error');
            return;
        }
        
        try {
            showToast('Finalizing clinical verification...', 'info');
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
            await saveToHistory(dataToSave);
            
            triggerHaptic('success');
            showToast('Prescription clinically verified and locked.', 'success');
            navigateToTab(AppTab.TREATMENTS, TransitionMode.DRILL);
        } catch (e: any) {
            console.error("Verification sync failure:", e);
            triggerHaptic('error');
            showToast(`Failed to lock record: ${e.message}`, 'critical');
        }
    };

    const handleDeleteReport = (id: string) => {
        triggerHaptic('heavy');
        deleteFromHistory(id);
        showToast("Record purged from history.", "info");
    };

    return {
        handleAnalyzeClick,
        handleSaveReview,
        handleVerify,
        handleDeleteReport
    };
};
