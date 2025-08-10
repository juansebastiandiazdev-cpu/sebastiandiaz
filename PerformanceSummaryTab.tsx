
import React, { useState } from 'react';
import { marked } from 'marked';
import { TeamMember, WeeklyPerformanceSnapshot } from '../types';
import { SparklesIcon, LoaderIcon } from './Icons';
import { api } from './services/api';

interface PerformanceSummaryTabProps {
    member: TeamMember;
    weeklySnapshots: WeeklyPerformanceSnapshot[];
}

export const PerformanceSummaryTab: React.FC<PerformanceSummaryTabProps> = ({ member, weeklySnapshots }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setSummary('');

        const memberSnapshots = weeklySnapshots.filter(s => s.teamMemberId === member.id);
        
        if (memberSnapshots.length === 0) {
            setSummary("Not enough historical data to generate a summary.");
            setIsLoading(false);
            return;
        }

        try {
            const data = await api.generatePerformanceSummary(member, memberSnapshots);
            setSummary(data.summary);

        } catch (error) {
            console.error("Error generating performance summary:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setSummary(`An error occurred while generating the summary: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const parsedHTML = { __html: marked.parse(summary, { breaks: true, gfm: true }) as string };

    return (
        <div className="space-y-4">
            <div className="flex justify-center">
                <button
                    onClick={handleGenerateSummary}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    {isLoading ? 'Generating...' : 'Generate AI Performance Summary'}
                </button>
            </div>

            {(isLoading || summary) && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 min-h-[200px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                           <LoaderIcon className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={parsedHTML} />
                    )}
                </div>
            )}
        </div>
    );
};
