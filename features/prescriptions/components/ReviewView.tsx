
import React, { useState, useEffect, useCallback } from 'react';
import { PrescriptionData, Medicine, VerificationResult, RxNormCandidate, usePrescription } from '@/features/prescriptions';
import { useClinicalIntelligence } from '@/features/clinical-intelligence';
import { AuditEntry } from '@/shared/types/audit.types';
import { PatientContextHeader } from './clinical/PatientContextHeader.tsx';
import { ConfidenceBadge } from './clinical/ConfidenceBadge.tsx';
import { ClinicalAlertBanner } from './clinical/ClinicalAlertBanner.tsx';
import { Spinner } from '@/components/Spinner.tsx';
import { LockClosedIcon } from '@/components/icons/LockClosedIcon.tsx';
import { ShareIcon } from '@/components/icons/ShareIcon.tsx';
import { HistoryIcon } from '@/components/icons/HistoryIcon.tsx';
import { verifyPrescriptionMeds, verifyMedication } from '@/services/medicationVerifier.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '@/hooks/useHaptic.ts';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput.tsx';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut.ts';
import { FEATURE_FLAGS } from '@/lib/featureFlags.ts';
import { HoldToConfirmButton } from '@/components/ui/HoldToConfirmButton.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { ClinicalStatusBadge } from '@/components/ui/ClinicalStatusBadge.tsx';
import { saveDraft, getDraft } from '@/services/localDatabaseService.ts';
import { HeaderCard } from './HeaderCard.tsx';
import { PrescriptionImage } from './PrescriptionImage.tsx';
import { Stepper } from '@/components/ui/Stepper.tsx';

// --- Clinical Verification Icons ---

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

// --- Sub-components ---

const AuditTrailModal: React.FC<{ trail: AuditEntry[], onClose: () => void }> = ({ trail, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl" onClick={onClose}>
            <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700"
            >
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Audit History</h3>
                        <p className="text-xs text-slate-500">Immutable record of clinical modifications.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">&times;</button>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto space-y-4 no-scrollbar">
                    {trail.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">No modifications recorded.</div>
                    ) : (
                        trail.map((entry, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-brand-blue uppercase">{entry.field}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold">Original</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 line-through opacity-60">{String(entry.originalValue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold">New Value</p>
                                        <p className="text-xs text-brand-green font-medium">{String(entry.newValue)}</p>
                                    </div>
                                </div>
                                <p className="mt-2 text-[9px] text-slate-500">Modified by: <span className="font-bold">{entry.userId}</span></p>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 text-center">
                    <button onClick={onClose} className="btn-secondary px-8 py-2 rounded-xl text-sm font-bold">Close History</button>
                </div>
            </motion.div>
        </div>
    );
};

const EditableField: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    multiline?: boolean; 
    disabled?: boolean; 
    rightElement?: React.ReactNode;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
}> = ({ label, value, onChange, multiline, disabled, rightElement, onFocus, onBlur, placeholder }) => {
    return (
        <div className="mb-3">
            <label className="clinical-label">
                {label} 
                {rightElement}
            </label>
            {multiline ? 
                <textarea 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)} 
                    disabled={disabled} 
                    placeholder={placeholder}
                    rows={3} 
                    onFocus={onFocus}
                    onBlur={onBlur}
                    className="w-full bg-white/60 dark:bg-black/40 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none disabled:opacity-50 transition-all hover:bg-white/80 dark:hover:bg-white/5 resize-none" 
                /> : 
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)} 
                    disabled={disabled} 
                    placeholder={placeholder}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    className="w-full bg-white/60 dark:bg-black/40 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none disabled:opacity-50 transition-all hover:bg-white/80 dark:hover:bg-white/5" 
                />
            }
        </div>
    );
};

const Confetti: React.FC = () => {
    const colors = ['#007ACC', '#3DA35D', '#FFC107', '#FF3D00'];
    const particles = Array.from({ length: 30 });
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {particles.map((_, i) => (
               <motion.div
                    key={i}
                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                    animate={{ opacity: 0, scale: Math.random() * 0.5 + 0.5, x: Math.random() * 200 - 100, y: Math.random() * -150 - 50, rotate: Math.random() * 360 }}
                    transition={{ duration: 0.8 }}
                    style={{ position: 'absolute', left: '50%', bottom: '20%', width: 10, height: 10, backgroundColor: colors[Math.floor(Math.random() * colors.length)], borderRadius: '50%' }}
                />
            ))}
        </div>
    );
};

const ResolutionModal: React.FC<{ 
    candidate: RxNormCandidate[]; 
    currentName: string;
    onSelect: (name: string) => void; 
    onClose: () => void 
}> = ({ candidate, currentName, onSelect, onClose }) => {
    // Keyboard Selection for Resolution
    useKeyboardShortcut([
        ...candidate.map((c, i) => ({
            combo: { key: (i + 1).toString() },
            callback: () => onSelect(c.name)
        })),
        { combo: { key: 'c' }, callback: () => onSelect(currentName) }, // C for Verbatim
        { combo: { key: 'escape' }, callback: onClose }
    ]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-white/10"
            >
                <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <span className="material-symbols-outlined text-2xl">clinical_notes</span>
                        </div>
                        <div>
                            <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Refine Medication</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">AI Uncertainty Resolution</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        The transcription <span className="text-slate-900 dark:text-white font-black italic">"{currentName}"</span> matched multiple database entries. Please select the correct standardized label:
                    </p>
                </div>
                
                <div className="p-4 max-h-[350px] overflow-y-auto no-scrollbar space-y-2">
                    {candidate.length > 0 ? (
                        candidate.map((c, i) => (
                            <motion.button 
                                key={i}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelect(c.name)}
                                className="w-full text-left p-5 bg-white dark:bg-white/5 hover:bg-brand-blue/5 border border-slate-100 dark:border-white/5 rounded-2xl transition-all group flex items-center justify-between"
                            >
                                <div className="flex flex-col">
                                    <span className="font-black text-slate-900 dark:text-white group-hover:text-brand-blue text-sm uppercase tracking-tight">{c.name}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">RxNorm ID: {c.rxcui} • {c.source}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-6 rounded-md bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-slate-400 mr-2 border border-slate-200 dark:border-white/10">{i + 1}</div>
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">{c.score}% Match</span>
                                    <span className="material-symbols-outlined text-slate-300 group-hover:text-brand-blue transition-colors">chevron_right</span>
                                </div>
                            </motion.button>
                        ))
                    ) : (
                        <div className="p-10 text-center space-y-4">
                            <div className="size-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <span className="material-symbols-outlined text-3xl">search_off</span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">No candidate matches found in the clinical repository.</p>
                        </div>
                    )}
                </div>
                
                <div className="p-6 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
                    <button 
                        onClick={() => onSelect(currentName)} 
                        className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        Confirm Original Verbatim
                        <span className="opacity-30 text-[10px]">[C]</span>
                    </button>
                    <button 
                        onClick={onClose} 
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all"
                    >
                        Cancel Resolution
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const ConfidenceIndicator: React.FC<{ confidence?: number }> = ({ confidence }) => {
    if (confidence === undefined) return null;
    const variant = confidence > 0.85 ? 'success' : confidence > 0.6 ? 'warning' : 'error';
    const label = confidence > 0.85 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low';
    
    return (
        <Badge variant={variant} size="xs" className="ml-3 shrink-0">
            {label} ({Math.round(confidence * 100)}%)
        </Badge>
    );
};

const ReasoningTrace: React.FC<{ reasoning?: string, verification?: VerificationResult }> = ({ reasoning, verification }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasIssues = verification?.issues && verification.issues.length > 0;
    if (!reasoning && !hasIssues) return null;

    return (
        <div className="mt-2 border-t border-slate-100 dark:border-white/5 pt-2">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-brand-blue hover:opacity-80 transition-opacity"
            >
                <span className="material-symbols-outlined text-[14px]">{isOpen ? 'keyboard_arrow_up' : 'psychology'}</span>
                {isOpen ? 'Hide Reasoning' : 'View Reasoning Trace'}
                {hasIssues && <span className="size-1.5 rounded-full bg-rose-500 animate-pulse ml-1" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 space-y-2 pl-5 border-l-2 border-brand-blue/20">
                            {reasoning && (
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Extraction Logic</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                                        {reasoning}
                                    </p>
                                </div>
                            )}
                            {hasIssues && (
                                <div>
                                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Clinical Flags</p>
                                    <ul className="space-y-1">
                                        {verification.issues.map((issue, idx) => (
                                            <li key={idx} className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[12px]">warning</span>
                                                {issue}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main View Component ---

interface ReviewViewProps {
  onSave: (data: PrescriptionData) => Promise<void>;
  onVerify: (data: PrescriptionData) => Promise<void>;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ onSave, onVerify }) => {
  const { prescriptionData: prescription, imageUrls } = usePrescription();
  const { triggerHaptic } = useHaptic();

  const { triggerAnalysis } = useClinicalIntelligence();
  const [editableData, setEditableData] = useState<PrescriptionData | null>(null);
  const [mobileTab, setMobileTab] = useState<'image' | 'details'>('details');
  const [activeMedIndex, setActiveMedIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [reverifyingIndex, setReverifyingIndex] = useState<number | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);

  const [resolutionTarget, setResolutionTarget] = useState<{ index: number, candidates: RxNormCandidate[] } | null>(null);

  useEffect(() => {
    if (prescription) {
        setEditableData(prev => prev || JSON.parse(JSON.stringify(prescription)));
        if (FEATURE_FLAGS.VERIFY_RXNORM) {
            if (prescription.medication && prescription.medication.length > 0 && !prescription.medication[0].verification) {
                const imageBase64 = imageUrls && imageUrls.length > 0 ? imageUrls[0].split(',')[1] : undefined;
                runVerification(prescription.medication, imageBase64);
            }
        }
    } else {
        // Try to load from drafts
        const loadDraft = async () => {
             const draft = await getDraft('active-review');
             if (draft) setEditableData(draft);
        };
        loadDraft();
    }
  }, [prescription, imageUrls]);

  // Auto-save drafts
  useEffect(() => {
    if (editableData) {
        saveDraft({ ...editableData, id: 'active-review' });
    }
  }, [editableData]);

  const runVerification = async (meds: Medicine[], imageBase64?: string) => {
      setIsVerifying(true);
      try {
          const verifiedMeds = await verifyPrescriptionMeds(meds, imageBase64);
          setEditableData(prev => prev ? { ...prev, medication: verifiedMeds } : null);
      } catch (e) {
          console.error("Verification failed", e);
      } finally {
          setIsVerifying(false);
      }
  };

  const debouncedVerify = useCallback(
    (() => {
        let timer: any;
        return (index: number, med: Medicine) => {
            clearTimeout(timer);
            setReverifyingIndex(index);
            timer = setTimeout(async () => {
                const imageBase64 = imageUrls && imageUrls.length > 0 ? imageUrls[0].split(',')[1] : undefined;
                const verification = await verifyMedication(med, imageBase64);
                setEditableData(prev => {
                    if (!prev) return null;
                    const meds = [...prev.medication];
                    meds[index] = { ...meds[index], verification, humanConfirmed: false };
                    return { ...prev, medication: meds };
                });
                setReverifyingIndex(null);
            }, 1000);
        };
    })(),
    [imageUrls]
  );

  const handleFieldChange = (field: keyof PrescriptionData, value: string) => {
    setEditableData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleMedChange = (index: number, field: keyof Medicine, value: string) => {
    setEditableData(prev => {
        if (!prev) return null;
        const meds = [...prev.medication];
        const updatedMed = { ...meds[index], [field]: value, humanConfirmed: false };
        meds[index] = updatedMed;
        if (field === 'name' || field === 'dosage') {
            debouncedVerify(index, updatedMed);
        }
        return { ...prev, medication: meds };
    });
  };

  const handleSignOff = (index: number) => {
      triggerHaptic('success');
      setEditableData(prev => {
          if (!prev) return null;
          const meds = [...prev.medication];
          meds[index] = { ...meds[index], humanConfirmed: true };
          return { ...prev, medication: meds };
      });
  };

  const handleDeleteMed = (index: number) => {
      if (!editableData) return;
      triggerHaptic('medium');
      const newMed = [...editableData.medication];
      newMed.splice(index, 1);
      setEditableData(prev => prev ? { ...prev, medication: newMed } : null);
  };

  const handleAddMed = () => {
      if (!editableData) return;
      triggerHaptic('light');
      const newMed = [...editableData.medication, { name: '', dosage: '', frequency: '', duration: '', humanConfirmed: false }];
      setEditableData(prev => prev ? { ...prev, medication: newMed } : null);
  };

  const handleResolutionSelect = (index: number, newName: string) => {
      handleMedChange(index, 'name', newName);
      setResolutionTarget(null);
      triggerHaptic('success');
  };

  const handleSave = async () => {
      if (!editableData) return;
      triggerHaptic('medium');
      await onSave(editableData);
      triggerAnalysis();
  };
  
  const handleVerifyClick = async () => {
      if (!editableData) return;
      
      const unconfirmedCount = editableData.medication.filter(m => !m.humanConfirmed).length;
      if (unconfirmedCount > 0) {
          return;
      }

      setShowConfetti(true);
      triggerHaptic('success');
      setTimeout(async () => {
          await onVerify(editableData);
          triggerAnalysis();
          setShowConfetti(false);
      }, 800);
  };

  const handleShare = async () => {
      if (!editableData) return;
      setIsSharing(true);
      triggerHaptic('medium');
      try {
          if (navigator.share) {
              const { getPDFFile } = await import('@/lib/pdfUtils.ts');
              const file = await getPDFFile(editableData);
              const shareData = { files: [file], title: `Prescription Report - ${editableData.patientName}`, text: `RxSnap Analysis Report for ${editableData.patientName}.` };
              if (navigator.canShare && navigator.canShare(shareData)) {
                  await navigator.share(shareData);
              } else {
                  await navigator.share({ title: shareData.title, text: `${shareData.text}\n\n[PDF sharing not supported on this device]` });
              }
          } else {
              const summary = `Report: ${editableData.patientName}\n${editableData.medication.map(m=>`${m.name} ${m.dosage}`).join('\n')}`;
              await navigator.clipboard.writeText(summary);
              alert("Report summary copied to clipboard!");
          }
      } catch (e) {
          console.error("Share failed:", e);
      } finally {
          setIsSharing(false);
      }
  };

  // Keyboard Shortcuts moved after declarations to fix hoisting issues
  useKeyboardShortcut([
    { combo: { key: 's', ctrl: true }, callback: () => handleSave() },
    { combo: { key: 'enter', ctrl: true }, callback: () => handleVerifyClick() },
    { combo: { key: 'n', alt: true }, callback: () => handleAddMed() },
    ...((editableData?.medication || []).map((_, i) => ({
        combo: { key: (i + 1).toString(), alt: true },
        callback: () => handleSignOff(i)
    }))),
    { combo: { key: 'escape' }, callback: () => {
        if (resolutionTarget) setResolutionTarget(null);
        if (showAuditModal) setShowAuditModal(false);
        setActiveMedIndex(null);
    }}
  ]);

  const renderImageViewer = () => (
      <PrescriptionImage 
          imageUrls={imageUrls} 
          medications={editableData?.medication || []} 
          activeMedIndex={activeMedIndex}
          onMedClick={(i) => setActiveMedIndex(i)}
      />
  );

  const renderForm = () => {
      const suggestions = editableData?.aiSuggestions;
      const hasCritical = suggestions?.criticalAlerts && suggestions.criticalAlerts.length > 0;
      const hasGeneral = suggestions?.generalRecommendations && suggestions.generalRecommendations.length > 0;
      const hasAnySuggestions = hasCritical || hasGeneral;

      const verificationSteps = [
          { id: 'ocr', label: 'Handwriting Extraction', status: isVerifying ? 'loading' : 'completed' as const },
          { id: 'rxnorm', label: 'Clinical Database Match', status: isVerifying ? 'pending' : 'completed' as const },
          { id: 'safety', label: 'Drug Interaction Check', status: isVerifying ? 'pending' : 'completed' as const },
      ];

      return (
          <div className="p-6 space-y-8">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Review Order</h2>
                  <div className="flex items-center gap-3">
                      <button 
                          onClick={() => { triggerHaptic('light'); setShowAuditModal(true); }} 
                          className="size-11 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-brand-blue" 
                          title="View Audit Trail"
                      >
                          <HistoryIcon className="w-6 h-6" />
                      </button>
                      {editableData && <ClinicalStatusBadge status={editableData.status as any} />}
                  </div>
              </div>

              {isVerifying && (
                  <div className="p-6 rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10">
                      <Stepper steps={verificationSteps} currentStepIndex={0} />
                  </div>
              )}

              <HeaderCard 
                  patientName={editableData?.patientName || ''}
                  date={editableData?.date || ''}
                  doctorName={editableData?.doctorName || ''}
                  patientNameConfidence={editableData?.patientNameConfidence}
                  dateConfidence={editableData?.dateConfidence}
                  doctorNameConfidence={editableData?.doctorNameConfidence}
              />

              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                      <h3 className="clinical-label">Medication Regimen</h3>
                      <Badge variant="neutral" size="xs">
                          {editableData?.medication.length} Items
                      </Badge>
                  </div>

                  <div className="space-y-4">
                      {editableData?.medication.map((med, i) => (
                          <motion.div 
                              key={i} 
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ 
                                  opacity: 1,
                                  y: 0,
                                  borderColor: i === activeMedIndex ? '#0066FF' : 'rgba(0, 102, 255, 0)',
                                  scale: i === activeMedIndex ? 1.02 : 1
                              }} 
                              transition={{ 
                                  delay: i * 0.1,
                                  type: 'spring',
                                  stiffness: 260,
                                  damping: 20
                              }}
                              className={`clinical-card ${i === activeMedIndex ? 'border-brand-blue ring-4 ring-brand-blue/10 shadow-2xl' : 'hover:border-slate-300 dark:hover:border-white/20'} space-y-4 relative overflow-hidden group`}
                          >
                              <div className={`absolute left-0 top-0 bottom-0 w-2 ${med.humanConfirmed ? 'bg-brand-green' : (med.verification?.color === 'rose' ? 'bg-rose-500' : (med.verification?.color === 'amber' ? 'bg-amber-500' : 'bg-slate-300'))}`} />
                              
                              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-slate-300 mr-2">#{i + 1}</span>
                          <motion.button
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      whileTap={{ scale: 0.9, rotate: -5 }}
                                      onClick={(e) => { e.stopPropagation(); handleDeleteMed(i); }}
                                      className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                  >
                                      <TrashIcon className="size-4" />
                                  </motion.button>
                              </div>

                              <div className="pl-4">
                                  <div className="flex items-center justify-between mb-2">
                                      <ConfidenceBadge confidence={med.confidence} className="mb-1" />
                                      {med.humanConfirmed && (
                                          <div className="flex items-center gap-2">
                                              <ClinicalStatusBadge status="Clinically-Verified" />
                                          </div>
                                      )}
                                  </div>
                                  <AutocompleteInput 
                                      label="Medication Name" 
                                      value={med.name} 
                                      onChange={v => handleMedChange(i, 'name', v)} 
                                      fetchSuggestions={async (q) => { 
                                          const { getDrugSuggestions } = await import('@/services/openFdaService.ts'); 
                                          const res = await getDrugSuggestions(q); 
                                          return res.map(r => r.standardName || r.brandName || r.genericName || ''); 
                                      }} 
                                      onFocus={() => setActiveMedIndex(i)} 
                                      onBlur={() => setActiveMedIndex(null)} 
                                      className="text-lg font-black uppercase tracking-tight"
                                      rightElement={
                                          <div className="flex items-center gap-2">
                                              <ClinicalStatusBadge 
                                                status={med.humanConfirmed ? 'Clinically-Verified' : (med.verification?.color === 'rose' ? 'Review' : (med.verification?.color === 'amber' ? 'Review' : 'AI-Extracted'))}
                                                size="xs"
                                                animate={reverifyingIndex === i}
                                                className="cursor-pointer"
                                                onClick={() => { 
                                                    const v = med.verification;
                                                    if (v && (v.color === 'amber' || v.color === 'rose') && v.candidates?.length > 0) { 
                                                        triggerHaptic('medium');
                                                        setResolutionTarget({ index: i, candidates: v.candidates }); 
                                                    } else {
                                                        handleSignOff(i);
                                                    }
                                                }}
                                              />
                                          </div>
                                      } 
                                  />
                              </div>

                              <div className="grid grid-cols-3 gap-4 pl-4">
                                  <EditableField label="Strength" value={med.dosage} onChange={v => handleMedChange(i, 'dosage', v)} onFocus={() => setActiveMedIndex(i)} onBlur={() => setActiveMedIndex(null)} />
                                  <EditableField label="Freq" value={med.frequency} onChange={v => handleMedChange(i, 'frequency', v)} onFocus={() => setActiveMedIndex(i)} onBlur={() => setActiveMedIndex(null)}/>
                                  <EditableField label="Route" value={med.route || ''} onChange={v => handleMedChange(i, 'route', v)} onFocus={() => setActiveMedIndex(i)} onBlur={() => setActiveMedIndex(null)}/>
                              </div>

                              <ReasoningTrace reasoning={med.reasoning} verification={med.verification} />

                              {!med.humanConfirmed && (
                                  <div className="pl-4 mt-4">
                                      <button 
                                          onClick={() => handleSignOff(i)}
                                          className="w-full py-3 rounded-2xl border-2 border-brand-blue/20 bg-brand-blue/5 text-xs font-black text-brand-blue uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all active:scale-95"
                                      >
                                          Confirm Line {i + 1}
                                      </button>
                                  </div>
                              )}
                          </motion.div>
                      ))}

                      <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAddMed}
                          className="w-full py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs"
                          title="Alt + N"
                      >
                          <span className="material-symbols-outlined">add_circle</span>
                          Add Medication
                          <span className="ml-2 opacity-30 text-[10px] hidden sm:inline">Alt+N</span>
                      </motion.button>
                  </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 opacity-50 my-6" />

              {/* Multilingual Notes & Translation */}
              <div className="space-y-4">
                  <EditableField 
                      label="Original Clinical Notes" 
                      value={editableData?.notes || ''} 
                      onChange={v => handleFieldChange('notes', v)} 
                      multiline 
                      rightElement={<ConfidenceIndicator confidence={editableData?.notesConfidence} />}
                  />
                  
                  {editableData?.translatedNotes && editableData.translatedNotes !== 'N/A' && (
                      <motion.div 
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30 space-y-2"
                      >
                          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                              <span className="material-symbols-outlined text-[18px]">translate</span>
                              <h4 className="clinical-label text-cyan-700 dark:text-cyan-300 mb-0">AI Clinical Translation</h4>
                          </div>
                          <p className="text-xs font-medium text-cyan-800 dark:text-cyan-200 italic leading-relaxed">
                              {editableData.translatedNotes}
                          </p>
                      </motion.div>
                  )}
              </div>

              {/* Patient Education Section */}
              {editableData?.patientSummary && (
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-[2rem] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-3 shadow-sm"
                  >
                      <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                              <span className="material-symbols-outlined text-[20px]">school</span>
                          </div>
                          <div>
                              <h4 className="clinical-label text-emerald-900 dark:text-emerald-100 mb-0">Patient Education</h4>
                              <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-tighter">Plain Language Summary</p>
                          </div>
                      </div>
                      <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">
                          {editableData.patientSummary}
                      </p>
                  </motion.div>
              )}

              <AnimatePresence>
                  {hasAnySuggestions && showAiSuggestions && (
                      <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mt-8 p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-sm"
                      >
                          <button 
                              onClick={() => { triggerHaptic('light'); setShowAiSuggestions(false); }}
                              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-400"
                              aria-label="Dismiss AI Insights"
                          >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>

                          <div className="flex items-center justify-between gap-2 mb-6">
                              <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/10">
                                      <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                                  </div>
                                  <div>
                                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Safety Insights</h4>
                                      <p className="clinical-label mt-1">Clinical AI Recommendations</p>
                                  </div>
                              </div>
                              <Badge variant="error" size="xs" className="animate-pulse">Critical</Badge>
                          </div>

                          <div className="space-y-4">
                              {hasCritical && suggestions.criticalAlerts?.map((alert, i) => (
                                  <motion.div 
                                      key={`crit-${i}`} 
                                      initial={{ x: -10, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ delay: i * 0.1 }}
                                      className="flex gap-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 shadow-sm"
                                  >
                                      <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[20px] shrink-0">report</span>
                                      <p className="text-xs font-black text-rose-900 dark:text-rose-100 leading-relaxed">{alert}</p>
                                  </motion.div>
                              ))}
                              
                              {hasGeneral && suggestions.generalRecommendations?.map((rec, i) => (
                                  <motion.div 
                                      key={`rec-${i}`} 
                                      initial={{ x: -10, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ delay: (hasCritical ? suggestions.criticalAlerts!.length : 0 + i) * 0.1 }}
                                      className="flex gap-4 p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 shadow-sm"
                                  >
                                      <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400 text-[20px] shrink-0">info</span>
                                      <p className="text-xs font-black text-cyan-900 dark:text-cyan-100 leading-relaxed">{rec}</p>
                                  </motion.div>
                              ))}
                          </div>
                          <div className="h-32" /> {/* Bottom padding for keyboard */}
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
      );
  };

  const renderActions = () => {
    const unconfirmedCount = editableData?.medication.filter(m => !m.humanConfirmed).length || 0;
    
    return (
        <div className="mt-auto p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 z-20 flex gap-3 overflow-hidden shadow-[0_-5px_20px_rgba(0,0,0,0.1)] h-24">
            {showConfetti && <Confetti />}
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleShare} disabled={isSharing} className="flex-[0.3] btn-secondary py-3 rounded-xl font-semibold flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10" title="Share Analysis"><ShareIcon className="w-5 h-5" /></motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} className="flex-1 btn-secondary py-3 rounded-xl font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10" title="Ctrl + S">Save Draft <span className="ml-2 opacity-30 text-[10px] hidden lg:inline">Ctrl+S</span></motion.button>
            <HoldToConfirmButton 
                onConfirm={handleVerifyClick}
                label={unconfirmedCount > 0 ? `Verify ${unconfirmedCount} more` : "Final Sign-off"}
                confirmLabel="Verification Locked"
                className={`flex-1 btn-gradient text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:grayscale disabled:opacity-50 ${unconfirmedCount > 0 ? 'opacity-50 grayscale' : ''}`}
                icon={<LockClosedIcon className="w-5 h-5"/>}
                title="Ctrl + Enter"
            />
        </div>
    );
  };

  if (!editableData) return <Spinner />;

  const criticalAlerts = editableData.aiSuggestions?.criticalAlerts || [];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <PatientContextHeader 
        name={editableData.patientName}
        id={editableData.id}
        dob={editableData.patientAge} // Assuming age might be DOB or just age string
        timestamp={editableData.timestamp}
      />
      
      <AnimatePresence>
        {criticalAlerts.length > 0 && (
          <ClinicalAlertBanner 
            severity="CRITICAL"
            title="Drug Interaction Warning"
            message={criticalAlerts[0]}
            onDismiss={() => {}} // In production, this might update state
          />
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence>{showAuditModal && <AuditTrailModal trail={editableData.auditTrail || []} onClose={() => setShowAuditModal(false)} />}</AnimatePresence>
        <AnimatePresence>{resolutionTarget && editableData && (<ResolutionModal candidate={resolutionTarget.candidates} currentName={editableData.medication[resolutionTarget.index].name} onSelect={(name) => handleResolutionSelect(resolutionTarget.index, name)} onClose={() => setResolutionTarget(null)}/>)}</AnimatePresence>
        
        <div className="lg:hidden flex flex-col h-full">
            <div className="flex p-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 h-14 shrink-0">
                <button onClick={() => setMobileTab('image')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileTab === 'image' ? 'bg-slate-200 dark:bg-white/10 text-brand-blue' : 'text-slate-500'}`}>Original Ink</button>
                <button onClick={() => setMobileTab('details')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileTab === 'details' ? 'bg-slate-200 dark:bg-white/10 text-brand-blue' : 'text-slate-500'}`}>Transcription Details</button>
            </div>
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {mobileTab === 'image' ? (
                  <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
                    {renderImageViewer()}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                      {renderForm()}
                    </div>
                    {renderActions()}
                  </div>
                )}
            </div>
        </div>

        <div className="hidden lg:flex h-full gap-6 p-6 overflow-hidden">
          <div className="w-1/2 glass-panel rounded-3xl p-4 flex items-center justify-center relative overflow-hidden">
            {renderImageViewer()}
          </div>
          <div className="w-1/2 glass-panel rounded-3xl relative overflow-hidden flex flex-col border border-white/60 dark:border-white/10 shadow-2xl">
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {renderForm()}
              </div>
              {renderActions()}
          </div>
        </div>
      </div>
    </div>
  );
};
