
import React from 'react';
import { marked } from 'marked';
import { TeamMember } from '../types';
import { SparklesIcon, LoaderIcon } from './Icons';
import { Modal } from './ui/Modal';
import { useTypingEffect } from '../hooks/useTypingEffect';

interface TeamMemberContextModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: TeamMember | null;
    summary: string;
    isLoading: boolean;
}

export const TeamMemberContextModal: React.FC<TeamMemberContextModalProps> = ({ isOpen, onClose, member, summary, isLoading }) => {
    const displayedSummary = useTypingEffect(summary, 20);

    if (!isOpen || !member) return null;

    const parsedHTML = { __html: marked.parse(displayedSummary, { breaks: true, gfm: true }) as string };

    const footer = (
        <button onClick={onClose} className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg">
            Close
        </button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`AI Context: ${member.name}`}
            icon={<SparklesIcon className="w-6 h-6 text-core-accent" />}
            size="2xl"
            footer={footer}
        >
            <div className="min-h-[250px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-core-text-secondary">
                        <LoaderIcon className="w-10 h-10 animate-spin text-core-accent" />
                        <p className="mt-4">Generating AI-powered overview...</p>
                    </div>
                ) : (
                    <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:text-core-text-primary prose-headings:font-semibold prose-h3:text-lg prose-ul:my-2" dangerouslySetInnerHTML={parsedHTML} />
                )}
            </div>
        </Modal>
    );
};
