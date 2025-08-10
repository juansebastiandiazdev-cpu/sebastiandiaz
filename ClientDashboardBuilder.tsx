
import React, { useState, useEffect } from 'react';
import { Client, KpiGroup, KpiProgress, TeamMember, WeeklyPerformanceSnapshot, Task } from '../types';
import { PrintableReportWrapper } from './PrintableReportWrapper';
import { SparklesIcon, LoaderIcon, LinkIcon, TargetIcon, CheckCircleIcon, XIcon } from './Icons';
import { ManageClientKpisModal } from './ManageClientKpisModal';
import { useToasts } from '../hooks/useToasts';
import { api } from './services/api';

interface ClientDashboardBuilderProps {
    client: Client;
    teamMembers: TeamMember[];
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    tasks: Task[];
    onSaveClient: (client: Client) => void;
}

const ShareModal: React.FC<{ link: string; onClose: () => void }> = ({ link, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-lg border border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Shareable Report Link</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-600 rounded-md p-2">
                    <input type="text" readOnly value={link} className="bg-transparent text-slate-300 w-full outline-none"/>
                    <button onClick={handleCopy} className={`ml-2 px-3 py-1 rounded text-sm font-semibold ${copied ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                 <p className="text-xs text-slate-400 mt-2">Anyone with this link can view the latest generated report. The dashboard is read-only.</p>
            </div>
        </div>
    )
}


export const ClientDashboardBuilder: React.FC<ClientDashboardBuilderProps> = (props) => {
    const { client, onSaveClient, tasks, teamMembers, kpiProgress, kpiGroups } = props;
    const { addToast } = useToasts();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReportClient, setGeneratedReportClient] = useState<Client | null>(client);
    const [isManageKpisOpen, setIsManageKpisOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    const publicLink = `${window.location.origin}${window.location.pathname}?page=public-dashboard&id=${client.id}`;

    useEffect(() => {
        setGeneratedReportClient(client);
    }, [client]);
    
    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            const assignedMemberIds = new Set(client.assignedTeamMembers);
            const membersOnClient = teamMembers.filter(m => assignedMemberIds.has(m.id));
            const kpiData = membersOnClient.flatMap(member => {
                const group = kpiGroups.find(g => g.id === member.kpiGroupId);
                if (!group) return [];
                return group.kpis.map(kpiDef => {
                    const progress = kpiProgress.find(p => p.teamMemberId === member.id && p.kpiDefinitionId === kpiDef.id);
                    return { name: kpiDef?.name, actual: progress?.actual || 0, target: kpiDef?.goal || 0 };
                })
            }).filter(d => d && d.name);

            const clientTasks = tasks.filter(t => t.clientId === client.id);
            const clientContext = {
                client,
                tasks: clientTasks,
                pulseLog: client.pulseLog,
                kpis: kpiData
            };

            const summaries = await api.generateDashboardReport(kpiData, clientContext);
            
            const updatedClient: Client = {
                ...client,
                dashboardConfig: {
                    ...(client.dashboardConfig || { updatedAt: '' }),
                    kpiSummary: summaries.kpiSummary,
                    highlights: summaries.highlights,
                    healthSummary: summaries.healthSummary,
                    updatedAt: new Date().toISOString(),
                }
            };

            onSaveClient(updatedClient);
            setGeneratedReportClient(updatedClient);
            addToast("Report generated successfully!", "success");

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addToast(`Failed to generate the full report: ${errorMessage}`, "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveKpis = (clientId: string, kpis: { teamMemberId: string; kpiDefinitionId: string; }[]) => {
        const updatedClient: Client = {
            ...client,
            trackedKpis: kpis
        };
        onSaveClient(updatedClient);
        setGeneratedReportClient(updatedClient);
    };

    return (
        <div className="space-y-6">
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-indigo-400">REPORT GENERATOR</h3>
                <p className="text-sm text-slate-300">
                    Generate an AI-powered report with KPI analysis and client health summaries. You can then download it as a PDF or share a public link.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                        {isGenerating ? 'Generating...' : 'Generate/Update Report'}
                    </button>
                    <button
                        onClick={() => setIsManageKpisOpen(true)}
                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                    >
                        <TargetIcon className="w-5 h-5"/>
                        Manage Tracked KPIs
                    </button>
                     <button
                        onClick={() => setIsShareModalOpen(true)}
                        disabled={!client.dashboardConfig?.kpiSummary}
                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <LinkIcon className="w-5 h-5"/>
                        Share Report
                    </button>
                </div>
            </div>
            
            {generatedReportClient && (
                 <PrintableReportWrapper {...props} client={generatedReportClient} onSaveClient={onSaveClient} />
            )}

            <ManageClientKpisModal 
                isOpen={isManageKpisOpen}
                onClose={() => setIsManageKpisOpen(false)}
                client={client}
                teamMembers={teamMembers}
                kpiGroups={kpiGroups}
                onSave={handleSaveKpis}
            />

            {isShareModalOpen && (
                <ShareModal link={publicLink} onClose={() => setIsShareModalOpen(false)} />
            )}
        </div>
    );
};
