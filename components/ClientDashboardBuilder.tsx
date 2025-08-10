
import React, { useState, useEffect, useRef } from 'react';
import { Client, KpiGroup, KpiProgress, TeamMember, WeeklyPerformanceSnapshot, Task, KpiReportData } from '../types';
import { SparklesIcon, LoaderIcon, LinkIcon, TargetIcon, DownloadIcon } from './Icons';
import { ManageClientKpisModal } from './ManageClientKpisModal';
import { useToasts } from '../hooks/useToasts';
import { api } from '../services/api';
import { InteractiveClientReport } from './InteractiveClientReport';
import { ClientReportPage } from './ClientReportPage';
import { Modal } from './ui/Modal';
import { useTheme } from '../contexts/ThemeContext';
import { getStartOfWeekISO } from './utils/time';

// Declare globals for TypeScript from script tags in index.html
declare const html2canvas: any;
declare const jspdf: any;


const ShareModal: React.FC<{ link: string; onClose: () => void }> = ({ link, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Shareable Report Link" size="lg">
             <div className="flex items-center bg-core-bg border border-core-border rounded-md p-2">
                <input type="text" readOnly value={link} className="bg-transparent text-core-text-primary w-full outline-none"/>
                <button onClick={handleCopy} className={`ml-2 px-3 py-1 rounded text-sm font-semibold ${copied ? 'bg-green-600 text-white' : 'bg-core-accent hover:bg-core-accent-hover text-white'}`}>
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
             <p className="text-xs text-core-text-secondary mt-2">Anyone with this link can view the latest generated report. The dashboard is read-only.</p>
        </Modal>
    )
}

interface ClientDashboardBuilderProps {
    client: Client;
    onSaveClient: (client: Client) => void;
    tasks: Task[];
    teamMembers: TeamMember[];
    kpiProgress: KpiProgress[];
    kpiGroups: KpiGroup[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
}

export const ClientDashboardBuilder: React.FC<ClientDashboardBuilderProps> = (props) => {
    const { client, onSaveClient, tasks, teamMembers, kpiProgress, kpiGroups, weeklySnapshots } = props;
    const { addToast } = useToasts();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [generatedReportClient, setGeneratedReportClient] = useState<Client | null>(client);
    const [isManageKpisOpen, setIsManageKpisOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const printableContentRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    
    const publicLink = `${window.location.origin}${window.location.pathname}?page=public-dashboard&id=${client.id}`;

    useEffect(() => {
        setGeneratedReportClient(client);
    }, [client]);
    
    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            const lastWeekStart = getStartOfWeekISO(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
            const lastWeekSnapshots = weeklySnapshots.filter(s => s.weekOf === lastWeekStart);
            
            const kpiData: KpiReportData[] = (client.trackedKpis || []).map(tracked => {
                const member = teamMembers.find(m => m.id === tracked.teamMemberId);
                if (!member || !member.kpiGroupId) return null;
                const group = kpiGroups.find(g => g.id === member.kpiGroupId);
                if (!group) return null;
                const kpiDef = group.kpis.find(k => k.id === tracked.kpiDefinitionId);
                if (!kpiDef) return null;
                
                const progress = kpiProgress.find(p => p.teamMemberId === member.id && p.kpiDefinitionId === kpiDef.id);
                
                const lastWeekMemberSnapshot = lastWeekSnapshots.find(s => s.teamMemberId === member.id);
                const previousActual = lastWeekMemberSnapshot?.kpiSnapshots?.find(k => k.name === kpiDef.name)?.actual ?? 0;
                
                return {
                    name: kpiDef.name,
                    actual: progress?.actual || 0,
                    goal: kpiDef.goal,
                    type: kpiDef.type,
                    teamMemberName: member.name,
                    previousActual: previousActual
                };
            }).filter((d): d is KpiReportData => d !== null);

            const clientTasks = tasks.filter(t => t.clientId === client.id);
            const clientContext = { client, tasks: clientTasks, pulseLog: client.pulseLog, kpis: kpiData };

            const summaries = await api.generateDashboardReport(kpiData, clientContext);
            
            const updatedClient: Client = {
                ...client,
                dashboardConfig: {
                    ...(client.dashboardConfig || { updatedAt: '' }),
                    kpiSummary: summaries.kpiSummary,
                    highlights: summaries.highlights,
                    healthSummary: summaries.healthSummary,
                    updatedAt: new Date().toISOString(),
                },
                aiHealthSummary: { summary: summaries.healthSummary, generatedAt: new Date().toISOString() }
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
    
    const handleDownloadPdf = async () => {
        const element = printableContentRef.current;
        if (!element) {
            addToast("Report content not found.", "error");
            return;
        }

        setIsGeneratingPdf(true);
        addToast('Generating PDF of the report...', 'info');

        // Temporarily make the element visible for capture, but off-screen
        const originalStyles = {
            display: element.style.display,
            position: element.style.position,
            left: element.style.left,
            top: element.style.top,
        };
        element.style.display = 'block';
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.top = '0px';

        try {
            const canvas = await html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#FFFFFF', // Force white background for PDF
                onclone: (document) => {
                    // force light theme on the cloned document for printing
                     document.documentElement.classList.remove('dark');
                },
                scrollX: 0,
                scrollY: 0,
            });
            const pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`report_${props.client.name.replace(/ /g, '_')}.pdf`);
        } catch (err) {
            console.error('Failed to generate PDF', err);
            addToast("Sorry, there was an error generating the PDF.", "error");
        } finally {
            // Restore original styles
            element.style.display = originalStyles.display;
            element.style.position = originalStyles.position;
            element.style.left = originalStyles.left;
            element.style.top = originalStyles.top;
            setIsGeneratingPdf(false);
        }
    };

    const handleSaveKpis = (clientId: string, kpis: { teamMemberId: string; kpiDefinitionId: string; }[]) => {
        const updatedClient: Client = { ...client, trackedKpis: kpis };
        onSaveClient(updatedClient);
        setGeneratedReportClient(updatedClient);
    };

    return (
        <div className="space-y-6">
            <div className="bg-core-bg p-4 rounded-lg border border-core-border space-y-3">
                <h3 className="text-sm font-bold text-core-accent">REPORT GENERATOR</h3>
                <p className="text-sm text-core-text-secondary">
                    Generate an AI-powered report with KPI analysis and client health summaries. You can then download it as a PDF or share a public link.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    <button onClick={handleGenerateReport} disabled={isGenerating || isGeneratingPdf} className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-core-accent hover:from-purple-600 hover:to-core-accent-hover text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-lg hover:shadow-core-accent/20 disabled:opacity-50">
                        {isGenerating ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                        {isGenerating ? 'Generating...' : 'Generate/Update'}
                    </button>
                    <button onClick={() => setIsManageKpisOpen(true)} className="flex items-center justify-center gap-2 bg-core-bg-soft hover:bg-core-border text-core-text-primary font-semibold py-2.5 px-4 rounded-lg transition-colors border border-core-border">
                        <TargetIcon className="w-5 h-5"/> Manage KPIs
                    </button>
                    <button onClick={() => setIsShareModalOpen(true)} disabled={!client.dashboardConfig?.kpiSummary} className="flex items-center justify-center gap-2 bg-core-bg-soft hover:bg-core-border text-core-text-primary font-semibold py-2.5 px-4 rounded-lg transition-colors border border-core-border disabled:opacity-50">
                        <LinkIcon className="w-5 h-5"/> Share Report
                    </button>
                    <button onClick={handleDownloadPdf} disabled={isGeneratingPdf || !client.dashboardConfig?.kpiSummary} className="flex items-center justify-center gap-2 bg-core-bg-soft hover:bg-core-border text-core-text-primary font-semibold py-2.5 px-4 rounded-lg transition-colors border border-core-border disabled:opacity-50">
                        {isGeneratingPdf ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <DownloadIcon className="w-5 h-5" />}
                        Download PDF
                    </button>
                </div>
            </div>

            {generatedReportClient?.dashboardConfig?.kpiSummary ? (
                <InteractiveClientReport {...props} client={generatedReportClient} />
            ) : (
                <div className="text-center py-16 bg-core-bg-soft rounded-lg border border-dashed border-core-border">
                    <SparklesIcon className="w-12 h-12 mx-auto text-core-text-secondary/50 mb-2"/>
                    <p className="font-semibold text-core-text-secondary">No report has been generated yet.</p>
                    <p className="text-sm text-core-text-secondary/70">Click the button above to generate an AI-powered report.</p>
                </div>
            )}
            
            <div className="printable-report-container" style={{ position: 'absolute', left: '-9999px', top: 0 }} ref={printableContentRef}>
                 {generatedReportClient && <ClientReportPage {...props} client={generatedReportClient} isPrintVersion={true} />}
            </div>

            <ManageClientKpisModal isOpen={isManageKpisOpen} onClose={() => setIsManageKpisOpen(false)} client={client} teamMembers={teamMembers} kpiGroups={kpiGroups} onSave={handleSaveKpis}/>
            {isShareModalOpen && <ShareModal link={publicLink} onClose={() => setIsShareModalOpen(false)} />}
        </div>
    );
};
