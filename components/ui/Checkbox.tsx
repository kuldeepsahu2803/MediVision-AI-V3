import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, className }) => {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onChange(!checked);
            }}
            className={cn(
                "size-6 rounded-lg border-2 transition-all flex items-center justify-center",
                checked 
                    ? "bg-brand-blue border-brand-blue shadow-lg shadow-brand-blue/20" 
                    : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-white/10 hover:border-brand-blue/30",
                className
            )}
        >
            {checked && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                >
                    <Check className="size-4 text-white stroke-[3]" />
                </motion.div>
            )}
        </button>
    );
};
