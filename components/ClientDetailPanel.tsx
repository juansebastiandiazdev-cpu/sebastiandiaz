

import React, { useState, useMemo } from 'react';
import { Client, ClientStatus, Task, Kpi, PulseLogEntry, TaskStatus, TeamMember, KpiGroup, KpiProgress, WeeklyPerformanceSnapshot } from '../types';
import { 
    XIcon, EditIcon, InfoIcon, ListIcon, PulseLogIcon, MailIcon, TrendingUpIcon, PhoneIcon, LocationIcon,
    UsersIcon, BarChartIcon, TargetIcon, LinkIcon, SparklesIcon, LoaderIcon, BriefcaseIcon
} from './Icons';
import { ClientDashboardBuilder } from './ClientDashboardBuilder';
import { timeAgo } from './utils/time';
import { BusinessReviewTab } from './BusinessReviewTab';


interface ClientDetailPanelProps {
  client: Client | null;
  currentUser: TeamMember;
  onClose: () => void;
  onEdit: (client: Client) => void;
  tasks: Task[];
  teamMembers: TeamMember[];
  onSaveClient: (client: Client) => void;
  navigateToTeamMember: (memberId: string) => void;
  navigateToTask: (filter: any, taskId: string) => void;
  kpiGroups: KpiGroup[];
  kpiProgress: KpiProgress[];
  weeklySnapshots: WeeklyPerformanceSnapshot[];
  isFullPage?: boolean;
}

const statusStyles: Record<ClientStatus, { text: string; bg: string; dot: string }> = {
  [ClientStatus.Healthy]: { text: 'text-green-500 dark:text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-500' },
  [ClientStatus.AtRisk]: { text: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-500' },
  [ClientStatus.Critical]: { text: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500' },
};

const NavTab: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, count?: number }> = ({ icon, label, active, onClick, count }) => (
    <button onClick={onClick} className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${active ? 'bg-core-accent text-core-accent-foreground' : 'text-core-text-secondary hover:bg-core-bg-soft hover:text-core-text-primary'}`}>
        {icon}
        <span>{label}</span>
        {typeof count !== 'undefined' && <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 dark:bg-black/20' : 'bg-core-bg-soft'}`}>{count}</span>}
    </button>
);

// --- START TAB CONTENT COMPONENTS ---

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-core-text-secondary uppercase text-xs tracking-wider">{label}</span>
        <span className="text-core-text-primary font-medium text-right">{value}</span>
    </div>
);

const OverviewTab: React.FC<{ client: Client }> = ({ client }) => (
    <div className="space-y-6">
        {client.aiHealthSummary ? (
          <div className="bg-core-bg-soft p-4 rounded-lg border border-core-border">
              <h3 className="text-sm font-bold text-core-accent mb-3">AI HEALTH SUMMARY</h3>
              <p className="text-sm text-core-text-secondary leading-relaxed">{client.aiHealthSummary.summary}</p>
              <p className="text-xs text-core-text-secondary/70 mt-2 text-right">Generated: {timeAgo(client.aiHealthSummary.generatedAt)}</p>
          </div>
        ) : (
             <div className="bg-core-bg-soft p-4 rounded-lg border border-dashed border-core-border text-center">
                 <SparklesIcon className="w-8 h-8 mx-auto text-core-text-secondary mb-2"/>
                 <p className="text-sm text-core-text-secondary">An AI-generated health summary will appear here once a report is created in the 'Report' tab.</p>
            </div>
        )}

        <div className="bg-core-bg-soft p-4 rounded-lg border border-core-border">
            <h3 className="text-sm font-bold text-core-accent mb-3">KEY DETAILS</h3>
            <div className="space-y-2.5">
                <DetailItem label="Client Code" value={client.id || 'N/A'} />
                <DetailItem label="POC" value={client.poc.join('; ')} />
                <DetailItem label="Sales Manager" value={client.salesManager || 'N/A'} />
                <DetailItem label="Start Date" value={client.startDate} />
                <DetailItem label="Seniority" value={client.seniority || 'N/A'} />
                <DetailItem label="Solversary" value={client.solversary || 'N/A'} />
            </div>
        </div>

        <div className="bg-core-bg-soft p-4 rounded-lg border border-core-border">
            <h3 className="text-sm font-bold text-core-accent mb-3">STATUS DESCRIPTION</h3>
            <p className="text-sm text-core-text-secondary leading-relaxed">
               {client.notes || 'No description provided.'}
            </p>
        </div>

        <div className="bg-core-bg-soft p-4 rounded-lg border border-core-border">
            <h3 className="text-sm font-bold text-core-accent mb-3">CONTACT & LOCATION</h3>
            <div className="space-y-3">
                 <div className="flex items-center text-sm">
                    <MailIcon className="w-4 h-4 mr-3 text-core-text-secondary"/>
                    <span className="text-core-text-primary">{client.contactInfo.email || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm">
                    <PhoneIcon className="w-4 h-4 mr-3 text-core-text-secondary"/>
                    <span className="text-core-text-primary">{client.contactInfo.phone || 'N/A'}</span>
                </div>
                 <div className="flex items-center text-sm">
                    <LocationIcon className="w-4 h-4 mr-3 text-core-text-secondary"/>
                    <span className="text-core-text-primary">{client.contactInfo.address || 'N/A'}</span>
                </div>
            </div>
        </div>
    </div>
);

const statusBadgeColors: Record<TaskStatus, string> = {
    [TaskStatus.Pending]: 'text-orange-500 dark:text-orange-400 bg-orange-500/10',
    [TaskStatus.InProgress]: 'text-blue-500 dark:text-blue-400 bg-blue-500/10',
    [TaskStatus.Overdue]: 'text-red-500 dark:text-red-400 bg-red-500/10',
    [TaskStatus.Completed]: 'text-green-500 dark:text-green-400 bg-green-500/10',
};

const TasksTab: React.FC<{ client: Client, tasks: Task[], navigateToTask: (filter:any, taskId:string)=>void }> = ({ client, tasks, navigateToTask }) => {
    const clientTasks = useMemo(() => {
        return tasks.filter(task => task.clientId === client.id)
            .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [client.id, tasks]);

    if (clientTasks.length === 0) {
        return <div className="text-center py-10 text-core-text-secondary"><ListIcon className="w-10 h-10 mx-auto mb-2" />No tasks found.</div>;
    }

    return (
        <div className="space-y-3">
            {clientTasks.map(task => (
                <div key={task.id} className="bg-core-bg-soft p-3 rounded-lg border border-core-border cursor-pointer hover:border-core-accent/50" onClick={()=>navigateToTask({}, task.id)}>
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-core-text-primary pr-4">{task.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadgeColors[task.status]}`}>{task.status}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-core-text-secondary">
                        <span>Assigned to: <span className="font-medium text-core-text-primary/80">{task.assignee?.name || 'N/A'}</span></span>
                        <span>Due: <span className="font-medium text-core-text-primary/80">{new Date(task.dueDate).toLocaleDateString()}</span></span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TeamTab: React.FC<{client: Client, navigateToTeamMember: (memberId: string) => void}> = ({client, navigateToTeamMember}) => {
    return (
        <div className="space-y-3">
            {client.team.map(member => (
                <div key={member.id} className="bg-core-bg-soft p-3 rounded-lg border border-core-border flex items-center gap-3 cursor-pointer hover:border-core-accent/50" onClick={() => navigateToTeamMember(member.id)}>
                    <div className="w-10 h-10 rounded-full bg-core-accent flex items-center justify-center text-core-accent-foreground font-bold flex-shrink-0">{member.avatarInitials}</div>
                    <div>
                        <p className="font-semibold text-core-text-primary">{member.name}</p>
                        <p className="text-sm text-core-text-secondary">{member.role}</p>
                    </div>
                </div>
            ))}
             {client.team.length === 0 && <p className="text-center py-10 text-core-text-secondary"><UsersIcon className="w-10 h-10 mx-auto mb-2" />No team members assigned.</p>}
        </div>
    )
}

const getIconForType = (type: string) => {
    switch(type.toLowerCase()){
        case 'meeting': return <UsersIcon className="w-5 h-5 text-indigo-400"/>;
        case 'call': return <PhoneIcon className="w-5 h-5 text-green-400"/>;
        case 'email': return <MailIcon className="w-5 h-5 text-orange-400"/>;
        default: return <InfoIcon className="w-5 h-5 text-slate-400"/>;
    }
}

const PulseLogTab: React.FC<{ log: PulseLogEntry[] }> = ({ log }) => {
    const sortedLog = useMemo(() => {
        if (!log) return [];
        return [...log].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [log]);
    
    if (sortedLog.length === 0) {
        return <div className="text-center py-10 text-core-text-secondary"><PulseLogIcon className="w-10 h-10 mx-auto mb-2" />No pulse log entries.</div>;
    }

    return (
        <div className="relative pl-5">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-core-border"></div>
            <div className="space-y-6">
                {sortedLog.map(entry => (
                    <div key={entry.id} className="relative">
                        <div className="absolute -left-7 top-1 w-5 h-5 bg-core-bg rounded-full flex items-center justify-center"><div className="w-2.5 h-2.5 bg-core-accent rounded-full"></div></div>
                        <div className="bg-core-bg-soft p-3 rounded-lg border border-core-border">
                            <div className="flex justify-between items-center mb-2">
                                <span className="flex items-center text-sm font-semibold text-core-text-primary">{getIconForType(entry.type)}<span className="ml-2">{entry.type}</span></span>
                                <span className="text-xs text-core-text-secondary">{new Date(entry.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-core-text-secondary">{entry.notes}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const ClientDetailPanel: React.FC<ClientDetailPanelProps> = (props) => {
  const { client, onClose, onEdit, tasks, teamMembers, onSaveClient, navigateToTeamMember, navigateToTask, kpiGroups, kpiProgress, weeklySnapshots, currentUser, isFullPage = false } = props;
  const [activeTab, setActiveTab] = useState('Overview');

  if (!client) return null;

  const style = statusStyles[client.status];
  
  const renderTabContent = () => {
    switch (activeTab) {
        case 'Tasks': return <TasksTab client={client} tasks={tasks} navigateToTask={navigateToTask}/>;
        case 'Pulse Log': return <PulseLogTab log={client.pulseLog || []} />;
        case 'Team': return <TeamTab client={client} navigateToTeamMember={navigateToTeamMember}/>;
        case 'Report': return <ClientDashboardBuilder client={client} onSaveClient={onSaveClient} teamMembers={teamMembers} kpiGroups={kpiGroups} kpiProgress={kpiProgress} weeklySnapshots={weeklySnapshots} tasks={tasks} />;
        case 'Business Review': return <BusinessReviewTab client={client} onSave={onSaveClient} currentUser={currentUser} />;
        case 'Overview': default: return <OverviewTab client={client} />;
    }
  };

  const containerClasses = isFullPage
    ? 'flex flex-col h-full bg-core-bg'
    : `fixed top-0 right-0 h-full w-[640px] bg-core-bg/95 backdrop-blur-lg border-l border-core-border/80 shadow-2xl z-30 transform transition-transform duration-300 ease-in-out ${client ? 'translate-x-0' : 'translate-x-full'}`;

  return (
    <div className={containerClasses}>
        <div className="flex flex-col h-full">
            <div className="p-5 border-b border-core-border flex-shrink-0">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-3 ${style.dot}`}></span>
                        <div>
                            <h2 className="text-xl font-bold text-core-text-primary">{client.name}</h2>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{client.status}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-core-text-secondary hover:text-core-text-primary"><XIcon className="w-6 h-6" /></button>
                </div>
            </div>

            <div className="p-3 border-b border-core-border flex-shrink-0">
                <div className="flex space-x-1 overflow-x-auto">
                    <NavTab icon={<InfoIcon className="w-4 h-4"/>} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
                    <NavTab icon={<BarChartIcon className="w-4 h-4"/>} label="Report" active={activeTab === 'Report'} onClick={() => setActiveTab('Report')} />
                    <NavTab icon={<BriefcaseIcon className="w-4 h-4"/>} label="Business Review" active={activeTab === 'Business Review'} onClick={() => setActiveTab('Business Review')} count={client.businessReviews?.length || 0} />
                    <NavTab icon={<ListIcon className="w-4 h-4"/>} label="Tasks" active={activeTab === 'Tasks'} onClick={() => setActiveTab('Tasks')} count={tasks.filter(t => t.clientId === client.id).length} />
                    <NavTab icon={<UsersIcon className="w-4 h-4"/>} label="Team" active={activeTab === 'Team'} onClick={() => setActiveTab('Team')} count={client.team.length}/>
                    <NavTab icon={<PulseLogIcon className="w-4 h-4"/>} label="Pulse Log" active={activeTab === 'Pulse Log'} onClick={() => setActiveTab('Pulse Log')} count={client.pulseLog?.length || 0} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">{renderTabContent()}</div>

            <div className="p-5 mt-auto border-t border-core-border flex-shrink-0 bg-core-bg/70 backdrop-blur-sm">
                <button onClick={() => onEdit(client)} className="w-full flex items-center justify-center bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg hover:shadow-core-accent/50">
                    <EditIcon className="w-5 h-5 mr-2" />
                    Edit Client Details
                </button>
            </div>
        </div>
    </div>
  );
};
