
import React from 'react';
import { Client, Task, TaskStatus, TeamMember, KpiReportData, KpiGroup, KpiProgress, WeeklyPerformanceSnapshot } from '../types';
import { DonutChart } from './DonutChart';
import { KpiReportCard } from './KpiReportCard';
import { ReportWidget } from './ui/ReportWidget';
import { SparklesIcon, TargetIcon, ListIcon, BarChartIcon, UsersIcon } from './Icons';
import { getStartOfWeekISO } from './utils/time';

interface InteractiveClientReportProps {
    client: Client;
    tasks: Task[];
    teamMembers: TeamMember[];
    kpiProgress: KpiProgress[];
    kpiGroups: KpiGroup[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
}

const TeamAvatarList: React.FC<{ members: TeamMember[] }> = ({ members }) => (
    <div className="space-y-3">
        {members.map(member => (
            <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-core-accent flex items-center justify-center font-bold text-sm text-core-accent-foreground">{member.avatarInitials}</div>
                <div>
                    <p className="font-semibold text-sm text-core-text-primary">{member.name}</p>
                    <p className="text-xs text-core-text-secondary">{member.role}</p>
                </div>
            </div>
        ))}
    </div>
);

const TaskSnapshotWidget: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const openTasks = tasks.filter(t => t.status !== TaskStatus.Completed).length;
    const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== TaskStatus.Completed).length;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="text-core-text-secondary">Open Tasks</span>
                <span className="font-bold text-lg text-core-text-primary">{openTasks}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-core-text-secondary">Overdue Tasks</span>
                <span className={`font-bold text-lg ${overdueTasks > 0 ? 'text-red-500' : 'text-core-text-primary'}`}>{overdueTasks}</span>
            </div>
        </div>
    );
};

export const InteractiveClientReport: React.FC<InteractiveClientReportProps> = ({ client, tasks, teamMembers, kpiProgress, kpiGroups, weeklySnapshots }) => {

    const lastWeekStart = getStartOfWeekISO(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const lastWeekSnapshots = weeklySnapshots.filter(s => s.weekOf === lastWeekStart);

    const { reportData, overallScore } = React.useMemo(() => {
        let totalScore = 0;
        let kpiCount = 0;
        
        const data: KpiReportData[] = (client.trackedKpis || []).map(tracked => {
            const member = teamMembers.find(m => m.id === tracked.teamMemberId);
            if (!member || !member.kpiGroupId) return null;
            const group = kpiGroups.find(g => g.id === member.kpiGroupId);
            if (!group) return null;
            const kpiDef = group.kpis.find(k => k.id === tracked.kpiDefinitionId);
            if (!kpiDef) return null;

            const lastWeekMemberSnapshot = lastWeekSnapshots.find(s => s.teamMemberId === member.id);
            
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
        }).filter((item): item is KpiReportData => !!item);
        
        const score = kpiCount > 0 ? Math.round((totalScore / kpiCount) * 100) : 0;
        return { reportData: data, overallScore: score };
    }, [client.trackedKpis, teamMembers, kpiGroups, kpiProgress, lastWeekSnapshots]);

    const assignedMembers = teamMembers.filter(m => client.assignedTeamMembers.includes(m.id));
    const clientTasks = tasks.filter(t => t.clientId === client.id);
    const scoreColor = overallScore >= 90 ? '#22c55e' : overallScore >= 70 ? '#facc15' : '#ef4444';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <ReportWidget title="AI-Powered Summary" icon={<SparklesIcon className="w-5 h-5 text-purple-400"/>}>
                    <p className="text-sm leading-relaxed mb-4 text-core-text-secondary">{client.dashboardConfig?.healthSummary}</p>
                    {client.dashboardConfig?.highlights && client.dashboardConfig.highlights.length > 0 && (
                        <div className="space-y-2 mt-4 pt-4 border-t border-core-border">
                            <h4 className="font-semibold text-sm text-core-text-primary">Key Highlights:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-core-text-secondary">
                                {client.dashboardConfig.highlights.map((h, i) => <li key={i}>{h}</li>)}
                            </ul>
                        </div>
                    )}
                </ReportWidget>
                <ReportWidget title="Tracked KPIs" icon={<TargetIcon className="w-5 h-5 text-blue-400"/>}>
                    <div className="space-y-3">
                        {reportData.length > 0 ? reportData.map(kpi => (
                            <KpiReportCard key={`${kpi.name}-${kpi.teamMemberName}`} kpi={kpi} />
                        )) : (
                            <p className="text-center py-4 text-core-text-secondary text-sm">No KPIs are tracked for this report. Use "Manage KPIs" to add some.</p>
                        )}
                    </div>
                </ReportWidget>
            </div>
            <div className="col-span-1 space-y-6">
                 <ReportWidget title="Overall Performance" icon={<BarChartIcon className="w-5 h-5 text-green-400"/>}>
                    <div className="flex flex-col items-center">
                        <DonutChart 
                            size={140} 
                            strokeWidth={14} 
                            data={[{value: overallScore, color: scoreColor}]} 
                            totalValue={100}
                            centerText={<span className="text-5xl font-bold text-core-text-primary">{overallScore}</span>}
                        />
                        <p className="text-center mt-2 text-sm text-core-text-secondary">Performance Score</p>
                    </div>
                </ReportWidget>
                <ReportWidget title="Assigned Team" icon={<UsersIcon className="w-5 h-5 text-orange-400"/>}>
                    <TeamAvatarList members={assignedMembers} />
                </ReportWidget>
                <ReportWidget title="Task Snapshot" icon={<ListIcon className="w-5 h-5 text-red-400"/>}>
                     <TaskSnapshotWidget tasks={clientTasks} />
                </ReportWidget>
            </div>
        </div>
    );
};
