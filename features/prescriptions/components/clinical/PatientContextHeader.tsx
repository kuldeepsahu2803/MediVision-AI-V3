
import React from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Hash, Clock } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils.ts';

interface PatientContextHeaderProps {
  name: string;
  id: string;
  dob?: string;
  timestamp?: string;
  className?: string;
}

export const PatientContextHeader: React.FC<PatientContextHeaderProps> = ({
  name,
  id,
  dob,
  timestamp,
  className
}) => {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center gap-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
          <User className="size-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Patient Identity</p>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {name || 'Unknown Patient'}
          </h3>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Hash className="size-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">ID: {id || 'N/A'}</span>
        </div>
        
        {dob && (
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">DOB: {formatDate(dob)}</span>
          </div>
        )}

        {timestamp && (
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Scanned: {new Date(timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Clinical Review Active</span>
      </div>
    </motion.div>
  );
};
