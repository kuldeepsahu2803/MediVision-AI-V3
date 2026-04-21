
import React, { useEffect } from 'react';
import { AnalyzeView, ReviewView, TreatmentsView, PrescriptionProvider, usePrescription } from '@/features/prescriptions';
import { LabsView, LabProvider, useLab } from '@/features/blood-tests';
import { ReportsView } from '@/components/ReportsView.tsx';
import { SettingsView } from '@/components/SettingsView.tsx';
import { HealthInsightsDashboard } from '@/components/HealthInsightsDashboard.tsx';
import { LoginModal } from '@/components/LoginModal.tsx';
import { Toast } from '@/components/Toast.tsx';
import { Spinner } from '@/components/Spinner.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition } from './components/ui/PageTransition.tsx';
import LandingView from './components/LandingView.tsx';
import { ServicesView } from './components/ServicesView.tsx';
import { RoleSelectionView } from './components/RoleSelectionView.tsx';

import { AppLayout } from './components/layout/AppLayout.tsx';
import { useAuthSession } from './hooks/useAuthSession.ts';
import { ClinicalIntelligenceProvider, useClinicalIntelligence } from '@/features/clinical-intelligence';
import { useHaptic } from './hooks/useHaptic.ts';
import { useAppWorkflow } from './hooks/useAppWorkflow.ts';
import { useNavigationState } from './hooks/useNavigationState.ts';
import { AppView, AppTab, TransitionMode } from './constants/navigation.ts';

type UserRole = 'guest' | 'professional' | null;

import { UIProvider, useUI } from './context/UIContext.tsx';

const AppContent: React.FC = () => {
  const { 
    userRole, setUserRole, isMenuOpen, setIsMenuOpen, showLoginModal, setShowLoginModal, 
    toasts, showToast, removeToast, showTreatments, setShowTreatments 
  } = useUI();

  const { appView, activeTab, transitionMode, selectedModule, setSelectedModule, navigateToTab, navigateToView } = useNavigationState();
  const { user, isLoggedIn, logout, loading: authLoading, cloudStatus } = useAuthSession();
  
  const { 
    history, 
    saveToHistory, 
    deleteFromHistory, 
    prescriptionData,
    setPrescriptionData,
    imageFiles,
    imageUrls,
    isLoading,
    error,
    addImages,
    removeImage,
    clear,
    analyze
  } = usePrescription();

  const { 
    labHistory, 
    saveLabToHistory, 
    deleteLabFromHistory, 
  } = useLab();

  const { triggerHaptic } = useHaptic();
  
  const { 
    insight, 
    isLoading: isInsightLoading, 
    triggerAnalysis, 
    dismissAlert 
  } = useClinicalIntelligence();

  const { handleSaveReview, handleVerify } = useAppWorkflow({
      user,
      analysisEngine: { imageFiles, imageUrls, prescriptionData, setPrescriptionData, isLoading, error, addImages, removeImage, clear, analyze },
      prescriptionHistory: { history, saveToHistory, deleteFromHistory },
      labHistory: { labHistory, saveLabToHistory, deleteLabFromHistory },
      triggerHaptic,
      navigateToTab,
      triggerClinicalAnalysis: triggerAnalysis
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
        if (isLoggedIn) {
            navigateToView(AppView.SERVICES);
        } else {
            setShowLoginModal(true);
        }
    }
  };
  
  const renderContent = () => {
    // Role-based view protection
    const isGuest = userRole === 'guest';
    
    if (isGuest) {
        const cloudTabs = [AppTab.DASHBOARD, AppTab.REVIEW, AppTab.TREATMENTS];
        if (cloudTabs.includes(activeTab)) {
            // Silently redirect to Analyze for Guests trying to access cloud tabs
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                    <div className="size-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                        <span className="material-symbols-outlined text-4xl">lock</span>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Professional Access Required</h3>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">
                            Real-time intelligence and verification reviews require a Professional account to ensure data integrity.
                        </p>
                    </div>
                    <button 
                        onClick={() => navigateToTab(AppTab.ANALYZE, TransitionMode.TAB)}
                        className="px-8 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        Return to Digitizer
                    </button>
                    <button 
                        onClick={() => setShowLoginModal(true)}
                        className="text-brand-blue font-black uppercase tracking-widest text-[10px] hover:underline"
                    >
                        Upgrade to Professional
                    </button>
                </div>
            );
        }
    }

    switch(activeTab) {
      case AppTab.REVIEW:
        return <ReviewView onSave={handleSaveReview} onVerify={handleVerify} />;
      case AppTab.LABS:
        return <LabsView />;
      case AppTab.DASHBOARD:
        return (
          <HealthInsightsDashboard 
            insight={insight} 
            onDismissAlert={dismissAlert} 
            onTriggerAnalysis={triggerAnalysis}
            isLoading={isInsightLoading}
          />
        );
      case AppTab.REPORTS:
        return (
          <ReportsView 
            onNavigateToAnalyze={() => navigateToTab(selectedModule === 'rx' ? AppTab.ANALYZE : AppTab.LABS, TransitionMode.TAB)}
            onNavigateToTab={navigateToTab}
          />
        );
      case AppTab.TREATMENTS:
        return <TreatmentsView />;
      case AppTab.SETTINGS:
        return <SettingsView onBack={() => navigateToTab(AppTab.ANALYZE, TransitionMode.TAB)} />;
      case AppTab.ANALYZE:
      default:
        return (
          <AnalyzeView 
            onVerify={() => navigateToTab(AppTab.REVIEW, TransitionMode.DRILL)}
            onViewAll={() => navigateToTab(AppTab.REPORTS, TransitionMode.TAB)}
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
            onClose={() => {
              setShowLoginModal(false);
              if (!isLoggedIn) setUserRole(null);
            }} 
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {authLoading ? (
            <motion.div key="loading" exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-white dark:bg-black z-[500]">
                <Spinner />
            </motion.div>
        ) : (
            <>
                {appView === AppView.LANDING && (
                    <motion.div 
                        key="landing" 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="w-full h-full flex flex-col"
                    >
                        <LandingView onStart={() => navigateToView(AppView.ROLE_SELECTION)} />
                    </motion.div>
                )}
                {appView === AppView.ROLE_SELECTION && (
                    <motion.div 
                        key="roles" 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="w-full h-full"
                    >
                        <RoleSelectionView onSelectRole={handleRoleSelection} onBack={() => navigateToView(AppView.LANDING)} />
                    </motion.div>
                )}
                {appView === AppView.SERVICES && (
                    <motion.div 
                        key="services" 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="w-full h-full"
                    >
                        <ServicesView 
                          onSelectService={(s) => { 
                            if (s === 'rx') {
                              setSelectedModule('rx');
                              navigateToView(AppView.APP);
                              navigateToTab(AppTab.ANALYZE, TransitionMode.TAB);
                            } else if (s === 'blood') {
                              setSelectedModule('blood');
                              navigateToView(AppView.APP);
                              navigateToTab(AppTab.LABS, TransitionMode.TAB);
                            } else {
                              showToast('Coming soon!', 'info');
                            }
                          }} 
                          onBack={() => navigateToView(AppView.ROLE_SELECTION)} 
                        />
                    </motion.div>
                )}
                {appView === AppView.APP && (
                    <motion.div
                        key="app-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full"
                    >
                        <AppLayout 
                          activeTab={activeTab} 
                          setActiveTab={(t) => navigateToTab(t, TransitionMode.TAB)} 
                          isLoggedIn={isLoggedIn} 
                          isGuest={userRole === 'guest'}
                          user={user} 
                          showTreatments={showTreatments} 
                          setShowTreatments={setShowTreatments} 
                          isMenuOpen={isMenuOpen} 
                          setIsMenuOpen={setIsMenuOpen} 
                          setShowLoginModal={setShowLoginModal} 
                          showToast={showToast} 
                          onLogout={handleLogout} 
                          onLogoClick={() => navigateToView(AppView.SERVICES)} 
                          triggerHaptic={triggerHaptic}
                          cloudStatus={cloudStatus}
                          selectedModule={selectedModule}
                        >
                            <div className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                                <AnimatePresence mode="wait">
                                    <PageTransition key={activeTab} mode={transitionMode}>
                                        {renderContent()}
                                    </PageTransition>
                                </AnimatePresence>
                            </div>
                        </AppLayout>
                    </motion.div>
                )}
            </>
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  const { error: authError } = useAuthSession();

  return (
    <UIProvider>
      <PrescriptionProvider>
        <LabProvider>
          <ClinicalIntelligenceProvider>
            <AppContentWrapper authError={authError} />
          </ClinicalIntelligenceProvider>
        </LabProvider>
      </PrescriptionProvider>
    </UIProvider>
  );
};

const AppContentWrapper: React.FC<{ authError: string | null }> = ({ authError }) => {
  const { showToast } = useUI();

  useEffect(() => {
    if (authError) {
      showToast(authError, 'error');
    }
  }, [authError, showToast]);

  return <AppContent />;
};

export default App;
