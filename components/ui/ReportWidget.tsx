
import React from 'react';

interface ReportWidgetProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const ReportWidget: React.FC<ReportWidgetProps> = ({ title, icon, children, action, className }) => (
    <div className={`bg-core-bg-soft rounded-xl border border-core-border flex flex-col ${className}`}>
        <header className="p-4 border-b border-core-border flex items-center justify-between">
            <div className="flex items-center gap-3">
                {icon}
                <h3 className="text-lg font-bold text-core-text-primary">{title}</h3>
            </div>
            {action && <div>{action}</div>}
        </header>
        <div className="p-4 flex-grow relative min-h-[250px]">
            {children}
        </div>
    </div>
);
