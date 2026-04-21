
import React from 'react';
import { PrescriptionData, Medicine } from '@/features/prescriptions';
import { formatDate } from '@/lib/utils.ts';
import { PrescriptionSkeleton } from '@/components/skeletons/PrescriptionSkeleton.tsx';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge.tsx';

interface ResultsDisplayProps {
  data: PrescriptionData | null;
  isLoading: boolean;
  error: string | null;
  hasImage: boolean;
  onVerifyClick: () => void;
  onRetry?: () => void;
}

const PillIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.06,5.44a6.73,6.73,0,0,0-9.22,0,6.58,6.58,0,0,0,0,9.21l.1.1,9.12-9.12Z" opacity="0.6"/>
      <path d="M10.94,18.56a6.73,6.73,0,0,0,9.22,0,6.58,6.58,0,0,0,0-9.21l-.1-.1-9.12,9.12Z"/>
    </svg>
);

const ResultRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => {
    const cleanValue = String(value || '').trim();
    if (!cleanValue || cleanValue.toLowerCase() === 'not mentioned' || cleanValue.toLowerCase() === 'n/a') {
      return null;
    }
    
    return (
      <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/10">
        <dt className="clinical-label mb-0">{label}</dt>
        <dd className="clinical-value text-right">{cleanValue}</dd>
      </div>
    );
};

const MedicationTable: React.FC<{ medicines: Medicine[]; onVerifyClick: () => void }> = ({ medicines, onVerifyClick }) => {
  if (!medicines || medicines.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-400 font-medium">No medication details found.</div>;
  }

  return (
    <div className="my-6 space-y-3">
      <h4 className="clinical-label mb-2">Medication Regimen</h4>
      <div className="space-y-2">
        {medicines.map((med, index) => {
          const variant = med.verification?.color === 'emerald' ? 'success' : 
                         med.verification?.color === 'amber' ? 'warning' : 
                         med.verification?.color === 'rose' ? 'error' : 
                         'neutral';
          
          const statusIcon = med.verification?.color === 'emerald' ? 'check_circle' : 
                            med.verification?.color === 'amber' ? 'info' : 
                            med.verification?.color === 'rose' ? 'warning' : 
                            'help';

          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-between group hover:border-brand-blue/30 transition-all cursor-pointer active:scale-[0.98]"
              onClick={onVerifyClick}
            >
              <div className="flex items-center gap-3">
                <div className={`size-2 rounded-full animate-pulse-ai ${
                  med.verification?.color === 'emerald' ? 'bg-brand-green' : 
                  med.verification?.color === 'amber' ? 'bg-brand-amber' : 
                  'bg-rose-500'
                }`} />
                <div className="flex flex-col">
                  <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-brand-blue transition-colors">
                    {med.verification?.normalizedName || med.name || '-'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{med.dosage || '-'}</span>
                    {med.frequency && (
                      <>
                        <span className="size-1 rounded-full bg-slate-300" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{med.frequency}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Badge 
                variant={variant} 
                size="xs" 
                icon={<span className="material-symbols-outlined text-[14px]">{statusIcon}</span>}
              >
                {med.verification?.status?.replace('_', ' ') || 'Unverified'}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data, isLoading, error, hasImage, onVerifyClick, onRetry }) => {

  if (isLoading) {
    return (
      <div className="relative h-full">
        <PrescriptionSkeleton />
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 bg-brand-blue/5 animate-pulse-ai" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn p-8">
        <div className="size-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mb-6 text-rose-500 border border-rose-500/20">
            <span className="material-symbols-outlined text-4xl">report</span>
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Analysis Failed</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-8 font-medium leading-relaxed">{error}</p>
        
        {onRetry && (
            <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={onRetry}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl"
            >
                Try Again
            </motion.button>
        )}
      </div>
    );
  }

  if (data) {
    const hasNotes = data.notes && data.notes.toLowerCase() !== 'none' && data.notes.trim() !== '' && data.notes.toLowerCase() !== 'no additional notes found.';
    
    return (
      <div className="flex flex-col h-full animate-fadeIn p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
             <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">warning</span>
             <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-tight">
               <span className="font-black uppercase">Unverified AI Extraction:</span> All values must be cross-referenced with the physical prescription before clinical verification.
             </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="size-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green border border-brand-green/20">
            <PillIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Extracted Data
            </h3>
            <p className="clinical-label mt-1">Clinical AI Output</p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-4 no-scrollbar">
          <div className="glass-panel rounded-[2rem] p-6 mb-6 border border-slate-100 dark:border-white/10">
            <dl className="space-y-1">
              <ResultRow label="Patient" value={data.patientName} />
              <ResultRow label="Age" value={data.patientAge} />
              <ResultRow label="Doctor" value={data.doctorName} />
              <ResultRow label="Clinic" value={data.clinicName} />
              <ResultRow label="Date" value={formatDate(data.date)} />
            </dl>
          </div>
          
          <MedicationTable medicines={data.medication} onVerifyClick={onVerifyClick} />
          
           {hasNotes && (
             <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 mt-6">
              <h4 className="clinical-label mb-3">Clinical Notes</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">"{data.notes}"</p>
            </div>
           )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onVerifyClick}
            className="w-full py-5 bg-brand-blue text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Verify & Correct
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn p-8">
       <div className="size-20 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300 dark:text-slate-700">
          <span className="material-symbols-outlined text-4xl">description</span>
       </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Awaiting Analysis</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs">
        {hasImage ? 'Click "Analyze Prescription" to begin the clinical extraction process.' : 'Upload an image of a prescription to start the analysis.'}
      </p>
    </div>
  );
};
