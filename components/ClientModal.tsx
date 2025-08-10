
import React, { useState, useEffect } from 'react';
import { Client, ClientStatus, TeamMember, DocumentationChecklist, SopInfo, KpiReportingInfo } from '../types';
import { UsersIcon, CheckSquareIcon } from './Icons';
import { Modal } from './ui/Modal';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: Client) => void;
    client: Client | null;
    teamMembers: TeamMember[];
}

const getInitialState = (): Omit<Client, 'id' | 'team' | 'openTasksCount' | 'pulseLog' | 'emailLogs'> => ({
    name: '',
    status: ClientStatus.Healthy,
    tags: [],
    contactInfo: { email: '', phone: '', address: '' },
    poc: [],
    salesManager: '',
    startDate: '',
    seniority: '',
    solversary: '',
    wbr: '',
    phoneSystem: '',
    notes: '', // This will hold the descriptive status notes
    assignedTeamMembers: [],
    sop: { exists: false, format: 'Not Set', lastUpdatedDate: undefined, documentLink: '' },
    kpiReporting: { frequency: 'To be set', lastReportSentDate: undefined, reportLocationLink: '', clientPreferenceNotes: '' },
    sharepointFolderLink: '',
    documentationChecklist: { accountInfo: false, kpiReports: false, hoApproval: false, sops: false },
    folderOrganizationStatus: 'Not Set',
});

const FormInput: React.FC<{
    name: string;
    label: string;
    value: string;
    required?: boolean;
    type?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ name, label, value, required, type = 'text', onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-core-text-secondary mb-1">{label}</label>
        <input 
            type={type} 
            id={name} 
            name={name} 
            value={value} 
            onChange={onChange} 
            required={required} 
            className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" 
        />
    </div>
);

const FormCheckbox: React.FC<{name: string, label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;}> = ({name, label, checked, onChange}) => (
     <label htmlFor={name} className="flex items-center space-x-2 cursor-pointer p-2 bg-core-bg-soft rounded-md hover:bg-core-bg">
        <input type="checkbox" id={name} name={name} checked={checked} onChange={onChange} className="h-4 w-4 rounded border-core-border text-core-accent bg-core-bg focus:ring-core-accent" />
        <span className="text-sm text-core-text-primary">{label}</span>
    </label>
);

export const ClientModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave, client: account, teamMembers }) => {
    const [formData, setFormData] = useState(getInitialState());
    const [tagsString, setTagsString] = useState('');
    const [pocString, setPocString] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (account) {
                setFormData({ ...getInitialState(), ...account });
                setTagsString(account.tags.join(', '));
                setPocString(account.poc.join(', '));
            } else {
                setFormData(getInitialState());
                setTagsString('');
                setPocString('');
            }
        }
    }, [account, isOpen]);
    
    if (!isOpen) return null;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name === 'assignedTeamMembers') {
            const options = (e.target as HTMLSelectElement).options;
            const selectedMembers: string[] = [];
            for (let i = 0, l = options.length; i < l; i++) {
                if (options[i].selected) {
                    selectedMembers.push(options[i].value);
                }
            }
            setFormData(prev => ({...prev, assignedTeamMembers: selectedMembers}));
            return;
        }

        if (name.startsWith('contactInfo.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, [field]: value } }));
        } else if (name.startsWith('sop.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, sop: { ...prev.sop, [field]: type === 'checkbox' ? checked : value } }));
        } else if (name.startsWith('kpiReporting.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, kpiReporting: { ...prev.kpiReporting, [field]: value } }));
        } else if (name.startsWith('documentationChecklist.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, documentationChecklist: { ...prev.documentationChecklist, [field]: checked } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalTags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
        const finalPoc = pocString.split(',').map(poc => poc.trim()).filter(Boolean);

        const accountToSave: Client = {
            ...formData,
            id: account?.id || `client-${Date.now()}`,
            tags: finalTags,
            poc: finalPoc,
            // These are enriched properties, so we just pass dummy values, they'll be recalculated
            team: [], 
            openTasksCount: account?.openTasksCount || 0,
            pulseLog: account?.pulseLog || [],
            emailLogs: account?.emailLogs || [],
        };
        onSave(accountToSave);
        onClose();
    };

    const footer = (
        <>
            <button type="button" onClick={onClose} className="bg-core-bg hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button type="submit" form="client-form" className="bg-core-accent hover:bg-core-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-all">
                {account ? 'Save Changes' : 'Create Account'}
            </button>
        </>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title={account ? 'Edit Account' : 'Add New Account'}
            icon={<UsersIcon className="w-6 h-6 text-core-accent" />}
            size="4xl"
            footer={footer}
        >
            <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
                {/* --- Basic Info --- */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput name="name" label="Account Name" value={formData.name} onChange={handleChange} required />
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-core-text-secondary mb-1">Status</label>
                            <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent">
                                {Object.values(ClientStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <FormInput name="poc" label="Points of Contact (comma-separated)" value={pocString} onChange={(e) => setPocString(e.target.value)} />
                        <FormInput name="tags" label="Tags (comma-separated)" value={tagsString} onChange={(e) => setTagsString(e.target.value)} />
                    </div>
                </div>
                
                {/* --- Contact & Details --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-core-accent border-b border-core-border pb-2">Contact &amp; Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormInput name="contactInfo.email" label="Email" value={formData.contactInfo.email} onChange={handleChange} />
                        <FormInput name="contactInfo.phone" label="Phone" value={formData.contactInfo.phone} onChange={handleChange} />
                        <FormInput name="startDate" label="Start Date" value={formData.startDate} type="date" onChange={handleChange}/>
                        <FormInput name="salesManager" label="Sales Manager" value={formData.salesManager} onChange={handleChange} />
                        <FormInput name="wbr" label="WBR Schedule" value={formData.wbr} onChange={handleChange} />
                        <FormInput name="phoneSystem" label="Phone System" value={formData.phoneSystem} onChange={handleChange} />
                    </div>
                </div>

                {/* --- Team & Links --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-core-accent border-b border-core-border pb-2">Team &amp; Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="assignedTeamMembers" className="block text-sm font-medium text-core-text-secondary mb-1">Assigned Team</label>
                            <select id="assignedTeamMembers" name="assignedTeamMembers" multiple value={formData.assignedTeamMembers} onChange={handleChange} className="mt-1 block w-full h-32 bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent">
                                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className='space-y-4'>
                            <FormInput name="sharepointFolderLink" label="SharePoint Link" value={formData.sharepointFolderLink} onChange={handleChange} />
                            <FormInput name="sop.documentLink" label="SOP Link" value={formData.sop.documentLink || ''} onChange={handleChange} />
                            <FormInput name="kpiReporting.reportLocationLink" label="KPI Report Link" value={formData.kpiReporting.reportLocationLink || ''} onChange={handleChange} />
                        </div>
                    </div>
                </div>
                
                {/* --- Documentation --- */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-core-accent border-b border-core-border pb-2">Documentation Checklist</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormCheckbox name="documentationChecklist.accountInfo" label="Account Info" checked={formData.documentationChecklist.accountInfo} onChange={handleChange} />
                        <FormCheckbox name="documentationChecklist.kpiReports" label="KPI Reports" checked={formData.documentationChecklist.kpiReports} onChange={handleChange} />
                        <FormCheckbox name="documentationChecklist.hoApproval" label="HO Approval" checked={formData.documentationChecklist.hoApproval} onChange={handleChange} />
                        <FormCheckbox name="documentationChecklist.sops" label="SOPs" checked={formData.documentationChecklist.sops} onChange={handleChange} />
                    </div>
                </div>

                {/* --- Notes --- */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-core-text-secondary mb-1">General Notes / Status Description</label>
                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={4} className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent"></textarea>
                </div>
            </form>
        </Modal>
    );
};
