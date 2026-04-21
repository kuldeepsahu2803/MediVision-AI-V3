
import React, { useState, useMemo } from 'react';
import { PrescriptionData, usePrescription } from '@/features/prescriptions';
import { BloodTestReport, useLab } from '@/features/blood-tests';
import { ArchiveFilterBar } from './clinical/ArchiveFilterBar.tsx';
import { AnimatePresence, m, useMotionValue, useTransform, motion } from 'framer-motion';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { useUI } from '../context/UIContext.tsx';
import { useAuthSession } from '@/hooks/useAuthSession.ts';
import { FolderIcon } from './icons/FolderIcon.tsx';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { exportSinglePDF, getPDFBlobUrl, getPDFBlob } from '../lib/pdfUtils.ts';
import { Spinner } from './Spinner.tsx';
import { ReportCardSkeleton } from './skeletons/ReportCardSkeleton.tsx';
import { AnalyzeIcon } from './icons/AnalyzeIcon.tsx';
import { Checkbox } from './ui/Checkbox.tsx';
import JSZip from 'jszip';
import { DraftIndicator } from './sync/DraftIndicator.tsx';
import { SyncQueueView } from './sync/SyncQueueView.tsx';
import { RefreshCw, List } from 'lucide-react';
import { ConflictResolutionModal } from './sync/ConflictResolutionModal.tsx';
import { cn } from '@/lib/utils';
import { AppTab, TransitionMode } from '@/constants/navigation';
import * as syncService from '@/services/syncService';
import * as localDB from '@/services/localDatabaseService';

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

type UnifiedReport = 
    | { type: 'rx'; data: PrescriptionData }
    | { type: 'lab'; data: BloodTestReport };

const groupReportsByDate = (reports: UnifiedReport[]) => {
    const groups: Record<string, UnifiedReport[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    reports.forEach(item => {
        const dateToUse = item.data.timestamp || item.data.date;
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
        groups[key].push(item);
    });
    return groups;
};

// --- Timeline Item Card ---
const TimelineItem: React.FC<{ 
    report: PrescriptionData; 
    selected: boolean;
    onToggleSelect: () => void;
    onSelect: () => void; 
    onDelete: () => void; 
    onDownload: () => void;
    onPreview: () => void;
    isDownloading: boolean;
}> = ({ report, selected, onToggleSelect, onSelect, onDelete, onDownload, onPreview, isDownloading }) => {
    const x = useMotionValue(0);
    const deleteOpacity = useTransform(x, [-100, -20], [1, 0]);

    const hasFullTimestamp = report.timestamp?.includes('T');
    const timeString = hasFullTimestamp 
        ? new Date(report.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Analysis Active';

    const getStatusConfig = () => {
        switch (report.status) {
            case 'Clinically-Verified':
                return { text: 'Verified', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: 'verified', iconColor: 'bg-emerald-50 text-emerald-500' };
            case 'User-Corrected':
                return { text: 'In Review', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: 'edit_note', iconColor: 'bg-amber-50 text-amber-500' };
            case 'Failed':
                return { text: 'Calibration Required', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: 'report', iconColor: 'bg-rose-50 text-rose-500' };
            case 'Processing':
                return { text: 'Calibrating...', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: 'sync', iconColor: 'bg-indigo-50 text-indigo-500' };
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
                className={`relative bg-white dark:bg-zinc-900 border ${selected ? 'border-brand-blue ring-2 ring-brand-blue/10 bg-brand-blue/5' : 'border-slate-100 dark:border-white/5'} p-7 shadow-glass hover:shadow-2xl transition-all cursor-pointer z-10 flex items-center gap-6`}
                onClick={onSelect}
            >
                <Checkbox 
                    checked={selected} 
                    onChange={onToggleSelect} 
                    className="shrink-0"
                />

                <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
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
                                <DraftIndicator status={report.sync?.status} />
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
                             {report.status === 'Failed' ? (
                                <m.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                                    className="p-2.5 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-110 transition-all flex items-center gap-2"
                                    title="Calibrate and Retry"
                                >
                                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                                    RETRY
                                </m.button>
                             ) : (
                                <>
                                 <m.button 
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); onPreview(); }}
                                    className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-brand-blue transition-all"
                                    title="Quick Preview"
                                >
                                    <EyeIcon className="size-5" />
                                </m.button>
                                <m.button 
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); onDownload(); }}
                                    disabled={isDownloading}
                                    className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-brand-blue transition-all disabled:opacity-50"
                                    title="Download PDF"
                                >
                                    {isDownloading ? <Spinner className="size-4" /> : <DownloadIcon className="size-5" />}
                                </m.button>
                                <m.button 
                                    whileHover={{ scale: 1.05, x: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                                    className="ml-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 text-[10px] font-black text-brand-blue uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-sm"
                                >
                                    DETAILS <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                </m.button>
                                </>
                             )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const LabTimelineItem: React.FC<{
    report: BloodTestReport;
    selected: boolean;
    onToggleSelect: () => void;
    onDelete: () => void;
}> = ({ report, selected, onToggleSelect, onDelete }) => {
    const x = useMotionValue(0);
    const deleteOpacity = useTransform(x, [-100, -20], [1, 0]);

    const hasFullTimestamp = report.timestamp?.includes('T');
    const timeString = hasFullTimestamp 
        ? new Date(report.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Report Logged';

    const criticalCount = report.results.filter(r => r.status === 'Critical').length;
    const abnormalCount = report.results.filter(r => r.status === 'Low' || r.status === 'High').length;

    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 overflow-hidden rounded-[2.5rem] group"
        >
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
                className={`relative bg-white dark:bg-zinc-900 border ${selected ? 'border-brand-blue ring-2 ring-brand-blue/10 bg-brand-blue/5' : 'border-slate-100 dark:border-white/5'} p-7 shadow-glass hover:shadow-2xl transition-all cursor-pointer z-10 flex items-center gap-6`}
            >
                <Checkbox 
                    checked={selected} 
                    onChange={onToggleSelect} 
                    className="shrink-0"
                />

                <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex gap-6">
                        <div className="size-16 shrink-0 rounded-2xl flex items-center justify-center shadow-inner border border-white/40 dark:border-transparent bg-purple-50 text-purple-500">
                            <span className="material-symbols-outlined text-[32px]">
                                lab_research
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-brand-blue transition-colors uppercase tracking-tight truncate">
                                    {report.patientName}
                                </h4>
                                <DraftIndicator status={report.sync?.status} />
                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm bg-purple-50 text-purple-600 border-purple-100">
                                    Blood Report
                                </span>
                                {criticalCount > 0 && (
                                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm bg-rose-50 text-rose-600 border-rose-100 animate-pulse">
                                        {criticalCount} Critical
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                {report.results.length} Biomarkers • {abnormalCount} Abnormal
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{timeString}</span>
                        <div className="flex items-center gap-1">
                             <m.button 
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-brand-blue transition-all"
                                title="View Lab Results"
                            >
                                <EyeIcon className="size-5" />
                            </m.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Main Page Component ---
interface ReportsViewProps {
    onNavigateToAnalyze: () => void;
    onNavigateToTab: (tab: AppTab, mode: TransitionMode) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ 
    onNavigateToAnalyze,
    onNavigateToTab
}) => {
    const { showToast } = useUI();
    const { isLoggedIn } = useAuthSession();
    const { 
        history, 
        deleteFromHistory: onDeleteReport, 
        setPrescriptionData: onSelectPrescription,
        isLoadingHistory: isLoadingPrescriptions,
    } = usePrescription();

    const { 
        labHistory, 
        deleteLabFromHistory: onDeleteLab,
        isLoading: isLoadingLabs
    } = useLab();

    const isLoading = isLoadingPrescriptions || isLoadingLabs;
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
    const [viewMode, setViewMode] = useState<'timeline' | 'queue'>('timeline');
    const [conflictItem, setConflictItem] = useState<UnifiedReport | null>(null);

    const unifiedHistory = useMemo(() => {
        const rxItems: UnifiedReport[] = history.map(h => ({ type: 'rx', data: h }));
        const labItems: UnifiedReport[] = labHistory.map(l => ({ type: 'lab', data: l }));
        return [...rxItems, ...labItems].sort((a, b) => {
            const dateA = new Date(a.data.timestamp || a.data.date).getTime();
            const dateB = new Date(b.data.timestamp || b.data.date).getTime();
            return dateB - dateA;
        });
    }, [history, labHistory]);

    const filteredHistory = useMemo(() => {
        const now = new Date();
        return unifiedHistory.filter(item => {
            const q = searchQuery.toLowerCase();
            const itemDate = new Date(item.data.timestamp || item.data.date);
            
            // Search filter
            const matchesSearch = 
                item.data.patientName.toLowerCase().includes(q) ||
                item.data.id.toLowerCase().includes(q) ||
                (item.type === 'rx' && (item.data as PrescriptionData).medication.some(m => m.name.toLowerCase().includes(q)));
            
            // Status/Type filter
            const matchesFilter = 
                activeFilter === 'all' ||
                (activeFilter === 'verified' && item.type === 'rx' && (item.data as PrescriptionData).status === 'Clinically-Verified') ||
                (activeFilter === 'review' && item.type === 'rx' && (item.data as PrescriptionData).status !== 'Clinically-Verified') ||
                (activeFilter === 'labs' && item.type === 'lab');

            // Date Range filter
            let matchesDate = true;
            if (dateRange !== 'all') {
                const diffTime = Math.abs(now.getTime() - itemDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (dateRange === '7d' && diffDays > 7) matchesDate = false;
                if (dateRange === '30d' && diffDays > 30) matchesDate = false;
                if (dateRange === '90d' && diffDays > 90) matchesDate = false;
            }

            return matchesSearch && matchesFilter && matchesDate;
        });
    }, [unifiedHistory, searchQuery, activeFilter, dateRange]);

    const groupedHistory = useMemo(() => groupReportsByDate(filteredHistory), [filteredHistory]);
    const groupKeys = useMemo(() => Object.keys(groupedHistory), [groupedHistory]);

    const filterOptions = [
        { id: 'all', label: 'All Reports', count: unifiedHistory.length },
        { id: 'review', label: 'Needs Review', count: history.filter(h => h.status !== 'Clinically-Verified').length },
        { id: 'verified', label: 'Verified', count: history.filter(h => h.status === 'Clinically-Verified').length },
        { id: 'labs', label: 'Lab Reports', count: labHistory.length },
    ];

    const stats = useMemo(() => ({
        total: unifiedHistory.length,
        needsReview: history.filter(h => h.status !== 'Clinically-Verified').length,
        syncs: unifiedHistory.filter(h => h.data.sync?.status !== 'synced').length
    }), [history, labHistory, unifiedHistory]);

    const handleDownload = async (report: PrescriptionData) => {
        if (report.sync?.status === 'conflict') {
            setConflictItem({ type: 'rx', data: report });
            return;
        }
        setDownloadingId(report.id);
        try {
            await exportSinglePDF(report);
        } catch (e) {
            console.error("Report extraction failed", e);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleBatchDownload = async () => {
        if (selectedIds.size === 0) return;
        setIsBatchProcessing(true);
        const selectedReports = unifiedHistory.filter(h => selectedIds.has(h.data.id));
        setExportProgress({ current: 0, total: selectedReports.length });

        try {
            const zip = new JSZip();
            
            for (let i = 0; i < selectedReports.length; i++) {
                const item = selectedReports[i];
                setExportProgress(prev => ({ ...prev, current: i + 1 }));
                
                if (item.type === 'rx') {
                    try {
                        const blob = await getPDFBlob(item.data as PrescriptionData);
                        zip.file(`${item.data.patientName || 'Patient'}_Report_${item.data.id.slice(0, 6)}.pdf`, blob);
                    } catch (err) {
                        console.error(`Failed to export report ${item.data.id}`, err);
                    }
                }
                // Small delay to allow UI to breathe
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Clinical_Archive_Export_${new Date().toISOString().split('T')[0]}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Batch export failed", e);
        } finally {
            setIsBatchProcessing(false);
            setExportProgress({ current: 0, total: 0 });
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredHistory.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredHistory.map(h => h.data.id)));
        }
    };

    const handlePreview = async (report: PrescriptionData) => {
        if (report.sync?.status === 'conflict') {
            setConflictItem({ type: 'rx', data: report });
            return;
        }
        try {
            const url = await getPDFBlobUrl(report);
            window.open(url, '_blank');
        } catch (e) {
            console.error("Diagnostic preview failed", e);
        }
    };

    const handleResolveConflict = async (resolution: 'local' | 'cloud' | 'merge') => {
        if (!conflictItem) return;
        
        const { type, data } = conflictItem;
        
        try {
            if (resolution === 'local') {
                // Re-enqueue for sync, which will overwrite cloud
                await syncService.syncManager.enqueue(type, 'update', {
                    ...data,
                    sync: { ...data.sync, status: 'pending', version: (data.sync?.version || 0) + 1 }
                });
            } else if (resolution === 'cloud') {
                // Keep cloud: Overwrite local with cloud data
                const cloudData = data.sync.conflictData.cloudData;
                if (type === 'rx') {
                    await localDB.saveToLocalDB({ ...cloudData, sync: { status: 'synced' } });
                } else {
                    await localDB.saveLabToLocalDB({ ...cloudData, sync: { status: 'synced' } });
                }
            } else {
                // Merge: Treat as manual review. 
                // We keep the local version but force it into review mode so the user MUST verify it.
                if (type === 'rx') {
                    await localDB.saveToLocalDB({ 
                        ...data, 
                        sync: { ...data.sync, status: 'pending', isLocalOnly: true } 
                    });
                    // Navigate to review tab for this specific report
                    onNavigateToTab(AppTab.REVIEW, TransitionMode.DRILL);
                } else {
                    await localDB.saveLabToLocalDB({ 
                        ...data, 
                        sync: { ...data.sync, status: 'pending', isLocalOnly: true } 
                    });
                    onNavigateToTab(AppTab.LABS, TransitionMode.TAB);
                }
                showToast('Action: Manual Review Required. Please verify all fields.', 'info');
            }
            
            showToast('Conflict resolved successfully.', 'success');
            setConflictItem(null);
        } catch (e: any) {
            showToast(`Resolution failed: ${e.message}`, 'error');
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
            <div className="flex flex-col items-center justify-center py-40 text-center animate-fadeIn max-w-xl mx-auto px-4">
                <div className="relative mb-12">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="size-48 bg-slate-50 dark:bg-zinc-900 rounded-[4rem] flex items-center justify-center text-slate-200 dark:text-slate-800 rotate-3 border-2 border-dashed border-slate-200 dark:border-white/5"
                    >
                        <FolderIcon className="size-24" />
                    </motion.div>
                    <motion.div 
                        initial={{ scale: 0, x: 20, y: 20 }}
                        animate={{ scale: 1, x: 0, y: 0 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="absolute -bottom-4 -right-4 size-24 bg-brand-blue text-white rounded-[2rem] flex items-center justify-center shadow-2xl -rotate-6 border-4 border-white dark:border-black"
                    >
                        <AnalyzeIcon className="size-12" />
                    </motion.div>
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-tight">
                    Your Clinical Archive is <span className="text-brand-blue">Awaiting Data</span>
                </h2>
                
                <p className="text-slate-500 dark:text-slate-400 mb-10 text-xl leading-relaxed font-medium">
                    Ready to digitize your workflow? Upload your first prescription to see AI extraction and clinical verification in action.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button 
                        onClick={onNavigateToAnalyze}
                        className="btn-gradient-cta px-10 py-5 rounded-[2rem] text-lg font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <span className="material-symbols-outlined text-2xl">add_circle</span>
                        Digitize First Script
                    </button>
                </div>

                <div className="mt-12 px-6 py-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 inline-flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 text-lg">{isLoggedIn ? 'verified_user' : 'visibility_off'}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                        {isLoggedIn ? 'Encrypted Cloud Storage Synchronized' : 'Local Session Data (IndexedDB Storage)'}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="flex justify-end mb-8">
                <div className="bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center shadow-sm">
                    <button 
                        onClick={() => setViewMode('timeline')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                            viewMode === 'timeline' ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <List className="size-3.5" />
                        Timeline
                    </button>
                    {isLoggedIn && (
                        <button 
                            onClick={() => setViewMode('queue')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all relative",
                                viewMode === 'queue' ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <RefreshCw className={cn("size-3.5", stats.syncs > 0 && "animate-spin")} />
                            Sync Queue
                            {stats.syncs > 0 && (
                                <span className="absolute -top-1 -right-1 size-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">
                                    {stats.syncs}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Official Branded Header */}
            <div className="mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
                <div className="space-y-5">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-white/50 dark:bg-white/5 px-5 py-2 rounded-full border border-slate-100 dark:border-white/5 w-fit shadow-sm backdrop-blur-md">
                        <HistoryLogIcon className="size-3.5" />
                        <span>{isLoggedIn ? 'Prescription Archive' : 'Session History'}</span>
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
                    <button 
                        onClick={onNavigateToAnalyze}
                        className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span> New Report
                    </button>
                </div>
            </div>

            <ArchiveFilterBar 
                options={filterOptions}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                className={viewMode === 'queue' ? 'hidden' : 'mb-16'}
            />

            {viewMode === 'queue' ? (
                <div className="max-w-3xl mx-auto">
                    <SyncQueueView />
                </div>
            ) : (
                <>
                    {/* Bento Grid Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                {/* Total Activity - Primary Bento Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-2 glass-panel p-10 rounded-[3rem] shadow-2xl border-white/60 dark:border-white/10 relative overflow-hidden group"
                >
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Total Clinical Activity</h4>
                            <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {stats.total} <span className="text-2xl text-slate-400 font-medium">Reports</span>
                            </h2>
                        </div>
                        <div className="mt-8 flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                                {isLoggedIn ? 'Cloud Archive Synchronized' : 'Local Workspace Active'}
                            </p>
                        </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 size-48 bg-brand-blue/5 rounded-full blur-3xl group-hover:bg-brand-blue/10 transition-colors duration-700" />
                </motion.div>

                {/* Needs Review - Secondary Bento Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-1 glass-panel p-10 rounded-[3rem] shadow-2xl border-white/60 dark:border-white/10 flex flex-col justify-between group"
                >
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-6">Action Required</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-rose-500 animate-pulse-ai">{stats.needsReview}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Items</span>
                        </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed mt-4">
                        Prescriptions awaiting clinical verification or correction.
                    </p>
                </motion.div>

                {/* Quick Action - Tertiary Bento Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={onNavigateToAnalyze}
                    className="md:col-span-1 bg-slate-900 dark:bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-all active:scale-95"
                >
                    <div className="size-14 rounded-2xl bg-white/10 dark:bg-black/10 flex items-center justify-center text-white dark:text-black mb-6 group-hover:rotate-12 transition-transform">
                        <span className="material-symbols-outlined text-3xl">add_circle</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white dark:text-black leading-tight mb-2">New<br/>Analysis</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Start Scan</p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Clinical Timeline Track */}
                <div className="lg:col-span-8 relative">
                    {/* Vertical Progression Line */}
                    <div className="absolute left-[39px] top-10 bottom-0 w-1 bg-gradient-to-b from-brand-blue/20 via-slate-100/50 to-transparent dark:from-white/10 dark:via-white/5 z-0 rounded-full" />
                    
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
                                        {groupedHistory[key].map((item) => (
                                            item.type === 'rx' ? (
                                                <TimelineItem 
                                                    key={`rx-${item.data.id}`}
                                                    report={item.data as PrescriptionData}
                                                    selected={selectedIds.has(item.data.id)}
                                                    onToggleSelect={() => toggleSelect(item.data.id)}
                                                    onSelect={() => onSelectPrescription(item.data as PrescriptionData)}
                                                    onDelete={() => onDeleteReport(item.data.id)}
                                                    onDownload={() => handleDownload(item.data as PrescriptionData)}
                                                    onPreview={() => handlePreview(item.data as PrescriptionData)}
                                                    isDownloading={downloadingId === item.data.id}
                                                />
                                            ) : (
                                                <LabTimelineItem 
                                                    key={`lab-${item.data.id}`}
                                                    report={item.data as BloodTestReport}
                                                    selected={selectedIds.has(item.data.id)}
                                                    onToggleSelect={() => toggleSelect(item.data.id)}
                                                    onDelete={() => onDeleteLab(item.data.id)}
                                                />
                                            )
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
                            <button 
                                onClick={() => setActiveFilter('all')}
                                className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] transition-all shadow-sm ${activeFilter === 'all' ? 'bg-brand-blue/5 text-brand-blue border-brand-blue/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 border-transparent'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-[22px]">prescriptions</span>
                                    <span className="text-xs font-black uppercase tracking-widest">Prescriptions</span>
                                </div>
                                <span className="text-xs font-black">{history.length}</span>
                            </button>
                            <button 
                                onClick={() => setActiveFilter('labs')}
                                className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] transition-all shadow-sm ${activeFilter === 'labs' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 border-transparent'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-[22px]">clinical_notes</span>
                                    <span className="text-xs font-black uppercase tracking-widest">Lab Results</span>
                                </div>
                                <span className="text-xs font-black">{labHistory.length}</span>
                            </button>
                        </div>
                    </div>

                    {/* Import Documents CTA */}
                    <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-10 text-white shadow-2xl group border border-white/10">
                        <div className="relative z-10">
                            <div className="size-20 bg-brand-blue/20 rounded-[1.5rem] flex items-center justify-center text-brand-blue mb-8 border border-brand-blue/20 group-hover:scale-110 duration-500">
                                <span className="material-symbols-outlined text-[48px]">cloud_upload</span>
                            </div>
                            <h5 className="text-3xl font-black mb-4 tracking-tighter">Local Import</h5>
                            <p className="mb-10 text-base text-slate-400 font-medium leading-relaxed">Import and digitize medical documents to keep your session history organized.</p>
                            <button 
                                onClick={onNavigateToAnalyze}
                                className="w-full rounded-2xl bg-white/10 py-5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20 backdrop-blur-md transition-all border border-white/10 active:scale-95"
                            >
                                Browse Files
                            </button>
                        </div>
                        {/* Decorative Background Elements */}
                        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-brand-blue/10 blur-[80px] group-hover:bg-brand-blue/20 transition-colors duration-700"></div>
                        <div className="absolute -left-16 -bottom-16 size-56 rounded-full bg-brand-green/5 blur-[80px]"></div>
                    </div>
                </aside>
            </div>
            </>
            )}

            {/* Batch Action Bar */}
            <AnimatePresence>
                {conflictItem && (
                    <ConflictResolutionModal 
                        isOpen={true}
                        localData={conflictItem.data}
                        cloudData={conflictItem.data.sync?.conflictData?.cloudVersion}
                        onResolve={handleResolveConflict}
                        onClose={() => setConflictItem(null)}
                    />
                )}
                {selectedIds.size > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4"
                    >
                        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-4 shadow-3xl flex items-center justify-between gap-6 backdrop-blur-xl">
                            <div className="flex items-center gap-6 pl-4">
                                <div className="size-10 rounded-full bg-brand-blue flex items-center justify-center text-white font-black text-sm shadow-glow ring-4 ring-brand-blue/20">
                                    {isBatchProcessing ? (
                                        <span className="text-[10px]">{Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
                                    ) : (
                                        selectedIds.size
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-white uppercase tracking-widest leading-none">
                                        {isBatchProcessing ? `Archiving Documents...` : `Reports Selected`}
                                    </p>
                                    <button 
                                        disabled={isBatchProcessing}
                                        onClick={toggleSelectAll} 
                                        className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors mt-1 uppercase tracking-tight disabled:opacity-50"
                                    >
                                        {selectedIds.size === filteredHistory.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="px-6 py-4 rounded-2xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBatchDownload}
                                    disabled={isBatchProcessing}
                                    className="px-8 py-4 rounded-2xl bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-blue/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 disabled:grayscale disabled:opacity-50"
                                >
                                    {isBatchProcessing ? <Spinner className="size-4" /> : <DownloadIcon className="size-4" />}
                                    <span>Export Collection</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
