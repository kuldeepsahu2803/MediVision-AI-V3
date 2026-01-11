
import React from 'react';
import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo.tsx';

interface RoleSelectionViewProps {
  onSelectRole: (role: 'guest' | 'professional') => void;
  onBack: () => void;
}

// Icons matching the reference style
const GuestIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const ProIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0 1 12 2.714Z" />
  </svg>
);

export const RoleSelectionView: React.FC<RoleSelectionViewProps> = ({ onSelectRole, onBack }) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-black selection:bg-cyan-500 selection:text-white">
      
      {/* Selection Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-white/90 dark:bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <BrandLogo variant="header" />
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="text-slate-500 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-bold flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-16 flex flex-col justify-center items-center gap-12">
        
        {/* Title Section with Greeting */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/30 shadow-sm"
          >
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400">Welcome to MediVision AI</span>
          </motion.div>
          
          <div className="space-y-3">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]"
            >
              Who are you?
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium"
            >
              Select your role to configure your clinical workspace.
            </motion.p>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          
          {/* General User Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8 }}
            className="group relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-10 cursor-pointer hover:shadow-2xl hover:shadow-cyan-500/10 transition-all flex flex-col items-center text-center"
            onClick={() => onSelectRole('guest')}
          >
            <div className="w-20 h-20 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-500 mb-8 shrink-0 group-hover:scale-110 transition-transform duration-300">
              <GuestIcon className="w-10 h-10" />
            </div>
            <div className="mb-8 flex-grow">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">General User</h3>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                Analyze handwritten prescriptions instantly. Ideal for patients or quick verification without history tracking.
              </p>
            </div>
            
            <div className="w-full space-y-4">
              <button className="w-full px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-black text-sm shadow-xl group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                Continue as Guest
              </button>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Temporary Session</span>
              </div>
            </div>
          </motion.div>

          {/* Medical Professional Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8 }}
            className="group relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-10 cursor-pointer hover:shadow-2xl hover:shadow-rose-500/10 transition-all flex flex-col items-center text-center"
            onClick={() => onSelectRole('professional')}
          >
            <div className="w-20 h-20 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mb-8 shrink-0 group-hover:scale-110 transition-transform duration-300">
              <ProIcon className="w-10 h-10" />
            </div>
            <div className="mb-8 flex-grow">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Medical Professional</h3>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                Save prescription history, generate HIPAA-compliant reports, and access clinical audit logs.
              </p>
            </div>

            <div className="w-full space-y-4">
              <button className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-rose-500 text-white font-black text-sm shadow-xl shadow-rose-500/20 group-hover:shadow-rose-500/40 transition-all duration-300">
                Sign in to Portal
              </button>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Login Required</span>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Lightweight Footer */}
      <footer className="text-center py-8 text-slate-400 dark:text-slate-600 text-xs font-medium uppercase tracking-[0.2em]">
        <p>© {new Date().getFullYear()} MediVision AI Inc. All rights reserved.</p>
      </footer>

    </div>
  );
};
