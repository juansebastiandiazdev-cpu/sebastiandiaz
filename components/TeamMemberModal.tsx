

import React, { useState, useEffect } from 'react';
import { TeamMember, HomeOfficeInfo } from '../types';
import { TeamIcon } from './Icons';
import { Modal } from './ui/Modal';

interface TeamMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: TeamMember) => void;
    member: TeamMember | null;
}

const getInitialState = (): Omit<TeamMember, 'id' | 'avatarInitials' | 'taskSnapshot' | 'performanceScore' | 'achievements' | 'completedTasksCount' | 'previousPerformanceScore' | 'rankHistory' | 'onFireStreak' | 'rank' | 'previousRank' | 'coachingSessions' | 'ptlReport' | 'leaveLog'> => ({
    name: '',
    role: '',
    email: '',
    department: 'Recruitment',
    skills: [],
    hireDate: new Date().toISOString().split('T')[0],
    homeOffice: { 
        status: 'On-Site Only', 
        notes: 'New hire, HO status pending.',
        approvalDate: undefined,
        daysPerWeek: undefined,
        clientApprovalDocumentLink: ''
    },
    assignedKpis: [],
    kpiGroupId: null,
    kpisMetRate: 0,
    vacationEntitlement: 15,
});


export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ isOpen, onClose, onSave, member }) => {
    const [formData, setFormData] = useState(getInitialState());
    const [skillsString, setSkillsString] = useState('');
    
    useEffect(() => {
        if(isOpen) {
            if (member) {
                setFormData({
                    ...getInitialState(), // ensures all fields are present
                    name: member.name,
                    role: member.role,
                    email: member.email,
                    department: member.department,
                    skills: member.skills,
                    hireDate: member.hireDate ? new Date(member.hireDate).toISOString().split('T')[0] : '',
                    homeOffice: {
                         ...getInitialState().homeOffice,
                         ...member.homeOffice,
                         approvalDate: member.homeOffice.approvalDate ? new Date(member.homeOffice.approvalDate).toISOString().split('T')[0] : '',
                    },
                    assignedKpis: member.assignedKpis,
                    kpiGroupId: member.kpiGroupId,
                    kpisMetRate: member.kpisMetRate,
                    vacationEntitlement: member.vacationEntitlement,
                });
                setSkillsString(member.skills.join(', '));
            } else {
                setFormData(getInitialState());
                setSkillsString('');
            }
        }
    }, [member, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (name.startsWith('homeOffice.')) {
            const field = name.split('.')[1];
            const valueToSet = type === 'number' ? (value ? parseInt(value, 10) : undefined) : value;
            setFormData(prev => ({ ...prev, homeOffice: { ...prev.homeOffice, [field]: valueToSet } }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSkillsString(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.role) {
            alert('Please fill out name, email, and role.');
            return;
        }

        const finalSkills = skillsString.split(',').map(s => s.trim()).filter(Boolean);

        const newMember: TeamMember = {
            id: member ? member.id : `user-${Date.now()}`,
            avatarInitials: formData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
            ...formData,
            hireDate: new Date(formData.hireDate).toISOString(),
            homeOffice: {
                ...formData.homeOffice,
                approvalDate: formData.homeOffice.approvalDate ? new Date(formData.homeOffice.approvalDate).toISOString() : undefined,
            },
            skills: finalSkills,
            // Non-editable fields from original member or default
            taskSnapshot: member?.taskSnapshot || { pending: 0, inProgress: 0, overdue: 0 },
            performanceScore: member?.performanceScore || 75,
            achievements: member?.achievements || [],
            completedTasksCount: member?.completedTasksCount || 0,
            previousPerformanceScore: member?.previousPerformanceScore || 75,
            rankHistory: member?.rankHistory || [],
            onFireStreak: member?.onFireStreak || 0,
            rank: member?.rank || 0, 
            previousRank: member?.previousRank || 0,
            coachingSessions: member?.coachingSessions || [],
            leaveLog: member?.leaveLog || [],
        };
        
        onSave(newMember);
        onClose();
    };
    
    const footer = (
         <>
            <button type="button" onClick={onClose}
                    className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button type="submit" form="team-member-form"
                    className="bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-bold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-core-accent/30">
                {member ? 'Save Changes' : 'Add Member'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={member ? 'Edit Team Member' : 'Add New Team Member'}
            icon={<TeamIcon className="w-6 h-6 text-core-accent" />}
            size="2xl"
            footer={footer}
        >
            <p className="text-sm text-core-text-secondary mb-4">
                {member ? 'Update the details for this team member.' : 'Create a new team member in the system.'}
            </p>
            <form id="team-member-form" onSubmit={handleSubmit} className="p-1 space-y-4">
                <fieldset className="border border-core-border p-4 rounded-lg">
                    <legend className="px-2 text-sm font-medium text-core-accent">Personal & Role Information</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-core-text-secondary mb-1">Full Name</label>
                            <input id="name" name="name" value={formData.name} onChange={handleChange} required
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-core-text-secondary mb-1">Email</label>
                            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                        </div>
                            <div>
                            <label htmlFor="role" className="block text-sm font-medium text-core-text-secondary mb-1">Role</label>
                            <input id="role" name="role" value={formData.role} onChange={handleChange} required
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                        </div>
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-core-text-secondary mb-1">Department</label>
                            <select id="department" name="department" value={formData.department} onChange={handleChange}
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent">
                                <option>Recruitment</option>
                                <option>Operations Support</option>
                                <option>HR</option>
                                <option>Finance</option>
                                <option>Marketing</option>
                                <option>Management</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="hireDate" className="block text-sm font-medium text-core-text-secondary mb-1">Hire Date</label>
                            <input id="hireDate" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange}
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                        </div>
                    </div>
                </fieldset>

                    <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-core-text-secondary mb-1">Skills (comma-separated)</label>
                    <input id="skills" name="skills" value={skillsString} onChange={handleSkillsChange}
                        className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                </div>

                <fieldset className="border border-core-border p-4 rounded-lg">
                    <legend className="px-2 text-sm font-medium text-core-accent">Home Office Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                            <label htmlFor="homeOffice.status" className="block text-sm font-medium text-core-text-secondary mb-1">Status</label>
                            <select id="homeOffice.status" name="homeOffice.status" value={formData.homeOffice.status} onChange={handleChange}
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent">
                                <option>On-Site Only</option>
                                <option>Eligible for HO</option>
                                <option>HO Pending Client Approval</option>
                                <option>HO Approved</option>
                            </select>
                        </div>
                            <div>
                            <label htmlFor="homeOffice.approvalDate" className="block text-sm font-medium text-core-text-secondary mb-1">Approval Date</label>
                            <input id="homeOffice.approvalDate" name="homeOffice.approvalDate" type="date" value={formData.homeOffice.approvalDate || ''} onChange={handleChange}
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                        </div>
                        <div>
                            <label htmlFor="homeOffice.daysPerWeek" className="block text-sm font-medium text-core-text-secondary mb-1">Days Per Week</label>
                            <input id="homeOffice.daysPerWeek" name="homeOffice.daysPerWeek" type="number" min="0" max="5" value={formData.homeOffice.daysPerWeek || ''} onChange={handleChange}
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                        </div>
                            <div>
                            <label htmlFor="homeOffice.clientApprovalDocumentLink" className="block text-sm font-medium text-core-text-secondary mb-1">Approval Document Link</label>
                            <input id="homeOffice.clientApprovalDocumentLink" name="homeOffice.clientApprovalDocumentLink" type="text" value={formData.homeOffice.clientApprovalDocumentLink || ''} onChange={handleChange}
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="homeOffice.notes" className="block text-sm font-medium text-core-text-secondary mb-1">Notes</label>
                        <textarea id="homeOffice.notes" name="homeOffice.notes" value={formData.homeOffice.notes} onChange={handleChange} rows={2}
                            className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                    </div>
                </fieldset>
            </form>
        </Modal>
    );
};
