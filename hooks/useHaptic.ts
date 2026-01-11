
import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useHaptic = () => {
  const triggerHaptic = useCallback((type: HapticType) => {
    // Check for support
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    try {
      switch (type) {
        case 'light':
          // Subtle tick for UI interactions (tabs, toggles)
          navigator.vibrate(10); 
          break;
        case 'medium':
          // Standard button press feel
          navigator.vibrate(20); 
          break;
        case 'heavy':
          // Impact or delete action
          navigator.vibrate(40); 
          break;
        case 'success':
          // Distinct double-tap (Da-da)
          navigator.vibrate([10, 50, 10]); 
          break;
        case 'warning':
          // Slower pulse
          navigator.vibrate([30, 50, 10]); 
          break;
        case 'error':
          // Rough buzz (Buzz-buzz-buzz)
          navigator.vibrate([50, 50, 50, 50, 50]); 
          break;
      }
    } catch (e) {
      // Ignore errors on unsupported devices
    }
  }, []);

  return { triggerHaptic };
};
