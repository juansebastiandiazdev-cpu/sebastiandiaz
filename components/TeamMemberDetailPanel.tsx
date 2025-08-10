

import React, { useState, useMemo } from 'react';
import { TeamMember, Client, Task, TaskStatus, WeeklyPerformanceSnapshot, ActionItem } from '../types';
import { PtlTab } from './PtlTab';
import { CoachingTab } from './CoachingTab';
import { PerformanceSummaryTab } from './PerformanceSummaryTab';
import { 
    XIcon, EditIcon, InfoIcon, ListIcon, MailIcon,
    UsersIcon, ClockIcon, BriefcaseIcon, CalendarIcon, HomeIcon, ClipboardCheckIcon, BarChartIcon, SparklesIcon, AlertTriangleIcon
} from './Icons';
import { AIActionSuggestion } from './AIActionSuggestion';
import { formatDate } from './utils/time';

interface TeamMemberDetailPanelProps {
  currentUser: TeamMember;
  member: TeamMember | null;
  onClose: () => void;
  onEdit?: (member: TeamMember) => void;
  onSaveTeamMember: (member: TeamMember) => void;
  clients: Client[];
  tasks: Task[];
  weeklySnapshots: WeeklyPerformanceSnapshot[];
  navigateToClient: (filter: any, clientId: string) => void;
  navigateToTask: (filter: any, taskId: string) => void;
  onLogPerformance?: (member: TeamMember) => void;
  isFullPage?: boolean;
}

const NavTab: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${active ? 'bg-core-accent text-core-accent-foreground' : 'text-core-text-secondary hover:bg-core-border'}`}>
        {icon}
        <span>{label}</span>
    </button>
);

const DetailItem: React.FC<{ icon?: React.ReactNode, label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start justify-between text-sm py-2 border-b border-core-border/50">
        <span className="text-core-text-secondary uppercase text-xs tracking-wider flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            {label}
        </span>
        <span className="text-core-text-primary font-medium text-right ml-4">{value}</span>
    </div>
);

// --- TAB CONTENT ---

const OverviewTab: React.FC<{ member: TeamMember }> = ({ member }) => {
    const { seniority, formattedHireDate } = useMemo(() => {
        if (!member.hireDate) return { seniority: 'N/A', formattedHireDate: 'N/A' };
        const hireDate = new Date(member.hireDate);
        if (isNaN(hireDate.getTime())) {
            return { seniority: 'Invalid', formattedHireDate: 'Invalid Date' };
        }

        const now = new Date();
        const diff = now.getTime() - hireDate.getTime();
        const years = diff / (1000 * 60 * 60 * 24 * 365.25);
        return { 
            seniority: `${years.toFixed(2)} years`, 
            formattedHireDate: formatDate(member.hireDate, { year: 'numeric', month: 'long', day: 'numeric' })
        };
    }, [member.hireDate]);

    return (
        <div className="space-y-6">
            <div className="bg-core-bg-soft p-4 rounded-lg border border-core-border">
                <h3 className="text-sm font-bold text-core-accent mb-2">CONTACT & ROLE</h3>
                <DetailItem icon={<MailIcon className="w-4 h-4" />} label="Email" value={member.email} />
                <DetailItem icon={<BriefcaseIcon className="w-4 h-4" />} label="Role" value={member.role} />
                <DetailItem icon={<UsersIcon className="w-4 h-4" />} label="Department" value={member.department} />
            </div>

            <div className="bg-core-bg-soft p-4 rounded-lg border border-core-border">
                <h3 className="text-sm font-bold text-core-accent mb-2">EMPLOYMENT DETAILS</h3>
                <DetailItem icon={<CalendarIcon className="w-4 h-4" />} label="Hire Date" value={formattedHireDate} />
                <DetailItem icon={<ClockIcon className="w-4 h-4" />} label="Seniority" value={seniority} />
            </div>

            <div className="bg-core-bg-soft p-4 rounded-lg border border-core-border">
                <h3 className="text-sm font-bold text-core-accent mb-2">HOME OFFICE STATUS</h3>
                <DetailItem icon={<HomeIcon className="w-4 h-4" />} label="Status" value={member.homeOffice.status} />
                <div className="text-sm text-core-text-primary pt-2">
                    <p className="text-xs text-core-text-secondary">Notes:</p>
                    <p>{member.homeOffice.notes}</p>
                </div>
            </div>

            <div className="bg-core-bg-soft p-4 rounded-lg border border-core-border">
                <h3 className="text-sm font-bold text-core-accent mb-3">SKILLS</h3>
                <div className="flex flex-wrap gap-2">
                    {member.skills.map(skill => (
                        <span key={skill} className="text-xs text-core-text-primary bg-core-bg px-3 py-1 rounded-full">{skill}</span>
                    ))}
                     {member.skills.length === 0 && <span className="text-xs text-core-text-secondary italic">No skills listed.</span>}
                </div>
            </div>
        </div>
    );
};

const AssignedClientsTab: React.FC<{ member: TeamMember, clients: Client[], navigateToClient: (filter: any, clientId: string) => void }> = ({ member, clients, navigateToClient }) => {
    const memberClients = useMemo(() => clients.filter(c => c.assignedTeamMembers.includes(member.id)), [member.id, clients]);

    return (
        <div className="space-y-3">
            {memberClients.map(client => (
                <div key={client.id} className="bg-core-bg-soft p-3 rounded-lg border border-core-border flex justify-between items-center cursor-pointer hover:border-core-accent/50" onClick={() => navigateToClient({}, client.id)}>
                    <p className="font-semibold text-core-text-primary">{client.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${client.status === "Healthy" ? 'bg-green-500/10 text-green-500 dark:text-green-400' : client.status === "At-Risk" ? 'bg-yellow-500/10 text-yellow-500 dark:text-yellow-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>{client.status}</span>
                </div>
            ))}
             {memberClients.length === 0 && <p className="text-core-text-secondary italic text-center py-4">No clients assigned.</p>}
        </div>
    );
};

const ActiveTasksTab: React.FC<{ member: TeamMember, tasks: Task[], navigateToTask: (filter: any, taskId: string) => void }> = ({ member, tasks, navigateToTask }) => {
    const memberTasks = useMemo(() => tasks.filter(t => t.assignedTo === member.id && t.status !== TaskStatus.Completed), [member.id, tasks]);

    return (
        <div className="space-y-3">
            {memberTasks.map(task => {
                 const dueDate = new Date(task.dueDate);
                 const formattedDueDate = !isNaN(dueDate.getTime()) ? dueDate.toLocaleDateString() : 'Invalid Date';
                 return (
                    <div key={task.id} className="bg-core-bg-soft p-3 rounded-lg border border-core-border cursor-pointer hover:border-core-accent/50" onClick={() => navigateToTask({}, task.id)}>
                         <p className="font-semibold text-core-text-primary">{task.title}</p>
                         <div className="mt-2 flex items-center justify-between text-xs text-core-text-secondary">
                             <span>Client: <span className="font-medium text-core-text-primary/80">{task.client?.name || 'Internal'}</span></span>
                             <span>Due: <span className="font-medium text-core-text-primary/80">{formattedDueDate}</span></span>
                         </div>
                    </div>
                );
            })}
            {memberTasks.length === 0 && <p className="text-core-text-secondary italic text-center py-4">No active tasks.</p>}
        </div>
    );
};

export const TeamMemberDetailPanel: React.FC<TeamMemberDetailPanelProps> = ({ currentUser, member, onClose, onEdit, onSaveTeamMember, clients, tasks, weeklySnapshots, navigateToClient, navigateToTask, onLogPerformance, isFullPage = false }) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [coachingTabState, setCoachingTabState] = useState<{ summary: string; leaderActions: ActionItem[]; employeeActions: ActionItem[] }>({ summary: '', leaderActions: [], employeeActions: [] });

    if (!member) return null;

    const { openTasksCount, overdueTasksCount } = useMemo(() => {
        const memberTasks = tasks.filter(t => t.assignedTo === member.id);
        const openTasks = memberTasks.filter(t => t.status !== TaskStatus.Completed);
        const overdueTasks = openTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== TaskStatus.Completed);
        return { openTasksCount: openTasks.length, overdueTasksCount: overdueTasks.length };
    }, [tasks, member.id]);
    
    const performanceScore = member.performanceScore || 0;
    const scoreColor = performanceScore >= 85 ? 'text-green-500 dark:text-green-400' : performanceScore >= 70 ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400';

    const handleStartCoaching = (data: { summary: string; leaderActions?: ActionItem[]; employeeActions?: ActionItem[] }) => {
        setCoachingTabState({ 
            summary: data.summary || '', 
            leaderActions: data.leaderActions || [], 
            employeeActions: data.employeeActions || [] 
        });
        setActiveTab('Coaching');
    };

    const handleClearInitialCoachingData = () => {
        setCoachingTabState({ summary: '', leaderActions: [], employeeActions: [] });
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Overview':
                return <OverviewTab member={member} />;
            case 'Assigned Clients':
                return <AssignedClientsTab member={member} clients={clients} navigateToClient={navigateToClient} />;
            case 'Active Tasks':
                return <ActiveTasksTab member={member} tasks={tasks} navigateToTask={navigateToTask} />;
            case 'PTL Analysis':
                return <PtlTab member={member} tasks={tasks} clients={clients} onSave={onSaveTeamMember} onStartCoaching={handleStartCoaching} />;
            case 'Coaching':
                return <CoachingTab member={member} onSave={onSaveTeamMember} currentUser={currentUser} tasks={tasks} clients={clients} initialSessionData={coachingTabState} clearInitialSessionData={handleClearInitialCoachingData} />;
            case 'Performance':
                return <PerformanceSummaryTab member={member} weeklySnapshots={weeklySnapshots} />;
            default:
                return null;
        }
    };
    
    const containerClasses = isFullPage
    ? 'flex flex-col h-full bg-core-bg'
    : `fixed top-0 right-0 h-full w-[640px] bg-core-bg/95 backdrop-blur-lg border-l border-core-border shadow-2xl z-30 transform transition-transform duration-300 ease-in-out ${member ? 'translate-x-0' : 'translate-x-full'}`;

    return (
        <div className={containerClasses}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-5 border-b border-core-border flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-core-accent flex items-center justify-center font-bold text-core-accent-foreground text-2xl flex-shrink-0">{member.avatarInitials}</div>
                            <div>
                                <h2 className="text-xl font-bold text-core-text-primary">{member.name}</h2>
                                <p className="text-sm text-core-accent">{member.role}</p>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className={`text-lg font-bold ${scoreColor}`}>{performanceScore} pts</span>
                                    <span className="text-xs text-core-text-secondary">Open Tasks: {openTasksCount}</span>
                                    <span className={`text-xs ${overdueTasksCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-core-text-secondary'}`}>Overdue: {overdueTasksCount}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-core-text-secondary hover:text-core-text-primary"><XIcon className="w-6 h-6" /></button>
                    </div>
                </div>

                {/* Nav */}
                <div className="p-3 border-b border-core-border flex-shrink-0">
                    <div className="flex space-x-1 overflow-x-auto">
                        <NavTab icon={<InfoIcon className="w-4 h-4"/>} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
                        <NavTab icon={<BarChartIcon className="w-4 h-4" />} label="Performance" active={activeTab === 'Performance'} onClick={() => setActiveTab('Performance')} />
                        <NavTab icon={<AlertTriangleIcon className="w-4 h-4" />} label="PTL Analysis" active={activeTab === 'PTL Analysis'} onClick={() => setActiveTab('PTL Analysis')} />
                        <NavTab icon={<SparklesIcon className="w-4 h-4" />} label="Coaching" active={activeTab === 'Coaching'} onClick={() => setActiveTab('Coaching')} />
                        <NavTab icon={<UsersIcon className="w-4 h-4"/>} label="Assigned Clients" active={activeTab === 'Assigned Clients'} onClick={() => setActiveTab('Assigned Clients')} />
                        <NavTab icon={<ListIcon className="w-4 h-4"/>} label="Active Tasks" active={activeTab === 'Active Tasks'} onClick={() => setActiveTab('Active Tasks')} />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    {member.ptlReport && member.ptlReport.riskLevel === 'High' && (
                       <AIActionSuggestion 
                           member={member} 
                           onNavigateToCoaching={() => setActiveTab('Coaching')}
                           onNavigateToTasks={(filter) => {
                               navigateToTask(filter, '');
                               onClose();
                           }}
                        />
                    )}
                    <div className={member.ptlReport && member.ptlReport.riskLevel === 'High' ? 'mt-4' : ''}>
                        {renderTabContent()}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 mt-auto border-t border-core-border flex-shrink-0 bg-core-bg/70 backdrop-blur-sm">
                    <div className="grid grid-cols-2 gap-3">
                         {onEdit && (
                            <button onClick={() => onEdit(member)} className="w-full flex items-center justify-center bg-core-bg-soft hover:bg-core-border text-core-text-primary font-semibold py-2.5 px-4 rounded-lg transition-all">
                                <EditIcon className="w-5 h-5 mr-2" />
                                Edit Member
                            </button>
                        )}
                        {onLogPerformance && (
                             <button onClick={() => onLogPerformance(member)} className="w-full flex items-center justify-center bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2.5 px-4 rounded-lg transition-all">
                                <ClipboardCheckIcon className="w-5 h-5 mr-2" />
                                Log Performance
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};