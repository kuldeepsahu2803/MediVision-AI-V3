
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { syncManager } from '@/services/syncService';
import { useUI } from '@/context/UIContext';

export const SyncStatusIndicator: React.FC = () => {
    const [status, setStatus] = useState(syncManager.getStatus());
    const { showToast } = useUI();

    useEffect(() => {
        const unsubscribe = syncManager.subscribe(() => {
            const nextStatus = syncManager.getStatus();
            if (nextStatus.isOnline && !status.isOnline) {
                showToast('Back Online — Syncing records...', 'success');
            } else if (!nextStatus.isOnline && status.isOnline) {
                showToast('Working Offline — Drafts Safe', 'info');
            }
            setStatus(nextStatus);
        });
        return unsubscribe;
    }, [status.isOnline, showToast]);

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
            {!status.isOnline ? (
                <div className="flex items-center gap-2 text-amber-500">
                    <WifiOff className="size-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Offline</span>
                </div>
            ) : status.isSyncing ? (
                <div className="flex items-center gap-2 text-brand-blue">
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                        Syncing {status.inProgressCount > 0 ? `(${status.inProgressCount})` : ''}
                    </span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="size-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Synced</span>
                </div>
            )}
        </div>
    );
};

export const OfflineBanner: React.FC = () => {
    const [isOnline, setIsOnline] = useState(syncManager.getStatus().isOnline);

    useEffect(() => {
        const unsubscribe = syncManager.subscribe(() => {
            setIsOnline(syncManager.getStatus().isOnline);
        });
        return unsubscribe;
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-amber-500 text-white overflow-hidden"
                >
                    <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3">
                        <WifiOff className="size-4" />
                        <span className="text-xs font-black uppercase tracking-widest">
                            You are working offline. Changes will be saved locally and synced automatically when you reconnect.
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
