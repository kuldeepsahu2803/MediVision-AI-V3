
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { ClinicalSeverity } from '@/features/clinical-intelligence';

interface ClinicalAlertBannerProps {
  severity: ClinicalSeverity;
  title: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const ClinicalAlertBanner: React.FC<ClinicalAlertBannerProps> = ({
  severity,
  title,
  message,
  onDismiss,
  className
}) => {
  const config = {
    CRITICAL: {
      bg: 'bg-rose-600 dark:bg-rose-950/80',
      text: 'text-white',
      icon: AlertCircle,
      border: 'border-rose-500/50',
      label: 'Critical Alert'
    },
    WARNING: {
      bg: 'bg-amber-500 dark:bg-amber-950/80',
      text: 'text-white',
      icon: AlertTriangle,
      border: 'border-amber-400/50',
      label: 'Clinical Warning'
    },
    INFO: {
      bg: 'bg-brand-blue dark:bg-brand-blue/80',
      text: 'text-white',
      icon: Info,
      border: 'border-brand-blue/50',
      label: 'Clinical Notice'
    }
  };

  const { bg, text, icon: Icon, border, label } = config[severity];

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className={cn(
        "w-full overflow-hidden shadow-2xl relative z-50",
        bg,
        text,
        border,
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-start gap-4">
        <div className="size-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="size-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{label}</span>
            <h4 className="text-sm font-black uppercase tracking-tight truncate">{title}</h4>
          </div>
          <p className="text-xs font-bold leading-relaxed opacity-90">{message}</p>
        </div>

        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
