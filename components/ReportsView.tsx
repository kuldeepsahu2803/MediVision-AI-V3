
import React, { useState, useMemo } from 'react';
import { PrescriptionData } from '../types.ts';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { FolderIcon } from './icons/FolderIcon.tsx';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { exportSinglePDF, getPDFBlobUrl } from '../lib/pdfUtils.ts';
import { Spinner } from './Spinner.tsx';
import { ReportCardSkeleton } from './skeletons/ReportCardSkeleton.tsx';
import { AnalyzeIcon } from './icons/AnalyzeIcon.tsx';

// --- Icons ---
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const HistoryLogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

// --- Utilities ---
const toLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr.replace(/-/g, '/'));
    }
    return new Date(dateStr);
};

const groupReportsByDate = (reports: PrescriptionData[]) => {
    const groups: Record<string, PrescriptionData[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    reports.forEach(report => {
        const dateToUse = report.timestamp || report.date;
        if (!dateToUse) return;

        const localDate = toLocalDate(dateToUse);
        const compareDate = new Date(localDate);
        compareDate.setHours(0,0,0,0);
        
        let key = localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        if (compareDate.getTime() === today.getTime()) {
            key = `Today, ${localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else if (compareDate.getTime() === yesterday.getTime()) {
            key = `Yesterday, ${localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(report);
    });
    return groups;
};

// --- Timeline Item Card ---
const TimelineItem: React.FC<{ 
    report: PrescriptionData; 
    onSelect: () => void; 
    onDelete: () => void; 
    onDownload: () => void;
    onPreview: () => void;
    isDownloading: boolean;
}> = ({ report, onSelect, onDelete, onDownload, onPreview, isDownloading }) => {
    const x = useMotionValue(0);
    const deleteOpacity = useTransform(x, [-100, -20], [1, 0]);

    const hasFullTimestamp = report.timestamp && report.timestamp.includes('T');
    const timeString = hasFullTimestamp 
        ? new Date(report.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Analysis Active';

    const getStatusConfig = () => {
        switch (report.status) {
            case 'Clinically-Verified':
                return { text: 'Verified', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: 'verified', iconColor: 'bg-emerald-50 text-emerald-500' };
            case 'User-Corrected':
                return { text: 'In Review', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: 'edit_note', iconColor: 'bg-amber-50 text-amber-500' };
            default:
                return { text: 'AI-Extracted', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: 'auto_fix_high', iconColor: 'bg-blue-50 text-blue-500' };
        }
    };

    const status = getStatusConfig();

    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 overflow-hidden rounded-[2.5rem] group"
        >
            {/* Reveal Delete on Swipe */}
            <motion.div 
                style={{ opacity: deleteOpacity }}
                className="absolute inset-0 bg-rose-600 rounded-[2.5rem] flex items-center justify-end pr-10"
            >
                <TrashIcon className="size-6 text-white" />
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                style={{ x }}
                onDragEnd={(_e, { offset }) => {
                    if (offset.x < -80) onDelete();
                }}
                className="relative bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 p-7 shadow-glass hover:shadow-2xl transition-all cursor-pointer z-10"
                onClick={onSelect}
            >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex gap-6">
                        <div className={`size-16 shrink-0 rounded-2xl flex items-center justify-center shadow-inner border border-white/40 dark:border-transparent ${status.iconColor}`}>
                            <span className="material-symbols-outlined text-[32px]">
                                {status.icon}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-brand-blue transition-colors uppercase tracking-tight truncate">
                                    {report.patientName}
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${status.color}`}>
                                    {status.text}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                {report.medication.length} Agents • Dr. {report.doctorName || 'Verification Required'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{timeString}</span>
                        <div className="flex items-center gap-1">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onPreview(); }}
                                className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-brand-blue transition-all"
                                title="Quick Preview"
                            >
                                <EyeIcon className="size-5" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                                disabled={isDownloading}
                                className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-brand-blue transition-all disabled:opacity-50"
                                title="Download PDF"
                            >
                                {isDownloading ? <Spinner className="size-4" /> : <DownloadIcon className="size-5" />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                                className="ml-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 text-[10px] font-black text-brand-blue uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-sm"
                            >
                                DETAILS <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Main Page Component ---
interface ReportsViewProps {
    history: PrescriptionData[];
    isLoading: boolean;
    onSelectPrescription: (report: PrescriptionData) => void;
    onDeleteReport: (id: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ history, isLoading, onSelectPrescription, onDeleteReport }) => {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const groupedHistory = useMemo(() => groupReportsByDate(history), [history]);
    const groupKeys = useMemo(() => Object.keys(groupedHistory), [groupedHistory]);

    const stats = useMemo(() => ({
        total: history.length,
        needsReview: history.filter(h => h.status !== 'Clinically-Verified').length
    }), [history]);

    const handleDownload = async (report: PrescriptionData) => {
        setDownloadingId(report.id);
        try {
            await exportSinglePDF(report);
        } catch (e) {
            console.error("Report extraction failed", e);
        } finally {
            setDownloadingId(null);
        }
    };

    const handlePreview = async (report: PrescriptionData) => {
        try {
            const url = await getPDFBlobUrl(report);
            window.open(url, '_blank');
        } catch (e) {
            console.error("Diagnostic preview failed", e);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-12 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ReportCardSkeleton />
                <ReportCardSkeleton />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-center animate-fadeIn max-w-lg mx-auto">
                <div className="relative mb-12">
                    <div className="size-40 bg-slate-50 dark:bg-zinc-900 rounded-[3rem] flex items-center justify-center text-slate-300 dark:text-slate-800 rotate-3 border-2 border-dashed border-slate-200 dark:border-white/5">
                        <FolderIcon className="size-20" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 size-20 bg-brand-blue text-white rounded-3xl flex items-center justify-center shadow-2xl -rotate-6 border-4 border-white dark:border-black">
                        <AnalyzeIcon className="size-10" />
                    </div>
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Clinical Archive Empty</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-12 text-lg leading-relaxed font-medium">
                    Verified clinical reports and digitized prescriptions will appear here automatically.
                </p>
                <div className="px-6 py-4 rounded-3xl bg-brand-blue/5 border border-brand-blue/10 inline-flex items-center gap-3">
                    <span className="material-symbols-outlined text-brand-blue text-lg">info</span>
                    <span className="text-[10px] text-brand-blue font-black uppercase tracking-[0.2em]">Swipe cards left to purge records permanently.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Official Branded Header */}
            <div className="mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
                <div className="space-y-5">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-white/50 dark:bg-white/5 px-5 py-2 rounded-full border border-slate-100 dark:border-white/5 w-fit shadow-sm backdrop-blur-md">
                        <HistoryLogIcon className="size-3.5" />
                        <span>Prescription Archive</span>
                        <span className="size-1 rounded-full bg-slate-300"></span>
                        <span>Clinical Log</span>
                        <span className="size-1 rounded-full bg-slate-300"></span>
                        <span className="text-brand-blue">{stats.total} Active</span>
                    </div>
                    <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 dark:text-white">
                        Reports & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">Timeline</span>
                    </h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2.5 px-8 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                        <span className="material-symbols-outlined text-[18px]">filter_list</span> Filters
                    </button>
                    <button className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[18px]">add_circle</span> New Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Clinical Timeline Track */}
                <div className="lg:col-span-8 relative">
                    {/* Vertical Progression Line */}
                    <div className="absolute left-[39px] top-10 bottom-0 w-1 bg-gradient-to-b from-slate-100 via-slate-100/50 to-transparent dark:from-white/10 dark:via-white/5 z-0 rounded-full" />
                    
                    <div className="space-y-20 relative z-10">
                        <AnimatePresence mode="popLayout">
                            {groupKeys.map((key) => (
                                <motion.section 
                                    key={key}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-10"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="size-5 rounded-full bg-brand-blue border-[5px] border-white dark:border-black shadow-glow ring-[6px] ring-brand-blue/5" />
                                        <h2 className="text-[12px] font-black text-brand-blue uppercase tracking-[0.4em] drop-shadow-sm">{key}</h2>
                                    </div>

                                    <div className="pl-20">
                                        {groupedHistory[key].map((report) => (
                                            <TimelineItem 
                                                key={report.id}
                                                report={report}
                                                onSelect={() => onSelectPrescription(report)}
                                                onDelete={() => onDeleteReport(report.id)}
                                                onDownload={() => handleDownload(report)}
                                                onPreview={() => handlePreview(report)}
                                                isDownloading={downloadingId === report.id}
                                            />
                                        ))}
                                    </div>
                                </motion.section>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Diagnostic Insights Sidebar */}
                <aside className="lg:col-span-4 space-y-10 lg:sticky lg:top-24 h-fit">
                    {/* Summary Card */}
                    <div className="glass-panel p-10 rounded-[3rem] shadow-2xl border-white/60 dark:border-white/10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Quick Stats</h4>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-7 rounded-[2rem] bg-white dark:bg-black/20 border border-slate-50 dark:border-white/5 shadow-inner group">
                                <p className="text-5xl font-black text-brand-blue mb-2 transition-transform group-hover:scale-110 duration-500 origin-left">{stats.total}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total<br/>Reports</p>
                            </div>
                            <div className="p-7 rounded-[2rem] bg-white dark:bg-black/20 border border-slate-50 dark:border-white/5 shadow-inner group">
                                <p className="text-5xl font-black text-rose-500 mb-2 transition-transform group-hover:scale-110 duration-500 origin-left">{stats.needsReview}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Requires<br/>Review</p>
                            </div>
                        </div>
                    </div>

                    {/* Taxonomy Categories */}
                    <div className="glass-panel p-10 rounded-[3rem] shadow-2xl border-white/60 dark:border-white/10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Classification</h4>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-brand-blue/5 text-brand-blue border border-brand-blue/10 hover:bg-brand-blue/10 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-[22px]">prescriptions</span>
                                    <span className="text-xs font-black uppercase tracking-widest">Prescriptions</span>
                                </div>
                                <span className="text-xs font-black">{stats.total}</span>
                            </button>
                            <button className="w-full flex items-center justify-between p-5 rounded-[1.5rem] text-slate-400 opacity-40 cursor-not-allowed border border-transparent">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-[22px]">radiology</span>
                                    <span className="text-xs font-black uppercase tracking-widest">Imaging (Lab)</span>
                                </div>
                                <span className="text-xs font-black">0</span>
                            </button>
                            <button className="w-full flex items-center justify-between p-5 rounded-[1.5rem] text-slate-400 opacity-40 cursor-not-allowed border border-transparent">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-[22px]">clinical_notes</span>
                                    <span className="text-xs font-black uppercase tracking-widest">Lab Results</span>
                                </div>
                                <span className="text-xs font-black">0</span>
                            </button>
                        </div>
                    </div>

                    {/* Collaborative Upload CTA */}
                    <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-10 text-white shadow-2xl group border border-white/10">
                        <div className="relative z-10">
                            <div className="size-20 bg-brand-blue/20 rounded-[1.5rem] flex items-center justify-center text-brand-blue mb-8 border border-brand-blue/20 group-hover:scale-110 duration-500">
                                <span className="material-symbols-outlined text-[48px]">cloud_upload</span>
                            </div>
                            <h5 className="text-3xl font-black mb-4 tracking-tighter">Expand History</h5>
                            <p className="mb-10 text-base text-slate-400 font-medium leading-relaxed">Sync external PDF results to maintain a holistic patient timeline.</p>
                            <button className="w-full rounded-2xl bg-white/10 py-5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20 backdrop-blur-md transition-all border border-white/10 active:scale-95">
                                Browse Medical Files
                            </button>
                        </div>
                        {/* Decorative Background Elements */}
                        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-brand-blue/10 blur-[80px] group-hover:bg-brand-blue/20 transition-colors duration-700"></div>
                        <div className="absolute -left-16 -bottom-16 size-56 rounded-full bg-brand-green/5 blur-[80px]"></div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
