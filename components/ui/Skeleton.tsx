import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div 
      className={`animate-pulse bg-black/10 dark:bg-white/10 rounded ${className}`} 
      style={style}
    />
  );
};