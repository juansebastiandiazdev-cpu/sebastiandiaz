
import React from 'react';
import { Client, KpiGroup, KpiProgress, TeamMember } from '../types';
import { SolvoLogoIcon, BarChartIcon, CheckCircleIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from './Icons';
import { timeAgo } from './utils/time';

interface PublicDashboardProps {
    client: Client | null;
    teamMembers: TeamMember[];
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
}

const KpiDisplayCard: React.FC<{
    link: { teamMemberId: string; kpiDefinitionId: string; };
    teamMembers: TeamMember[];
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
}> = ({ link, teamMembers, kpiGroups, kpiProgress }) => {
    
    const member = teamMembers.find(m => m.id === link.teamMemberId);
    const group = member ? kpiGroups.find(g => g.id === member.kpiGroupId) : null;
    const kpiDef = group ? group.kpis.find(k => k.id === link.kpiDefinitionId) : null;
    const progress = kpiDef ? kpiProgress.find(p => p.teamMemberId === member!.id && p.kpiDefinitionId === kpiDef.id) : null;
    
    if (!kpiDef || !progress || !member) return null;

    const { goal, name, type } = kpiDef;
    const { actual } = progress;
    
    const lowerIsBetter = kpiDef.name.toLowerCase().includes('cancel');
    let percentage = goal > 0 ? (actual / goal) * 100 : 0;
    if (lowerIsBetter) {
        percentage = Math.max(0, 1 - (actual / goal)) * 100;
    }
    const isComplete = percentage >= 100;

    let colorClass = 'text-red-500 dark:text-red-400';
    let icon = <TrendingDownIcon className="w-5 h-5" />;

    if(isComplete) {
        colorClass = 'text-green-500 dark:text-green-400';
        icon = <CheckCircleIcon className="w-5 h-5" />;
    } else if (percentage >= 70) {
        colorClass = 'text-yellow-500 dark:text-yellow-400';
        icon = <TrendingUpIcon className="w-5 h-5" />;
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 dark:text-white">{name}</h3>
                <div className={colorClass}>{icon}</div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Tracked for: {member.name}</p>
            <div className="flex items-baseline space-x-2">
                <p className={`text-4xl font-bold ${colorClass}`}>{actual}{type==='percentage' && '%'}</p>
                <p className="text-slate-500 dark:text-slate-400">/ {goal}{type==='percentage' && '%'} (target)</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                <div className={`${colorClass.replace('text-','bg-')} h-2 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
        </div>
    );
}

export const PublicDashboard: React.FC<PublicDashboardProps> = ({ client, teamMembers, kpiGroups, kpiProgress }) => {
    if (!client || !client.dashboardConfig) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white p-4">
                <div className="text-center">
                    <SolvoLogoIcon className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Dashboard Not Found</h1>
                    <p className="text-slate-500 dark:text-slate-400">The requested dashboard could not be found or has not been generated yet.</p>
                </div>
            </div>
        );
    }

    const { kpiSummary, updatedAt, highlights } = client.dashboardConfig;
    const kpiLinks = client.trackedKpis || [];

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans text-slate-700 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center mb-4 sm:mb-0">
                        <SolvoLogoIcon className="w-10 h-10 text-indigo-500 mr-4"/>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{client.name}</h1>
                            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <BarChartIcon className="w-4 h-4"/>
                                Performance Dashboard
                            </p>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-500 text-left sm:text-right">
                        Last updated: {timeAgo(updatedAt)}
                    </div>
                </header>

                {kpiSummary && (
                    <div className="mb-8 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Performance Summary</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{kpiSummary}</p>
                    </div>
                )}
                
                {highlights && highlights.length > 0 && (
                     <div className="mb-8 p-5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-500/30">
                        <h2 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">Key Highlights</h2>
                        <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-200">
                           {highlights.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kpiLinks.map(link => (
                         <KpiDisplayCard 
                            key={`${link.teamMemberId}-${link.kpiDefinitionId}`} 
                            link={link}
                            teamMembers={teamMembers}
                            kpiGroups={kpiGroups}
                            kpiProgress={kpiProgress}
                        />
                    ))}
                </div>

                {kpiLinks.length === 0 && (
                     <div className="text-center py-16 text-slate-500 dark:text-slate-500">
                        <BarChartIcon className="w-16 h-16 mx-auto mb-4" />
                        <p>No KPIs have been selected for this dashboard.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
