
import React, { useState, useEffect, useMemo } from 'react';
import { Client, TeamMember, KpiGroup } from '../types';
import { TargetIcon } from './Icons';
import { Modal } from './ui/Modal';

interface ManageClientKpisModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    teamMembers: TeamMember[];
    kpiGroups: KpiGroup[];
    onSave: (clientId: string, kpis: { teamMemberId: string; kpiDefinitionId: string; }[]) => void;
}

export const ManageClientKpisModal: React.FC<ManageClientKpisModalProps> = ({ isOpen, onClose, client, teamMembers, kpiGroups, onSave }) => {
    const [selectedKpis, setSelectedKpis] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isOpen && client?.trackedKpis) {
            const initialSelection: Record<string, boolean> = {};
            client.trackedKpis.forEach(kpi => {
                initialSelection[`${kpi.teamMemberId}-${kpi.kpiDefinitionId}`] = true;
            });
            setSelectedKpis(initialSelection);
        } else if(isOpen) {
            setSelectedKpis({});
        }
    }, [client, isOpen]);

    const availableKpis = useMemo(() => {
        if (!client) return [];
        const clientTeamMemberIds = new Set(client.assignedTeamMembers);
        return teamMembers
            .filter(m => clientTeamMemberIds.has(m.id) && m.kpiGroupId)
            .flatMap(member => {
                const group = kpiGroups.find(g => g.id === member.kpiGroupId);
                if (!group) return [];
                return group.kpis.map(kpiDef => ({
                    member,
                    kpiDef,
                }));
            });
    }, [client, teamMembers, kpiGroups]);

    const handleToggle = (memberId: string, kpiDefId: string) => {
        const key = `${memberId}-${kpiDefId}`;
        setSelectedKpis(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        if (!client) return;
        const kpisToSave = Object.entries(selectedKpis)
            .filter(([, isSelected]) => isSelected)
            .map(([key]) => {
                const [teamMemberId, kpiDefinitionId] = key.split('-');
                return { teamMemberId, kpiDefinitionId };
            });
        onSave(client.id, kpisToSave);
        onClose();
    };

    if (!isOpen || !client) return null;

    const footer = (
        <>
            <button onClick={onClose} className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} className="bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-bold py-2 px-4 rounded-lg">Save KPIs</button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Manage Tracked KPIs for ${client.name}`}
            icon={<TargetIcon className="w-6 h-6 text-core-accent" />}
            size="2xl"
            footer={footer}
        >
            <div className="space-y-4">
                {availableKpis.length > 0 ? (
                    <div className="space-y-2">
                            {availableKpis.map(({ member, kpiDef }) => (
                            <label key={`${member.id}-${kpiDef.id}`} className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-core-border/50 cursor-pointer border ${selectedKpis[`${member.id}-${kpiDef.id}`] ? 'bg-core-accent-light border-core-accent' : 'bg-core-bg-soft border-core-border'}`}>
                                <input
                                    type="checkbox"
                                    checked={!!selectedKpis[`${member.id}-${kpiDef.id}`]}
                                    onChange={() => handleToggle(member.id, kpiDef.id)}
                                    className="h-5 w-5 rounded border-core-border text-core-accent bg-core-bg-soft focus:ring-core-accent flex-shrink-0"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-core-text-primary">{kpiDef.name}</p>
                                    <p className="text-sm text-core-text-secondary">From: {member.name} ({member.role})</p>
                                </div>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-core-text-secondary py-8">No KPIs available from assigned team members.</p>
                )}
            </div>
        </Modal>
    );
};
