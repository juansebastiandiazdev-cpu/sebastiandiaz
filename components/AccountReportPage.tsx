
import React, { useState, useEffect } from 'react';
import { Client, KpiReportData, TeamMember, Task, TaskStatus, WeeklyPerformanceSnapshot, KpiGroup, KpiProgress } from '../types';
import { SolvoLogoIcon, SparklesIcon, TargetIcon, ListIcon, BarChartIcon, UsersIcon, LoaderIcon } from './Icons';
import { KpiReportCard } from './KpiReportCard';
import { DonutChart } from './DonutChart';
import { api } from '../services/api';

interface AccountReportPageProps {
    clients: Client[];
    tasks: Task[];
    teamMembers: TeamMember[];
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    isPrintVersion?: boolean;
}

const getStartOfWeekISO = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

const getStatusStyles = (status: string, isPrintVersion: boolean) => {
    switch(status) {
        case 'Healthy': return isPrintVersion ? 'bg-green-100 text-green-800' : 'bg-green-900/50 text-green-300';
        case 'At-Risk': return isPrintVersion ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-900/50 text-yellow-300';
        case 'Critical': return isPrintVersion ? 'bg-red-100 text-red-800' : 'bg-red-900/50 text-red-300';
        default: return isPrintVersion ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-gray-300';
    }
}

const TeamAvatarList: React.FC<{ members: TeamMember[], isPrintVersion: boolean }> = ({ members, isPrintVersion }) => (
    <div className="space-y-3">
        {members.map(member => (
            <div key={member.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isPrintVersion ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500 text-white'}`}>{member.avatarInitials}</div>
                <div>
                    <p className={`font-semibold text-sm ${isPrintVersion ? 'text-slate-800' : 'text-slate-200'}`}>{member.name}</p>
                    <p className={`text-xs ${isPrintVersion ? 'text-slate-600' : 'text-slate-400'}`}>{member.role}</p>
                </div>
            </div>
        ))}
    </div>
);

const TaskSnapshotWidget: React.FC<{ tasks: Task[], isPrintVersion: boolean }> = ({ tasks, isPrintVersion }) => {
    const openTasks = tasks.filter(t => t.status !== TaskStatus.Completed).length;
    const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== TaskStatus.Completed).length;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className={isPrintVersion ? 'text-slate-600' : 'text-slate-400'}>Open Tasks</span>
                <span className="font-bold text-lg">{openTasks}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className={isPrintVersion ? 'text-slate-600' : 'text-slate-400'}>Overdue Tasks</span>
                <span className={`font-bold text-lg ${overdueTasks > 0 ? (isPrintVersion ? 'text-red-600' : 'text-red-400') : ''}`}>{overdueTasks}</span>
            </div>
        </div>
    );
};

const ReportSection: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode, isPrintVersion: boolean, className?: string}> = ({ title, icon, children, isPrintVersion, className }) => (
    <div className={className}>
        <h2 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-3 ${isPrintVersion ? 'text-slate-600' : 'text-slate-400'}`}>
            {icon} {title}
        </h2>
        <div className={`rounded-lg border p-4 ${isPrintVersion ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700'}`}>
            {children}
        </div>
    </div>
);


const AIActionItems: React.FC<{ client: Client, tasks: Task[], isPrintVersion: boolean }> = ({ client, tasks, isPrintVersion }) => {
    const [actions, setActions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActions = async () => {
            setIsLoading(true);
            try {
                const clientContext = {
                    name: client.name,
                    status: client.status,
                    notes: client.notes,
                    openTasks: tasks.filter(t => t.status !== TaskStatus.Completed).map(t => ({ title: t.title, priority: t.priority, status: t.status }))
                };
                const data = await api.generateReportActionItems(clientContext);
                setActions(data.actions || []);
            } catch (error) {
                console.error("Failed to fetch AI actions:", error);
                setActions(["Could not generate AI recommendations."]);
            } finally {
                setIsLoading(false);
            }
        };

        if (isPrintVersion) {
            fetchActions();
        }
    }, [client, tasks, isPrintVersion]);
    
    if (!isPrintVersion) return null;

    if (isLoading) {
         return (
             <ReportSection title="Strategic Recommendations" icon={<SparklesIcon />} isPrintVersion={isPrintVersion}>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                    <span>AI is analyzing data to generate recommendations...</span>
                </div>
            </ReportSection>
        );
    }

    if (actions.length === 0) {
        return null;
    }

    return (
        <ReportSection title="Strategic Recommendations" icon={<SparklesIcon />} isPrintVersion={isPrintVersion}>
            <div className="space-y-2 text-sm text-indigo-700">
                {actions.map((action, index) => (
                    <p key={index} className="flex items-start gap-2 leading-relaxed">
                         <SparklesIcon className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                        <span>{action}</span>
                    </p>
                ))}
            </div>
        </ReportSection>
    )
}

export const AccountReportPage: React.FC<AccountReportPageProps> = ({ clients, teamMembers, kpiGroups, kpiProgress, weeklySnapshots, tasks, isPrintVersion = false }) => {
    const lastWeekStart = getStartOfWeekISO(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const lastWeekSnapshots = weeklySnapshots.filter(s => s.weekOf === lastWeekStart);

    return (
        <div className={isPrintVersion ? 'bg-white text-black font-sans' : 'bg-slate-900 text-white'}>
            {clients.map((client, index) => {
                const { reportData, overallScore } = (() => {
                    let totalScore = 0;
                    let kpiCount = 0;
                    
                    const data: KpiReportData[] = client.assignedTeamMembers.flatMap(memberId => {
                        const member = teamMembers.find(m => m.id === memberId);
                        if (!member || !member.kpiGroupId) return [];
                        const group = kpiGroups.find(g => g.id === member.kpiGroupId);
                        if (!group) return [];
                        const lastWeekMemberSnapshot = lastWeekSnapshots.find(s => s.teamMemberId === member.id);
                        return group.kpis.map(kpiDef => {
                            const progress = kpiProgress.find(p => p.teamMemberId === member.id && p.kpiDefinitionId === kpiDef.id);
                            const actual = progress?.actual || 0;
                            const goal = kpiDef.goal;
                            const previousActual = lastWeekMemberSnapshot?.kpiSnapshots?.find(k => k.name === kpiDef.name)?.actual ?? 0;
                            if(goal > 0) {
                                const isLowerBetter = kpiDef.name.toLowerCase().includes('cancel');
                                let achievementRatio = isLowerBetter ? Math.max(0, 1 - (actual / goal)) : actual / goal;
                                totalScore += Math.min(achievementRatio, 1.5);
                                kpiCount++;
                            }
                            return { name: kpiDef.name, actual, goal, type: kpiDef.type, previousActual, teamMemberName: member.name };
                        });
                    }).filter((item): item is KpiReportData => !!item);
                    
                    const score = kpiCount > 0 ? Math.round((totalScore / kpiCount) * 100) : 0;
                    return { reportData: data, overallScore: score };
                })();

                const assignedMembers = teamMembers.filter(m => client.assignedTeamMembers.includes(m.id));
                const clientTasks = tasks.filter(t => t.clientId === client.id);
                const scoreColor = overallScore >= 90 ? '#22c55e' : overallScore >= 70 ? '#facc15' : '#ef4444';

                return (
                    <div key={client.id} className={`print-page ${index < clients.length - 1 ? 'multipage' : ''} p-10`} style={{width: '210mm', minHeight: '297mm', display: 'flex', flexDirection: 'column'}}>
                        <header className="flex justify-between items-center pb-4 border-b" style={{borderColor: isPrintVersion ? '#e2e8f0' : '#334155'}}>
                            <div className="flex items-center gap-4">
                                <SolvoLogoIcon className={`w-10 h-10 ${isPrintVersion ? 'text-indigo-600' : 'text-indigo-500'}`} />
                                <h1 className={`text-3xl font-bold ${isPrintVersion ? 'text-slate-900' : 'text-white'}`}>{client.name}</h1>
                                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusStyles(client.status, isPrintVersion)}`}>
                                    {client.status}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                <p className="text-sm text-slate-500">Weekly Performance Report</p>
                            </div>
                        </header>

                        <main className="flex-grow my-8 grid grid-cols-3 gap-8">
                            <div className="col-span-2 space-y-6">
                                {(client.dashboardConfig?.healthSummary || (isPrintVersion && client.aiHealthSummary?.summary)) && (
                                     <ReportSection title="AI-Powered Summary" icon={<SparklesIcon className="w-5 h-5"/>} isPrintVersion={isPrintVersion}>
                                        <p className={`text-sm leading-relaxed mb-4 ${isPrintVersion ? 'text-slate-700' : 'text-slate-300'}`}>{client.dashboardConfig?.healthSummary || client.aiHealthSummary?.summary}</p>
                                        {client.dashboardConfig?.highlights && client.dashboardConfig.highlights.length > 0 && (
                                            <div className="space-y-2 mt-4 pt-4 border-t" style={{borderColor: isPrintVersion ? '#e2e8f0' : '#475569'}}>
                                                <h4 className={`font-semibold text-sm ${isPrintVersion ? 'text-slate-800' : 'text-white'}`}>Key Highlights:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    {client.dashboardConfig.highlights.map((h, i) => <li key={i}>{h}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </ReportSection>
                                )}
                                <AIActionItems client={client} tasks={clientTasks} isPrintVersion={isPrintVersion} />
                                <ReportSection title="KPI Details" icon={<TargetIcon className="w-5 h-5"/>} isPrintVersion={isPrintVersion}>
                                    <div className="space-y-3">
                                        {reportData.length > 0 ? reportData.map(kpi => (
                                            <KpiReportCard key={`${kpi.name}-${kpi.teamMemberName}`} kpi={kpi} isPrintVersion={isPrintVersion} />
                                        )) : (
                                            <p className={`text-center py-4 ${isPrintVersion ? 'text-slate-500' : 'text-slate-400'}`}>No KPIs are tracked for this report.</p>
                                        )}
                                    </div>
                                </ReportSection>
                            </div>

                            <div className="col-span-1 space-y-6">
                                <ReportSection title="Overall Performance" icon={<BarChartIcon className="w-5 h-5"/>} isPrintVersion={isPrintVersion}>
                                    <div className="flex flex-col items-center">
                                        <DonutChart size={140} strokeWidth={14} data={[{value: overallScore, color: scoreColor}, {value: Math.max(0, 100-overallScore), color: isPrintVersion ? '#e2e8f0' : '#334155'}]}
                                            centerText={<span className="text-5xl font-bold" style={{color: scoreColor}}>{overallScore}</span>}
                                        />
                                        <p className={`text-center mt-2 text-sm ${isPrintVersion ? 'text-slate-600' : 'text-slate-400'}`}>Performance Score</p>
                                    </div>
                                </ReportSection>
                                <ReportSection title="Assigned Team" icon={<UsersIcon className="w-5 h-5"/>} isPrintVersion={isPrintVersion}>
                                    <TeamAvatarList members={assignedMembers} isPrintVersion={isPrintVersion} />
                                </ReportSection>
                                <ReportSection title="Task Snapshot" icon={<ListIcon className="w-5 h-5"/>} isPrintVersion={isPrintVersion}>
                                     <TaskSnapshotWidget tasks={clientTasks} isPrintVersion={isPrintVersion} />
                                </ReportSection>
                            </div>
                        </main>

                        <footer className="text-center text-xs text-slate-500 pt-4 border-t" style={{borderColor: isPrintVersion ? '#e2e8f0' : '#334155'}}>
                            Solvo Core | Confidential Report Generated on {new Date().toLocaleDateString()}
                        </footer>
                    </div>
                );
            })}
        </div>
    );
};
