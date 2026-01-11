
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

const SuccessIcon = () => (
  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <motion.path 
      initial={{ pathLength: 0 }} 
      animate={{ pathLength: 1 }} 
      transition={{ duration: 0.3, delay: 0.1 }}
      d="M5 13l4 4L19 7" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <motion.path 
      initial={{ pathLength: 0 }} 
      animate={{ pathLength: 1 }} 
      transition={{ duration: 0.3 }}
      d="M6 18L18 6M6 6l12 12" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <motion.path 
      initial={{ pathLength: 0, opacity: 0 }} 
      animate={{ pathLength: 1, opacity: 1 }} 
      transition={{ duration: 0.3 }}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'info' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
        case 'success': return <SuccessIcon />;
        case 'error': return <ErrorIcon />;
        default: return <InfoIcon />;
    }
  };

  const colors = {
      success: 'bg-zinc-800/95 dark:bg-zinc-900/95 border-green-500/30',
      error: 'bg-zinc-800/95 dark:bg-zinc-900/95 border-red-500/30',
      info: 'bg-zinc-800/95 dark:bg-zinc-900/95 border-blue-500/30'
  };

  return createPortal(
    <div className="fixed top-6 left-0 right-0 z-[60] flex justify-center pointer-events-none px-4">
        <motion.div
        layout
        initial={{ y: -50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`pointer-events-auto flex items-start sm:items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border ${colors[type]} w-auto max-w-[90vw] sm:max-w-md`}
        >
        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 mt-0.5 sm:mt-0">
            {getIcon()}
        </div>
        <p className="text-sm font-medium text-white pr-2 break-words leading-tight">
            {message}
        </p>
        </motion.div>
    </div>,
    document.body
  );
};
