

import React, { useMemo, useState, useEffect } from 'react';
import { Client, Task, TaskFilter, TaskStatus, ClientStatus, TeamMember, ShoutOut, TaskPriority, View, AccountFilter, AIInsight, KpiGroup, KpiProgress } from '../types';
import { 
    UsersIcon, AlertTriangleIcon, ListIcon, ArrowRightIcon, ClockIcon, 
    TrophyIcon, CheckCircleIcon, CalendarDaysIcon, FlameIcon, LoaderIcon
} from './Icons';
import { timeAgo } from './utils/time';
import { StatCard } from './StatCard';
import { SkeletonLoader } from './SkeletonLoader';
import { AIInsightsWidget } from './AIInsightsWidget';
import { api } from '../services/api';

interface DashboardProps {
    user: TeamMember;
    tasks: Task[];
    clients: Client[];
    teamMembers: TeamMember[];
    shoutOuts: ShoutOut[];
    setActiveView: (view: View) => void;
    navigateToTasks: (filter: Partial<TaskFilter>, taskId?: string) => void;
    navigateToClients: (filter: Partial<AccountFilter>, clientId?: string) => void;
    navigateToTeamMember: (memberId: string) => void;
    isLoading: boolean;
    aiInsights: AIInsight[];
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
}

const FocusItem: React.FC<{
  task: Task;
  onViewTask: () => void;
  onViewClient: () => void;
  colorClass: string;
}> = ({ task, onViewTask, onViewClient, colorClass }) => (
    <div className="group flex items-center p-3 bg-core-bg-soft rounded-lg hover:bg-core-border transition-colors border-l-4" style={{borderColor: colorClass}}>
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-4" style={{backgroundColor: `${colorClass}20`, color: colorClass}}>
            <ListIcon className="w-5 h-5"/>
        </div>
        <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-core-text-primary truncate cursor-pointer hover:underline" onClick={onViewTask}>{task.title}</p>
            <p className="text-xs text-core-text-secondary truncate">
                Due: {new Date(task.dueDate).toLocaleDateString()}
                {task.client && <span className="cursor-pointer hover:underline" onClick={onViewClient}> | {task.client.name}</span>}
            </p>
        </div>
        <button onClick={onViewTask} className="ml-4 px-3 py-1 text-xs font-semibold bg-core-bg hover:bg-core-accent text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            View
        </button>
    </div>
);

const MyWeekPreview: React.FC<{ tasks: Task[], onNavigate: () => void }> = ({ tasks, onNavigate }) => {
    const weeklyData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const taskCounts = Array(5).fill(0);
        
        tasks.forEach(task => {
            const dueDate = new Date(task.dueDate);
            const dayIndex = dueDate.getDay() - 1; // 0=Mon, 1=Tue...
            if(dayIndex >= 0 && dayIndex < 5) {
                taskCounts[dayIndex]++;
            }
        });
        
        const maxTasks = Math.max(...taskCounts, 1);
        return { days, taskCounts, maxTasks };

    }, [tasks]);

    return (
        <div className="mt-4">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-core-text-primary flex items-center"><CalendarDaysIcon className="w-5 h-5 mr-2 text-core-accent"/> My Week At a Glance</h3>
                <button onClick={onNavigate} className="flex items-center text-sm text-core-accent hover:text-core-accent-hover">
                    Full Schedule <ArrowRightIcon className="w-4 h-4 ml-1" />
                </button>
            </div>
            <div className="flex justify-around items-end gap-2 h-24 p-2 bg-core-bg/50 rounded-lg">
                {weeklyData.days.map((day, i) => (
                    <div key={day} className="flex flex-col items-center flex-1 h-full group">
                        <div className="w-full h-full flex items-end rounded-md overflow-hidden relative">
                             <div className="absolute bottom-0 w-full bg-core-border/50" style={{height: '100%'}}></div>
                            <div 
                                className="w-full bg-core-accent rounded-t-sm transition-all duration-300 ease-out group-hover:bg-core-accent-hover"
                                style={{ height: `${(weeklyData.taskCounts[i] / weeklyData.maxTasks) * 100}%`}}
                            ></div>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity">{weeklyData.taskCounts[i]}</span>
                        </div>
                        <span className="text-xs text-core-text-secondary mt-1.5">{day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TeamPulse: React.FC<{ 
    teamMembers: TeamMember[], 
    shoutOuts: ShoutOut[], 
    onNavigate: () => void,
    onViewMember: (id: string) => void,
}> = ({ teamMembers, shoutOuts, onNavigate, onViewMember }) => {
    const leaders = teamMembers.sort((a,b) => b.performanceScore - a.performanceScore).slice(0, 3);
    const recentShoutouts = shoutOuts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 2);
    const onFireMember = useMemo(() => teamMembers.length > 0 ? teamMembers.reduce((p, c) => (c.onFireStreak > p.onFireStreak ? c : p)) : null, [teamMembers]);

    return (
        <div className="bg-core-bg-soft p-5 rounded-xl border border-core-border h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg text-core-text-primary flex items-center">
                        <UsersIcon className="w-5 h-5 mr-2"/> Team Pulse
                    </h3>
                    <button onClick={onNavigate} className="flex items-center text-sm text-core-accent hover:text-core-accent-hover">
                        View Hub <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </button>
                </div>
            </div>

            <div className="flex-grow mt-4">
                 <h4 className="text-xs text-core-text-secondary uppercase font-semibold mb-2">Top Performers</h4>
                 <div className="space-y-2">
                    {leaders.map((member, index) => (
                        <div key={member.id} className="flex items-center bg-core-bg p-2.5 rounded-lg cursor-pointer hover:bg-core-border" onClick={() => onViewMember(member.id)}>
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full font-bold mr-3 ${index === 0 ? 'bg-amber-400 text-slate-900' : 'bg-core-border text-core-text-secondary'}`}>{index + 1}</span>
                            <div className="w-8 h-8 rounded-full bg-core-accent flex items-center justify-center text-xs font-bold mr-3">{member.avatarInitials}</div>
                            <span className="flex-1 truncate text-core-text-primary text-sm font-semibold">{member.name}</span>
                            <span className="text-core-text-primary text-sm font-bold">{member.performanceScore} pts</span>
                        </div>
                    ))}
                </div>
                 {onFireMember && onFireMember.onFireStreak > 1 && (
                    <>
                        <h4 className="text-xs text-core-text-secondary uppercase font-semibold mb-2 mt-4">On Fire! 🔥</h4>
                        <div className="flex items-center bg-orange-900/50 p-2 rounded-md border border-orange-500/50">
                            <FlameIcon className="w-8 h-8 mr-3 text-orange-400"/>
                            <div>
                                <p className="text-sm font-bold text-core-text-primary">{onFireMember.name}</p>
                                <p className="text-xs text-orange-300">{onFireMember.onFireStreak}-week high-performance streak!</p>
                            </div>
                        </div>
                    </>
                 )}
                <h4 className="text-xs text-core-text-secondary uppercase font-semibold mb-2 mt-4">Recent Shout-Outs</h4>
                <div className="space-y-3">
                    {recentShoutouts.map(so => (
                        <div key={so.id} className="bg-core-bg p-3 rounded-lg text-sm">
                            <p className="text-core-text-secondary">
                                <b className="text-core-text-primary cursor-pointer hover:underline" onClick={() => teamMembers.find(tm => tm.name === so.from.name) && onViewMember(teamMembers.find(tm => tm.name === so.from.name)!.id)}>{so.from.name}</b> to <b className="text-core-text-primary cursor-pointer hover:underline" onClick={() => teamMembers.find(tm => tm.name === so.to.name) && onViewMember(teamMembers.find(tm => tm.name === so.to.name)!.id)}>{so.to.name}</b>: "{so.message}"
                            </p>
                            <p className="text-right text-xs text-core-text-secondary/50 mt-1">{timeAgo(so.date)}</p>
                        </div>
                    ))}
                     {recentShoutouts.length === 0 && <p className="text-core-text-secondary/50 text-sm text-center py-4">No recent shout-outs.</p>}
                </div>
            </div>
        </div>
    )
}

const SupervisorActionHub: React.FC<{
    teamMembers: TeamMember[];
    clients: Client[];
    tasks: Task[];
    navigateToTeamMember: (id: string) => void;
    navigateToClients: (filter: any, id: string) => void;
    navigateToTasks: (filter: any, id: string) => void;
}> = ({ teamMembers, clients, tasks, navigateToTeamMember, navigateToClients, navigateToTasks }) => {
    
    const actionItems = useMemo(() => {
        const highRiskMembers = teamMembers.filter(m => m.ptlReport && (m.ptlReport.riskLevel === 'High' || m.ptlReport.riskLevel === 'Critical')).slice(0, 3);
        const criticalClients = clients.filter(c => c.status === ClientStatus.Critical).slice(0, 3);
        const urgentTasks = tasks.filter(t => t.status === TaskStatus.Overdue && t.priority === TaskPriority.High).slice(0, 3);
        
        return { highRiskMembers, criticalClients, urgentTasks };
    }, [teamMembers, clients, tasks]);
    
    const ActionItem: React.FC<{ icon: React.ReactNode, text: string, subtext: string, onClick: () => void, colorClass: string }> = ({ icon, text, subtext, onClick, colorClass }) => (
        <div onClick={onClick} className="flex items-center gap-3 p-2.5 bg-core-bg/50 rounded-lg cursor-pointer hover:bg-core-border">
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="font-semibold text-sm text-core-text-primary">{text}</p>
                <p className="text-xs text-core-text-secondary">{subtext}</p>
            </div>
        </div>
    );

    if (actionItems.highRiskMembers.length === 0 && actionItems.criticalClients.length === 0 && actionItems.urgentTasks.length === 0) {
        return null;
    }

    return (
        <div className="bg-core-bg-soft p-5 rounded-xl border border-core-border">
             <h2 className="font-bold text-lg mb-4 flex items-center">
                <AlertTriangleIcon className="w-5 h-5 mr-2 text-orange-400"/>
                Supervisor Action Hub
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-core-text-secondary mb-2">High-Risk Team Members</h3>
                    <div className="space-y-2">
                        {actionItems.highRiskMembers.map(m => <ActionItem key={m.id} icon={<UsersIcon className="w-5 h-5"/>} text={m.name} subtext={`Risk: ${m.ptlReport?.riskLevel || 'N/A'}`} onClick={() => navigateToTeamMember(m.id)} colorClass="bg-red-500/20 text-red-400" />)}
                         {actionItems.highRiskMembers.length === 0 && <p className="text-sm text-core-text-secondary/50 italic p-2">No team members flagged.</p>}
                    </div>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-core-text-secondary mb-2">Critical Accounts</h3>
                    <div className="space-y-2">
                         {actionItems.criticalClients.map(c => <ActionItem key={c.id} icon={<UsersIcon className="w-5 h-5"/>} text={c.name} subtext={`POC: ${c.poc[0]}`} onClick={() => navigateToClients({status: c.status}, c.id)} colorClass="bg-orange-500/20 text-orange-400" />)}
                          {actionItems.criticalClients.length === 0 && <p className="text-sm text-core-text-secondary/50 italic p-2">No critical accounts.</p>}
                    </div>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-core-text-secondary mb-2">Urgent Overdue Tasks</h3>
                     <div className="space-y-2">
                        {actionItems.urgentTasks.map(t => <ActionItem key={t.id} icon={<ListIcon className="w-5 h-5"/>} text={t.title} subtext={`Assignee: ${t.assignee?.name || 'N/A'}`} onClick={() => navigateToTasks({}, t.id)} colorClass="bg-yellow-500/20 text-yellow-400" />)}
                        {actionItems.urgentTasks.length === 0 && <p className="text-sm text-core-text-secondary/50 italic p-2">No urgent overdue tasks.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, tasks, clients, teamMembers, shoutOuts, setActiveView, navigateToTasks, navigateToClients: navigateToAccounts, navigateToTeamMember, isLoading, aiInsights, kpiGroups, kpiProgress }) => {
    
    const [focusItems, setFocusItems] = useState<Task[]>([]);
    const [isLoadingPriorities, setIsLoadingPriorities] = useState(true);

    const { dashboardStats, myWeeklyTasks } = useMemo(() => {
        const myTasks = tasks.filter(t => t.assignedTo === user.id);
        const myOpenTasks = myTasks.filter(t => t.status !== TaskStatus.Completed);
        const myClientIds = new Set<string>();
        clients.forEach(c => {
            if(c.assignedTeamMembers.includes(user.id)) myClientIds.add(c.id);
        });
        const assignedClients = clients.filter(c => myClientIds.has(c.id));

        const stats = {
            performanceScore: user.performanceScore,
            openTasks: myOpenTasks.length,
            overdueTasks: myOpenTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== TaskStatus.Completed).length,
            criticalClients: assignedClients.filter(c => c.status === ClientStatus.Critical).length,
        };
        
        return { 
            dashboardStats: stats,
            myWeeklyTasks: tasks.filter(t => t.weeklyGoalCategory && t.assignedTo === user.id),
        };
    }, [tasks, clients, user]);

    useEffect(() => {
        const fetchFocusItems = async () => {
            setIsLoadingPriorities(true);
            const myOpenTasks = tasks.filter(t => t.assignedTo === user.id && t.status !== TaskStatus.Completed);
            if (myOpenTasks.length === 0) {
                setFocusItems([]);
                setIsLoadingPriorities(false);
                return;
            }
            try {
                const { topThree } = await api.suggestTaskPriority(myOpenTasks);
                const topTasks = topThree.map(id => tasks.find(t => t.id === id)).filter((t): t is Task => !!t);
                setFocusItems(topTasks);
            } catch (error) {
                console.error("Failed to fetch AI task priorities, falling back to manual sort.", error);
                const sortedFocusTasks = myOpenTasks.sort((a, b) => {
                    const aIsOverdue = new Date(a.dueDate) < new Date() && a.status !== TaskStatus.Completed;
                    const bIsOverdue = new Date(b.dueDate) < new Date() && b.status !== TaskStatus.Completed;
                    if (aIsOverdue && !bIsOverdue) return -1;
                    if (!aIsOverdue && bIsOverdue) return 1;

                    const priorityOrder = { [TaskPriority.Urgent]: 4, [TaskPriority.High]: 3, [TaskPriority.Medium]: 2, [TaskPriority.Low]: 1 };
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    }

                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                }).slice(0, 3);
                setFocusItems(sortedFocusTasks);
            } finally {
                setIsLoadingPriorities(false);
            }
        };
        fetchFocusItems();
    }, [tasks, user.id]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const isSupervisor = user.role.includes('Manager') || user.role.includes('Director');
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    if (isLoading) {
        return (
            <div className="p-8 space-y-6 animate-pulse">
                <header><SkeletonLoader className="h-16 w-3/4 rounded-lg"/></header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SkeletonLoader className="h-24 rounded-xl" />
                    <SkeletonLoader className="h-24 rounded-xl" />
                    <SkeletonLoader className="h-24 rounded-xl" />
                    <SkeletonLoader className="h-24 rounded-xl" />
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <SkeletonLoader className="h-64 rounded-xl" />
                        <SkeletonLoader className="h-48 rounded-xl" />
                    </div>
                    <div className="lg:col-span-1">
                        <SkeletonLoader className="h-96 rounded-xl" />
                    </div>
                 </div>
            </div>
        )
    }
    
    return (
        <div className="p-8 text-core-text-primary space-y-6">
            <header>
                <h1 className="text-3xl font-bold">{getGreeting()}, {user.name.split(' ')[0]}!</h1>
                <p className="text-core-text-secondary">Today is {today}. Here's your command center.</p>
            </header>
            
            <AIInsightsWidget insights={aiInsights} isLoading={isLoading} />

            {isSupervisor && <SupervisorActionHub clients={clients} tasks={tasks} teamMembers={teamMembers} navigateToClients={navigateToAccounts} navigateToTasks={navigateToTasks} navigateToTeamMember={navigateToTeamMember}/>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard onClick={() => navigateToTasks({ status: 'Overdue' })} icon={<ClockIcon className="w-6 h-6 text-red-400"/>} title="Overdue" value={dashboardStats.overdueTasks} />
                <StatCard onClick={() => navigateToTasks({ status: TaskStatus.Pending })} icon={<ListIcon className="w-6 h-6 text-blue-400"/>} title="Open Tasks" value={dashboardStats.openTasks} />
                <StatCard onClick={() => navigateToAccounts({ status: ClientStatus.Critical })} icon={<AlertTriangleIcon className="w-6 h-6 text-orange-400"/>} title="Critical Accounts" value={dashboardStats.criticalClients} />
                <StatCard onClick={() => setActiveView('leaderboard')} icon={<TrophyIcon className="w-6 h-6 text-yellow-400"/>} title="My Performance" value={dashboardStats.performanceScore} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-core-bg-soft p-5 rounded-xl border border-core-border">
                        <h2 className="font-bold text-lg mb-4 flex items-center">
                            <AlertTriangleIcon className="w-5 h-5 mr-2 text-yellow-400"/>
                            Today's Priorities
                        </h2>
                        <div className="space-y-3">
                           {isLoadingPriorities ? (
                                <div className="flex items-center justify-center h-24 text-core-text-secondary"><LoaderIcon className="w-8 h-8 animate-spin" /></div>
                           ) : focusItems.length > 0 ? focusItems.map((task) => (
                                <FocusItem 
                                    key={task.id}
                                    task={task}
                                    onViewTask={() => navigateToTasks({}, task.id)}
                                    onViewClient={() => task.clientId && navigateToAccounts({}, task.clientId)}
                                    colorClass={task.priority === TaskPriority.High || task.priority === TaskPriority.Urgent || new Date(task.dueDate) < new Date() ? '#ef4444' : '#f59e0b'}
                                />
                            )) : (
                                <div className="flex items-center p-3 bg-core-bg rounded-lg border-l-4 border-green-500">
                                    <CheckCircleIcon className="w-8 h-8 mr-4 text-green-500"/>
                                    <div>
                                        <p className="font-semibold text-core-text-primary">All Clear!</p>
                                        <p className="text-sm text-core-text-secondary">No urgent items on your plate. Great job!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-core-bg-soft p-5 rounded-xl border border-core-border">
                        <MyWeekPreview tasks={myWeeklyTasks} onNavigate={() => setActiveView('my-week')} />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <TeamPulse 
                        teamMembers={teamMembers} 
                        shoutOuts={shoutOuts} 
                        onNavigate={() => setActiveView('leaderboard')} 
                        onViewMember={navigateToTeamMember}
                    />
                </div>
            </div>
        </div>
    );
};