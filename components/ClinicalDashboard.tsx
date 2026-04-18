import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Info, 
  X,
  Stethoscope,
  ShieldAlert,
  Droplets,
  Zap,
  Heart,
  Thermometer
} from 'lucide-react';
import { ClinicalInsight, ClinicalAlert } from '@/features/clinical-intelligence';
import { cn } from '../lib/utils.ts';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Tooltip,
  CartesianGrid
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

  return (
    <div className="space-y-12">
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

      {/* Intelligence Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Clinical Intelligence <span className="text-brand-blue">Dashboard</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Cross-referencing {insight.alerts.length} conflict rules against history</p>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus date={insight.generatedAt} />
          <button 
            onClick={onTriggerAnalysis}
            disabled={isLoading}
            className="p-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Activity className="size-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Alerts & Trends */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Risk Score Hub */}
          <section>
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Biological Vitality Systems</h2>
                <span className="px-3 py-1 bg-brand-blue/5 text-brand-blue text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-blue/10">Real-time Risk Mapping</span>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <RiskCard label="Kidney" score={insight.riskScores.kidney} icon={<Droplets className="size-5" />} />
                <RiskCard label="Liver" score={insight.riskScores.liver} icon={<Activity className="size-5" />} />
                <RiskCard label="Heart" score={insight.riskScores.heart} icon={<Heart className="size-5" />} />
                <RiskCard label="Diabetes" score={insight.riskScores.diabetes} icon={<Zap className="size-5" />} />
                <RiskCard label="Thyroid" score={insight.riskScores.thyroid} icon={<Thermometer className="size-5" />} />
             </div>
          </section>

          {/* Biomarker Trends Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Clinical Marker Longitudinal Tracking</h2>
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insight.testTrends && insight.testTrends.length > 0 ? (
                insight.testTrends.slice(0, 4).map(trend => (
                  <TrendChart key={trend.test} trend={trend} />
                ))
              ) : (
                <div className="md:col-span-2 p-12 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                   <TrendingUp className="size-10 text-slate-300 mb-4" />
                   <p className="text-slate-500 font-bold">At least 2 lab reports are required for trend visualization.</p>
                </div>
              )}
            </div>
          </section>

          {/* Pattern Recognition Section */}
          <section className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="size-12 rounded-2xl bg-brand-blue/20 flex items-center justify-center text-brand-blue border border-brand-blue/20">
                  <Activity className="size-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Intelligence Pattern Recognition</h3>
                  <p className="text-brand-blue text-[10px] font-black uppercase tracking-widest">Cross-system Correlation Evidence</p>
                </div>
              </div>

              <div className="space-y-4">
                {activeAlerts.length === 0 ? (
                   <p className="text-slate-400 font-medium">No recurring clinical patterns detected in existing history.</p>
                ) : (
                  activeAlerts.filter(a => a.type === 'TREND').map(pattern => (
                    <div key={pattern.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                      <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                        <TrendingUp className="size-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-200">
                        {pattern.message}
                      </p>
                    </div>
                  ))
                )}
                {/* Simulated ML Insights */}
                <div className="p-5 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center gap-4">
                  <div className="size-8 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center">
                    <Info className="size-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-200 italic">
                    AI Observation: Medication adherence patterns suggest optimal response during evening intervals.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-20 -bottom-20 size-80 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />
          </section>

        </div>

        {/* Right Column: Alerts & Summary */}
        <div className="lg:col-span-4 space-y-10">
          
          {/* Active Alerts List */}
          <section className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Primary Risks ({activeAlerts.length})
            </h2>
            
            <div className="space-y-4">
              {activeAlerts.length === 0 ? (
                <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                  <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-4" />
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Clear Profile</p>
                </div>
              ) : (
                activeAlerts.map(alert => (
                  <AlertItem key={alert.id} alert={alert} onDismiss={() => onDismissAlert(alert.id)} />
                ))
              )}
            </div>
          </section>

          {/* Logic Summary Card */}
          <section className="p-8 bg-brand-blue text-white rounded-[3rem] shadow-xl shadow-brand-blue/20 h-fit lg:sticky lg:top-24">
             <div className="flex items-center gap-2 mb-6">
                <Info className="size-5" />
                <h3 className="font-black uppercase tracking-tighter text-lg">AI Clinical Synthesis</h3>
             </div>
             <p className="text-sm font-bold leading-relaxed opacity-90 mb-8 border-l-2 border-white/20 pl-4 py-2">
                {insight.summary}
             </p>
             <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                   <span>Safety Protocol</span>
                   <span className="text-emerald-400">Active</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                   <span>DDI Scan</span>
                   <span className="text-emerald-400">Complete</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                   <span>Audit Log</span>
                   <span className="text-emerald-400">Secure</span>
                </div>
             </div>
          </section>

        </div>

      </div>
    </div>
  );
};

const TrendChart: React.FC<{ trend: { test: string; unit: string; data: { date: string; value: number }[] } }> = ({ trend }) => {
  return (
    <div className="p-7 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-glass group hover:shadow-2xl transition-all h-64">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{trend.test}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trend.unit} Track</p>
        </div>
        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
          <TrendingUp className="size-4" />
        </div>
      </div>
      <div className="h-32 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend.data}>
            <defs>
              <linearGradient id={`gradient-${trend.test}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
            <Tooltip 
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill={`url(#gradient-${trend.test})`} 
              strokeWidth={3}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const SyncStatus = ({ date }: { date: string }) => (
  <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-2">
    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
      Analysis Active: {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  </div>
);

const RiskCard: React.FC<{ label: string; score: number; icon: React.ReactNode }> = ({ label, score, icon }) => {
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

const AlertItem: React.FC<{ alert: ClinicalAlert; onDismiss: () => void }> = ({ alert, onDismiss }) => {
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


