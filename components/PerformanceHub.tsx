
import React, { useMemo, useState, useRef } from 'react';
import { TeamMember, WeeklyPerformanceSnapshot, KpiProgress, KpiGroup, KpiDefinition, View, Client } from '../types';
import { BarChartIcon, TrendingUpIcon, TrophyIcon, CalendarIcon, ArrowDownIcon, PlusIcon, EditIcon, TrashIcon, TargetIcon, ListIcon, ArrowUpIcon, TrendingDownIcon, MinusIcon, FlameIcon, RocketIcon, LinkIcon, LayoutGridIcon } from './Icons';
import { TeamMemberDetailPanel } from './TeamMemberDetailPanel';
import { KpiGroupModal } from './KpiGroupModal';
import { PageHeader } from './ui/PageHeader';

// --- SUB-COMPONENTS ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-core-bg-soft p-4 rounded-xl flex items-center border border-core-border">
        <div className="p-3 rounded-lg bg-core-bg mr-4">{icon}</div>
        <div>
            <p className="text-xs text-core-text-secondary tracking-wider uppercase">{title}</p>
            <p className="text-2xl font-bold text-core-text-primary truncate">{value}</p>
        </div>
    </div>
);

const KpiCell: React.FC<{
    progress?: KpiProgress;
    definition?: KpiDefinition;
    snapshot?: WeeklyPerformanceSnapshot['kpiSnapshots'][0];
}> = ({ progress, definition, snapshot }) => {
    const data = snapshot || (progress && definition ? { actual: progress.actual, ...definition } : null);

    if (!data) {
        return <span className="text-core-text-secondary/50 text-center block">-</span>;
    }
    
    const { actual, goal, type } = data;
    const kpiProgress = goal > 0 ? (actual / goal) * 100 : 0;
    
    let colorClass = 'bg-slate-500';
    if (kpiProgress >= 100) colorClass = 'bg-green-500';
    else if (kpiProgress >= 70) colorClass = 'bg-yellow-500';
    else if (kpiProgress > 0) colorClass = 'bg-red-500';

    return (
        <div className="space-y-1.5 min-w-[150px]">
            <div className="flex justify-between items-center">
                 <span className="font-bold text-core-text-primary">{actual}{type === 'percentage' && '%'}</span>
                 <span className="text-xs text-core-text-secondary">/ {goal}{type === 'percentage' && '%'}</span>
            </div>
            <div className="w-full bg-core-bg rounded-full h-1.5">
                <div className={`${colorClass} h-1.5 rounded-full`} style={{ width: `${Math.min(kpiProgress, 100)}%` }}></div>
            </div>
        </div>
    );
};

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
    if (data.length < 2) return null;
    const width = 100;
    const height = 20;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / range) * (height - 2) - 1}`).join(' ');

    return <svg width={width} height={height}><polyline fill="none" stroke="var(--color-core-accent)" strokeWidth="1.5" points={points}/></svg>;
};

const TeamPerformanceTrendChart: React.FC<{ weeklySnapshots: WeeklyPerformanceSnapshot[], teamMembers: TeamMember[] }> = ({ weeklySnapshots, teamMembers }) => {
    const trendData = useMemo(() => {
        const weeks = [...new Set(weeklySnapshots.map(s => s.weekOf))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        if (weeks.length < 2) return null;

        const data = weeks.map((week: string) => {
            const snapshotsForWeek = weeklySnapshots.filter(s => s.weekOf === week);
            const avgScore = snapshotsForWeek.length > 0
                ? Math.round(snapshotsForWeek.reduce((sum, s) => sum + s.performanceScore, 0) / snapshotsForWeek.length)
                : 0;
            return { week: new Date(week).toLocaleDateString('en-us', {month:'short', day:'numeric'}), score: avgScore };
        });

        // Add current score
        const currentAvg = teamMembers.length > 0 ? Math.round(teamMembers.reduce((acc, m) => acc + m.performanceScore, 0) / teamMembers.length) : 0;
        data.push({ week: 'Current', score: currentAvg });

        return data.slice(-8); // Show last 8 periods
    }, [weeklySnapshots, teamMembers]);
    
    if (!trendData) return <div className="text-center text-core-text-secondary py-8">Not enough historical data for a trend.</div>;

    const maxScore = Math.max(...trendData.map(d => d.score), 100);

    return (
        <div className="h-48 flex items-end gap-3">
            {trendData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                     <span className="text-xs font-bold text-core-text-primary opacity-0 group-hover:opacity-100 transition-opacity">{d.score}</span>
                    <div className="w-full h-full flex items-end">
                       <div 
                           className="w-full bg-core-accent rounded-t-md hover:bg-core-accent-hover transition-colors" 
                           style={{ height: `${(d.score / maxScore) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-core-text-secondary">{d.week}</span>
                </div>
            ))}
        </div>
    );
};

const RankChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
    if (change > 0) return <span title={`Up ${change}`} className="flex items-center text-green-500"><ArrowUpIcon className="w-3.5 h-3.5" /></span>
    if (change < 0) return <span title={`Down ${Math.abs(change)}`} className="flex items-center text-red-500"><TrendingDownIcon className="w-3.5 h-3.5" /></span>
    return <span title="No change" className="flex items-center text-core-text-secondary"><MinusIcon className="w-3.5 h-3.5" /></span>
}

type SortKey = 'rank' | 'performanceScore' | 'name' | string;
type SortDirection = 'asc' | 'desc';

const SortableHeader: React.FC<{label: string; sortKey: SortKey; currentSort: SortKey; direction: SortDirection; onSort: (key: SortKey) => void; className?: string}> = ({ label, sortKey, currentSort, direction, onSort, className }) => (
    <th onClick={() => onSort(sortKey)} className={`px-4 py-3 text-left text-xs font-medium text-core-text-secondary uppercase tracking-wider cursor-pointer hover:bg-core-bg ${className}`}>
        <div className="flex items-center">
            {label}
            {currentSort === sortKey && <ArrowDownIcon className={`w-4 h-4 ml-1.5 transition-transform ${direction === 'asc' ? 'rotate-180' : ''}`} />}
        </div>
    </th>
);

type PerformanceCardMember = TeamMember & {
    performanceScore: number;
    kpis: (KpiDefinition | WeeklyPerformanceSnapshot['kpiSnapshots'][0])[];
    isCurrent: boolean;
    rank: number;
};

const PerformanceCard: React.FC<{ member: PerformanceCardMember; isCurrent: boolean; kpiProgress: KpiProgress[]; navigateToTeamMember: (memberId: string) => void; }> = ({ member, isCurrent, kpiProgress, navigateToTeamMember }) => {
    const scoreColor = member.performanceScore >= 90 ? 'text-green-400' : member.performanceScore >= 70 ? 'text-yellow-400' : 'text-red-400';
    return (
        <div className="bg-core-bg rounded-xl p-4 border border-core-border hover:border-core-accent/50 transition-all cursor-pointer" onClick={() => navigateToTeamMember(member.id)}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <span className="text-2xl font-bold text-core-text-secondary">#{member.rank}</span>
                     <div className="w-10 h-10 rounded-full bg-core-accent flex-shrink-0 flex items-center justify-center font-bold text-sm text-core-accent-foreground">{member.avatarInitials}</div>
                     <div className="overflow-hidden">
                         <p className="font-bold text-core-text-primary truncate">{member.name}</p>
                         <p className="text-xs text-core-text-secondary truncate">{member.role}</p>
                     </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="flex items-baseline justify-end gap-1.5">
                        <span className={`text-3xl font-bold ${scoreColor}`}>{member.performanceScore}</span>
                        <span className="text-sm text-core-text-secondary">pts</span>
                        {isCurrent && <RankChangeIndicator change={member.previousRank - member.rank} />}
                    </div>
                </div>
            </div>
            <div className="mt-4 border-t border-core-border pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(member.kpis).map(kpi => {
                    let kpiData;
                    if ('actual' in kpi) {
                        kpiData = kpi;
                    } else {
                        const progress = kpiProgress.find(p => p.teamMemberId === member.id && p.kpiDefinitionId === kpi.id);
                        kpiData = { actual: progress?.actual ?? 0, ...kpi };
                    }

                    const kpiPercentage = kpiData.goal > 0 ? (kpiData.actual / kpiData.goal) * 100 : 0;
                    let colorClass = 'bg-slate-500';
                    if (kpiPercentage >= 100) colorClass = 'bg-green-500';
                    else if (kpiPercentage >= 70) colorClass = 'bg-yellow-500';
                    else if (kpiPercentage > 0) colorClass = 'bg-red-500';

                    return (
                        <div key={kpiData.name || kpiData.id} className="text-sm">
                            <p className="font-semibold text-core-text-secondary truncate">{kpiData.name}</p>
                            <div className="flex justify-between text-xs text-core-text-secondary mt-1">
                                <span>{kpiData.actual}{kpiData.type === 'percentage' && '%'}</span>
                                <span>{kpiData.goal}{kpiData.type === 'percentage' && '%'}</span>
                            </div>
                            <div className="w-full bg-core-bg rounded-full h-1 mt-1">
                                <div className={`${colorClass} h-1 rounded-full`} style={{ width: `${Math.min(kpiPercentage, 100)}%` }}></div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const PerformanceHub: React.FC<{
    teamMembers: TeamMember[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
    onEndWeek: () => void;
    onSaveKpiGroup: (group: KpiGroup) => void;
    onDeleteKpiGroup: (groupId: string) => void;
    navigateToTeamMember: (memberId: string) => void;
}> = ({ teamMembers, weeklySnapshots, kpiGroups, kpiProgress, onEndWeek, onSaveKpiGroup, onDeleteKpiGroup, navigateToTeamMember }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'rank', direction: 'asc' });
    const [isKpiGroupModalOpen, setIsKpiGroupModalOpen] = useState(false);
    const [editingKpiGroup, setEditingKpiGroup] = useState<KpiGroup | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'kpi_groups'>('overview');
    const [selectedWeek, setSelectedWeek] = useState<string>('current');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    
    const weekOptions = useMemo(() => {
        const snapshotWeeks = [...new Set(weeklySnapshots.map(s => s.weekOf))];
        snapshotWeeks.sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
        return ['current', ...snapshotWeeks];
    }, [weeklySnapshots]);
    
    const { performanceData, uniqueKpiNames } = useMemo(() => {
        const isCurrent = selectedWeek === 'current';
        const allKpiNames = new Set<string>();

        const data = teamMembers.map(member => {
            if (isCurrent) {
                const group = kpiGroups.find(g => g.id === member.kpiGroupId);
                group?.kpis.forEach(kpi => allKpiNames.add(kpi.name));
                return { member, kpis: group?.kpis || [], isCurrent };
            } else {
                const snapshot = weeklySnapshots.find(s => s.teamMemberId === member.id && s.weekOf === selectedWeek);
                snapshot?.kpiSnapshots?.forEach(kpi => allKpiNames.add(kpi.name));
                return { member, snapshot, kpis: snapshot?.kpiSnapshots || [], isCurrent };
            }
        });

        return { performanceData: data, uniqueKpiNames: Array.from(allKpiNames) };
    }, [selectedWeek, teamMembers, kpiGroups, weeklySnapshots]);

    const rankedPerformanceData: PerformanceCardMember[] = useMemo(() => {
        return performanceData
            .map(data => ({
                ...data.member,
                performanceScore: data.isCurrent ? data.member.performanceScore : data.snapshot?.performanceScore ?? 0,
                kpis: data.kpis,
                isCurrent: data.isCurrent,
                rank: 0, // placeholder
            }))
            .sort((a,b) => b.performanceScore - a.performanceScore)
            .map((m, i) => ({...m, rank: i+1}));
    }, [performanceData]);
    
    const sortedMembers: PerformanceCardMember[] = useMemo(() => {
        return [...rankedPerformanceData].sort((a, b) => {
            let valA, valB;
            const { key, direction } = sortConfig;
    
            if (key === 'rank' || key === 'performanceScore' || key === 'name') {
                valA = a[key as keyof typeof a];
                valB = b[key as keyof typeof b];
            } else {
                // This part handles sorting by a dynamic KPI name
                const kpiName = key;
                const getKpiActual = (member: PerformanceCardMember) => {
                    const kpi = member.kpis.find(k => k.name === kpiName);
                    if (!kpi) return -1;

                    if ('actual' in kpi) { // Is a snapshot kpi, has `actual` property
                        return kpi.actual;
                    }
                    
                    // Is a KpiDefinition, need to look up progress
                    const progress = kpiProgress.find(p => p.teamMemberId === member.id && p.kpiDefinitionId === kpi.id);
                    return progress ? progress.actual : -1;
                };
                valA = getKpiActual(a);
                valB = getKpiActual(b);
            }
    
            if (typeof valA === 'string' && typeof valB === 'string') {
                return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
    
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [rankedPerformanceData, sortConfig, kpiProgress]);

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleAddNewKpiGroup = () => {
        setEditingKpiGroup(null);
        setIsKpiGroupModalOpen(true);
    };

    const handleEditKpiGroup = (group: KpiGroup) => {
        setEditingKpiGroup(group);
        setIsKpiGroupModalOpen(true);
    };

    const handleDeleteKpiGroupWithConfirm = (groupId: string) => {
        if(window.confirm("Are you sure you want to delete this KPI Group? This will unassign it from all members and delete related progress data.")) {
            onDeleteKpiGroup(groupId);
        }
    }

    const { mostImproved, onFire } = useMemo(() => ({
        mostImproved: teamMembers.length > 0 ? teamMembers.reduce((p, c) => ((p.previousRank - p.rank) > (c.previousRank - c.rank)) ? p : c) : null,
        onFire: teamMembers.length > 0 ? teamMembers.reduce((p, c) => (c.onFireStreak > p.onFireStreak) ? p : c) : null,
    }), [teamMembers]);
    
    return (
        <div className="p-6 space-y-6">
            <PageHeader 
                title="Performance Hub"
                description="Monitor, manage, and boost team performance."
                icon={<TrophyIcon className="w-6 h-6"/>}
                actions={
                    <button onClick={onEndWeek} className="flex items-center bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-bold py-2 px-4 rounded-lg transition-colors shadow-lg hover:shadow-core-accent/30">
                        <CalendarIcon className="w-5 h-5 mr-2"/> End & Archive Week
                    </button>
                }
            />
            
             <div className="flex items-center gap-2 bg-core-bg-soft p-2 rounded-xl border border-core-border">
                <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md font-semibold ${activeTab === 'overview' ? 'bg-core-accent text-white' : 'text-core-text-primary hover:bg-core-border'}`}>
                    <BarChartIcon className="w-5 h-5"/> Performance Overview
                </button>
                <button onClick={() => setActiveTab('kpi_groups')} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md font-semibold ${activeTab === 'kpi_groups' ? 'bg-core-accent text-white' : 'text-core-text-primary hover:bg-core-border'}`}>
                    <TargetIcon className="w-5 h-5"/> KPI Groups
                </button>
            </div>

            {activeTab === 'overview' ? (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-core-bg-soft p-5 rounded-xl border border-core-border">
                        <h3 className="text-lg font-bold text-core-text-primary mb-4">Team Performance Trend (Avg Score)</h3>
                        <TeamPerformanceTrendChart weeklySnapshots={weeklySnapshots} teamMembers={teamMembers} />
                    </div>
                    <div className="space-y-4">
                        <StatCard title="Most Improved" value={mostImproved?.name || 'N/A'} icon={<RocketIcon className="w-6 h-6 text-green-400" />} />
                        <StatCard title="On Fire Streak" value={onFire?.name || 'N/A'} icon={<FlameIcon className="w-6 h-6 text-orange-400" />} />
                    </div>
                </div>
            
                <div className="bg-core-bg-soft rounded-xl border border-core-border">
                    <div className="p-4 border-b border-core-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-core-text-primary">Weekly Performance Ranking</h3>
                        <div className="flex items-center gap-2">
                             <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="bg-core-bg border-core-border rounded-lg py-1 px-3 text-sm text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent">
                                {weekOptions.map(week => {
                                    const label = week === 'current' ? 'Current Week' : `Week of ${new Date(week as string).toLocaleDateString()}`;
                                    return <option key={week} value={week}>{label}</option>;
                                })}
                            </select>
                            <div className="flex bg-core-bg rounded-lg p-1 border border-core-border">
                                <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-border'}`} title="Table View">
                                    <ListIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md ${viewMode === 'cards' ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-border'}`} title="Cards View">
                                    <LayoutGridIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                    {viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-core-border">
                                <thead className="bg-core-bg">
                                    <tr>
                                        <SortableHeader label="Rank" sortKey="rank" currentSort={sortConfig.key} direction={sortConfig.direction} onSort={handleSort} className="w-20"/>
                                        <SortableHeader label="Team Member" sortKey="name" currentSort={sortConfig.key} direction={sortConfig.direction} onSort={handleSort} />
                                        <SortableHeader label="Score" sortKey="performanceScore" currentSort={sortConfig.key} direction={sortConfig.direction} onSort={handleSort} />
                                        {uniqueKpiNames.map(kpiName => <SortableHeader key={kpiName} label={kpiName} sortKey={kpiName} currentSort={sortConfig.key} direction={sortConfig.direction} onSort={handleSort} />)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-core-border">
                                    {sortedMembers.map(member => (
                                        <tr key={member.id} className="hover:bg-core-bg cursor-pointer" onClick={() => navigateToTeamMember(member.id)}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg text-core-text-primary w-6 text-center">{member.rank}</span>
                                                    {member.isCurrent && <RankChangeIndicator change={member.previousRank - member.rank} />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-core-accent flex-shrink-0 flex items-center justify-center font-bold text-sm text-core-accent-foreground">{member.avatarInitials}</div>
                                                    <div>
                                                        <p className="font-semibold text-core-text-primary">{member.name}</p>
                                                        <p className="text-xs text-core-text-secondary">{member.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-lg font-bold text-core-accent">{member.performanceScore}</td>
                                            {uniqueKpiNames.map(kpiName => (
                                                <td key={kpiName} className="px-4 py-3 whitespace-nowrap">
                                                    <KpiCell 
                                                        progress={member.isCurrent ? kpiProgress.find(p => p.teamMemberId === member.id && p.kpiDefinitionId === (member.kpis as KpiDefinition[]).find(k => k.name === kpiName)?.id) : undefined} 
                                                        definition={member.isCurrent ? (member.kpis as KpiDefinition[]).find(k => k.name === kpiName) : undefined}
                                                        snapshot={!member.isCurrent ? (member.kpis as WeeklyPerformanceSnapshot['kpiSnapshots']).find(k => k.name === kpiName) : undefined}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {sortedMembers.map(member => (
                                <PerformanceCard key={member.id} member={member} isCurrent={member.isCurrent} kpiProgress={kpiProgress} navigateToTeamMember={navigateToTeamMember}/>
                            ))}
                        </div>
                    )}
                </div>
            </>
            ) : (
                <div className="bg-core-bg-soft rounded-xl border border-core-border p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-core-text-primary">Manage KPI Groups</h3>
                        <button onClick={handleAddNewKpiGroup} className="flex items-center bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-bold py-2 px-3 rounded-lg text-sm transition-colors">
                           <PlusIcon className="w-4 h-4 mr-2"/> Add New Group
                        </button>
                    </div>
                     <div className="space-y-4">
                        {kpiGroups.map(group => (
                            <div key={group.id} className="bg-core-bg p-4 rounded-lg border border-core-border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-core-text-primary text-lg">{group.name}</h4>
                                        <p className="text-sm text-core-accent">For Role: {group.role}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditKpiGroup(group)} className="p-2 text-core-text-secondary hover:text-white"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteKpiGroupWithConfirm(group.id)} className="p-2 text-core-text-secondary hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-core-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {group.kpis.map(kpi => (
                                        <div key={kpi.id} className="bg-core-bg-soft/50 p-2 rounded-md">
                                            <p className="font-semibold text-sm text-core-text-primary">{kpi.name}</p>
                                            <p className="text-xs text-core-text-secondary">Goal: {kpi.goal}{kpi.type==='percentage' && '%'} | Points: {kpi.points}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <KpiGroupModal 
                isOpen={isKpiGroupModalOpen}
                onClose={() => setIsKpiGroupModalOpen(false)}
                onSave={onSaveKpiGroup}
                group={editingKpiGroup}
            />
        </div>
    );
};