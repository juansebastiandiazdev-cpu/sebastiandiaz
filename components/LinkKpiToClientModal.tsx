
import React, { useState } from 'react';
import { Client } from '../types';
import { LinkIcon, SearchIcon } from './Icons';
import { Modal } from './ui/Modal';

interface LinkKpiToClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    clients: Client[];
    kpiInfo: { teamMemberId: string; kpiDefinitionId: string; kpiName: string } | null;
    onLink: (data: { clientId: string; teamMemberId: string; kpiDefinitionId: string; }) => void;
}

export const LinkKpiToClientModal: React.FC<LinkKpiToClientModalProps> = ({ isOpen, onClose, clients, kpiInfo, onLink }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    if (!isOpen || !kpiInfo) return null;

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleLink = () => {
        if (selectedClientId) {
            onLink({ 
                clientId: selectedClientId, 
                teamMemberId: kpiInfo.teamMemberId, 
                kpiDefinitionId: kpiInfo.kpiDefinitionId 
            });
            onClose();
        }
    };
    
    const footer = (
        <>
            <button onClick={onClose} className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-md transition-colors">
                Cancel
            </button>
            <button onClick={handleLink} disabled={!selectedClientId} className="bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50">
                Link KPI
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Link KPI to Client"
            icon={<LinkIcon className="w-6 h-6 text-core-accent" />}
            size="lg"
            footer={footer}
        >
            <p className="text-sm text-core-text-secondary mt-1">Pin "<span className="font-semibold text-core-text-primary">{kpiInfo.kpiName}</span>" to a client for primary tracking.</p>
            <div className="py-4">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-core-text-secondary" />
                    <input
                        type="search"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-core-bg border border-core-border rounded-lg py-2 pl-10 pr-4 text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent"
                    />
                </div>
            </div>
            
            <div className="flex-grow max-h-64 pr-2 -mr-2 overflow-y-auto space-y-2">
                {filteredClients.map(client => (
                    <label 
                        key={client.id}
                        htmlFor={`client-${client.id}`}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border ${selectedClientId === client.id ? 'bg-core-accent/10 border-core-accent' : 'bg-core-bg-soft border-core-border hover:bg-core-border/50'}`}
                    >
                        <input
                            type="radio"
                            id={`client-${client.id}`}
                            name="client"
                            value={client.id}
                            checked={selectedClientId === client.id}
                            onChange={() => setSelectedClientId(client.id)}
                            className="h-4 w-4 text-core-accent bg-core-bg border-core-border focus:ring-core-accent"
                        />
                        <span className="ml-3 text-core-text-primary font-medium">{client.name}</span>
                    </label>
                ))}
                {filteredClients.length === 0 && (
                    <p className="text-center text-core-text-secondary py-8">No clients found.</p>
                )}
            </div>
        </Modal>
    );
};
