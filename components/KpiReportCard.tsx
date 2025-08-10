
import React from 'react';
import { KpiReportData } from '../types';
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from './Icons';

interface KpiReportCardProps {
    kpi: KpiReportData;
    isPrintVersion?: boolean;
}

export const KpiReportCard: React.FC<KpiReportCardProps> = ({ kpi, isPrintVersion = false }) => {
    const isLowerBetter = kpi.name.toLowerCase().includes('cancel');
    const performanceRatio = kpi.goal > 0 ? kpi.actual / kpi.goal : 0;
    const displayPercentage = isLowerBetter ? Math.max(0, 1 - performanceRatio) * 100 : performanceRatio * 100;

    let trendIcon: React.ReactNode;
    let trendColor = isPrintVersion ? 'text-slate-500' : 'text-core-text-secondary';

    if (kpi.actual > kpi.previousActual) {
        trendIcon = <TrendingUpIcon className="w-4 h-4" />;
        trendColor = isPrintVersion ? (isLowerBetter ? 'text-red-500' : 'text-green-500') : (isLowerBetter ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400');
    } else if (kpi.actual < kpi.previousActual) {
        trendIcon = <TrendingDownIcon className="w-4 h-4" />;
        trendColor = isPrintVersion ? (isLowerBetter ? 'text-green-500' : 'text-red-500') : (isLowerBetter ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400');
    } else {
        trendIcon = <MinusIcon className="w-4 h-4" />;
    }

    let performanceBarColor = isPrintVersion ? 'bg-red-300' : 'bg-red-500';
    if (displayPercentage >= 100) performanceBarColor = isPrintVersion ? 'bg-green-400' : 'bg-green-500';
    else if (displayPercentage >= 70) performanceBarColor = isPrintVersion ? 'bg-yellow-400' : 'bg-yellow-500';
    
    const cardBg = isPrintVersion ? 'bg-white border-slate-200' : 'bg-core-bg border-core-border';

    return (
        <div className={`flex items-center p-3 rounded-lg border ${cardBg} overflow-hidden`}>
            <div className={`w-1.5 h-12 mr-3 rounded-full ${performanceBarColor}`}></div>
            <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isPrintVersion ? 'text-slate-800' : 'text-core-text-primary'}`}>{kpi.name}</p>
                <p className={`text-xs truncate ${isPrintVersion ? 'text-slate-500' : 'text-core-text-secondary'}`}>
                    {kpi.teamMemberName}
                </p>
            </div>
            <div className="flex items-center gap-4 ml-4">
                <div className="text-right">
                    <p className={`font-bold text-lg ${isPrintVersion ? 'text-slate-800' : 'text-core-text-primary'}`}>{kpi.actual}{kpi.type === 'percentage' && '%'}</p>
                    <p className={`text-xs ${isPrintVersion ? 'text-slate-500' : 'text-core-text-secondary'}`}>
                        Target: {kpi.goal}{kpi.type === 'percentage' && '%'}
                    </p>
                </div>
                <div className={`flex flex-col items-center flex-shrink-0 w-16 ${trendColor}`}>
                    {trendIcon}
                    <span className="text-xs text-center">vs last week</span>
                </div>
            </div>
        </div>
    );
};
