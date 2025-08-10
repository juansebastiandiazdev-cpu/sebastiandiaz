
import React, { useMemo } from 'react';
import { Client, ClientStatus } from '../types';
import { 
    UsersIcon, ListIcon, ClockIcon,
    EditIcon, TrashIcon, LinkIcon, EllipsisVerticalIcon
} from './Icons';
import { timeAgo } from './utils/time';

interface ClientCardProps {
  client: Client;
  onClientSelect: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  navigateToTeamMember: (memberId: string) => void;
}

const statusClasses: Record<ClientStatus, { border: string; }> = {
  [ClientStatus.Healthy]: { border: 'border-green-500' },
  [ClientStatus.AtRisk]: { border: 'border-yellow-500' },
  [ClientStatus.Critical]: { border: 'border-red-500' },
};

const TeamAvatarStack: React.FC<{ members: Client['team'], onClick: (e: React.MouseEvent) => void }> = ({ members, onClick }) => (
    <div className="flex items-center cursor-pointer" onClick={onClick}>
        {members.slice(0, 3).map(member => (
            <div key={member.id} className="w-8 h-8 rounded-full bg-core-accent flex items-center justify-center text-core-accent-foreground text-xs font-bold border-2 border-core-bg-soft -ml-2 first:ml-0" title={member.name}>
                {member.avatarInitials}
            </div>
        ))}
        {members.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-core-text-secondary/50 flex items-center justify-center text-white text-xs font-bold border-2 border-core-bg-soft -ml-2">
                +{members.length - 3}
            </div>
        )}
    </div>
);

const StatItem: React.FC<{icon: React.ReactNode, value: string | number, tooltip: string}> = ({icon, value, tooltip}) => (
    <div className="flex items-center gap-1.5 text-core-text-secondary" title={tooltip}>
        {icon}
        <span className="font-medium text-sm text-core-text-primary">{value}</span>
    </div>
);

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClientSelect, onEdit, onDelete, navigateToTeamMember }) => {
    
    const lastContact = useMemo(() => {
        const lastEntry = client.pulseLog?.length > 0
            ? client.pulseLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            : null;
        return lastEntry ? timeAgo(lastEntry.date) : 'N/A';
    }, [client.pulseLog]);
    
    const style = statusClasses[client.status];

    return (
        <div 
            onClick={() => onClientSelect(client)}
            className={`bg-core-bg-soft rounded-lg p-5 flex flex-col space-y-4 border border-core-border hover:border-core-accent/50 transition-all duration-300 relative group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-core-accent/5 ${style.border} border-l-4`}
        >
            <div className="flex items-start justify-between">
                <h3 className="font-bold text-lg text-core-text-primary leading-tight pr-8">{client.name}</h3>
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                        {client.sharepointFolderLink && (
                          <a href={client.sharepointFolderLink.startsWith('http') ? client.sharepointFolderLink : `https://${client.sharepointFolderLink}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-full text-core-text-secondary hover:bg-core-border hover:text-core-accent transition-colors" title="Open SharePoint Folder">
                              <LinkIcon className="w-5 h-5" />
                          </a>
                        )}
                    </div>
                </div>
            </div>
            
            <p className="text-sm text-core-text-secondary leading-snug flex-1">
                {client.notes.substring(0, 100)}{client.notes.length > 100 && '...'}
            </p>

            <div className="grid grid-cols-3 gap-x-4 gap-y-3 pt-3 border-t border-core-border">
                 <StatItem icon={<ListIcon className="w-4 h-4 text-blue-400"/>} value={client.openTasksCount} tooltip="Open Tasks" />
                 <StatItem icon={<UsersIcon className="w-4 h-4 text-purple-400"/>} value={client.team.length} tooltip="Team Size" />
                 <StatItem icon={<ClockIcon className="w-4 h-4 text-slate-400"/>} value={lastContact} tooltip="Last Contact" />
            </div>

            <div className="mt-auto flex items-center justify-between pt-2">
                 <TeamAvatarStack 
                    members={client.team} 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (client.team[0]) navigateToTeamMember(client.team[0].id);
                    }} 
                />
            </div>
        </div>
    );
};
