
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ToastType } from '../App.tsx';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: ToastType;
}

const SuccessIcon = () => (
  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.1 }} d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'info' }) => {
  const isCritical = type === 'critical';

  useEffect(() => {
    if (!isCritical) {
        const timer = setTimeout(() => {
            onClose();
        }, type === 'warning' ? 6000 : 4000);
        return () => clearTimeout(timer);
    }
  }, [onClose, type, isCritical]);

  const getIcon = () => {
    switch (type) {
        case 'success': return <SuccessIcon />;
        case 'error': 
        case 'critical': return <ErrorIcon />;
        case 'warning': return <WarningIcon />;
        default: return <InfoIcon />;
    }
  };

  const colors = {
      success: 'bg-zinc-800/95 border-green-500/30',
      error: 'bg-zinc-800/95 border-red-500/30',
      critical: 'bg-red-900/95 border-red-400 shadow-red-500/20 ring-4 ring-red-500/20',
      warning: 'bg-zinc-800/95 border-amber-500/30',
      info: 'bg-zinc-800/95 border-blue-500/30'
  };

  return (
    <motion.div
        layout
        initial={{ y: -50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`pointer-events-auto flex items-start sm:items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border ${colors[type]} w-auto max-w-[90vw] sm:max-w-md relative`}
    >
        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 mt-0.5 sm:mt-0">
            {getIcon()}
        </div>
        <div className="flex-1 pr-6">
            {isCritical && <p className="text-[10px] font-black uppercase tracking-widest text-red-300 mb-0.5">Clinical Safety Error</p>}
            <p className={`text-sm font-medium pr-2 break-words leading-tight ${isCritical ? 'text-white' : 'text-white'}`}>
                {message}
            </p>
        </div>
        {isCritical && (
            <button onClick={onClose} className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        )}
    </motion.div>
  );
};
