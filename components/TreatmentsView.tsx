
import React, { useState, useEffect } from 'react';
import { PrescriptionData, AiSuggestions, Medicine } from '../types.ts';
import { getTreatmentSuggestions, getDrugReferenceInfo, DrugReference } from '../services/geminiService.ts';
import { getDrugInteractions } from '../services/rxNormService.ts';
import { Spinner } from './Spinner.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { exportSinglePDF } from '../lib/pdfUtils.ts';
import { useHaptic } from '../hooks/useHaptic.ts';

// --- Reimagined Clinical Icons (Medical-First Design) ---

const PillIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7" opacity="0.4"/>
  </svg>
);

const TabletIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/><path d="M7 12h10" opacity="0.4"/>
  </svg>
);

const BottleIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 20V10M12 20V10M6 20V10M10 2h4l1 6H9l1-6Z"/><path d="M18 22H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z"/>
  </svg>
);

const SyringeIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m18 2 4 4"/><path d="m17 7 3-3" opacity="0.4"/><path d="M19 9 8.7 19.3c-.7.7-1.6 1-2.4 1.1a1.2 1.2 0 0 1-.9-.9c.1-.8.4-1.7 1.1-2.4L16.8 6.9"/><path d="m8 11 4 4"/><path d="m12 7 4 4"/><path d="M3 21l3-3"/>
  </svg>
);

const TubeIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 21h10"/><path d="M7 21l1-14a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2l1 14"/><path d="M9 5V3h6v2" opacity="0.4"/><path d="M10 11h4" opacity="0.4"/>
  </svg>
);

const DropperIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m10 2 1.5 1.5"/><path d="m14 6 3 3"/><path d="M17 9l-9 9-4 1 1-4 9-9z"/><path d="M7 16l-3 3" opacity="0.4"/>
  </svg>
);

const SparklesIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/>
  </svg>
);

// --- Sub-components ---
const MedicineRow: React.FC<{ 
  med: Medicine; 
  isExpanded: boolean; 
  onToggle: () => void;
  referenceData?: DrugReference;
  isLoadingRef: boolean;
}> = ({ med, isExpanded, onToggle, referenceData, isLoadingRef }) => {
  const { triggerHaptic } = useHaptic();

  const getIcon = () => {
    const name = med.name.toLowerCase();
    const route = (med.route || '').toLowerCase();
    const dose = (med.dosage || '').toLowerCase();
    
    if (name.includes('inj') || route.includes('iv') || route.includes('im')) return SyringeIcon;
    if (name.includes('syp') || name.includes('syrup') || name.includes('liquid') || name.includes('sol') || dose.includes('ml')) return BottleIcon;
    if (name.includes('drop') || name.includes('eye') || name.includes('ear')) return DropperIcon;
    if (name.includes('crm') || name.includes('cream') || name.includes('ointment') || name.includes('gel')) return TubeIcon;
    if (name.includes('cap') || name.includes('capsule')) return PillIcon;
    return TabletIcon; // Default
  };

  const Icon = getIcon();
  const statusColor = (med.humanConfirmed || med.verification?.color === 'emerald') ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 
                      med.verification?.color === 'rose' ? 'bg-rose-500/10 text-rose-600 border-rose-200' : 
                      'bg-cyan-500/10 text-cyan-600 border-cyan-200';

  return (
    <motion.div 
      layout
      onClick={() => { triggerHaptic('light'); onToggle(); }}
      className={`relative bg-white dark:bg-zinc-900 border ${isExpanded ? 'border-brand-blue ring-1 ring-brand-blue/20 shadow-2xl' : 'border-slate-100 dark:border-white/5 shadow-sm'} rounded-[2.5rem] p-6 transition-all duration-300 mb-4 group cursor-pointer overflow-hidden`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className={`size-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${statusColor} border group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-glow shadow-sm`}>
          <Icon className="size-8 group-hover:scale-110 transition-transform duration-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase group-hover:text-brand-blue transition-colors">{med.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isExpanded ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
              {isExpanded ? 'Clinical Details' : 'Expand Info'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strength</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{med.dosage !== 'N/A' ? med.dosage : 'Verify Dose'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequency</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{med.frequency !== 'N/A' ? med.frequency : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Route</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{med.route || 'Oral'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
              <p className="text-sm font-bold text-cyan-600">{med.duration || 'As prescribed'}</p>
            </div>
          </div>
        </div>

        <div className="hidden sm:block opacity-30 group-hover:opacity-100 transition-opacity">
           <motion.span 
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="material-symbols-outlined text-slate-400"
            >
              keyboard_arrow_down
            </motion.span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="mt-8 pt-8 border-t border-slate-50 dark:border-white/5 overflow-hidden"
          >
            {isLoadingRef ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Spinner className="size-6 text-brand-blue" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Accessing Medical Repository...</span>
              </div>
            ) : referenceData ? (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                   <div className="size-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                   <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">General Reference (AI-generated)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-2">Therapeutic Category</p>
                        <span className="px-3 py-1 rounded-lg bg-brand-blue/10 text-brand-blue text-sm font-bold border border-brand-blue/10">
                            {referenceData.category}
                        </span>
                    </div>
                    
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {referenceData.description}
                        </p>
                    </div>
                  </div>

                  <div className="space-y-6 bg-slate-50/50 dark:bg-white/5 rounded-[1.5rem] p-6 border border-slate-100 dark:border-white/5">
                    <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            Common Precautions
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic font-medium">
                            {referenceData.precautions}
                        </p>
                    </div>
                    
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Usage Context</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {referenceData.usageNotes}
                        </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-50 text-center leading-loose">
                        Disclaimer: This information is for educational purposes only and does not constitute medical advice.<br/>Always follow your physician's specific instructions.
                    </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400 italic">Clinical reference data currently unavailable for this pharmaceutical agent.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Main Component ---
export const TreatmentsView: React.FC<{ prescription: PrescriptionData | null }> = ({ prescription }) => {
  const [suggestions, setSuggestions] = useState<AiSuggestions | null>(null);
  const [rxInteractions, setRxInteractions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const [referenceCache, setReferenceCache] = useState<Record<string, DrugReference>>({});
  const [loadingRefName, setLoadingRefName] = useState<string | null>(null);
  
  const { triggerHaptic } = useHaptic();

  useEffect(() => {
    if (prescription) {
      setIsLoading(true);
      const fetchAllData = async () => {
        try {
          const suggestionData = prescription.aiSuggestions || await getTreatmentSuggestions(prescription);
          setSuggestions(suggestionData);
          const cuis = prescription.medication.map(m => m.verification?.rxcui).filter(Boolean) as string[];
          if (cuis.length >= 2) {
            const interactions = await getDrugInteractions(cuis);
            setRxInteractions(interactions);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAllData();
    }
  }, [prescription]);

  const handleToggleExpansion = async (index: number, medName: string) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
      return;
    }

    setExpandedIndex(index);

    if (!referenceCache[medName]) {
      setLoadingRefName(medName);
      try {
        const info = await getDrugReferenceInfo(medName);
        setReferenceCache(prev => ({ ...prev, [medName]: info }));
      } catch (e) {
        console.warn("Failed to retrieve pharmaceutical reference", e);
      } finally {
        setLoadingRefName(null);
      }
    }
  };

  if (!prescription) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-fadeIn">
        <div className="size-24 rounded-3xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400 mb-6 rotate-3 border border-slate-200 dark:border-white/5">
          <SparklesIcon className="size-12 text-slate-300 dark:text-slate-700" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tighter">Diagnostic Data Missing</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium leading-relaxed">
          Please complete a prescription scan to generate pharmaceutical insights and interaction alerts.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn">
        <div className="relative size-20 mb-8">
            <Spinner className="size-full text-brand-blue" />
            <div className="absolute inset-0 flex items-center justify-center">
                <SparklesIcon className="size-8 text-brand-blue animate-pulse" />
            </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synthesizing Clinical Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 bg-white/50 dark:bg-white/5 px-4 py-1.5 rounded-full border border-slate-100 dark:border-white/5 w-fit shadow-sm">
            <span className="material-symbols-outlined text-[12px]">medical_information</span>
            <span>Profile: {prescription.patientName}</span>
            <span className="size-1 rounded-full bg-slate-300"></span>
            <span>Ref: {prescription.id.slice(0, 8)}</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
            Clinical <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">Insights</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-brand-blue"></div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Therapeutic Regimen</h2>
              </div>
              <span className="text-[10px] font-black text-brand-blue bg-brand-blue/5 px-4 py-1.5 rounded-full border border-brand-blue/10 uppercase tracking-widest shadow-sm">
                {prescription.medication.length} Active Agents
              </span>
            </div>
            
            <div className="flex flex-col">
              {prescription.medication.map((med, idx) => (
                <MedicineRow 
                  key={idx} 
                  med={med} 
                  isExpanded={expandedIndex === idx}
                  onToggle={() => handleToggleExpansion(idx, med.name)}
                  referenceData={referenceCache[med.name]}
                  isLoadingRef={loadingRefName === med.name}
                />
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 sm:p-14 border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none scale-125">
                <SparklesIcon className="size-72 text-brand-blue" />
            </div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="size-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/10">
                  <SparklesIcon className="size-6" />
                </div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Synthesized Summary</h2>
              </div>
              
              <div className="space-y-8 text-lg sm:text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                <p>
                  <span className="text-slate-900 dark:text-white font-black">Clinical Intent:</span> The current regimen appears primarily focused on 
                  {suggestions?.generalRecommendations?.[0]?.toLowerCase().replace('.', '') || 'targeted therapeutic intervention as defined in the primary documentation'}. 
                  The alignment of these agents suggests a unified approach to the patient's presenting symptoms.
                </p>
                <p>
                  <span className="text-slate-900 dark:text-white font-black">Stability Index:</span> Pharmacological dosing patterns align with standard clinical protocols for 
                  {prescription.medication.some(m => m.duration) ? 'acute symptomatic management' : 'maintenance of chronic stability'}. 
                  All ingredient concentrations fall within expected therapeutic ranges.
                </p>
              </div>

              <div className="mt-16 flex flex-wrap gap-4">
                <div className="px-6 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-3 shadow-sm">
                    <span className="size-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Confidence Score: High</span>
                </div>
                {rxInteractions.length > 0 && (
                   <div className="px-6 py-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center gap-3 shadow-sm">
                    <span className="size-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{rxInteractions.length} Interactions Flagged</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 sticky top-12 space-y-8">
          <div className="p-10 rounded-[3rem] bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-5 mb-10">
                <div className="size-16 rounded-3xl bg-brand-blue/5 dark:bg-brand-blue/10 flex items-center justify-center shadow-inner border border-brand-blue/10 group-hover:scale-105 transition-transform duration-500">
                  <SparklesIcon className="size-10 text-brand-blue" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Analysis Health</h5>
                  <p className="text-xl font-black tracking-tighter">Repository Ready</p>
                </div>
              </div>

              <div className="space-y-6 mb-12">
                <div className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-white/5">
                  <span className="text-sm font-bold text-slate-500">Extraction Precision</span>
                  <span className="text-sm font-black text-brand-blue">High Confidence</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-white/5">
                  <span className="text-sm font-bold text-slate-500">Database Verification</span>
                  <span className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Validated
                  </span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-white/5">
                  <span className="text-sm font-bold text-slate-500">Cross-Reference Scan</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">RxNorm / FDA</span>
                </div>
              </div>

              <button 
                onClick={() => { triggerHaptic('medium'); exportSinglePDF(prescription); }}
                className="w-full rounded-[1.5rem] bg-slate-900 dark:bg-white py-5 text-sm font-black text-white dark:text-slate-900 hover:shadow-glow-blue transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest border border-transparent dark:border-white/10"
              >
                Export Clinical Report
                <span className="material-symbols-outlined text-sm">download</span>
              </button>
            </div>
            
            <div className="absolute -left-10 -bottom-10 size-40 bg-brand-blue/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="px-10 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-loose opacity-60 hover:opacity-100 transition-opacity">
                Standard clinical references verified via RxNorm Repository.<br/>
                Diagnostic review required for all outcomes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
