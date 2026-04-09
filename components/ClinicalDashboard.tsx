import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X,
  Stethoscope,
  ShieldAlert,
  Droplets,
  Zap,
  Heart,
  Thermometer
} from 'lucide-react';
import { ClinicalInsight, ClinicalAlert, ClinicalSeverity } from '../types.ts';
import { cn } from '../lib/utils.ts';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

interface ClinicalDashboardProps {
  insight: ClinicalInsight | null;
  onDismissAlert: (id: string) => void;
  onTriggerAnalysis: () => void;
  isLoading?: boolean;
}

export const ClinicalDashboard: React.FC<ClinicalDashboardProps> = ({ 
  insight, 
  onDismissAlert, 
  onTriggerAnalysis,
  isLoading 
}) => {
  if (!insight) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl">
        <Stethoscope className="size-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Clinical Insights Yet</h2>
        <p className="text-slate-500 font-medium mb-6">Upload lab reports and prescriptions to generate clinical intelligence.</p>
        <button 
          onClick={onTriggerAnalysis}
          disabled={isLoading}
          className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg shadow-brand-blue/20 disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Run Clinical Analysis'}
        </button>
      </div>
    );
  }

  const activeAlerts = insight.alerts.filter(a => !a.resolved);
  const emergencyAlerts = activeAlerts.filter(a => a.severity === 'EMERGENCY');
  const highAlerts = activeAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');
  const otherAlerts = activeAlerts.filter(a => a.severity !== 'EMERGENCY' && a.severity !== 'HIGH' && a.severity !== 'CRITICAL');

  return (
    <div className="space-y-8">
      {/* Emergency Banner */}
      <AnimatePresence>
        {emergencyAlerts.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-600 text-white p-6 rounded-[2rem] shadow-2xl shadow-rose-500/30 flex items-center gap-6 overflow-hidden"
          >
            <div className="size-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <ShieldAlert className="size-10" />
            </div>
            <div className="flex-grow">
              <h2 className="text-xl font-black uppercase tracking-tight">Emergency Alert Detected</h2>
              <p className="font-bold opacity-90">{emergencyAlerts[0].message}</p>
              <p className="text-sm font-black uppercase tracking-widest mt-2 bg-white/20 inline-block px-3 py-1 rounded-lg">
                Action: {emergencyAlerts[0].action}
              </p>
            </div>
            <Zap className="size-12 opacity-20 shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Risk Score Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <RiskCard label="Kidney" score={insight.riskScores.kidney} icon={<Droplets className="size-5" />} />
        <RiskCard label="Liver" score={insight.riskScores.liver} icon={<Activity className="size-5" />} />
        <RiskCard label="Heart" score={insight.riskScores.heart} icon={<Heart className="size-5" />} />
        <RiskCard label="Diabetes" score={insight.riskScores.diabetes} icon={<Zap className="size-5" />} />
        <RiskCard label="Thyroid" score={insight.riskScores.thyroid} icon={<Thermometer className="size-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <AlertTriangle className="size-6 text-amber-500" />
              Active Clinical Alerts
            </h2>
            <button 
              onClick={onTriggerAnalysis}
              className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline"
            >
              Re-run Analysis
            </button>
          </div>

          <div className="space-y-4">
            {activeAlerts.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">No active clinical conflicts detected.</p>
              </div>
            ) : (
              <>
                {highAlerts.map(alert => (
                  <AlertItem key={alert.id} alert={alert} onDismiss={() => onDismissAlert(alert.id)} />
                ))}
                {otherAlerts.map(alert => (
                  <AlertItem key={alert.id} alert={alert} onDismiss={() => onDismissAlert(alert.id)} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Summary & Trends Sidebar */}
        <div className="space-y-6">
          <div className="p-8 bg-brand-blue text-white rounded-[2.5rem] shadow-xl shadow-brand-blue/20 space-y-6">
            <div className="flex items-center gap-2">
              <Info className="size-5" />
              <h3 className="font-black uppercase tracking-tight">Clinical Summary</h3>
            </div>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              {insight.summary}
            </p>
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Last Updated: {new Date(insight.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Health Trends (90d)</h3>
              <TrendingUp className="size-4 text-brand-green" />
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-widest">Aggregate Wellness Index</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RiskCard = ({ label, score, icon }: { label: string, score: number, icon: React.ReactNode }) => {
  const getColor = (s: number) => {
    if (s < 30) return 'text-emerald-500 bg-emerald-500/10';
    if (s < 60) return 'text-amber-500 bg-amber-500/10';
    return 'text-rose-500 bg-rose-500/10';
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm space-y-3">
      <div className={cn("size-10 rounded-2xl flex items-center justify-center", getColor(score))}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{label}</p>
        <div className="flex items-end gap-1">
          <span className="text-xl font-black text-slate-900 dark:text-white">{score}</span>
          <span className="text-[10px] text-slate-400 font-bold mb-1">%</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={cn("h-full rounded-full", score < 30 ? 'bg-emerald-500' : score < 60 ? 'bg-amber-500' : 'bg-rose-500')}
        />
      </div>
    </div>
  );
};

const AlertItem = ({ alert, onDismiss }: { alert: ClinicalAlert, onDismiss: () => void, key?: string }) => {
  const severityStyles = {
    LOW: 'border-blue-100 bg-blue-50/30 text-blue-700 dark:border-blue-500/10 dark:bg-blue-500/5 dark:text-blue-400',
    MEDIUM: 'border-amber-100 bg-amber-50/30 text-amber-700 dark:border-amber-500/10 dark:bg-amber-500/5 dark:text-amber-400',
    HIGH: 'border-orange-100 bg-orange-50/30 text-orange-700 dark:border-orange-500/10 dark:bg-orange-500/5 dark:text-orange-400',
    CRITICAL: 'border-rose-100 bg-rose-50/30 text-rose-700 dark:border-rose-500/10 dark:bg-rose-500/5 dark:text-rose-400',
    EMERGENCY: 'border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
  };

  const typeIcons = {
    DDI: <Zap className="size-4" />,
    TREND: <TrendingUp className="size-4" />,
    CRITICAL: <ShieldAlert className="size-4" />,
    AYURVEDIC: <Droplets className="size-4" />
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-5 rounded-3xl border flex gap-4 relative group",
        severityStyles[alert.severity]
      )}
    >
      <div className="size-10 rounded-2xl bg-white/50 dark:bg-white/5 flex items-center justify-center shrink-0">
        {typeIcons[alert.type]}
      </div>
      <div className="flex-grow pr-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{alert.type}</span>
          <span className="size-1 rounded-full bg-current opacity-30" />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{alert.severity}</span>
        </div>
        <p className="text-sm font-black leading-tight mb-2">{alert.message}</p>
        {alert.action && (
          <p className="text-xs font-bold opacity-80 bg-white/30 dark:bg-black/20 px-3 py-1.5 rounded-xl inline-block">
            Recommendation: {alert.action}
          </p>
        )}
      </div>
      <button 
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
};

const mockTrendData = [
  { day: 1, score: 82 },
  { day: 2, score: 85 },
  { day: 3, score: 80 },
  { day: 4, score: 88 },
  { day: 5, score: 84 },
  { day: 6, score: 90 },
  { day: 7, score: 92 },
];
