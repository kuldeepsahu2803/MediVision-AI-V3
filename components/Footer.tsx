
import React from 'react';
import BrandLogo from './BrandLogo.tsx';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-6">
            <BrandLogo variant="header" className="grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-default scale-110" />
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
                {/* COMPLIANCE: Real placeholders for legal requirements */}
                <a href="/legal/privacy" onClick={e => e.preventDefault()} className="hover:text-brand-blue transition-colors">Privacy Policy</a>
                <a href="/legal/terms" onClick={e => e.preventDefault()} className="hover:text-brand-blue transition-colors">Terms of Service</a>
                <a href="/legal/hipaa" onClick={e => e.preventDefault()} className="hover:text-brand-blue transition-colors">HIPAA Disclosure</a>
                <a href="/status" onClick={e => e.preventDefault()} className="hover:text-brand-blue transition-colors">System Status</a>
            </div>
        </div>

        <div className="text-center space-y-4 max-w-3xl">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic opacity-80">
                This digital cockpit is for administrative synthesis only. Clinical interventions require licensed practitioner sign-off.
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                &copy; {new Date().getFullYear()} MediVision AI Systems Inc. All Rights Reserved.
            </p>
        </div>
      </div>
    </footer>
  );
};
