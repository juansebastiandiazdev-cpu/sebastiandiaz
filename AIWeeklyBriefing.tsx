
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { Task } from '../types';
import { SparklesIcon, LoaderIcon } from './Icons';
import { api } from './services/api';

interface AIWeeklyBriefingProps {
    tasks: Task[];
}

export const AIWeeklyBriefing: React.FC<AIWeeklyBriefingProps> = ({ tasks }) => {
    const [briefing, setBriefing] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateBriefing = async () => {
            setIsLoading(true);
            if (tasks.length === 0) {
                setBriefing("You have no key tasks scheduled for the week. It's a blank canvas!");
                setIsLoading(false);
                return;
            }
    
            try {
                const data = await api.generateWeeklyBriefing(tasks);
                setBriefing(data.briefing);

            } catch (error) {
                 console.error("Failed to fetch AI briefing.", error);
                 let fallbackSummary = "Could not generate AI briefing at this time.";
                 if (error instanceof Error) {
                    fallbackSummary = `**AI Briefing failed**: ${error.message}`;
                 }
                 setBriefing(fallbackSummary);
            } finally {
                setIsLoading(false);
            }
        };

        generateBriefing();

    }, [tasks]);

    const parsedHTML = { __html: marked.parse(briefing, { breaks: true, gfm: true }) as string };

    return (
        <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/50 flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-6 h-6" />
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-white">Your AI Weekly Briefing</h3>
                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                        Analyzing your week...
                    </div>
                ) : (
                    <div className="text-sm text-blue-200 mt-1 prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={parsedHTML} />
                )}
            </div>
        </div>
    );
};
