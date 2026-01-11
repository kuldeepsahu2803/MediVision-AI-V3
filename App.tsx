
import React, { useState, useEffect, useCallback } from 'react';
import { AnalyzeView } from './components/AnalyzeView.tsx';
import { ReviewView } from './components/ReviewView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { TreatmentsView } from './components/TreatmentsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { Toast } from './components/Toast.tsx';
import { Spinner } from './components/Spinner.tsx';
import BrandLogo from './components/BrandLogo.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition } from './components/ui/PageTransition.tsx';
import LandingView from './components/LandingView.tsx';
import { ServicesView } from './components/ServicesView.tsx';
import { RoleSelectionView } from './components/RoleSelectionView.tsx';

import { AppLayout } from './components/layout/AppLayout.tsx';
import { useAuthSession } from './hooks/useAuthSession.ts';
import { useMedicalHistory } from './hooks/useMedicalHistory.ts';
import { useAnalysisEngine } from './hooks/useAnalysisEngine.ts';
import { useHaptic } from './hooks/useHaptic.ts';
import { useAppWorkflow } from './hooks/useAppWorkflow.ts';
import { useNavigationState } from './hooks/useNavigationState.ts';
import { AppView, AppTab, TransitionMode } from './constants/navigation.ts';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'critical';
export type ToastItem = { id: string; message: string; type: ToastType };
type UserRole = 'guest' | 'professional' | null;

const m = motion as any;

const OnboardingOverlay = ({ onClose }: { onClose: () => void }) => (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/90 backdrop-blur-xl"
    >
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl text-center border border-white/20">
            <div className="w-20 h-20 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">How it Works</h2>
            <div className="space-y-4 text-left mb-8">
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex-shrink-0 flex items-center justify-center font-bold">1</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400"><strong>AI Extraction:</strong> We scan handwriting verbatim. Accuracy depends on scan quality.</p>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-green text-white flex-shrink-0 flex items-center justify-center font-bold">2</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Clinical Verification:</strong> Extracted data is cross-referenced with RxNorm clinical standards.</p>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex-shrink-0 flex items-center justify-center font-bold">3</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Human Review:</strong> You review the result and sign-off before finalizing the clinical report.</p>
                </div>
            </div>
            <button onClick={onClose} className="w-full btn-gradient text-white py-4 rounded-2xl font-bold shadow-xl">Get Started</button>
        </div>
    </motion.div>
);

const App: React.FC = () => {
  const { appView, activeTab, transitionMode, navigateToTab, navigateToView } = useNavigationState();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showTreatments, setShowTreatments] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { user, isLoggedIn, login, logout } = useAuthSession();
  const medicalHistory = useMedicalHistory();
  const analysisEngine = useAnalysisEngine(isLoggedIn);
  const { triggerHaptic } = useHaptic();
  
  const { history, isLoadingHistory } = medicalHistory;
  const { imageFiles, imageUrls, prescriptionData, setPrescriptionData, isLoading, error, addImages, removeImage, clear, analyze } = analysisEngine;

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const { handleAnalyzeClick, handleSaveReview, handleVerify, handleDeleteReport } = useAppWorkflow({
      userRole,
      user,
      analysisEngine,
      medicalHistory,
      triggerHaptic,
      showToast,
      setShowLoginModal,
      navigateToTab
  });

  const handleLoginSuccess = (user: { name: string; email: string }) => {
    setShowLoginModal(false);
    triggerHaptic('success');
    showToast(`Welcome, ${user.name}!`, 'success');
    if (appView === AppView.ROLE_SELECTION && userRole === 'professional') {
        navigateToView(AppView.SERVICES);
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    triggerHaptic('medium');
    showToast('You have been logged out.', 'info');
    navigateToView(AppView.LANDING);
    setUserRole(null);
  };

  const handleRoleSelection = (role: UserRole) => {
    if (userRole && userRole !== role) {
        const confirmed = window.confirm("Switching roles may reset your current session. Continue?");
        if (!confirmed) return;
    }
    triggerHaptic('light');
    setUserRole(role);
    if (role === 'guest') {
        showToast("Guest sessions are temporary. Unsaved reviews reset on refresh.", "info");
        navigateToView(AppView.SERVICES);
    } else if (role === 'professional') {
        if (isLoggedIn) navigateToView(AppView.SERVICES);
        else setShowLoginModal(true);
    }
  };
  
  const displayHistory = userRole === 'guest' ? (prescriptionData ? [prescriptionData] : []) : history;

  const renderContent = () => {
    const isProtectedTab = [AppTab.REVIEW, AppTab.REPORTS, AppTab.TREATMENTS].includes(activeTab);
    const isGuest = userRole === 'guest';
    
    if (isProtectedTab && !isLoggedIn && !isGuest) {
      navigateToTab(AppTab.ANALYZE);
      return null;
    }

    if (isProtectedTab && isGuest && !prescriptionData) {
      navigateToTab(AppTab.ANALYZE);
      return null;
    }

    switch(activeTab) {
      case AppTab.REVIEW:
        return <ReviewView prescription={prescriptionData} imageUrls={imageUrls.length > 0 ? imageUrls : null} onSave={handleSaveReview} onVerify={handleVerify} />;
      case AppTab.REPORTS:
        return <ReportsView history={displayHistory} isLoading={isLoadingHistory} onSelectPrescription={(p) => { setPrescriptionData(p); navigateToTab(AppTab.REVIEW, TransitionMode.DRILL); }} onDeleteReport={handleDeleteReport} />;
      case AppTab.TREATMENTS:
        return <TreatmentsView prescription={prescriptionData} />;
      case AppTab.SETTINGS:
        return <SettingsView onBack={() => navigateToTab(AppTab.ANALYZE, TransitionMode.TAB)} />;
      case AppTab.ANALYZE:
      default:
        return (
          <AnalyzeView 
            imageFiles={imageFiles}
            imageUrls={imageUrls}
            prescriptionData={prescriptionData}
            isLoading={isLoading}
            error={error}
            history={displayHistory}
            onAddImages={addImages}
            onRemoveImage={removeImage}
            onClearQueue={clear}
            onAnalyze={handleAnalyzeClick}
            onVerify={() => navigateToTab(AppTab.REVIEW, TransitionMode.DRILL)}
            onSelectHistory={(item) => { setPrescriptionData(item); navigateToTab(AppTab.REVIEW, TransitionMode.DRILL); }}
            onViewAll={() => navigateToTab(AppTab.REPORTS, TransitionMode.TAB)}
            triggerHaptic={triggerHaptic}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden">
      <div className="fixed top-6 left-0 right-0 z-[1000] flex flex-col items-center gap-3 pointer-events-none px-4">
          <AnimatePresence>
              {toasts.map(t => (
                  <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
              ))}
          </AnimatePresence>
      </div>
      <AnimatePresence>{showLoginModal && <LoginModal onLogin={handleLoginSuccess} onClose={() => setShowLoginModal(false)} />}</AnimatePresence>
      <AnimatePresence>{showOnboarding && <OnboardingOverlay onClose={() => setShowOnboarding(false)} />}</AnimatePresence>
      <AnimatePresence mode="wait">
        {appView === AppView.LANDING && (<m.div key="landing" exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full flex flex-col"><LandingView onStart={() => { triggerHaptic('medium'); navigateToView(AppView.ROLE_SELECTION); }} /></m.div>)}
        {appView === AppView.ROLE_SELECTION && (<m.div key="roles" exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full"><RoleSelectionView onSelectRole={handleRoleSelection} onBack={() => navigateToView(AppView.LANDING)} /></m.div>)}
        {appView === AppView.SERVICES && (<m.div key="services" exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full"><ServicesView onSelectService={(s) => { triggerHaptic('success'); if (s === 'rx') navigateToView(AppView.APP); else showToast('Module coming soon!', 'info'); }} onBack={() => handleRoleSelection(null)} /></m.div>)}
        {appView === AppView.APP && (
            <AppLayout 
              activeTab={activeTab} 
              setActiveTab={(t) => navigateToTab(t, TransitionMode.TAB)} 
              isLoggedIn={isLoggedIn} 
              isGuest={userRole === 'guest'}
              hasData={!!prescriptionData}
              user={user} 
              history={displayHistory} 
              showTreatments={showTreatments} 
              setShowTreatments={setShowTreatments} 
              isMenuOpen={isMenuOpen} 
              setIsMenuOpen={setIsMenuOpen} 
              setShowLoginModal={setShowLoginModal} 
              showToast={showToast} 
              onLogout={handleLogout} 
              onLogoClick={() => navigateToView(AppView.SERVICES)} 
              triggerHaptic={triggerHaptic}
            >
                <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-visible">
                    <AnimatePresence mode="wait">
                        <PageTransition key={activeTab} mode={transitionMode}>
                            {renderContent()}
                        </PageTransition>
                    </AnimatePresence>
                </m.div>
            </AppLayout>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
