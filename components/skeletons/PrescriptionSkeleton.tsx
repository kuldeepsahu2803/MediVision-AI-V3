import React from 'react';
import { Skeleton } from '../ui/Skeleton.tsx';

export const PrescriptionSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Header Area */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="flex-grow pr-2">
        {/* Patient Info Grid - mimics the dl/div grid in ResultsDisplay */}
        <div className="grid grid-cols-[auto,1fr] gap-x-8 gap-y-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <React.Fragment key={i}>
                    <Skeleton className="h-4 w-24 self-center" />
                    <Skeleton className="h-4 w-full max-w-[200px] self-center ml-auto" />
                </React.Fragment>
            ))}
        </div>

        {/* Medication Table Header */}
        <div className="rounded-lg border border-light-border dark:border-dark-border overflow-hidden mb-6">
            <div className="bg-black/5 dark:bg-white/5 px-4 py-3 border-b border-light-border dark:border-dark-border flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
            </div>
            {/* Table Rows */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3 flex justify-between border-b border-light-border/50 dark:border-dark-border/50 last:border-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>

        {/* Notes Section */}
        <div className="pt-4 mt-4 border-t border-light-border/50 dark:border-dark-border/50 space-y-2">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
        </div>
      </div>

      {/* Buttons Footer */}
      <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Skeleton className="h-12 w-full sm:w-40 rounded-lg" />
      </div>
    </div>
  );
};