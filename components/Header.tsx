import React, { useMemo } from 'react';
import { HamburgerMenuIcon } from '@/components/icons/HamburgerMenuIcon.tsx';
import { AnalyzeIcon } from '@/components/icons/AnalyzeIcon.tsx';
import { ClipboardDocumentCheckIcon } from '@/components/icons/ClipboardDocumentCheckIcon.tsx';
import { FolderIcon } from '@/components/icons/FolderIcon.tsx';
import { StethoscopeIcon } from '@/components/icons/StethoscopeIcon.tsx';
import { SettingsIcon } from '@/components/icons/SettingsIcon.tsx';
import BrandLogo from '@/components/BrandLogo.tsx';
import { motion } from 'framer-motion';
import { AppTab } from '@/constants/navigation.ts';
import { SyncStatusIndicator } from './sync/SyncStatus.tsx';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onMenuClick: () => void;
  isLoggedIn: boolean;
  isGuest: boolean;
  hasData: boolean;
  showTreatments: boolean;
  onLogoClick?: () => void;
  cloudStatus: string;
  selectedModule: 'rx' | 'blood';
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  onMenuClick, 
  isLoggedIn, 
  isGuest,
  hasData,
  showTreatments, 
  onLogoClick,
  selectedModule
}) => {
  const navLinks: { id: AppTab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; bg: string }[] = [
    { id: AppTab.ANALYZE, label: 'Analyze', icon: AnalyzeIcon, color: 'text-primary', bg: 'bg-primary/5' },
    { id: AppTab.LABS, label: 'Labs', icon: AnalyzeIcon, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
    { id: AppTab.REVIEW, label: 'Review', icon: ClipboardDocumentCheckIcon, color: 'text-amber-500', bg: 'bg-amber-500/5' },
    { id: AppTab.TREATMENTS, label: 'Insights', icon: StethoscopeIcon, color: 'text-rose-500', bg: 'bg-rose-500/5' },
    { id: AppTab.REPORTS, label: 'Reports', icon: FolderIcon, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
    { id: AppTab.SETTINGS, label: 'Settings', icon: SettingsIcon, color: 'text-slate-500', bg: 'bg-slate-500/5' },
  ];

  const availableNavLinks = useMemo(() => {
    let links = navLinks;
    if (!showTreatments) {
      links = links.filter(l => l.id !== AppTab.TREATMENTS);
    }
    
    // Filter based on selected module
    if (selectedModule === 'rx') {
      links = links.filter(l => l.id !== AppTab.LABS);
    } else if (selectedModule === 'blood') {
      links = links.filter(l => l.id !== AppTab.ANALYZE && l.id !== AppTab.REVIEW && l.id !== AppTab.TREATMENTS);
    }
    
    return links;
  }, [showTreatments, selectedModule]);

  return (
    <header className="relative w-full z-40 transition-all duration-300 pt-[env(safe-area-inset-top,0px)]">
      <div className="absolute inset-0 bg-white/95 dark:bg-black/90 border-b border-light-border dark:border-dark-border shadow-sm backdrop-blur-xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="cursor-pointer group" onClick={onLogoClick}>
              <BrandLogo variant="header" className="transform group-hover:scale-105 transition-transform" />
            </div>
            <div className="hidden sm:block">
              <SyncStatusIndicator />
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-full border border-slate-200 dark:border-white/5 backdrop-blur-md">
            {availableNavLinks.map(link => {
              const isActive = activeTab === link.id;
              const isDisabled = link.id !== AppTab.ANALYZE && link.id !== AppTab.SETTINGS && !isLoggedIn && !(isGuest && hasData);
              
              return (
                <button 
                  key={link.id}
                  onClick={() => !isDisabled && setActiveTab(link.id)}
                  disabled={isDisabled}
                  className={`relative flex items-center px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-500
                      ${isActive 
                          ? `${link.color} shadow-sm` 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }
                      ${isDisabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isActive && (
                    <motion.div 
                        layoutId="activeTabBg"
                        className={`absolute inset-0 ${link.bg} rounded-full border border-current opacity-20`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <span className="relative z-10 flex items-center gap-2.5">
                    <link.icon className={`w-[22px] h-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-60'}`} />
                    {link.label}
                  </span>

                  {isActive && (
                    <motion.div 
                      layoutId="activeTabDot"
                      className={`nav-accent bg-current`}
                    />
                  )}
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