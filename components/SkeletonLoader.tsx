import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = 'h-4 bg-slate-700/50 rounded' }) => {
  return <div className={`animate-pulse ${className}`}></div>;
};
