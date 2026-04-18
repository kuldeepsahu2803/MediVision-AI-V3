import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { ClinicalInsight } from '@/features/clinical-intelligence';
import { PrescriptionData } from '@/features/prescriptions';
import { BloodTestReport } from '@/features/blood-tests';
import * as dbService from '../services/databaseService.ts';
import { ClinicalEngine } from '../services/clinicalIntelligence.ts';
import { useAuthSession } from './useAuthSession.ts';

export const useClinicalAlerts = (history: PrescriptionData[], labHistory: BloodTestReport[]) => {
  const [insight, setInsight] = useState<ClinicalInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoggedIn } = useAuthSession();

  const fetchLatestInsight = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const latest = await dbService.getLatestClinicalInsight();
      setInsight(latest);
    } catch (error) {
      console.error("Failed to fetch clinical insights:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchLatestInsight();

    if (isLoggedIn && user) {
      // Subscribe to real-time updates
      const channel = supabase
        .channel('clinical_insights_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'clinical_insights',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newInsight: ClinicalInsight = {
              id: payload.new.id,
              userId: payload.new.user_id,
              alerts: payload.new.alerts,
              summary: payload.new.summary,
              riskScores: payload.new.risk_scores,
              generatedAt: payload.new.generated_at
            };
            setInsight(newInsight);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isLoggedIn, user, fetchLatestInsight]);

  const triggerAnalysis = useCallback(async () => {
    if (!isLoggedIn || history.length === 0 && labHistory.length === 0) return;
    
    try {
      const newInsight = ClinicalEngine.analyze(history, labHistory);
      await dbService.saveClinicalInsight(newInsight);
      // The real-time subscription will update the state
    } catch (error) {
      console.error("Clinical analysis failed:", error);
    }
  }, [isLoggedIn, history, labHistory]);

  const dismissAlert = useCallback(async (alertId: string) => {
    if (!insight) return;

    const updatedAlerts = insight.alerts.map(a => 
      a.id === alertId ? { ...a, resolved: true } : a
    );

    const updatedInsight = { ...insight, alerts: updatedAlerts };
    setInsight(updatedInsight);

    try {
      // Update in Supabase
      const { error } = await supabase
        .from('clinical_insights')
        .update({ alerts: updatedAlerts })
        .eq('id', insight.id);
        
      if (error) throw error;
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
      // Revert local state on failure
      setInsight(insight);
    }
  }, [insight]);

  return {
    insight,
    isLoading,
    triggerAnalysis,
    dismissAlert,
    refresh: fetchLatestInsight
  };
};
