
import React, { useState } from 'react';
import { TeamMember, ShoutOut } from '../types';
import { MegaphoneIcon } from './Icons';
import { Modal } from './ui/Modal';

interface ShoutOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamMembers: TeamMember[];
    currentUser: TeamMember;
    onAddShoutOut: (shoutOut: Omit<ShoutOut, 'id'>) => void;
}

export const ShoutOutModal: React.FC<ShoutOutModalProps> = ({ isOpen, onClose, teamMembers, currentUser, onAddShoutOut }) => {
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [message, setMessage] = useState('');
    
    const handleSubmit = () => {
        if (!selectedMemberId || !message) {
            alert('Please select a team member and write a message.');
            return;
        }

        const toMember = teamMembers.find(m => m.id === selectedMemberId);
        if (!toMember) {
            alert("Selected team member not found.");
            return;
        }

        onAddShoutOut({
            from: { name: currentUser.name, avatarInitials: currentUser.avatarInitials },
            to: { name: toMember.name, avatarInitials: toMember.avatarInitials },
            message: message,
            date: new Date().toISOString()
        });
        
        alert('Shout-out sent successfully!');
        onClose();
        setSelectedMemberId('');
        setMessage('');
    };
    
    const modalFooter = (
        <>
            <button type="button" onClick={onClose}
                    className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button type="button" onClick={handleSubmit}
                    className="bg-core-accent hover:bg-core-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Send Shout-Out
            </button>
        </>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Give a Shout-Out" 
            icon={<MegaphoneIcon className="w-6 h-6 text-core-accent" />}
            footer={modalFooter}
            size="lg"
        >
            <div className="space-y-4">
                <p className="text-sm text-core-text-secondary">Recognize a team member for their awesome work!</p>
                <div>
                    <label htmlFor="team-member" className="block text-sm font-medium text-core-text-secondary mb-1">
                        Team Member
                    </label>
                    <select
                        id="team-member"
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm"
                    >
                        <option value="" disabled>Select a colleague...</option>
                        {teamMembers
                            .filter(member => member.id !== currentUser.id)
                            .map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-core-text-secondary mb-1">
                        Message
                    </label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        placeholder="e.g., for always being so helpful and positive!"
                        className="mt-1 block w-full bg-core-bg border border-core-border rounded-lg shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm"
                    />
                </div>
            </div>
        </Modal>
    );
};
