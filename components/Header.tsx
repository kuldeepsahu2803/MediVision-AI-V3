
import React from 'react';
import { HamburgerMenuIcon } from './icons/HamburgerMenuIcon.tsx';
import { AnalyzeIcon } from './icons/AnalyzeIcon.tsx';
import { ClipboardDocumentCheckIcon } from './icons/ClipboardDocumentCheckIcon.tsx';
import { FolderIcon } from './icons/FolderIcon.tsx';
import { StethoscopeIcon } from './icons/StethoscopeIcon.tsx';
import { SettingsIcon } from './icons/SettingsIcon.tsx';
import BrandLogo from './BrandLogo.tsx';
import { motion } from 'framer-motion';
import { AppTab } from '../constants/navigation.ts';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onMenuClick: () => void;
  isLoggedIn: boolean;
  isGuest: boolean;
  hasData: boolean;
  showTreatments: boolean;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  onMenuClick, 
  isLoggedIn, 
  isGuest,
  hasData,
  showTreatments, 
  onLogoClick 
}) => {
  const navLinks: { id: AppTab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: AppTab.ANALYZE, label: 'Analyze', icon: AnalyzeIcon },
    { id: AppTab.REVIEW, label: 'Review', icon: ClipboardDocumentCheckIcon },
    { id: AppTab.TREATMENTS, label: 'Insights', icon: StethoscopeIcon },
    { id: AppTab.REPORTS, label: 'Reports', icon: FolderIcon },
    { id: AppTab.SETTINGS, label: 'Settings', icon: SettingsIcon },
  ];

  const availableNavLinks = showTreatments ? navLinks : navLinks.filter(l => l.id !== AppTab.TREATMENTS);

  return (
    <header className="relative w-full z-40 transition-all duration-300">
      <div className="absolute inset-0 bg-white/95 dark:bg-black/90 border-b border-light-border dark:border-dark-border shadow-sm backdrop-blur-xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          <div className="flex items-center cursor-pointer group" onClick={onLogoClick}>
            <BrandLogo variant="header" className="transform group-hover:scale-105 transition-transform" />
          </div>
          
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1.5 rounded-full border border-slate-200 dark:border-white/5 backdrop-blur-md">
            {availableNavLinks.map(link => {
              const isActive = activeTab === link.id;
              
              // Settings is always available, others dependent on auth/data
              const isDisabled = link.id !== AppTab.ANALYZE && link.id !== AppTab.SETTINGS && !isLoggedIn && !(isGuest && hasData);
              
              return (
                <button 
                  key={link.id}
                  onClick={() => !isDisabled && setActiveTab(link.id)}
                  disabled={isDisabled}
                  className={`relative flex items-center px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300
                      ${isActive 
                          ? 'text-brand-blue dark:text-white shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }
                      ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isActive && (
                    <motion.div 
                        layoutId="activeTabBg"
                        className="absolute inset-0 bg-white dark:bg-white/10 rounded-full shadow-md border border-slate-200 dark:border-white/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    <link.icon className={`w-4 h-4 ${isActive ? 'opacity-100 text-brand-blue' : 'opacity-60'}`} />
                    {link.label}
                  </span>
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center">
             <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={onMenuClick}
                className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
             >
                <HamburgerMenuIcon className="w-6 h-6" />
             </motion.button>
          </div>
      </div>
    </header>
  );
};
