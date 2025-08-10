import React from 'react';
import { AIInsight } from '../types';
import { SparklesIcon, AlertTriangleIcon, LightbulbIcon, InfoIcon } from './Icons';
import { SkeletonLoader } from './SkeletonLoader';

interface AIInsightsWidgetProps {
    insights: AIInsight[];
    isLoading: boolean;
}

const insightStyles: Record<'risk' | 'opportunity' | 'info', { icon: React.ReactNode; container: string; iconColor: string; button: string; }> = {
    risk: { 
        icon: <AlertTriangleIcon className="w-5 h-5" />, 
        container: 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-200',
        iconColor: 'text-red-500 dark:text-red-400',
        button: 'bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 dark:hover:text-red-200'
    },
    opportunity: { 
        icon: <LightbulbIcon className="w-5 h-5" />, 
        container: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-800 dark:text-yellow-200',
        iconColor: 'text-yellow-500 dark:text-yellow-400',
        button: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 dark:hover:text-yellow-200'
    },
    info: { 
        icon: <InfoIcon className="w-5 h-5" />, 
        container: 'bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-200',
        iconColor: 'text-blue-500 dark:text-blue-400',
        button: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 dark:hover:text-blue-200'
    },
};

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ insights, isLoading }) => {
    
    if (isLoading && insights.length === 0) {
        return (
             <div className="bg-core-bg-soft p-4 rounded-xl border border-core-border">
                 <SkeletonLoader className="h-6 w-1/3 mb-4 rounded-lg bg-core-border" />
                 <div className="space-y-3">
                    <SkeletonLoader className="h-4 w-full rounded bg-core-border" />
                    <SkeletonLoader className="h-4 w-3/4 rounded bg-core-border" />
                 </div>
             </div>
        )
    }

    if(insights.length === 0) return null;

    return (
        <div className="bg-core-bg-soft p-4 rounded-xl border border-core-border">
            <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 bg-core-accent-light text-core-accent rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-core-text-primary text-lg">AI Command Center</h3>
            </div>
            
            <div className="space-y-3">
                {insights.map(insight => {
                    const style = insightStyles[insight.type] || insightStyles.info;
                    return (
                        <div key={insight.id} className={`p-3 rounded-lg flex justify-between items-center border ${style.container}`}>
                            <div className="flex items-center gap-3">
                                <div className={style.iconColor}>{style.icon}</div>
                                <p className="text-sm text-current">{insight.text}</p>
                            </div>
                            {insight.action && (
                                <button 
                                    onClick={insight.action.handler}
                                    className={`ml-4 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${style.button}`}
                                >
                                    {insight.action.label}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};