
import React from 'react';
import { CloudOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SyncStatus } from '@/shared/types/sync.types';

interface DraftIndicatorProps {
  status?: SyncStatus;
  className?: string;
}

export const DraftIndicator: React.FC<DraftIndicatorProps> = ({ status, className }) => {
    if (!status || status === 'synced') return null;

    if (status === 'pending') {
        return (
            <div className={cn("flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-md border border-amber-500/20", className)}>
                <CloudOff className="size-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Draft (Local)</span>
            </div>
        );
    }

    if (status === 'conflict') {
        return (
            <div className={cn("flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-md border border-rose-500/20", className)}>
                <AlertCircle className="size-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Sync Conflict</span>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={cn("flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md border border-red-500/20", className)}>
                <AlertCircle className="size-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Sync Error</span>
            </div>
        );
    }

    return null;
};
