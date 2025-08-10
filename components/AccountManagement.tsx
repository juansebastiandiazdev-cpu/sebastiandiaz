
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Client, ClientStatus, TeamMember, Task, View, AccountFilter, KpiGroup, KpiProgress, WeeklyPerformanceSnapshot, TeamMember as CurrentUser } from '../types';
import { useFilteredAndSortedItems } from '../hooks/useFilteredAndSortedItems';
import { useDebounce } from '../hooks/useDebounce';
import { ClientCard } from './ClientCard';
import { ClientDetailPanel } from './ClientDetailPanel';
import { StatCard } from './StatCard';
import { PageHeader } from './ui/PageHeader';
import { 
    UsersIcon, CheckCircleIcon, AlertTriangleIcon, 
    PlusIcon, SortIcon,
    GridIcon, ListViewIcon, ArrowDownIcon, XIcon, SearchIcon, FilterIcon
} from './Icons';
import { timeAgo } from './utils/time';
import { api } from '../services/api';

interface AccountManagementProps {
    currentUser: CurrentUser;
    accounts: Client[];
    teamMembers: TeamMember[];
    tasks: Task[];
    onDeleteAccount: (accountId: string) => void;
    navigateToTeamMember: (memberId: string) => void;
    navigateToTask: (filter: any, taskId: string) => void;
    preselectedAccountId: string | null;
    clearPreselectedAccount: () => void;
    accountFilter: AccountFilter | null;
    clearAccountFilter: () => void;
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    onSaveAccount: (account: Client) => void;
    onOpenModal: (type: 'account', data: Client | null) => void;
}

type SortKey = 'name' | 'status' | 'openTasksCount' | 'lastContact';
type SortDirection = 'asc' | 'desc';

const statusColors: Record<ClientStatus, string> = {
  [ClientStatus.Healthy]: 'text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-500/10',
  [ClientStatus.AtRisk]: 'text-yellow-500 bg-yellow-500/10 dark:text-yellow-400 dark:bg-yellow-500/10',
  [ClientStatus.Critical]: 'text-red-500 bg-red-500/10 dark:text-red-400 dark:bg-red-500/10',
};

const TeamAvatarStack: React.FC<{ members: TeamMember[], onViewTeam: () => void; }> = ({ members, onViewTeam }) => (
    <div className="flex items-center cursor-pointer" onClick={(e) => {e.stopPropagation(); onViewTeam();}}>
        {members.slice(0, 3).map(member => (
            <div key={member.id} className="w-7 h-7 rounded-full bg-core-accent flex items-center justify-center text-core-accent-foreground text-xs font-bold border-2 border-core-bg-soft -ml-2 first:ml-0" title={member.name}>
                {member.avatarInitials}
            </div>
        ))}
        {members.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-core-text-secondary/50 flex items-center justify-center text-white text-xs font-bold border-2 border-core-bg-soft -ml-2">
                +{members.length - 3}
            </div>
        )}
    </div>
);

const AccountListItem: React.FC<{ account: Client, onAccountSelect: (account: Client) => void, navigateToTeamMember: (memberId: string) => void; }> = ({ account, onAccountSelect, navigateToTeamMember }) => {
    const lastContact = useMemo(() => {
        if (!account.pulseLog || account.pulseLog.length === 0) return 'N/A';
        const lastEntry = account.pulseLog.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        return timeAgo(lastEntry.date);
    }, [account.pulseLog]);
    
    return (
        <tr className="hover:bg-core-bg-soft/50 dark:hover:bg-core-bg-soft/5 cursor-pointer" onClick={() => onAccountSelect(account)}>
            <td className="px-4 py-3 whitespace-nowrap">
                <p className="text-sm font-medium text-core-text-primary">{account.name}</p>
                <p className="text-xs text-core-text-secondary">{account.contactInfo.email}</p>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[account.status]}`}>
                    {account.status}
                </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-core-text-secondary">{account.poc.join(', ')}</td>
            <td className="px-4 py-3 whitespace-nowrap"><TeamAvatarStack members={account.team} onViewTeam={() => account.team[0] && navigateToTeamMember(account.team[0].id)} /></td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-core-text-secondary">{account.openTasksCount}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-core-text-secondary">{lastContact}</td>
        </tr>
    );
};

const SortableHeader: React.FC<{label: string; sortKey: SortKey; currentSort: SortKey; direction: SortDirection; onSort: (key: SortKey) => void;}> = ({ label, sortKey, currentSort, direction, onSort }) => (
    <th onClick={() => onSort(sortKey)} className="px-4 py-3 text-left text-xs font-medium text-core-text-secondary uppercase tracking-wider cursor-pointer hover:bg-core-bg-soft">
        <div className="flex items-center">
            {label}
            {currentSort === sortKey && <ArrowDownIcon className={`w-4 h-4 ml-2 transition-transform ${direction === 'asc' ? 'rotate-180' : ''}`} />}
        </div>
    </th>
);

const FilterPopover: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    filters: any,
    setFilters: React.Dispatch<React.SetStateAction<any>>,
    uniqueTags: string[],
    teamMembersList: TeamMember[],
}> = ({ isOpen, onClose, filters, setFilters, uniqueTags, teamMembersList }) => {
    if(!isOpen) return null;

    const handleTagClick = (tag: string) => {
        const currentTags = filters.tags || [];
        const newTags = currentTags.includes(tag) ? currentTags.filter((t:string) => t !== tag) : [...currentTags, tag];
        setFilters((prev:any) => ({ ...prev, tags: newTags }));
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-core-bg-soft/90 backdrop-blur-md border border-core-border rounded-lg shadow-2xl z-20">
            <div className="p-4 space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-core-text-secondary mb-2">Status</h4>
                    <div className="flex gap-2">
                        {(['All', ...Object.values(ClientStatus)]).map(status => (
                            <button key={status} onClick={() => setFilters((p:any) => ({...p, status: status === 'All' ? 'All' : status}))}
                                className={`px-2 py-1 text-xs rounded-md flex-grow ${filters.status === status ? 'bg-core-accent text-white' : 'bg-core-bg hover:bg-core-border text-core-text-primary'}`}>
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="team-filter" className="text-sm font-semibold text-core-text-secondary mb-2 block">Assigned Team Member</label>
                    <select id="team-filter" value={filters.assignedTeamMembers || 'all'} onChange={e => setFilters((p:any) => ({...p, assignedTeamMembers: e.target.value}))}
                        className="w-full bg-core-bg border-core-border text-core-text-primary rounded-md py-1.5 px-2 text-sm focus:ring-core-accent focus:border-core-accent">
                        <option value="all">All Members</option>
                        {teamMembersList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                 <div>
                    <h4 className="text-sm font-semibold text-core-text-secondary mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {uniqueTags.map(tag => (
                            <button key={tag} onClick={() => handleTagClick(tag)}
                                className={`px-2.5 py-1 text-xs rounded-full ${filters.tags?.includes(tag) ? 'bg-core-accent text-white border-core-accent' : 'bg-core-bg text-core-text-primary hover:bg-core-border border-transparent'} border`}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
             <div className="p-2 border-t border-core-border">
                <button onClick={() => setFilters({})} className="w-full text-center text-sm text-core-text-secondary hover:text-core-text-primary py-1">Clear All Filters</button>
            </div>
        </div>
    )
}

const ActiveFilters: React.FC<{
    filters: any,
    setFilters: React.Dispatch<React.SetStateAction<any>>,
    teamMembers: TeamMember[],
    clearAccountFilter: () => void,
}> = ({ filters, setFilters, teamMembers, clearAccountFilter }) => {
    
    const activeFilters = Object.entries(filters).filter(([, value]) => value && value !== 'all' && (!Array.isArray(value) || value.length > 0));

    if (activeFilters.length === 0) return null;
    
    const removeFilter = (key: string, valueToRemove?: any) => {
        if(key === 'status') clearAccountFilter();

        setFilters((prev: any) => {
            const newFilters = {...prev};
            if(valueToRemove && Array.isArray(newFilters[key])) {
                newFilters[key] = newFilters[key].filter((v:any) => v !== valueToRemove);
            } else {
                 delete newFilters[key];
            }
            return newFilters;
        });
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-core-text-secondary">Active Filters:</span>
            {filters.status && filters.status !== 'all' && (
                 <span className="flex items-center gap-1.5 text-xs text-core-text-primary bg-core-bg-soft/80 px-2 py-1 rounded-full">
                    Status: {filters.status}
                    <button onClick={() => removeFilter('status')} className="text-core-text-secondary hover:text-core-text-primary"><XIcon className="w-3 h-3"/></button>
                </span>
            )}
            {filters.assignedTeamMembers && filters.assignedTeamMembers !== 'all' && (
                 <span className="flex items-center gap-1.5 text-xs text-core-text-primary bg-core-bg-soft/80 px-2 py-1 rounded-full">
                    Team: {teamMembers.find(m => m.id === filters.assignedTeamMembers)?.name || '...'}
                    <button onClick={() => removeFilter('assignedTeamMembers')} className="text-core-text-secondary hover:text-core-text-primary"><XIcon className="w-3 h-3"/></button>
                </span>
            )}
             {filters.tags?.map((tag: string) => (
                 <span key={tag} className="flex items-center gap-1.5 text-xs text-core-text-primary bg-core-bg-soft/80 px-2 py-1 rounded-full">
                    Tag: {tag}
                    <button onClick={() => removeFilter('tags', tag)} className="text-core-text-secondary hover:text-core-text-primary"><XIcon className="w-3 h-3"/></button>
                </span>
            ))}
        </div>
    );
};


export const AccountManagement: React.FC<AccountManagementProps> = (props) => {
    const { currentUser, accounts, teamMembers, tasks, onSaveAccount, onDeleteAccount, navigateToTeamMember, navigateToTask, preselectedAccountId, clearPreselectedAccount, accountFilter, clearAccountFilter, kpiGroups, kpiProgress, weeklySnapshots, onOpenModal } = props;
    const [selectedAccount, setSelectedAccount] = useState<Client | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterButtonRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const accountsWithLastContact = useMemo(() => accounts.map(c => ({
            ...c,
            lastContact: c.pulseLog?.length > 0 ? new Date(c.pulseLog.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).getTime() : 0,
    })), [accounts]);

    const {
        filteredAndSortedItems: filteredAccounts,
        sortConfig,
        requestSort,
        filters,
        setFilters
    } = useFilteredAndSortedItems(accountsWithLastContact, { 
        initialSortKey: 'name', 
        searchKeys: ['name', 'tags', 'poc', 'id', 'status', 'openTasksCount', 'lastContact'],
        searchTerm: debouncedSearchTerm,
    });

    useEffect(() => {
        if(preselectedAccountId) {
            const accountToSelect = accounts.find(c => c.id === preselectedAccountId);
            if(accountToSelect) setSelectedAccount(accountToSelect);
            clearPreselectedAccount();
        }
    }, [preselectedAccountId, accounts, clearPreselectedAccount]);

    useEffect(() => {
        if (accountFilter?.status) {
             setFilters(prev => ({ ...prev, status: accountFilter.status }));
        }
    }, [accountFilter, setFilters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isFilterOpen && filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFilterOpen]);


    const uniqueTags = useMemo(() => [...new Set(accounts.flatMap(c => c.tags))], [accounts]);
    const teamMembersForFilter = useMemo(() => [...teamMembers].sort((a,b) => a.name.localeCompare(b.name)), [teamMembers]);
    
    const stats = useMemo(() => ({
        total: accounts.length,
        healthy: accounts.filter(c => c.status === ClientStatus.Healthy).length,
        atRisk: accounts.filter(c => c.status === ClientStatus.AtRisk).length,
        critical: accounts.filter(c => c.status === ClientStatus.Critical).length,
    }), [accounts]);

    const handleAccountSelect = (account: Client) => {
        setSelectedAccount(account);
    };

    const handleEditAccount = (account: Client) => {
        onOpenModal('account', account);
    };

    const handleAddNewAccount = () => {
        onOpenModal('account', null);
    };
    
    const handleDeleteAccountWithConfirm = async (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        if (!account) return;
        
        const associatedTaskCount = tasks.filter(t => t.clientId === accountId).length;

        try {
            const { confirmationText } = await api.generateDeleteConfirmation('client', account.name, associatedTaskCount);
            if (window.confirm(confirmationText)) {
                onDeleteAccount(accountId);
                if(selectedAccount?.id === accountId) {
                    setSelectedAccount(null);
                }
            }
        } catch (error) {
            console.error("Failed to get AI confirmation, falling back to default.", error);
            if (window.confirm(`Are you sure you want to delete client '${account.name}'? This will also remove ${associatedTaskCount} associated tasks. This action cannot be undone.`)) {
                onDeleteAccount(accountId);
                if(selectedAccount?.id === accountId) {
                    setSelectedAccount(null);
                }
            }
        }
    };

    const handlePanelClose = () => {
        setSelectedAccount(null);
    };

    if (selectedAccount) {
        return (
            <ClientDetailPanel
                isFullPage={true}
                client={selectedAccount}
                currentUser={currentUser}
                onClose={handlePanelClose}
                onEdit={handleEditAccount}
                tasks={tasks}
                teamMembers={teamMembers}
                onSaveClient={onSaveAccount}
                navigateToTeamMember={navigateToTeamMember}
                navigateToTask={navigateToTask}
                kpiGroups={kpiGroups}
                kpiProgress={kpiProgress}
                weeklySnapshots={weeklySnapshots}
            />
        );
    }


    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Account Management"
                description="Oversee client health, tasks, and team assignments."
                icon={<UsersIcon className="w-6 h-6"/>}
                actions={
                    <button onClick={handleAddNewAccount} className="flex items-center bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-core-accent/30">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add New Account
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard onClick={() => setFilters({ status: 'All' })} icon={<UsersIcon className="w-6 h-6 text-indigo-400"/>} title="Total Accounts" value={stats.total} />
                <StatCard onClick={() => setFilters({ status: ClientStatus.Healthy })} icon={<CheckCircleIcon className="w-6 h-6 text-green-400"/>} title="Healthy" value={stats.healthy} />
                <StatCard onClick={() => setFilters({ status: ClientStatus.AtRisk })} icon={<AlertTriangleIcon className="w-6 h-6 text-yellow-400"/>} title="At-Risk" value={stats.atRisk} />
                <StatCard onClick={() => setFilters({ status: ClientStatus.Critical })} icon={<AlertTriangleIcon className="w-6 h-6 text-red-400"/>} title="Critical" value={stats.critical} />
            </div>

            <div className="space-y-3">
                 <div className="flex flex-wrap gap-4 items-center justify-between bg-core-bg-soft p-4 rounded-xl border border-core-border">
                    <div className="relative flex-grow min-w-[250px]">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-core-text-secondary" />
                        <input
                            type="search"
                            placeholder="Search accounts by name, tag, ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-core-bg border border-core-border rounded-lg py-2 pl-10 pr-4 text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div ref={filterButtonRef} className="relative">
                            <button onClick={() => setIsFilterOpen(prev => !prev)} className="flex items-center gap-2 bg-core-bg hover:bg-core-border text-core-text-primary font-medium py-2 px-3 rounded-lg transition-colors border border-core-border">
                                <FilterIcon className="w-4 h-4" /> Filters
                            </button>
                            <FilterPopover isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} setFilters={setFilters} uniqueTags={uniqueTags} teamMembersList={teamMembersForFilter} />
                        </div>
                        <select
                            value={sortConfig.key as string}
                            onChange={(e) => requestSort(e.target.value as SortKey)}
                            className="flex items-center bg-core-bg hover:bg-core-border text-core-text-primary font-medium py-2 px-3 rounded-lg transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-core-accent border border-core-border"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="status">Sort by Status</option>
                            <option value="openTasksCount">Sort by Tasks</option>
                            <option value="lastContact">Sort by Last Contact</option>
                        </select>
                        <button onClick={() => requestSort(sortConfig.key)} className="p-2 bg-core-bg rounded-lg hover:bg-core-border border border-core-border">
                             <SortIcon className={`w-5 h-5 transition-transform duration-200 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="flex bg-core-bg rounded-lg p-1 border border-core-border">
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-border'}`} title="Grid View">
                                <GridIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-border'}`} title="List View">
                                <ListViewIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </div>
                <ActiveFilters filters={filters} setFilters={setFilters} teamMembers={teamMembers} clearAccountFilter={clearAccountFilter} />
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {filteredAccounts.map(account => (
                        <ClientCard 
                          key={account.id} 
                          client={account} 
                          onClientSelect={handleAccountSelect}
                          onEdit={handleEditAccount}
                          onDelete={handleDeleteAccountWithConfirm}
                          navigateToTeamMember={navigateToTeamMember}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-core-bg-soft rounded-xl border border-core-border overflow-x-auto">
                    <table className="min-w-full divide-y divide-core-border">
                        <thead className="bg-core-bg">
                            <tr>
                                <SortableHeader label="Account" sortKey="name" currentSort={sortConfig.key as SortKey} direction={sortConfig.direction} onSort={requestSort} />
                                <SortableHeader label="Status" sortKey="status" currentSort={sortConfig.key as SortKey} direction={sortConfig.direction} onSort={requestSort} />
                                <th className="px-4 py-3 text-left text-xs font-medium text-core-text-secondary uppercase tracking-wider">POC</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-core-text-secondary uppercase tracking-wider">Team</th>
                                <SortableHeader label="Open Tasks" sortKey="openTasksCount" currentSort={sortConfig.key as SortKey} direction={sortConfig.direction} onSort={requestSort} />
                                <SortableHeader label="Last Contact" sortKey="lastContact" currentSort={sortConfig.key as SortKey} direction={sortConfig.direction} onSort={requestSort} />
                            </tr>
                        </thead>
                        <tbody className="bg-core-bg-soft divide-y divide-core-border">
                            {filteredAccounts.map(account => (
                                <AccountListItem key={account.id} account={account} onAccountSelect={handleAccountSelect} navigateToTeamMember={navigateToTeamMember}/>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
