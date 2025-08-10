
import React, { useState, useEffect, useMemo } from 'react';
import { TeamMember, KpiGroup, KpiProgress, WeeklyPerformanceSnapshot } from '../types';
import { TargetIcon } from './Icons';
import { Modal } from './ui/Modal';

interface PerformanceLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: TeamMember | null;
    kpiGroup: KpiGroup | null;
    kpiProgress: KpiProgress[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    onUpdateKpiProgress: (progressId: string, actual: number) => void;
    onSaveHistoricalSnapshot: (memberId: string, weekOf: string, kpis: {kpiDefId: string, actual: number}[]) => void;
}

// Function to get the start of the week (Monday)
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

export const PerformanceLogModal: React.FC<PerformanceLogModalProps> = ({ 
    isOpen, onClose, member, kpiGroup, kpiProgress, onUpdateKpiProgress, weeklySnapshots, onSaveHistoricalSnapshot 
}) => {
    const [localProgress, setLocalProgress] = useState<Record<string, number>>({});
    const [selectedWeek, setSelectedWeek] = useState<string>('current');

    const weekOptions = useMemo(() => {
        const snapshotWeeks = [...new Set(weeklySnapshots.filter(s => s.teamMemberId === member?.id).map(s => s.weekOf))];
        const lastFourWeeks: string[] = [];
        for(let i=0; i<4; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            lastFourWeeks.push(getStartOfWeek(date));
        }
        
        const allWeeks = [...new Set(['current', ...snapshotWeeks, ...lastFourWeeks])];
        allWeeks.sort((a: string, b: string) => {
            if (a === 'current') return -1;
            if (b === 'current') return 1;
            return new Date(b).getTime() - new Date(a).getTime();
        });
        return allWeeks;
    }, [weeklySnapshots, member]);

    useEffect(() => {
        if (isOpen && member && kpiGroup) {
            const initialProgress: Record<string, number> = {};
            const isCurrent = selectedWeek === 'current';
            const snapshotForWeek = isCurrent ? null : weeklySnapshots.find(s => s.teamMemberId === member.id && s.weekOf === selectedWeek);

            kpiGroup.kpis.forEach(kpiDef => {
                if (isCurrent) {
                    const progressEntry = kpiProgress.find(p => p.teamMemberId === member.id && p.kpiDefinitionId === kpiDef.id);
                    initialProgress[kpiDef.id] = progressEntry?.actual || 0;
                } else {
                    const snapshotKpi = snapshotForWeek?.kpiSnapshots?.find(k => k.name === kpiDef.name);
                    initialProgress[kpiDef.id] = snapshotKpi?.actual || 0;
                }
            });
            setLocalProgress(initialProgress);
        } else if (!isOpen) {
            setSelectedWeek('current'); // Reset on close
        }
    }, [isOpen, member, kpiGroup, kpiProgress, selectedWeek, weeklySnapshots]);

    const handleInputChange = (kpiDefId: string, value: string) => {
        setLocalProgress(prev => ({ ...prev, [kpiDefId]: parseFloat(value) || 0 }));
    };

    const handleSaveChanges = () => {
        if (!member) return;
        if (selectedWeek === 'current' && kpiGroup) {
            kpiGroup.kpis.forEach(kpiDef => {
                const progressEntry = kpiProgress.find(p => p.teamMemberId === member.id && p.kpiDefinitionId === kpiDef.id);
                if (progressEntry && localProgress[kpiDef.id] !== progressEntry.actual) {
                    onUpdateKpiProgress(progressEntry.id, localProgress[kpiDef.id]);
                }
            });
        } else if(kpiGroup) {
            const kpisToSave = kpiGroup.kpis.map(kpiDef => ({
                kpiDefId: kpiDef.id,
                actual: localProgress[kpiDef.id] || 0
            }));
            onSaveHistoricalSnapshot(member.id, selectedWeek, kpisToSave);
        }
        onClose();
    };
    
     if (!member || !kpiGroup) return null;
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button type="button" onClick={handleSaveChanges} className="bg-core-accent hover:bg-core-accent-hover text-white font-bold py-2 px-4 rounded-lg">
                Save Changes
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Log Performance"
            icon={<TargetIcon className="w-6 h-6 text-core-accent" />}
            footer={footer}
            size="lg"
        >
            <div className="space-y-4">
                 <p className="text-sm text-core-text-secondary">Update KPI progress for {member.name}.</p>
                 <div>
                    <label htmlFor="week-selector" className="block text-sm font-medium text-core-text-secondary mb-1">Select Week to Log</label>
                     <select id="week-selector" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent">
                        {weekOptions.map(week => {
                            const label = week === 'current' ? `Current Week (W/O ${new Date(getStartOfWeek(new Date())).toLocaleDateString()})` : `Week of ${new Date(week).toLocaleDateString()}`;
                            return <option key={week} value={week}>{label}</option>
                        })}
                    </select>
                </div>
                 <div className="space-y-4 pt-4 border-t border-core-border">
                    {kpiGroup.kpis.map(kpiDef => (
                        <div key={kpiDef.id} className="grid grid-cols-3 gap-4 items-center">
                            <div className="col-span-2">
                                <p className="font-medium text-core-text-primary">{kpiDef.name}</p>
                                <p className="text-xs text-core-text-secondary">Target: {kpiDef.goal}{kpiDef.type === 'percentage' && '%'}</p>
                            </div>
                            <input
                                type="number"
                                value={localProgress[kpiDef.id] ?? ''}
                                onChange={(e) => handleInputChange(kpiDef.id, e.target.value)}
                                className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary text-center text-lg focus:outline-none focus:ring-2 focus:ring-core-accent"
                            />
                        </div>
                    ))}
                    {kpiGroup.kpis.length === 0 && (
                        <p className="text-core-text-secondary text-center py-4">This team member has no KPIs assigned to their role group.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};
