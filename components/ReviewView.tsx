import React, { useState, useEffect, useCallback } from 'react';
import { PrescriptionData, Medicine, VerificationResult, RxNormCandidate, AuditEntry } from '../types.ts';
import { Spinner } from './Spinner.tsx';
import { LockClosedIcon } from './icons/LockClosedIcon.tsx';
import { ShareIcon } from './icons/ShareIcon.tsx';
import { AdjustmentsIcon } from './icons/AdjustmentsIcon.tsx';
import { HistoryIcon } from './icons/HistoryIcon.tsx';
import { verifyPrescriptionMeds, verifyMedication } from '../services/medicationVerifier.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic.ts';
import { AutocompleteInput } from './ui/AutocompleteInput.tsx';
import { FEATURE_FLAGS } from '../lib/featureFlags.ts';

// --- Clinical Verification Icons ---

const VerifiedShield = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4" opacity="0.6"/>
  </svg>
);

const ReviewEye = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3" opacity="0.6"/>
  </svg>
);

const AlertShield = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12" opacity="0.6"/><line x1="12" y1="16" x2="12.01" y2="16" opacity="0.6"/>
  </svg>
);

const EyeSlashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

// --- Sub-components (Moved outside to prevent re-creation) ---

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

const StatusBadge: React.FC<{ status: PrescriptionData['status'] }> = ({ status }) => {
    const styles = {
        'AI-Extracted': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        'User-Corrected': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        'Clinically-Verified': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    };
    return <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${styles[status]}`}>{status.replace('-', ' ')}</span>;
};

const VerificationStatusBadge: React.FC<{ 
    result?: VerificationResult, 
    humanConfirmed?: boolean, 
    onClick?: () => void, 
    isReverifying?: boolean 
}> = ({ result, humanConfirmed, onClick, isReverifying }) => {
    if (isReverifying) return <div className="p-1"><Spinner className="w-3.5 h-3.5" /></div>;
    if (!result) return null;

    if (humanConfirmed) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm">
                <VerifiedShield className="w-3.5 h-3.5" />
                Human Verified
            </div>
        );
    }

    const config = {
        'cyan': { icon: ReviewEye, text: 'DB Match', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', tooltip: 'High confidence RxNorm match. Human sign-off required.' },
        'amber': { icon: ReviewEye, text: 'Tentative', bg: 'bg-amber-50 text-amber-700 border-amber-200', tooltip: 'Variant detected. Click bounding box to verify ink.' },
        'rose': { icon: AlertShield, text: 'Review', bg: 'bg-rose-50 text-rose-700 border-rose-200', tooltip: 'Safety flag: Ambiguous ink or invalid strength.' },
        'gray': { icon: ReviewEye, text: 'AI Guess', bg: 'bg-slate-50 text-slate-600 border-slate-200', tooltip: 'Raw extraction. No database match found.' },
        'emerald': { icon: VerifiedShield, text: 'Verified', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', tooltip: 'Human confirmed.' }
    };

    const style = config[result.color] || config['gray'];
    const Icon = style.icon;

    return (
        <div className="group relative">
            <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${style.bg} hover:brightness-95 transition-all`} 
            >
                <Icon className="w-3.5 h-3.5" />
                {style.text}
            </motion.button>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 text-white text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl z-50">
                {style.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
            </div>
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
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between items-center h-5">
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
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-sm w-full overflow-hidden border border-gray-200 dark:border-gray-700"
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Verify Transcription</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">"{currentName}" was not found exactly in database.</p>
                </div>
                <div className="p-2 max-h-[300px] overflow-y-auto">
                    {candidate.length > 0 ? (
                        <>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 uppercase tracking-widest">Database Suggestions</p>
                        {candidate.map((c, i) => (
                            <button 
                                key={i}
                                onClick={() => onSelect(c.name)}
                                className="w-full text-left px-4 py-3 hover:bg-brand-blue/10 dark:hover:bg-brand-blue/20 rounded-lg transition-colors group"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-brand-blue">{c.name}</span>
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">{c.score}% Match</span>
                                </div>
                            </button>
                        ))}
                        </>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            <p>No similar drugs found in database. Manual entry required.</p>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between gap-3">
                    <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">Cancel</button>
                    <button onClick={() => onSelect(currentName)} className="flex-1 py-2 text-sm font-medium text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20 rounded-lg">Confirm Verbatim</button>
                </div>
            </motion.div>
        </div>
    );
};

// --- Main View Component ---

interface ReviewViewProps {
  prescription: PrescriptionData | null;
  imageUrls: string[] | null;
  onSave: (data: PrescriptionData) => Promise<void>;
  onVerify: (data: PrescriptionData) => Promise<void>;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ prescription, imageUrls, onSave, onVerify }) => {
  const [editableData, setEditableData] = useState<PrescriptionData | null>(null);
  const [mobileTab, setMobileTab] = useState<'image' | 'details'>('details');
  const [activeMedIndex, setActiveMedIndex] = useState<number | null>(null);
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [reverifyingIndex, setReverifyingIndex] = useState<number | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const [imageFilters, setImageFilters] = useState({ contrast: false, brightness: false, grayscale: false });
  const [showImageControls, setShowImageControls] = useState(false);
  const [resolutionTarget, setResolutionTarget] = useState<{ index: number, candidates: RxNormCandidate[] } | null>(null);

  const { triggerHaptic } = useHaptic();
  
  useEffect(() => {
    if (prescription) {
        setEditableData(prev => prev || JSON.parse(JSON.stringify(prescription)));
        if (FEATURE_FLAGS.VERIFY_RXNORM) {
            if (prescription.medication && prescription.medication.length > 0 && !prescription.medication[0].verification) {
                const imageBase64 = imageUrls && imageUrls.length > 0 ? imageUrls[0].split(',')[1] : undefined;
                runVerification(prescription.medication, imageBase64);
            }
        }
    }
  }, [prescription, imageUrls]);

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

  const handleResolutionSelect = (index: number, newName: string) => {
      handleMedChange(index, 'name', newName);
      setResolutionTarget(null);
      triggerHaptic('success');
  };

  const handleSave = async () => {
      if (!editableData) return;
      triggerHaptic('medium');
      await onSave(editableData);
  };
  
  const handleVerifyClick = async () => {
      if (!editableData) return;
      
      const unconfirmedCount = editableData.medication.filter(m => !m.humanConfirmed).length;
      if (unconfirmedCount > 0) {
          alert(`Please perform human sign-off on all ${unconfirmedCount} medication entries before final locking.`);
          return;
      }

      setShowConfetti(true);
      triggerHaptic('success');
      setTimeout(async () => {
          await onVerify(editableData);
          setShowConfetti(false);
      }, 800);
  };

  const handleShare = async () => {
      if (!editableData) return;
      setIsSharing(true);
      triggerHaptic('medium');
      try {
          if (navigator.share) {
              const { getPDFFile } = await import('../lib/pdfUtils.ts');
              const file = await getPDFFile(editableData);
              const shareData = { files: [file], title: `Prescription Report - ${editableData.patientName}`, text: `MediVision Analysis Report for ${editableData.patientName}.` };
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

  const transform = activeMedIndex !== null && editableData?.medication[activeMedIndex]?.coordinates 
      ? { scale: 2, x: `${50 - (editableData.medication[activeMedIndex].coordinates![1] + editableData.medication[activeMedIndex].coordinates![3]) / 2 / 10}%`, y: `${50 - (editableData.medication[activeMedIndex].coordinates![0] + editableData.medication[activeMedIndex].coordinates![2]) / 2 / 10}%` }
      : { scale: 1, x: 0, y: 0 };
  
  const getFilterString = () => {
      const filters = [];
      if (imageFilters.grayscale) filters.push('grayscale(100%)');
      if (imageFilters.contrast) filters.push('contrast(150%)');
      if (imageFilters.brightness) filters.push('brightness(120%)');
      return filters.join(' ');
  };

  const renderImageViewer = () => (
      <div className="relative w-full h-full overflow-hidden bg-black/5 dark:bg-black/30 flex items-center justify-center rounded-2xl group border border-white/20 dark:border-white/5 min-h-[350px] aspect-square lg:aspect-auto">
          {imageUrls && (
              <motion.div className="relative max-w-full max-h-full" animate={transform} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                  <img src={imageUrls[0]} className={`max-h-full max-w-full object-contain shadow-2xl rounded-lg transition-all duration-300`} style={{ filter: showOriginalImage ? 'none' : getFilterString() }} alt="Prescription Source" />
                  {!showOriginalImage && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                          {editableData?.medication.map((med, i) => (
                              med.coordinates && (
                                <motion.rect key={i} initial={{ opacity: 0 }} animate={{ opacity: i === activeMedIndex ? 1 : 0.3, strokeWidth: i === activeMedIndex ? 4 : 1, fillOpacity: i === activeMedIndex ? 0.2 : 0 }}
                                    x={med.coordinates[1]} y={med.coordinates[0]} width={med.coordinates[3] - med.coordinates[1]} height={med.coordinates[2] - med.coordinates[0]}
                                    fill={i === activeMedIndex ? (med.verification?.color === 'rose' ? '#EF4444' : '#007ACC') : "transparent"} stroke={i === activeMedIndex ? (med.verification?.color === 'rose' ? '#EF4444' : '#007ACC') : "#3DA35D"} vectorEffect="non-scaling-stroke"
                                 />
                              )
                          ))}
                      </svg>
                  )}
              </motion.div>
          )}
           <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
               <motion.button whileTap={{ scale: 0.9 }} onClick={() => { triggerHaptic('light'); setShowImageControls(!showImageControls); }} className={`p-2 rounded-full shadow-lg backdrop-blur-md border border-white/20 transition-colors ${showImageControls ? 'bg-brand-blue text-white' : 'bg-black/40 text-white'}`}>
                   <AdjustmentsIcon className="w-5 h-5" />
               </motion.button>
               <AnimatePresence>
                   {showImageControls && (
                       <motion.div initial={{ opacity: 0, scale: 0.8, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -10 }} className="flex flex-col gap-2 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10">
                           <button onClick={() => { triggerHaptic('light'); setImageFilters(p => ({...p, grayscale: !p.grayscale})); }} className={`text-[10px] px-2 py-1 rounded ${imageFilters.grayscale ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>B&W</button>
                           <button onClick={() => { triggerHaptic('light'); setImageFilters(p => ({...p, contrast: !p.contrast})); }} className={`text-[10px] px-2 py-1 rounded ${imageFilters.contrast ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>Contrast</button>
                           <button onClick={() => { triggerHaptic('light'); setImageFilters(p => ({...p, brightness: !p.brightness})); }} className={`text-[10px] px-2 py-1 rounded ${imageFilters.brightness ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>Bright</button>
                       </motion.div>
                   )}
               </AnimatePresence>
           </div>
           <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-3 pointer-events-auto">
               <button aria-label="Hold to view original image" className="bg-white/90 dark:bg-black/90 text-gray-800 dark:white p-2 rounded-full shadow-lg" onMouseDown={() => setShowOriginalImage(true)} onMouseUp={() => setShowOriginalImage(false)} onTouchStart={() => setShowOriginalImage(true)} onTouchEnd={() => setShowOriginalImage(false)}>
                   <EyeSlashIcon className="w-5 h-5" />
               </button>
          </div>
      </div>
  );

  const renderForm = () => (
      <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rx Details</h2>
              <div className="flex items-center gap-3">
                 <button onClick={() => { triggerHaptic('light'); setShowAuditModal(true); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-brand-blue" title="View Audit Trail">
                    <HistoryIcon className="w-5 h-5" />
                 </button>
                 {isVerifying && <Spinner className="w-4 h-4 text-brand-blue" />}
                 {editableData && <StatusBadge status={editableData.status} />}
              </div>
          </div>
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <EditableField label="Patient Name" value={editableData?.patientName || ''} onChange={v => handleFieldChange('patientName', v)} />
                  <EditableField label="Date" value={editableData?.date || ''} onChange={v => handleFieldChange('date', v)} placeholder="YYYY-MM-DD" />
              </div>
              <EditableField label="Prescriber" value={editableData?.doctorName || ''} onChange={v => handleFieldChange('doctorName', v)} />
              
              <div className="border-t border-slate-200 dark:border-slate-700 opacity-50 my-4" />
              
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Regimen</h3>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-100 dark:border-white/5">
                    {editableData?.medication.length} Agents Identified
                </div>
              </div>

              {editableData?.medication.map((med, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ borderColor: i === activeMedIndex ? 'var(--brand-blue)' : 'transparent' }} 
                    className={`p-4 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border transition-all duration-300 ${i === activeMedIndex ? 'border-brand-blue ring-1 ring-brand-blue/20 shadow-lg' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'} space-y-3 relative overflow-hidden`}
                  >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${med.humanConfirmed ? 'bg-emerald-500' : (med.verification?.color === 'rose' ? 'bg-rose-500' : (med.verification?.color === 'amber' ? 'bg-amber-500' : 'bg-slate-300'))}`} />
                      
                      <div className="pl-2">
                        <AutocompleteInput 
                            label="Clinical Label" 
                            value={med.name} 
                            onChange={v => handleMedChange(i, 'name', v)} 
                            fetchSuggestions={async (q) => { 
                                const { getDrugSuggestions } = await import('../services/openFdaService.ts'); 
                                const res = await getDrugSuggestions(q); 
                                return res.map(r => r.standardName || r.brandName || r.genericName || ''); 
                            }} 
                            onFocus={() => setActiveMedIndex(i)} 
                            onBlur={() => setActiveMedIndex(null)} 
                            rightElement={
                                <VerificationStatusBadge 
                                    isReverifying={reverifyingIndex === i} 
                                    result={med.verification} 
                                    humanConfirmed={med.humanConfirmed}
                                    onClick={() => { 
                                        if (med.verification && med.verification.candidates.length > 0) { 
                                            setResolutionTarget({ index: i, candidates: med.verification.candidates }); 
                                        } else {
                                            handleSignOff(i);
                                        }
                                    }} 
                                />
                            } 
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3 pl-2">
                          <EditableField label="Strength" value={med.dosage} onChange={v => handleMedChange(i, 'dosage', v)} onFocus={() => setActiveMedIndex(i)} onBlur={() => setActiveMedIndex(null)} />
                          <EditableField label="Freq" value={med.frequency} onChange={v => handleMedChange(i, 'frequency', v)} onFocus={() => setActiveMedIndex(i)} onBlur={() => setActiveMedIndex(null)}/>
                          <EditableField label="Route" value={med.route || ''} onChange={v => handleMedChange(i, 'route', v)} onFocus={() => setActiveMedIndex(i)} onBlur={() => setActiveMedIndex(null)}/>
                      </div>

                      {!med.humanConfirmed && (
                          <div className="pl-2 mt-2">
                              <button 
                                onClick={() => handleSignOff(i)}
                                className="w-full py-1.5 rounded-lg border border-brand-blue/20 bg-brand-blue/5 text-[10px] font-black text-brand-blue uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all"
                              >
                                  Sign-off Line {i + 1}
                              </button>
                          </div>
                      )}
                  </motion.div>
              ))}
          </div>
      </div>
  );

  const renderActions = () => (
    <div className="mt-auto p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 z-20 flex gap-3 overflow-hidden shadow-[0_-5px_20px_rgba(0,0,0,0.1)] h-20">
        {showConfetti && <Confetti />}
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleShare} disabled={isSharing} className="flex-[0.3] btn-secondary py-3 rounded-xl font-semibold flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"><ShareIcon className="w-5 h-5" /></motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} className="flex-1 btn-secondary py-3 rounded-xl font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10">Save Draft</motion.button>
        <motion.button 
            whileTap={{ scale: 0.96 }} 
            onClick={handleVerifyClick} 
            className="flex-1 btn-gradient text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:grayscale disabled:opacity-50"
        >
            <LockClosedIcon className="w-5 h-5"/> Final Sign-off
        </motion.button>
    </div>
  );

  if (!editableData) return <Spinner />;

  return (
    <>
      <AnimatePresence>{showAuditModal && <AuditTrailModal trail={editableData.auditTrail || []} onClose={() => setShowAuditModal(false)} />}</AnimatePresence>
      <AnimatePresence>{resolutionTarget && editableData && (<ResolutionModal candidate={resolutionTarget.candidates} currentName={editableData.medication[resolutionTarget.index].name} onSelect={(name) => handleResolutionSelect(resolutionTarget.index, name)} onClose={() => setResolutionTarget(null)}/>)}</AnimatePresence>
      <div className="lg:hidden flex flex-col overflow-visible">
          <div className="flex p-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 h-14 shrink-0">
              <button onClick={() => setMobileTab('image')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileTab === 'image' ? 'bg-slate-200 dark:bg-white/10 text-brand-blue' : 'text-slate-500'}`}>Original Ink</button>
              <button onClick={() => setMobileTab('details')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileTab === 'details' ? 'bg-slate-200 dark:bg-white/10 text-brand-blue' : 'text-slate-500'}`}>Transcription Details</button>
          </div>
          <div className="flex-grow overflow-visible relative">
              {mobileTab === 'image' ? <div className="p-4 flex items-center justify-center">{renderImageViewer()}</div> : <div className="relative flex flex-col"><div className="flex-grow no-scrollbar pb-24">{renderForm()}</div>{renderActions()}</div>}
          </div>
      </div>
      <div className="hidden lg:flex gap-6 overflow-visible">
        <div className="w-1/2 glass-panel rounded-2xl p-4 flex items-center justify-center relative">{renderImageViewer()}</div>
        <div className="w-1/2 glass-panel rounded-2xl relative overflow-hidden flex flex-col border border-white/60 dark:border-white/10 shadow-2xl">
            <div className="flex-grow no-scrollbar">{renderForm()}</div>
            {renderActions()}
        </div>
      </div>
    </>
  );
};