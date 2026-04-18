
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge.tsx';

interface HeaderCardProps {
  patientName: string;
  date: string;
  doctorName: string;
  patientNameConfidence?: number;
  dateConfidence?: number;
  doctorNameConfidence?: number;
  onEdit?: (field: string, value: string) => void;
}

export const HeaderCard: React.FC<HeaderCardProps> = ({ 
  patientName, 
  date, 
  doctorName, 
  patientNameConfidence, 
  dateConfidence, 
  doctorNameConfidence 
}) => {
  const getConfidenceVariant = (conf?: number) => {
    if (conf === undefined) return 'neutral';
    if (conf > 0.85) return 'success';
    if (conf > 0.6) return 'warning';
    return 'error';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/10">
          <span className="material-symbols-outlined text-[28px]">person</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Identity</h3>
            <Badge variant={getConfidenceVariant(patientNameConfidence)} size="xs">
              {patientNameConfidence ? `${Math.round(patientNameConfidence * 100)}% Match` : 'Unverified'}
            </Badge>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{patientName || 'Unknown Patient'}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Prescription Date</label>
            <Badge variant={getConfidenceVariant(dateConfidence)} size="xs">
              {dateConfidence ? `${Math.round(dateConfidence * 100)}%` : 'Manual'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_today</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{date || 'Not specified'}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Prescriber</label>
            <Badge variant={getConfidenceVariant(doctorNameConfidence)} size="xs">
              {doctorNameConfidence ? `${Math.round(doctorNameConfidence * 100)}%` : 'Manual'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">medical_services</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{doctorName || 'Not specified'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
