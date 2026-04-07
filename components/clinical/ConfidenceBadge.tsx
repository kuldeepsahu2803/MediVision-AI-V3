
import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Info } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { ConfidenceLevel } from '../../types.ts';

interface ConfidenceBadgeProps {
  confidence?: number;
  level?: ConfidenceLevel;
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  level,
  className,
  showIcon = true,
  showLabel = true
}) => {
  const getLevel = (conf?: number): ConfidenceLevel => {
    if (level) return level;
    if (conf === undefined) return 'UNKNOWN';
    if (conf >= 0.9) return 'HIGH';
    if (conf >= 0.7) return 'MEDIUM';
    return 'LOW';
  };

  const currentLevel = getLevel(confidence);

  const config = {
    HIGH: {
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
      icon: ShieldCheck,
      label: 'High Confidence'
    },
    MEDIUM: {
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
      icon: ShieldAlert,
      label: 'Medium Confidence'
    },
    LOW: {
      color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
      icon: ShieldQuestion,
      label: 'Low Confidence'
    },
    UNKNOWN: {
      color: 'bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400 border-slate-100 dark:border-slate-900/30',
      icon: Info,
      label: 'Unknown Confidence'
    }
  };

  const { color, icon: Icon, label } = config[currentLevel];

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all",
      color,
      className
    )}>
      {showIcon && <Icon className="size-3" />}
      {showLabel && <span>{label}</span>}
      {confidence !== undefined && (
        <span className="opacity-60 ml-1">{Math.round(confidence * 100)}%</span>
      )}
    </div>
  );
};
