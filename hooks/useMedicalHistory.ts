import { usePrescriptionHistory } from '@/features/prescriptions';
import { useLabHistory } from '@/features/blood-tests';

export const useMedicalHistory = () => {
  const { 
    history, 
    saveToHistory, 
    deleteFromHistory, 
    isLoading: isLoadingPrescriptions 
  } = usePrescriptionHistory();

  const {
    labHistory,
    saveLabToHistory,
    deleteLabFromHistory,
    isLoading: isLoadingLabs
  } = useLabHistory();

  return { 
    history, 
    labHistory, 
    saveToHistory, 
    saveLabToHistory, 
    deleteFromHistory, 
    deleteLabFromHistory, 
    isLoadingHistory: isLoadingPrescriptions || isLoadingLabs
  };
};
