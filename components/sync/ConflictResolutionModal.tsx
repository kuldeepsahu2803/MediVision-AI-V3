
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, FileText, Database, ArrowRight, Check, X, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrescriptionData } from '@/features/prescriptions';

interface ConflictResolutionModalProps {
    isOpen: boolean;
    localData: any;
    cloudData: any;
    onResolve: (resolution: 'local' | 'cloud' | 'merge') => void;
    onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
    isOpen,
    localData,
    cloudData,
    onResolve,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
                <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-rose-500/5">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="size-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center">
                            <ShieldAlert className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sync Conflict Detected</h2>
                            <p className="text-xs text-rose-500 font-black uppercase tracking-widest">Version Mismatch: Select version to keep</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[60vh]">
                    {/* Local Version */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                <FileText className="size-4 text-brand-blue" />
                                Your Local Version
                            </h3>
                            <span className="text-[10px] text-brand-blue font-black uppercase">Recent Edit</span>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl space-y-4">
                            <DiffField label="Patient" value={localData.patientName} diff={localData.patientName !== cloudData.patientName} />
                            <DiffField label="Prescriber" value={localData.doctorName} diff={localData.doctorName !== cloudData.doctorName} />
                            <DiffField label="Date" value={localData.date} diff={localData.date !== cloudData.date} />
                            <DiffField label="Meds Count" value={localData.medication?.length || 0} diff={localData.medication?.length !== cloudData.medication?.length} />
                        </div>
                        <button 
                            onClick={() => onResolve('local')}
                            className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-blue/20"
                        >
                            Overrun Cloud with Local
                        </button>
                    </div>

                    {/* Cloud Version */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                <Database className="size-4 text-emerald-500" />
                                Server Version
                            </h3>
                            <span className="text-[10px] text-emerald-500 font-black uppercase">Cloud Master</span>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl space-y-4">
                            <DiffField label="Patient" value={cloudData.patientName} diff={localData.patientName !== cloudData.patientName} />
                            <DiffField label="Prescriber" value={cloudData.doctorName} diff={localData.doctorName !== cloudData.doctorName} />
                            <DiffField label="Date" value={cloudData.date} diff={localData.date !== cloudData.date} />
                            <DiffField label="Meds Count" value={cloudData.medication?.length || 0} diff={localData.medication?.length !== cloudData.medication?.length} />
                        </div>
                        <button 
                            onClick={() => onResolve('cloud')}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                        >
                            Discard Local (Use Cloud)
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-8 pt-0 flex flex-col md:flex-row gap-4">
                    <button 
                        onClick={() => onResolve('merge')}
                        className="flex-1 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        Manual Review Required
                    </button>
                </div>

                <div className="px-8 py-6 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-sm">
                        Conflicts occur when the cloud version has been modified since your last sync.
                    </p>
                    <button 
                        onClick={onClose}
                        className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const DiffField = ({ label, value, diff }: { label: string, value: any, diff: boolean }) => (
    <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
        <div className={cn(
            "text-sm font-bold truncate",
            diff ? "text-rose-500" : "text-slate-700 dark:text-slate-200"
        )}>
            {value}
        </div>
    </div>
);
