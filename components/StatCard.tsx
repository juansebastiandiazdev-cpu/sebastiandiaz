
import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value, onClick, className }) => {
  const baseClasses = `relative group p-5 rounded-xl flex items-center border bg-core-bg-soft border-core-border transition-all duration-300 overflow-hidden`;

  const IconWrapper = () => (
    <div className="relative z-10 p-3 rounded-lg bg-core-bg mr-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
    </div>
  );

  const Content = () => (
     <div className="relative z-10">
        <p className="text-sm text-core-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-core-text-primary truncate">{value}</p>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClasses} text-left w-full hover:border-core-accent hover:shadow-xl hover:shadow-core-accent/10`}>
        <IconWrapper />
        <Content />
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
       <IconWrapper />
       <Content />
    </div>
  );
};
