import React from 'react';
import { Header } from '../Header.tsx';
import { Footer } from '../Footer.tsx';
import { HamburgerMenu } from '../HamburgerMenu.tsx';
import { PrescriptionData } from '../../types.ts';
import { AppTab } from '../../constants/navigation.ts';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isLoggedIn: boolean;
  isGuest: boolean;
  hasData: boolean;
  user: any;
  history: PrescriptionData[];
  showTreatments: boolean;
  setShowTreatments: (show: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: React.SetStateAction<boolean>) => void;
  setShowLoginModal: (show: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onLogout: () => void;
  onLogoClick: () => void;
  triggerHaptic: (type: any) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  isLoggedIn,
  isGuest,
  hasData,
  user,
  history,
  showTreatments,
  setShowTreatments,
  isMenuOpen,
  setIsMenuOpen,
  setShowLoginModal,
  showToast,
  onLogout,
  onLogoClick,
  triggerHaptic
}) => {
  return (
    <div className="flex flex-col min-h-screen w-full relative bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 overflow-y-auto overflow-x-hidden">
      {/* 
          Sticky Navigation Header:
          Enhanced with sticky top-0 and z-index to ensure it floats 
          above content while providing a blur transition.
      */}
      <div className="w-full shrink-0 sticky top-0 z-[45]">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onMenuClick={() => { triggerHaptic('light'); setIsMenuOpen(p => !p); }} 
          isLoggedIn={isLoggedIn}
          isGuest={isGuest}
          hasData={hasData}
          showTreatments={showTreatments} 
          onLogoClick={onLogoClick}
        />
      </div>

      {isMenuOpen && (
        <HamburgerMenu 
            closeMenu={() => { triggerHaptic('light'); setIsMenuOpen(false); }} 
            setActiveTab={setActiveTab}
            isLoggedIn={isLoggedIn}
            user={user}
            history={history} 
            onLogin={() => {
                triggerHaptic('light');
                setIsMenuOpen(false);
                setShowLoginModal(true);
            }}
            onLogout={onLogout}
            showTreatments={showTreatments}
            setShowTreatments={setShowTreatments}
            showToast={showToast}
        />
      )}

      {/* Content wrapper with natural overflow */}
      <main className="flex-grow flex flex-col w-full relative">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
};