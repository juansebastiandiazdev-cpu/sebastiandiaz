
import React, { useState, useEffect } from 'react';
import { TeamMember, TaskFilter } from '../types';
import { SparklesIcon, LoaderIcon, LightbulbIcon, ArrowRightIcon, XIcon } from './Icons';
import { api } from '../services/api';
import { useToasts } from '../hooks/useToasts';

interface Suggestion {
    text: string;
    action: {
        type: 'navigate';
        view: 'coaching' | 'tasks';
        filter?: Partial<TaskFilter>;
    };
}

interface AIActionSuggestionProps {
    member: TeamMember;
    onNavigateToCoaching: () => void;
    onNavigateToTasks: (filter: Partial<TaskFilter>) => void;
}

export const AIActionSuggestion: React.FC<AIActionSuggestionProps> = ({ member, onNavigateToCoaching, onNavigateToTasks }) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const { addToast } = useToasts();

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const data = await api.generateContextualSuggestions({
                    contextType: 'teamMember',
                    contextData: member
                });
                setSuggestions(data.suggestions || []);
            } catch (error) {
                console.error("Failed to fetch AI suggestions:", error);
                addToast("Could not load AI suggestions.", 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [member, addToast]);
    
    const handleActionClick = (suggestion: Suggestion) => {
        if (suggestion.action.view === 'coaching') {
            onNavigateToCoaching();
        } else if (suggestion.action.view === 'tasks' && suggestion.action.filter) {
            onNavigateToTasks(suggestion.action.filter);
        }
    }

    if (!isVisible || (isLoading && !suggestions.length) || (!isLoading && suggestions.length === 0)) {
        return null;
    }

    return (
        <div className="bg-core-accent-light p-4 rounded-xl border border-core-accent/50 shadow-lg animate-fade-in-up">
            <div className="flex justify-between items-start gap-3">
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-core-accent/20 text-core-accent rounded-full flex items-center justify-center animate-pulse">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-core-text-primary">AI Action Suggestions</h4>
                        <p className="text-sm text-core-text-secondary">Based on {member.name}'s high turnover risk, here are some recommended actions:</p>
                    </div>
                 </div>
                <button onClick={() => setIsVisible(false)} className="p-1 rounded-full text-core-text-secondary/60 hover:text-core-text-primary hover:bg-black/10 dark:hover:bg-white/10">
                    <XIcon className="w-4 h-4"/>
                </button>
            </div>
            
            <div className="mt-3 pl-11 space-y-2">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-core-text-secondary">
                        <LoaderIcon className="w-4 h-4 animate-spin"/>
                        <span>Generating suggestions...</span>
                    </div>
                ) : (
                    suggestions.map((s, i) => (
                        <button key={i} onClick={() => handleActionClick(s)} className="group w-full text-left flex justify-between items-center p-2 rounded-md bg-core-bg/50 hover:bg-core-bg transition-colors">
                           <div className="flex items-center gap-2">
                             <LightbulbIcon className="w-5 h-5 text-yellow-400 dark:text-yellow-300"/>
                             <span className="font-medium text-sm text-core-text-secondary group-hover:text-core-text-primary">{s.text}</span>
                           </div>
                           <ArrowRightIcon className="w-4 h-4 text-core-text-secondary/70 group-hover:translate-x-1 transition-transform"/>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
