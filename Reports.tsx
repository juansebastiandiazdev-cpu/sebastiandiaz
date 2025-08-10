

import React, { useState } from 'react';
import { marked } from 'marked';
import { Client, Task, TeamMember, WeeklyPerformanceSnapshot, KpiGroup, KpiProgress } from '../types';
import { SparklesIcon, LoaderIcon, BarChartIcon } from './Icons';
import { api } from './services/api';

interface ReportsProps {
    clients: Client[];
    tasks: Task[];
    teamMembers: TeamMember[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
}

const suggestionChips = [
    "Quarterly team performance review",
    "Client health and risk analysis",
    "Analysis of overdue tasks by department",
    "Identify top 3 most-improved team members",
];

export const Reports: React.FC<ReportsProps> = ({ clients, tasks, teamMembers, weeklySnapshots, kpiGroups, kpiProgress }) => {
    const [prompt, setPrompt] = useState('');
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = async (requestText: string) => {
        if (!requestText.trim() || isLoading) return;
        
        setIsLoading(true);
        setReport('');
        setPrompt(requestText);

        try {
            const contextData = {
                teamMembers: teamMembers.map(({ name, role, department, performanceScore, completedTasksCount, kpisMetRate }) => ({ name, role, department, performanceScore, completedTasksCount, kpisMetRate })),
                clients: clients.map(({ name, status, openTasksCount, team, poc }) => ({ name, status, openTasksCount, poc, assignedTeam: team.map(t => t.name) })),
                tasks: tasks.map(({ title, status, priority, assignee, client }) => ({ title, status, priority, assignee: assignee?.name, client: client?.name })),
                weeklySnapshots: weeklySnapshots,
            };

            const data = await api.generateReport(requestText, contextData);
            setReport(data.report);

        } catch (error) {
            console.error("Error generating report:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setReport(`## Error\n\nSorry, I couldn't generate the report.\n\n*Details: ${errorMessage}*`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const parsedHTML = (text: string) => {
        const rawMarkup = marked.parse(text, { breaks: true, gfm: true });
        return { __html: rawMarkup as string };
    }

    return (
        <div className="p-6 space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-white flex items-center">
                    <BarChartIcon className="w-8 h-8 mr-3 text-indigo-400"/>
                    AI Reporting Hub
                </h2>
                <p className="text-slate-400 mt-1">Generate deep insights from your operational data.</p>
            </header>
            
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div className="flex flex-col gap-2">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Generate a summary of all at-risk clients and their pending high-priority tasks.'"
                        disabled={isLoading}
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                     <div className="flex items-center justify-between">
                         <div className="flex flex-wrap gap-2">
                             {suggestionChips.map(chip => (
                                <button key={chip} onClick={() => handleGenerateReport(chip)} disabled={isLoading} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full text-xs transition-colors disabled:opacity-50">
                                    {chip}
                                </button>
                             ))}
                         </div>
                         <button
                            onClick={() => handleGenerateReport(prompt)}
                            disabled={isLoading || !prompt.trim()}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed"
                         >
                            {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                            <span>{isLoading ? 'Generating...' : 'Generate Report'}</span>
                        </button>
                     </div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 min-h-[400px] flex flex-col">
                <div className="p-4 border-b border-slate-700">
                    <h3 className="text-lg font-semibold text-white">Generated Report</h3>
                </div>
                <div className="p-6 flex-grow">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <LoaderIcon className="w-12 h-12 animate-spin mb-4" />
                            <p className="text-lg">Analyzing data and generating your report...</p>
                            <p className="text-sm">This may take a moment.</p>
                        </div>
                    )}
                    {!isLoading && !report && (
                         <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <BarChartIcon className="w-16 h-16 mb-4" />
                            <p className="text-lg font-medium">Your report will appear here.</p>
                            <p className="text-sm">Use the input above to request a report.</p>
                        </div>
                    )}
                    {!isLoading && report && (
                        <div className="prose prose-invert max-w-none prose-h2:text-xl prose-h2:mb-3 prose-h3:text-lg prose-h3:text-indigo-400 prose-h3:mb-2 prose-ul:list-disc prose-ul:pl-6 prose-li:mb-1"
                             dangerouslySetInnerHTML={parsedHTML(report)} />
                    )}
                </div>
            </div>
        </div>
    );
};