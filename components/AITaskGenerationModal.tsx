
import React, { useState } from 'react';
import { LoaderIcon, SparklesIcon, CheckCircleIcon, ListIcon } from './Icons';
import { Modal } from './ui/Modal';

interface AITaskGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (type: 'monthly-reports' | 'kpi-dashboards') => void;
}

type GenerationType = 'monthly-reports' | 'kpi-dashboards';

export const AITaskGenerationModal: React.FC<AITaskGenerationModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [generating, setGenerating] = useState<GenerationType | null>(null);

    if (!isOpen) return null;

    const handleGenerateClick = (type: GenerationType) => {
        setGenerating(type);
        // Simulate generation time for user feedback
        setTimeout(() => {
            onGenerate(type);
            setGenerating(null);
            onClose();
        }, 500);
    };

    const GenerationButton = ({ type, icon, title, description }: { type: GenerationType, icon: React.ReactNode, title: string, description: string }) => (
        <button
            onClick={() => handleGenerateClick(type)}
            disabled={!!generating}
            className="flex items-center w-full p-4 text-left bg-core-bg rounded-lg hover:bg-core-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-core-border"
        >
            <div className="mr-4 text-core-accent">{icon}</div>
            <div className="flex-1">
                <p className="font-semibold text-core-text-primary">{title}</p>
                <p className="text-sm text-core-text-secondary">{description}</p>
            </div>
            {generating === type ? <LoaderIcon className="w-6 h-6 animate-spin text-core-text-primary"/> : <SparklesIcon className="w-6 h-6 text-core-accent"/>}
        </button>
    );
    
    const footer = (
        <button onClick={onClose} className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg transition-colors">
            Close
        </button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="AI Task Generation"
            icon={<SparklesIcon className="w-6 h-6 text-core-accent" />}
            footer={footer}
            size="lg"
        >
             <p className="text-sm text-core-text-secondary mb-4">Let AI handle the repetitive work. Select a task bundle to generate.</p>
            <div className="space-y-4">
                <GenerationButton
                    type="monthly-reports"
                    icon={<CheckCircleIcon className="w-8 h-8"/>}
                    title="Generate Monthly Client Reports"
                    description="Creates a 'Send Performance Email' task for every active client."
                />
                <GenerationButton
                    type="kpi-dashboards"
                    icon={<ListIcon className="w-8 h-8"/>}
                    title="Generate KPI Dashboard Tasks"
                    description="Creates a 'Create KPI Dashboard' task for every active client."
                />
            </div>
        </Modal>
    );
};
