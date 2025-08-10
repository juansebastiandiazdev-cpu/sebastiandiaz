

import React, { useState } from 'react';
import { Client, BusinessReview, TeamMember, CoachingFeedForward, ActionItem } from '../types';
import { MailIcon, XIcon, DownloadIcon, ClipboardCheckIcon } from './Icons';
import { api } from '../services/api';
import { Modal } from './ui/Modal';

interface FollowUpEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
    leader: TeamMember;
    session: BusinessReview | CoachingFeedForward;
    initialDraft: { subject: string; body: string };
    isTeamMemberFollowup?: boolean;
    teamMember?: TeamMember;
}

export const FollowUpEmailModal: React.FC<FollowUpEmailModalProps> = ({ isOpen, onClose, client, leader, session, initialDraft, isTeamMemberFollowup = false, teamMember }) => {
    const [subject, setSubject] = useState(initialDraft.subject);
    const [body, setBody] = useState(initialDraft.body);
    const [copied, setCopied] = useState<null | 'subject' | 'body'>(null);

    if (!isOpen) return null;

    const handleCopy = (text: string, type: 'subject' | 'body') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    const handleDownloadEml = () => {
         const toEmail = (isTeamMemberFollowup && teamMember) ? teamMember.email : client.contactInfo.email;
         const clientOrMemberName = (isTeamMemberFollowup && teamMember) ? teamMember.name : client.name;
         
         const htmlBody = `<html><body style="font-family: sans-serif;">${body.replace(/\n/g, '<br>')}</body></html>`;
         const emlContent = [
            `From: ${leader.email}`, `To: ${toEmail}`, `Subject: ${subject}`,
            'MIME-Version: 1.0', 'Content-Type: text/html; charset=utf-8', 'Content-Disposition: inline', '',
            htmlBody
       ].join('\n');
       const blob = new Blob([emlContent], { type: 'message/rfc822' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `FollowUp_${clientOrMemberName.replace(/ /g, '_')}_${session.sessionDate}.eml`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       URL.revokeObjectURL(url);
    };
    
    const footer = (
        <>
            <button onClick={onClose} className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg">Close</button>
            <button onClick={handleDownloadEml} className="flex items-center gap-2 bg-core-accent hover:bg-core-accent-hover text-white font-bold py-2 px-4 rounded-lg">
                <DownloadIcon className="w-5 h-5"/>
                Download .eml
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="AI-Drafted Follow-up"
            icon={<MailIcon className="w-5 h-5"/>}
            size="2xl"
            footer={footer}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-core-text-secondary mb-1">Subject</label>
                    <div className="flex items-center gap-2">
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                            <button onClick={() => handleCopy(subject, 'subject')} className={`p-2 rounded-md transition-colors ${copied === 'subject' ? 'bg-green-500/80 text-white' : 'bg-core-bg-soft hover:bg-core-border text-core-text-secondary'}`}>
                                <ClipboardCheckIcon className="w-5 h-5" />
                            </button>
                    </div>
                </div>
                    <div>
                    <label className="block text-sm font-medium text-core-text-secondary mb-1">Body</label>
                        <div className="flex items-start gap-2">
                            <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                            <button onClick={() => handleCopy(body, 'body')} className={`p-2 rounded-md transition-colors ${copied === 'body' ? 'bg-green-500/80 text-white' : 'bg-core-bg-soft hover:bg-core-border text-core-text-secondary'}`}>
                                <ClipboardCheckIcon className="w-5 h-5" />
                            </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
