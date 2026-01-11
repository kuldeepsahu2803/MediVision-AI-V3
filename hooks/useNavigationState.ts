
import { useState } from 'react';
import { AppView, AppTab, TransitionMode } from '../constants/navigation.ts';

export const useNavigationState = () => {
  const [appView, setAppView] = useState<AppView>(AppView.LANDING);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ANALYZE);
  const [transitionMode, setTransitionMode] = useState<TransitionMode>(TransitionMode.TAB);

  const navigateToTab = (tab: AppTab, mode: TransitionMode = TransitionMode.TAB) => {
    if (tab !== activeTab) {
        setTransitionMode(mode);
        setActiveTab(tab);
    }
  };

  const navigateToView = (view: AppView) => {
      setAppView(view);
  };

  return {
    appView,
    activeTab,
    transitionMode,
    navigateToTab,
    navigateToView,
    setAppView // Exposed for cases where simple state setting is preferred
  };
};
