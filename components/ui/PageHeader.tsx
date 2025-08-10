
import React from 'react';

interface PageHeaderProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions }) => {
    return (
        <header className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-core-accent-light text-core-accent rounded-xl">
                    {icon}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-core-text-primary">{title}</h2>
                    <p className="text-core-text-secondary mt-1">{description}</p>
                </div>
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </header>
    );
};
