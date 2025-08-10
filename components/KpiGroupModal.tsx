
import React, { useState, useEffect } from 'react';
import { KpiGroup, KpiDefinition } from '../types';
import { TargetIcon, PlusIcon, TrashIcon, EditIcon } from './Icons';
import { Modal } from './ui/Modal';

interface KpiGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (group: KpiGroup) => void;
    group: KpiGroup | null;
}

const getInitialState = (): Omit<KpiGroup, 'id'> => ({
    name: '',
    role: 'Recruiter',
    kpis: []
});

const getInitialKpiDefState = (): Omit<KpiDefinition, 'id'> => ({
    name: '',
    type: 'number',
    goal: 10,
    points: 100
});

export const KpiGroupModal: React.FC<KpiGroupModalProps> = ({ isOpen, onClose, onSave, group }) => {
    const [formData, setFormData] = useState(getInitialState());
    const [newKpiDef, setNewKpiDef] = useState(getInitialKpiDefState());
    const [editingKpiId, setEditingKpiId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(group ? { ...group } : getInitialState());
            setNewKpiDef(getInitialKpiDefState());
            setEditingKpiId(null);
        }
    }, [group, isOpen]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const handleNewKpiChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewKpiDef(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };
    
    const handleAddOrUpdateKpi = () => {
        if (!newKpiDef.name) {
            alert('KPI name cannot be empty.');
            return;
        }

        if (editingKpiId) {
            setFormData(prev => ({
                ...prev,
                kpis: prev.kpis.map(k => k.id === editingKpiId ? { ...newKpiDef, id: editingKpiId } : k)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                kpis: [...prev.kpis, { ...newKpiDef, id: `kpi_def_${Date.now()}` }]
            }));
        }
        
        setNewKpiDef(getInitialKpiDefState());
        setEditingKpiId(null);
    };
    
    const handleEditKpi = (kpiDef: KpiDefinition) => {
        setEditingKpiId(kpiDef.id);
        setNewKpiDef({ ...kpiDef });
    };
    
    const handleDeleteKpi = (kpiId: string) => {
        setFormData(prev => ({
            ...prev,
            kpis: prev.kpis.filter(k => k.id !== kpiId)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: group?.id || `group_${Date.now()}`});
    };
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button type="submit" form="kpi-group-form" className="bg-core-accent hover:bg-core-accent-hover text-white font-bold py-2 px-4 rounded-lg">
                {group ? 'Save Changes' : 'Create Group'}
            </button>
        </>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={group ? 'Edit KPI Group' : 'Create New KPI Group'} 
            icon={<TargetIcon className="w-6 h-6 text-core-accent" />}
            footer={footer}
            size="2xl"
        >
            <form id="kpi-group-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-core-text-secondary mb-1">Group Name</label>
                        <input id="name" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g., Standard Recruiter KPIs" required className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-core-text-secondary mb-1">Assigned Role</label>
                        <input id="role" name="role" value={formData.role} onChange={handleFormChange} placeholder="e.g., Recruiter" required className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                    </div>
                </div>

                <div className="pt-4 border-t border-core-border">
                    <h3 className="text-lg font-semibold text-core-text-primary mb-2">KPI Definitions</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {formData.kpis.map(kpi => (
                            <div key={kpi.id} className="flex items-center justify-between bg-core-bg p-2 rounded-md">
                                <div>
                                    <p className="font-medium text-core-text-primary">{kpi.name}</p>
                                    <p className="text-xs text-core-text-secondary">Goal: {kpi.goal}{kpi.type==='percentage' && '%'} | Points: {kpi.points}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => handleEditKpi(kpi)} className="p-1.5 text-core-text-secondary hover:text-white"><EditIcon className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => handleDeleteKpi(kpi.id)} className="p-1.5 text-core-text-secondary hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 bg-core-bg/70 rounded-lg space-y-3 border border-core-border">
                        <h4 className="font-semibold text-core-text-secondary">{editingKpiId ? 'Edit KPI' : 'Add New KPI'}</h4>
                        <input value={newKpiDef.name} onChange={handleNewKpiChange} name="name" placeholder="KPI Name" className="w-full bg-core-bg border border-core-border rounded-lg py-1.5 px-3 text-core-text-primary text-sm" />
                        <div className="grid grid-cols-3 gap-2">
                             <select value={newKpiDef.type} onChange={handleNewKpiChange} name="type" className="w-full bg-core-bg border border-core-border rounded-lg py-1.5 px-3 text-core-text-primary text-sm">
                                <option value="number">Number</option>
                                <option value="percentage">Percentage</option>
                            </select>
                            <input value={newKpiDef.goal} onChange={handleNewKpiChange} name="goal" type="number" placeholder="Goal" className="w-full bg-core-bg border border-core-border rounded-lg py-1.5 px-3 text-core-text-primary text-sm" />
                            <input value={newKpiDef.points} onChange={handleNewKpiChange} name="points" type="number" placeholder="Points" className="w-full bg-core-bg border border-core-border rounded-lg py-1.5 px-3 text-core-text-primary text-sm" />
                        </div>
                        <button type="button" onClick={handleAddOrUpdateKpi} className="w-full bg-core-accent/20 hover:bg-core-accent/30 text-core-accent font-semibold py-1.5 rounded-md text-sm">
                            {editingKpiId ? 'Update KPI' : 'Add KPI'}
                        </button>
                         {editingKpiId && <button type="button" onClick={() => { setEditingKpiId(null); setNewKpiDef(getInitialKpiDefState());}} className="w-full text-center text-core-text-secondary text-xs mt-1 hover:text-white">Cancel Edit</button>}
                    </div>
                </div>
            </form>
        </Modal>
    );
};
