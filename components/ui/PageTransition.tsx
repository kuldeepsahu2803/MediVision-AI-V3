
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { TransitionMode } from '../../constants/navigation.ts';

interface PageTransitionProps {
  children: React.ReactNode;
  mode?: TransitionMode;
}

const variants: Variants = {
  initial: (mode: TransitionMode) => {
    if (mode === TransitionMode.TAB) {
      return { opacity: 0, scale: 0.98 };
    }
    return { x: 20, opacity: 0 };
  },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 1
    }
  },
  exit: (mode: TransitionMode) => {
    if (mode === TransitionMode.TAB) {
      return { opacity: 0, transition: { duration: 0.15 } };
    }
    return { 
      x: -20, 
      opacity: 0,
      transition: { duration: 0.2 } 
    };
  }
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, mode = TransitionMode.TAB }) => {
  return (
    <motion.div
      custom={mode}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};
