
import React from 'react';
import BrandLogo from './BrandLogo.tsx';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-6">
            <BrandLogo variant="header" className="grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-default scale-110" />
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
                <a href="#" className="hover:text-brand-blue transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-brand-blue transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-brand-blue transition-colors">HIPAA Compliance</a>
                <a href="#" className="hover:text-brand-blue transition-colors">System Status</a>
            </div>
        </div>

        <div className="text-center space-y-4 max-w-3xl">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic opacity-80">
                This clinical analysis report is synthesized using MediVision AI Core v2.1. Extraction outcomes are subject to physician sign-off. 
                MediVision AI does not provide medical diagnoses. Always consult with a licensed pharmaceutical expert before initiating clinical interventions.
            </p>
            <div className="h-px w-12 bg-slate-200 dark:bg-white/10 mx-auto"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                &copy; {new Date().getFullYear()} MediVision AI Systems Inc. Engineered for Clinical Excellence.
            </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10 items-center opacity-30 grayscale transition-all hover:opacity-50">
            <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-slate-400 rounded-md" />
                <span className="text-[9px] font-black uppercase tracking-widest">ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-slate-400 rounded-md" />
                <span className="text-[9px] font-black uppercase tracking-widest">SOC2 Type II</span>
            </div>
            <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-slate-400 rounded-md" />
                <span className="text-[9px] font-black uppercase tracking-widest">EU-US GDPR Data Sovereignty</span>
            </div>
        </div>
      </div>
    </footer>
  );
};
