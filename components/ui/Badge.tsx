
import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
  animate?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  size = 'sm', 
  className = '', 
  icon,
  animate = false
}) => {
  const variants = {
    primary: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
    secondary: 'bg-brand-navy/10 text-brand-navy border-brand-navy/20 dark:bg-white/10 dark:text-white dark:border-white/20',
    success: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    info: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
    outline: 'bg-transparent text-slate-600 border-slate-200 dark:text-slate-400 dark:border-white/10',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[9px]',
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
  };

  const Component = animate ? motion.span : 'span';
  const animationProps = animate ? {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      {...animationProps}
      className={`
        inline-flex items-center gap-1.5 font-black uppercase tracking-widest border rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </Component>
  );
};
