
import React, { useMemo } from 'react';
import { TeamMember, Client } from '../types';
import { 
    UsersIcon, 
    ListIcon, 
    TargetIcon, 
    ArrowUpIcon, 
    TrendingDownIcon, 
    MinusIcon,
    FlameIcon,
    SparklesIcon
} from './Icons';

interface TeamMemberCardProps {
  member: TeamMember;
  onMemberSelect: (member: TeamMember) => void;
  onViewContext: (member: TeamMember) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (memberId: string) => void;
  clients: Client[];
}

const StatItem: React.FC<{icon: React.ReactNode, label: string, value: string | number}> = ({icon, label, value}) => (
    <div className="bg-core-bg p-3 rounded-lg text-center flex-1">
        <div className="w-8 h-8 rounded-full bg-core-bg-soft/60 flex items-center justify-center mx-auto mb-1.5 text-core-text-secondary">
            {icon}
        </div>
        <p className="text-xl font-bold text-core-text-primary">{value}</p>
        <p className="text-xs text-core-text-secondary">{label}</p>
    </div>
);

const RankChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
    if (change > 0) return <span title={`Up ${change} ranks`} className="flex items-center text-green-400"><ArrowUpIcon className="w-4 h-4" /></span>
    if (change < 0) return <span title={`Down ${Math.abs(change)} ranks`} className="flex items-center text-red-400"><TrendingDownIcon className="w-4 h-4" /></span>
    return <span title="No rank change" className="flex items-center text-core-text-secondary"><MinusIcon className="w-4 h-4" /></span>
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, clients, onMemberSelect, onViewContext }) => {
  const { clientCount, openTasksCount } = useMemo(() => {
    const count = clients.filter(c => c.assignedTeamMembers.includes(member.id)).length;
    const tasks = member.taskSnapshot ? member.taskSnapshot.pending + member.taskSnapshot.inProgress + member.taskSnapshot.overdue : 0;
    return { clientCount: count, openTasksCount: tasks };
  }, [member.taskSnapshot, clients, member.id]);

  const performanceScore = member.performanceScore || 0;
  
  const scoreColor = performanceScore >= 85 ? 'text-green-500' : performanceScore >= 70 ? 'text-yellow-500' : 'text-red-500';
  const scoreBgColor = performanceScore >= 85 ? 'bg-green-500' : performanceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500';
  const rankChange = member.previousRank - member.rank;

  return (
    <div 
      onClick={() => onMemberSelect(member)}
      className="bg-core-bg-soft rounded-lg p-5 flex flex-col space-y-4 border border-core-border transition-all duration-300 cursor-pointer group relative overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-core-accent/10"
    >
      <button
            onClick={(e) => {
                e.stopPropagation();
                onViewContext(member);
            }}
            title="Get AI Context"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-core-bg text-core-text-secondary opacity-0 group-hover:opacity-100 transition-all hover:bg-core-accent-light hover:text-core-accent z-10"
        >
            <SparklesIcon className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-core-accent to-blue-500 flex items-center justify-center font-bold text-white text-2xl flex-shrink-0 border-2 border-core-border">
          {member.avatarInitials}
        </div>
        <div className="overflow-hidden flex-1">
          <h3 className="font-bold text-lg text-core-text-primary leading-tight truncate">{member.name}</h3>
          <p className="text-sm text-core-accent truncate">{member.role}</p>
        </div>
        <div className="flex items-center gap-2">
            <RankChangeIndicator change={rankChange} />
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs font-medium text-core-text-secondary">Performance</span>
            <span className={`text-xl font-bold ${scoreColor}`}>{performanceScore}<span className="text-sm">pts</span></span>
        </div>
        <div className="w-full bg-core-bg rounded-full h-2">
            <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${scoreBgColor}`} 
            style={{ width: `${performanceScore}%`}}
            ></div>
        </div>
      </div>
      

      <div className="flex gap-2 text-center pt-2 border-t border-core-border">
         <StatItem icon={<UsersIcon className="w-5 h-5"/>} label="Clients" value={clientCount} />
         <StatItem icon={<ListIcon className="w-5 h-5"/>} label="Open Tasks" value={openTasksCount} />
         <StatItem icon={<TargetIcon className="w-5 h-5"/>} label="KPIs Met" value={`${member.kpisMetRate}%`} />
      </div>
      
       {member.onFireStreak > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 text-orange-400 font-semibold text-xs bg-core-bg px-2 py-1 rounded-full" title="On Fire Streak">
                <FlameIcon className="w-4 h-4"/>
                <span>{member.onFireStreak}w</span>
            </div>
        )}
    </div>
  );
};
