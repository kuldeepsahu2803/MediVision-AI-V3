
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    RefreshCw, 
    Trash2, 
    AlertCircle, 
    Clock, 
    ArrowUp, 
    GripVertical, 
    CheckCircle2,
    X,
    FileText,
    Activity
} from 'lucide-react';
import { syncManager } from '@/services/syncService';
import { getSyncQueue, removeFromSyncQueue } from '@/services/localDatabaseService';
import { SyncQueueItem } from '@/shared/types/sync.types';
import { cn } from '@/lib/utils';
import { useUI } from '@/context/UIContext';

export const SyncQueueView: React.FC = () => {
    const [queue, setQueue] = useState<SyncQueueItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useUI();

    const loadQueue = async () => {
        const q = await getSyncQueue();
        setQueue(q);
        setIsLoading(false);
    };

    useEffect(() => {
        loadQueue();
        const unsubscribe = syncManager.subscribe(loadQueue);
        return unsubscribe;
    }, []);

    const handleForceSync = () => {
        syncManager.processQueue();
        showToast('Sync initiated...', 'info');
    };

    const handleRemoveItem = async (id: string) => {
        await removeFromSyncQueue(id);
        showToast('Item removed from sync queue', 'info');
        loadQueue();
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading sync queue...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sync Queue</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {queue.length} items awaiting cloud synchronization
                    </p>
                </div>
                <button 
                    onClick={handleForceSync}
                    disabled={queue.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-blue/20 disabled:opacity-50"
                >
                    <RefreshCw className="size-3.5" />
                    Sync Now
                </button>
            </div>

            {queue.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                    <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Your local data is perfectly synced with the cloud.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {queue.map((item, index) => (
                            <motion.div 
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="group p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-4 hover:shadow-lg transition-all"
                            >
                                <div className="text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="size-4" />
                                </div>
                                <div className={cn(
                                    "size-10 rounded-xl flex items-center justify-center shrink-0",
                                    item.type === 'prescription' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-emerald-500/10 text-emerald-500'
                                )}>
                                    {item.type === 'prescription' ? <FileText className="size-5" /> : <Activity className="size-5" />}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                            {item.action} • {item.type}
                                        </span>
                                        {item.retryCount > 0 && (
                                            <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                {item.retryCount} Retries
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">
                                        {item.data.patientName || 'Untitled Record'}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-bold">
                                        <span className="flex items-center gap-1">
                                            <Clock className="size-3" />
                                            {new Date(item.createdAt).toLocaleTimeString()}
                                        </span>
                                        {item.lastError && (
                                            <span className="flex items-center gap-1 text-rose-500/70">
                                                <AlertCircle className="size-3" />
                                                {item.lastError}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
