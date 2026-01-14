import React, { useState, useEffect, useCallback } from 'react';
import { AnalyzeView } from './components/AnalyzeView.tsx';
import { ReviewView } from './components/ReviewView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { TreatmentsView } from './components/TreatmentsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { Toast } from './components/Toast.tsx';
import { Spinner } from './components/Spinner.tsx';
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

const App: React.FC = () => {
  const { appView, activeTab, transitionMode, navigateToTab, navigateToView } = useNavigationState();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showTreatments, setShowTreatments] = useState(true);

  const { user, isLoggedIn, login, logout, loading: authLoading } = useAuthSession();
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

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    triggerHaptic('medium');
    showToast('You have been logged out.', 'info');
    navigateToView(AppView.LANDING);
    setUserRole(null);
  };

  const handleRoleSelection = (role: UserRole) => {
    triggerHaptic('light');
    setUserRole(role);
    if (role === 'guest') {
        navigateToView(AppView.SERVICES);
    } else if (role === 'professional') {
        if (isLoggedIn) navigateToView(AppView.SERVICES);
        else setShowLoginModal(true);
    }
  };
  
  const displayHistory = userRole === 'guest' ? (prescriptionData ? [prescriptionData] : []) : history;

  const renderContent = () => {
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
    <div className="app-root flex flex-col min-h-screen w-full bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden">
      <div className="fixed top-6 left-0 right-0 z-[1000] flex flex-col items-center gap-3 pointer-events-none px-4">
          <AnimatePresence>
              {toasts.map(t => (
                  <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
              ))}
          </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {showLoginModal && (
          <LoginModal 
            onLogin={() => {
              setShowLoginModal(false);
              setUserRole('professional');
              navigateToView(AppView.SERVICES);
            }} 
            onClose={() => setShowLoginModal(false)} 
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {authLoading ? (
            <motion.div key="loading" exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-white dark:bg-black z-[500]">
                <Spinner />
            </motion.div>
        ) : (
            <React.Fragment>
                {appView === AppView.LANDING && (<motion.div key="landing" exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full flex flex-col"><LandingView onStart={() => navigateToView(AppView.ROLE_SELECTION)} /></motion.div>)}
                {appView === AppView.ROLE_SELECTION && (<motion.div key="roles" exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full"><RoleSelectionView onSelectRole={handleRoleSelection} onBack={() => navigateToView(AppView.LANDING)} /></motion.div>)}
                {appView === AppView.SERVICES && (<motion.div key="services" exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full"><ServicesView onSelectService={(s) => { if (s === 'rx') navigateToView(AppView.APP); else showToast('Coming soon!', 'info'); }} onBack={() => navigateToView(AppView.ROLE_SELECTION)} /></motion.div>)}
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                            <AnimatePresence mode="wait">
                                <PageTransition key={activeTab} mode={transitionMode}>
                                    {renderContent()}
                                </PageTransition>
                            </AnimatePresence>
                        </motion.div>
                    </AppLayout>
                )}
            </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;