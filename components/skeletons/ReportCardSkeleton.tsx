import React from 'react';
import { Skeleton } from '../ui/Skeleton.tsx';

export const ReportCardSkeleton: React.FC = () => {
  return (
    <div className="bg-light-panel dark:bg-dark-panel backdrop-blur-lg rounded-xl border border-light-border dark:border-dark-border p-5 flex flex-col space-y-3">
        {/* Header: Name and Date */}
        <div className="flex justify-between items-start">
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Summary Content */}
        <div className="flex-grow min-h-[50px] space-y-2 pt-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-light-border/50 dark:border-dark-border/50">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
        </div>
    </div>
  );
};