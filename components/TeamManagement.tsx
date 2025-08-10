
import React, { useMemo, useState, useEffect } from 'react';
import { TeamMember, Client, Task, KpiGroup, KpiProgress, WeeklyPerformanceSnapshot, AccountFilter, TaskFilter } from '../types';
import { useFilteredAndSortedItems } from '../hooks/useFilteredAndSortedItems';
import { TeamMemberCard } from './TeamMemberCard';
import { StatCard } from './StatCard';
import { TeamMemberDetailPanel } from './TeamMemberDetailPanel';
import { PerformanceLogModal } from './PerformanceLogModal';
import { PageHeader } from './ui/PageHeader';
import { 
    UsersIcon, BriefcaseIcon, 
    TargetIcon, PlusIcon, SearchIcon, TeamIcon
} from './Icons';
import { api } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { TeamMemberContextModal } from './TeamMemberContextModal';

interface TeamManagementProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    tasks: Task[];
    clients: Client[];
    onSaveTeamMember: (member: TeamMember) => void;
    onDeleteTeamMember: (memberId: string) => void;
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    onUpdateKpiProgress: (progressId: string, actual: number) => void;
    onSaveHistoricalSnapshot: (memberId: string, weekOf: string, kpis: {kpiDefId: string, actual: number}[]) => void;
    navigateToClient: (filter: Partial<AccountFilter>, clientId?: string) => void;
    navigateToTask: (filter: Partial<TaskFilter>, taskId?: string) => void;
    preselectedTeamMemberId: string | null;
    clearPreselectedTeamMember: () => void;
    onOpenModal: (type: 'team', data: TeamMember | null) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
    currentUser,
    teamMembers,
    tasks,
    clients,
    onSaveTeamMember,
    onDeleteTeamMember,
    kpiGroups,
    kpiProgress,
    weeklySnapshots,
    onUpdateKpiProgress,
    onSaveHistoricalSnapshot,
    navigateToClient,
    navigateToTask,
    preselectedTeamMemberId,
    clearPreselectedTeamMember,
    onOpenModal,
}) => {
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedMemberForLog, setSelectedMemberForLog] = useState<TeamMember | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // New state for context modal
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    const [selectedMemberForContext, setSelectedMemberForContext] = useState<TeamMember | null>(null);
    const [contextSummary, setContextSummary] = useState('');
    const [isContextLoading, setIsContextLoading] = useState(false);


     useEffect(() => {
        if (preselectedTeamMemberId) {
            const memberToSelect = teamMembers.find(m => m.id === preselectedTeamMemberId);
            if (memberToSelect) {
                setSelectedMember(memberToSelect);
            }
            clearPreselectedTeamMember();
        }
    }, [preselectedTeamMemberId, teamMembers, clearPreselectedTeamMember]);

    const {
        filteredAndSortedItems: filteredMembers,
        filters,
        setFilters
    } = useFilteredAndSortedItems(teamMembers, { 
        initialSortKey: 'name',
        searchKeys: ['name', 'role', 'skills', 'department'],
        searchTerm: debouncedSearchTerm
    });

    const stats = useMemo(() => {
        const averagePerformance = teamMembers.length > 0
            ? Math.round(teamMembers.reduce((acc, m) => acc + m.performanceScore, 0) / teamMembers.length)
            : 0;
        const departments = [...new Set(teamMembers.map(m => m.department))];
        return {
            total: teamMembers.length,
            departments: departments.length,
            averagePerformance,
        };
    }, [teamMembers]);

    const handleMemberSelect = (member: TeamMember) => {
        setSelectedMember(member);
    };

    const handleEditMember = (member: TeamMember) => {
        onOpenModal('team', member);
    };

    const handleAddNewMember = () => {
        onOpenModal('team', null);
    };
    
    const handleViewContext = async (member: TeamMember) => {
        setSelectedMemberForContext(member);
        setIsContextModalOpen(true);
        setIsContextLoading(true);
        setContextSummary(''); // Clear previous summary
        try {
            const memberTasks = tasks.filter(t => t.assignedTo === member.id);
            const memberClients = clients.filter(c => c.assignedTeamMembers.includes(member.id));
            const { summary } = await api.generateTeamMemberContext(member, memberTasks, memberClients);
            setContextSummary(summary);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setContextSummary(`### Error\nFailed to generate context summary.\n\n**Details:** ${errorMessage}`);
        } finally {
            setIsContextLoading(false);
        }
    };

    const handleDeleteMemberWithConfirm = async (memberId: string) => {
        const member = teamMembers.find(m => m.id === memberId);
        if (!member) return;
        
        const associatedTaskCount = tasks.filter(t => t.assignedTo === memberId).length;

        try {
            const { confirmationText } = await api.generateDeleteConfirmation('team member', member.name, associatedTaskCount);
            if (window.confirm(confirmationText)) {
                onDeleteTeamMember(memberId);
                if (selectedMember?.id === memberId) {
                    setSelectedMember(null);
                }
            }
        } catch (error) {
             console.error("Failed to get AI confirmation, falling back to default.", error);
            if (window.confirm(`Are you sure you want to delete ${member.name}? This will unassign ${associatedTaskCount} associated tasks.`)) {
                onDeleteTeamMember(memberId);
                if (selectedMember?.id === memberId) {
                    setSelectedMember(null);
                }
            }
        }
    };

    const handlePanelClose = () => {
        setSelectedMember(null);
    };
    
    const handleLogPerformance = (member: TeamMember) => {
        setSelectedMemberForLog(member);
        setIsLogModalOpen(true);
    };

    const selectedMemberKpiGroup = useMemo(() => {
        if (!selectedMemberForLog || !selectedMemberForLog.kpiGroupId) return null;
        return kpiGroups.find(g => g.id === selectedMemberForLog.kpiGroupId) || null;
    }, [selectedMemberForLog, kpiGroups]);
    
    if (selectedMember) {
        return (
            <TeamMemberDetailPanel
                isFullPage={true}
                currentUser={currentUser}
                member={selectedMember}
                onClose={handlePanelClose}
                onEdit={handleEditMember}
                onSaveTeamMember={onSaveTeamMember}
                clients={clients}
                tasks={tasks}
                weeklySnapshots={weeklySnapshots}
                navigateToClient={navigateToClient}
                navigateToTask={navigateToTask}
                onLogPerformance={handleLogPerformance}
            />
        );
    }

    return (
        <>
            <div className="p-8 space-y-6">
                <PageHeader 
                    title="Team Management"
                    description="Oversee team members, performance, and workload."
                    icon={<TeamIcon className="w-6 h-6"/>}
                    actions={
                        <button onClick={handleAddNewMember} className="flex items-center bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-core-accent/30">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Add New Member
                        </button>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard icon={<UsersIcon className="w-6 h-6 text-indigo-400"/>} title="Total Team Members" value={stats.total} />
                    <StatCard icon={<BriefcaseIcon className="w-6 h-6 text-green-400"/>} title="Departments" value={stats.departments} />
                    <StatCard icon={<TargetIcon className="w-6 h-6 text-yellow-400"/>} title="Avg. Performance" value={`${stats.averagePerformance}`} />
                </div>
                
                <div className="flex flex-wrap gap-4 items-center justify-between bg-core-bg-soft p-4 rounded-xl border border-core-border">
                    <div className="relative flex-grow min-w-[250px]">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-core-text-secondary" />
                        <input
                            type="search"
                            placeholder="Search members by name, role, or skill..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-core-bg border border-core-border rounded-lg py-2 pl-10 pr-4 text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={filters.department || 'all'}
                            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                            className="flex items-center bg-core-bg hover:bg-core-border text-core-text-primary font-medium py-2 px-3 rounded-lg transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-core-accent border border-core-border"
                        >
                            <option value="all">All Departments</option>
                            {[...new Set(teamMembers.map(m => m.department))].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {filteredMembers.map(member => (
                        <TeamMemberCard 
                            key={member.id}
                            member={member}
                            clients={clients}
                            onMemberSelect={handleMemberSelect}
                            onViewContext={handleViewContext}
                            onEdit={handleEditMember}
                            onDelete={handleDeleteMemberWithConfirm}
                        />
                    ))}
                </div>
            </div>

            <PerformanceLogModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                member={selectedMemberForLog}
                kpiGroup={selectedMemberKpiGroup}
                kpiProgress={kpiProgress}
                onUpdateKpiProgress={onUpdateKpiProgress}
                weeklySnapshots={weeklySnapshots}
                onSaveHistoricalSnapshot={onSaveHistoricalSnapshot}
            />
            <TeamMemberContextModal
                isOpen={isContextModalOpen}
                onClose={() => setIsContextModalOpen(false)}
                member={selectedMemberForContext}
                summary={contextSummary}
                isLoading={isContextLoading}
            />
        </>
    );
};
