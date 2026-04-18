
import React from 'react';
import { motion } from 'framer-motion';
import { Filter, Search, X, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface ArchiveFilterBarProps {
  options: FilterOption[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

export const ArchiveFilterBar: React.FC<ArchiveFilterBarProps> = ({
  options,
  activeFilter,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  searchQuery,
  onSearchChange,
  className
}) => {
  const dateRanges = [
    { id: 'all', label: 'All Time' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'This Quarter' },
  ];

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="relative group flex-1">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-brand-green/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
          <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-full px-6 py-4 shadow-sm group-focus-within:border-brand-blue/50 transition-all">
            <Search className="size-5 text-slate-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search by patient name, ID, or medication..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 w-full font-bold text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="size-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 shrink-0">
             <Calendar className="size-4" />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none">Date Range</span>
          </div>
          <div className="flex p-1 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
            {dateRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => onDateRangeChange(range.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  dateRange === range.id 
                    ? "bg-white dark:bg-zinc-800 text-brand-blue shadow-sm ring-1 ring-slate-200 dark:ring-white/10" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 shrink-0">
          <Filter className="size-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Filter By Status</span>
        </div>
        
        {options.map((option) => (
          <motion.button
            key={option.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(option.id)}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 flex items-center gap-2",
              activeFilter === option.id
                ? "bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20"
                : "bg-white dark:bg-zinc-900 text-slate-500 border-slate-200 dark:border-white/10 hover:border-brand-blue/30"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[8px] font-black",
                activeFilter === option.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400"
              )}>
                {option.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
