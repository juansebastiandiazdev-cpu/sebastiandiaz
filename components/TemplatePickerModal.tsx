

import React from 'react';
import { ARTICLE_TEMPLATES } from '../constants';
import { BookOpenIcon, PlusIcon } from './Icons';
import { Modal } from './ui/Modal';

interface TemplatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (templateContent: string) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({ isOpen, onClose, onSelect }) => {

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Article"
            icon={<BookOpenIcon className="w-6 h-6 text-core-accent" />}
            size="lg"
        >
            <div className="space-y-3">
                 <p className="text-sm text-core-text-secondary">Start with a blank document or use a template to get started.</p>
                <button 
                    onClick={() => { onSelect(''); onClose(); }}
                    className="w-full flex items-center gap-4 p-4 text-left bg-core-bg rounded-lg hover:bg-core-border transition-colors border border-core-border"
                >
                    <div className="w-12 h-12 bg-core-accent rounded-lg flex items-center justify-center">
                        <PlusIcon className="w-8 h-8 text-core-accent-foreground"/>
                    </div>
                    <div>
                        <p className="font-semibold text-core-text-primary text-lg">Blank Article</p>
                        <p className="text-sm text-core-text-secondary">Start from scratch.</p>
                    </div>
                </button>
                {ARTICLE_TEMPLATES.map(template => (
                    <button 
                        key={template.title}
                        onClick={() => { onSelect(template.content); onClose(); }}
                        className="w-full flex items-center gap-4 p-4 text-left bg-core-bg rounded-lg hover:bg-core-border transition-colors border border-core-border"
                    >
                        <div className="w-12 h-12 bg-core-bg-soft rounded-lg flex items-center justify-center">
                            <BookOpenIcon className="w-7 h-7 text-core-text-secondary"/>
                        </div>
                        <div>
                            <p className="font-semibold text-core-text-primary text-lg">{template.title}</p>
                            <p className="text-sm text-core-text-secondary">A pre-defined structure for {template.category}.</p>
                        </div>
                    </button>
                ))}
            </div>
        </Modal>
    );
};
