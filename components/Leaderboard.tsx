
import React, { useMemo, useState } from 'react';
import { ACHIEVEMENTS } from '../constants';
import { TeamMember, Achievement, UserAchievement, ShoutOut, DepartmentalRanking, Client, Task, WeeklyPerformanceSnapshot, AccountFilter, TaskFilter, KpiGroup, KpiProgress } from '../types';
import { 
    TrophyIcon, ListIcon, CheckCircleIcon, FlameIcon, BarChartIcon, CrownIcon, ArrowUpIcon, TrendingDownIcon, 
    MinusIcon, RocketIcon, MegaphoneIcon, UserIcon, StarIcon
} from './Icons';
import { timeAgo } from './utils/time';
import { TeamMemberDetailPanel } from './TeamMemberDetailPanel';
import { ShoutOutModal } from './ShoutOutModal';
import { SparklineChart } from './SparklineChart';
import { PerformanceLogModal } from './PerformanceLogModal';
import { PageHeader } from './ui/PageHeader';

interface LeaderboardProps {
    user: TeamMember;
    teamMembers: TeamMember[];
    shoutOuts: ShoutOut[];
    departmentalRankings: DepartmentalRanking[];
    onAddShoutOut: (shoutOut: Omit<ShoutOut, 'id'>) => void;
    onSaveTeamMember: (member: TeamMember) => void;
    tasks: Task[];
    clients: Client[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    navigateToTeamMember: (memberId: string) => void;
    navigateToClient: (filter: Partial<AccountFilter>, clientId?: string) => void;
    navigateToTask: (filter: Partial<TaskFilter>, taskId?: string) => void;
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
    onUpdateKpiProgress: (progressId: string, actual: number) => void;
    onSaveHistoricalSnapshot: (memberId: string, weekOf: string, kpis: {kpiDefId: string, actual: number}[]) => void;
}

type LeaderboardType = 'overall' | 'tasks' | 'kpisMet';

// --- UTILITY & SUB-COMPONENTS ---
const getLeaderboardValue = (member: TeamMember | null | undefined, type: LeaderboardType, withUnit = true) => {
    if(!member) return withUnit ? 'N/A' : 0;
    switch(type) {
        case 'overall': return withUnit ? `${member.performanceScore} pts` : member.performanceScore;
        case 'tasks': return withUnit ? `${member.completedTasksCount} tasks` : member.completedTasksCount;
        case 'kpisMet': return withUnit ? `${member.kpisMetRate}%` : member.kpisMetRate;
    }
}

const RankChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
    if (change > 0) return <span title={`Up ${change}`} className="flex items-center text-green-400"><ArrowUpIcon className="w-4 h-4" /></span>
    if (change < 0) return <span title={`Down ${Math.abs(change)}`} className="flex items-center text-red-400"><TrendingDownIcon className="w-4 h-4" /></span>
    return <span title="No change" className="flex items-center text-core-text-secondary"><MinusIcon className="w-4 h-4" /></span>
}

const WidgetCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }> = ({ title, icon, children, action }) => (
    <div className="bg-core-bg-soft rounded-xl p-4 border border-core-border h-full flex flex-col">
        <div className="flex justify-between items-center mb-3">
            <h3 className="flex items-center text-sm font-semibold text-core-text-secondary">
                {icon}
                <span className="ml-2 uppercase tracking-wider">{title}</span>
            </h3>
            {action}
        </div>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);

const PodiumMember: React.FC<{ member: TeamMember, type: LeaderboardType, onSelect: () => void }> = ({ member, type, onSelect }) => {
    const rank = member.rank;
    const styles: {[key: number]: { height: string; color: string; avatar: string; shadow: string; crown?: boolean }} = {
        1: { height: 'h-40', color: 'text-core-accent', avatar: 'w-24 h-24 text-3xl', shadow: 'shadow-[0_0_15px_rgba(var(--color-core-accent-rgb),0.4)]', crown: true },
        2: { height: 'h-32', color: 'text-core-text-secondary', avatar: 'w-20 h-20 text-2xl', shadow: '' },
        3: { height: 'h-24', color: 'text-core-text-secondary', avatar: 'w-16 h-16 text-xl', shadow: '' }
    };
    const s = styles[rank];
    if (!s) return null;

    return (
        <div className="flex flex-col items-center text-center w-1/3 cursor-pointer" onClick={onSelect}>
            <div className="relative">
                {s.crown && <CrownIcon className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-300 z-10" />}
                <div className={`relative rounded-full bg-core-accent flex items-center justify-center font-bold text-white mx-auto border-4 border-core-bg ${s.avatar} ${s.shadow}`}>
                    {member.avatarInitials}
                </div>
            </div>
            <p className="font-bold text-core-text-primary truncate w-full px-1 mt-2">{member.name}</p>
            <p className={`font-bold ${s.color}`}>{getLeaderboardValue(member, type)}</p>
            <div className={`w-full rounded-t-lg mt-3 flex items-center justify-center font-black bg-core-bg border-t-4 border-core-accent ${s.height}`}>
                <span className={`text-6xl text-core-border`}>{rank}</span>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const Leaderboard: React.FC<LeaderboardProps> = (props) => {
    const { user, teamMembers, shoutOuts, departmentalRankings, onAddShoutOut, onSaveTeamMember, tasks, clients, weeklySnapshots, navigateToTeamMember, navigateToClient, navigateToTask, kpiGroups, kpiProgress, onUpdateKpiProgress, onSaveHistoricalSnapshot } = props;
    const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('overall');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [isShoutOutModalOpen, setShoutOutModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedMemberForLog, setSelectedMemberForLog] = useState<TeamMember | null>(null);
    
    const [spotlightIndex, setSpotlightIndex] = useState(0);

    const leaderboardData = useMemo(() => {
        const getSortKey = (type: LeaderboardType): keyof TeamMember => {
            switch(type) {
                case 'tasks': return 'completedTasksCount';
                case 'kpisMet': return 'kpisMetRate';
                default: return 'performanceScore';
            }
        };

        const sortKey = getSortKey(leaderboardType);
        
        const filteredMembers = departmentFilter === 'all'
            ? teamMembers
            : teamMembers.filter(m => m.department === departmentFilter);

        const sortedMembers = [...filteredMembers].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
        const rankedMembers = sortedMembers.map((member, index) => ({...member, rank: index + 1}));
        
        const prevSortKey = 'previousPerformanceScore';
        const prevSorted = [...filteredMembers].sort((a, b) => (b[prevSortKey] as number) - (a[prevSortKey] as number));
        const prevRanked = new Map(prevSorted.map((m, i) => [m.id, i+1]));

        return rankedMembers.map(m => ({ ...m, previousRank: prevRanked.get(m.id) || m.rank }));

    }, [leaderboardType, departmentFilter, teamMembers]);
    
    const loggedInUserStats = useMemo(() => leaderboardData.find(m => m.id === user.id), [leaderboardData, user.id]);
    const mostImproved = useMemo(() => leaderboardData.length > 0 ? leaderboardData.reduce((prev, current) => ((prev.previousRank - prev.rank) > (current.previousRank - current.rank)) ? prev : current) : null, [leaderboardData]);
    const onFire = useMemo(() => teamMembers.length > 0 ? teamMembers.reduce((prev, current) => (current.onFireStreak > prev.onFireStreak) ? current : prev) : null, [teamMembers]);

    const spotlights = useMemo(() => {
        const spots = [];
        if (leaderboardData.length > 0 && leaderboardData[0]) {
            spots.push({ title: 'Top Performer', icon: <TrophyIcon className="w-5 h-5"/>, member: leaderboardData[0], detail: `${leaderboardData[0]?.performanceScore} pts`, color: 'amber' });
        }
        if (mostImproved) {
            spots.push({ title: 'Most Improved', icon: <RocketIcon className="w-5 h-5"/>, member: mostImproved, detail: `+${mostImproved.previousRank - mostImproved.rank} spots`, color: 'green' });
        }
        if (onFire) {
            spots.push({ title: 'On Fire!', icon: <FlameIcon className="w-5 h-5"/>, member: onFire, detail: `${onFire.onFireStreak}-week streak`, color: 'orange' });
        }
        return spots;
    }, [leaderboardData, mostImproved, onFire]);

    React.useEffect(() => {
        if(spotlights.length === 0) return;
        const timer = setTimeout(() => {
            setSpotlightIndex((prevIndex) => (prevIndex + 1) % spotlights.length);
        }, 5000);
        return () => clearTimeout(timer);
    }, [spotlightIndex, spotlights.length]);

    const myAchievements = user.achievements;
    const unearnedAchievements = ACHIEVEMENTS.filter(ach => !myAchievements.some(myAch => myAch.id === ach.id)).slice(0, 4);

    const podium = leaderboardData.slice(0, 3);
    const podiumIds = new Set(podium.map(p => p.id));
    const restOfLeaderboard = leaderboardData.filter(m => !podiumIds.has(m.id));

    const memberRank1 = podium.find(p => p.rank === 1);
    const memberRank2 = podium.find(p => p.rank === 2);
    const memberRank3 = podium.find(p => p.rank === 3);
    
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
                currentUser={user}
                member={selectedMember}
                onClose={() => setSelectedMember(null)}
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
        <div className="p-6 space-y-6">
            <PageHeader
                title="Leaderboard"
                description="Recognizing team excellence and celebrating growth."
                icon={<TrophyIcon className="w-6 h-6 text-yellow-400"/>}
            />

            <div className="flex justify-between items-center border-b border-core-border pb-3">
                <div className="flex items-center gap-2 bg-core-bg-soft p-1 rounded-lg border border-core-border">
                    {(['overall', 'tasks', 'kpisMet'] as LeaderboardType[]).map(type => (
                        <button key={type} onClick={() => setLeaderboardType(type)}
                            className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${leaderboardType === type ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-bg'}`}>
                            {type === 'overall' && <BarChartIcon className="w-5 h-5"/>}
                            {type === 'tasks' && <ListIcon className="w-5 h-5"/>}
                            {type === 'kpisMet' && <CheckCircleIcon className="w-5 h-5"/>}
                            <span>{type === 'overall' ? 'Overall' : type === 'tasks' ? 'Tasks' : 'KPIs Met'}</span>
                        </button>
                    ))}
                </div>
                <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="bg-core-bg-soft border border-core-border rounded-md py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent text-sm">
                    <option value="all">All Departments</option>
                    {[...new Set(teamMembers.map(m => m.department))].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {podium.length > 0 && (
                         <div className="flex justify-around items-end gap-2 p-4 bg-core-bg-soft/50 rounded-xl border border-core-border min-h-[260px]">
                            {memberRank2 
                                ? <PodiumMember member={memberRank2} type={leaderboardType} onSelect={() => setSelectedMember(memberRank2)} />
                                : <div className="w-1/3" />
                            }
                            {memberRank1
                                ? <PodiumMember member={memberRank1} type={leaderboardType} onSelect={() => setSelectedMember(memberRank1)} />
                                : <div className="w-1/3" />
                            }
                            {memberRank3
                                ? <PodiumMember member={memberRank3} type={leaderboardType} onSelect={() => setSelectedMember(memberRank3)} />
                                : <div className="w-1/3" />
                            }
                         </div>
                    )}

                    <div className="bg-core-bg-soft rounded-xl border border-core-border">
                        {restOfLeaderboard.map((member, index) => (
                           <button key={member.id} onClick={() => setSelectedMember(member)} className={`w-full flex items-center p-3 space-x-4 text-left hover:bg-core-bg transition-colors ${index < restOfLeaderboard.length - 1 ? 'border-b border-core-border' : ''}`}>
                               <span className="text-lg font-semibold text-core-text-secondary w-6 text-center">{member.rank}</span>
                               <div className="w-10 h-10 rounded-full bg-core-accent flex items-center justify-center font-bold text-core-accent-foreground text-sm">
                                   {member.avatarInitials}
                               </div>
                               <div className="flex-1">
                                   <p className="font-semibold text-core-text-primary">{member.name}</p>
                                   <p className="text-xs text-core-text-secondary">{member.role}</p>
                               </div>
                               <div className="w-24 hidden md:block"><SparklineChart data={member.rankHistory}/></div>
                               <div className="w-24 text-right font-bold text-lg text-core-accent">{getLeaderboardValue(member, leaderboardType)}</div>
                               <div className="w-8 text-center"><RankChangeIndicator change={member.previousRank - member.rank} /></div>
                           </button>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {loggedInUserStats && (
                        <WidgetCard title="Your Stats" icon={<UserIcon className="w-4 h-4"/>}>
                             <div className="flex justify-between items-baseline mb-2">
                                <p className="text-core-text-secondary">Rank: <span className="text-2xl font-bold text-core-text-primary">#{loggedInUserStats.rank}</span></p>
                                <p className="text-core-text-secondary">Score: <span className="text-2xl font-bold text-core-text-primary">{getLeaderboardValue(loggedInUserStats, leaderboardType)}</span></p>
                            </div>
                            <div className="w-full bg-core-border rounded-full h-2.5">
                                <div className="bg-core-accent h-2.5 rounded-full" style={{ width: `${(loggedInUserStats.rank > 1 ? (1 - 1/loggedInUserStats.rank)*80 + 10 : 100)}%` }}></div>
                            </div>
                        </WidgetCard>
                    )}

                    {spotlights.length > 0 && <WidgetCard title="Weekly Spotlights" icon={<StarIcon className="w-4 h-4 text-yellow-400"/>}>
                        <div className="text-center">
                            <div className={`w-16 h-16 mb-2 rounded-full bg-${spotlights[spotlightIndex].color}-600 flex items-center justify-center font-bold text-white text-xl mx-auto border-2 border-${spotlights[spotlightIndex].color}-400`}>
                               {spotlights[spotlightIndex].member.avatarInitials}
                            </div>
                            <p className="text-sm font-semibold text-core-text-primary truncate">{spotlights[spotlightIndex].member.name}</p>
                            <p className={`text-xs text-${spotlights[spotlightIndex].color}-400`}>{spotlights[spotlightIndex].title}: <span className="font-bold">{spotlights[spotlightIndex].detail}</span></p>
                        </div>
                    </WidgetCard>}
                    
                    <WidgetCard title="Shout-Outs" icon={<MegaphoneIcon className="w-4 h-4" />} action={
                        <button onClick={() => setShoutOutModalOpen(true)} className="text-xs bg-core-accent text-white px-2 py-1 rounded hover:bg-core-accent-hover">Give Shout-Out</button>
                    }>
                        <div className="space-y-3">
                            {shoutOuts.slice(0, 2).map(s => (
                                <div key={s.id} className="text-sm bg-core-bg p-2 rounded-md">
                                    <p className="text-core-text-secondary">
                                        <b className="text-core-text-primary">{s.from.name}</b> to <b className="text-core-text-primary">{s.to.name}</b>: {s.message}
                                    </p>
                                    <p className="text-right text-xs text-core-text-secondary/50 mt-1">{timeAgo(s.date)}</p>
                                </div>
                            ))}
                        </div>
                    </WidgetCard>
                </div>
            </div>
        </div>
        <ShoutOutModal 
            isOpen={isShoutOutModalOpen}
            onClose={() => setShoutOutModalOpen(false)}
            teamMembers={teamMembers}
            currentUser={user}
            onAddShoutOut={onAddShoutOut}
        />
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
        </>
    );
};