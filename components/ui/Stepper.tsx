
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './Badge.tsx';

interface Step {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

interface StepperProps {
  steps: Step[];
  currentStepIndex: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStepIndex }) => {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex || step.status === 'completed';
        const isPending = index > currentStepIndex && step.status === 'pending';
        const isLoading = step.status === 'loading' || (isActive && step.status !== 'completed' && step.status !== 'error');

        return (
          <div key={step.id} className="relative flex gap-4">
            {/* Connector Line */}
            {index !== steps.length - 1 && (
              <div 
                className={`absolute left-4 top-10 bottom-0 w-0.5 -translate-x-1/2 transition-colors duration-500 ${isCompleted ? 'bg-brand-green' : 'bg-slate-200 dark:bg-white/10'}`} 
              />
            )}

            {/* Step Icon */}
            <div className="relative z-10">
              <motion.div 
                initial={false}
                animate={{ 
                  backgroundColor: isCompleted ? '#3DA35D' : (isLoading ? '#007ACC' : 'transparent'),
                  borderColor: isCompleted ? '#3DA35D' : (isLoading ? '#007ACC' : '#E2E8F0'),
                  scale: isActive ? 1.1 : 1
                }}
                className={`size-8 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${isPending ? 'dark:border-white/10' : ''}`}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.span 
                      key="check" 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="material-symbols-outlined text-white text-[18px]"
                    >
                      check
                    </motion.span>
                  ) : isLoading ? (
                    <motion.div 
                      key="loader"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="size-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <span className="text-[10px] font-black text-slate-400">{index + 1}</span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Step Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-black uppercase tracking-widest transition-colors duration-500 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                  {step.label}
                </h4>
                {isActive && (
                  <Badge variant="primary" size="xs" animate>Processing</Badge>
                )}
              </div>
              {step.description && (
                <p className={`text-[10px] font-medium mt-1 transition-colors duration-500 ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400/50'}`}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
