
import React from 'react';
import { CloudOff, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

interface SyncStatusBarProps {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  lastSynced?: string;
  className?: string;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({
  status,
  lastSynced,
  className
}) => {
  const config = {
    synced: {
      color: 'text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle,
      label: 'Cloud Synced'
    },
    syncing: {
      color: 'text-brand-blue dark:text-brand-blue-400',
      icon: RefreshCw,
      label: 'Syncing Changes...',
      animate: 'animate-spin'
    },
    offline: {
      color: 'text-amber-600 dark:text-amber-400',
      icon: CloudOff,
      label: 'Offline Mode'
    },
    error: {
      color: 'text-rose-600 dark:text-rose-400',
      icon: CloudOff,
      label: 'Sync Error'
    }
  };

  const { color, icon: Icon, label, animate } = config[status];

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm backdrop-blur-md transition-all",
      className
    )}>
      <div className={cn("size-4 flex items-center justify-center", color, animate)}>
        <Icon className="size-full" />
      </div>
      
      <div className="flex flex-col">
        <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-0.5", color)}>
          {label}
        </span>
        {lastSynced && status === 'synced' && (
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
            Last: {new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};
