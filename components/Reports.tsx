
import React, { useState, useRef } from 'react';
import { marked } from 'marked';
import { Client, Task, TeamMember, WeeklyPerformanceSnapshot, KpiProgress, KpiGroup, TeamPerformanceReportData, ClientHealthReportData, TaskHotspotsReportData } from '../types';
import { SparklesIcon, LoaderIcon, BarChartIcon, DownloadIcon, UsersIcon, AlertTriangleIcon, ListIcon } from './Icons';
import { api } from '../services/api';
import { DonutChart } from './DonutChart';
import { useToasts } from '../hooks/useToasts';
import { useDataContext } from '../contexts/DataContext';
import { ReportWidget } from './ui/ReportWidget';
import { PageHeader } from './ui/PageHeader';
import { useTheme } from '../contexts/ThemeContext';
import { SkeletonLoader } from './SkeletonLoader';

// Declare globals for TypeScript from script tags in index.html
declare const html2canvas: any;
declare const jspdf: any;

interface ReportsProps {
    clients: Client[];
    tasks: Task[];
    teamMembers: TeamMember[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
}

const WidgetListItem: React.FC<{ item: { id: string, name: string, detail: string | number }, onNavigate: () => void, avatarInitials?: string }> = ({ item, onNavigate, avatarInitials }) => (
    <div onClick={onNavigate} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-core-bg">
        {avatarInitials && <div className="w-8 h-8 rounded-full bg-core-accent flex items-center justify-center font-bold text-xs flex-shrink-0 text-core-accent-foreground">{avatarInitials}</div>}
        <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-core-text-primary truncate text-sm">{item.name}</p>
        </div>
        <p className="text-sm font-medium text-core-text-secondary">{item.detail}</p>
    </div>
);

const EmptyState: React.FC<{ onGenerate: () => void; text?: string }> = ({ onGenerate, text = "Generate Report" }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-core-bg-soft/50 rounded-lg">
        <button onClick={onGenerate} className="flex items-center gap-2 bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-core-accent/20">
            <SparklesIcon className="w-5 h-5" />
            <span>{text}</span>
        </button>
    </div>
);

const SkeletonReport: React.FC = () => (
    <div className="space-y-3 animate-pulse">
        <SkeletonLoader className="h-5 w-full rounded" />
        <SkeletonLoader className="h-5 w-3/4 rounded" />
        <SkeletonLoader className="h-5 w-1/2 rounded" />
    </div>
);

export const Reports: React.FC<ReportsProps> = ({ clients, tasks, teamMembers, weeklySnapshots }) => {
    const { addToast } = useToasts();
    const { navigateToTeamMember, navigateToTasks } = useDataContext();
    const { theme } = useTheme();
    const dashboardRef = useRef<HTMLDivElement>(null);

    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    
    // Report-specific states
    const [teamReport, setTeamReport] = useState<TeamPerformanceReportData | null>(null);
    const [clientReport, setClientReport] = useState<ClientHealthReportData | null>(null);
    const [taskReport, setTaskReport] = useState<TaskHotspotsReportData | null>(null);
    const [customReport, setCustomReport] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');

    const handleApiCall = async (
        reportType: 'team' | 'client' | 'task' | 'custom', 
        apiCall: () => Promise<any>,
        onSuccess: (data: any) => void
    ) => {
        setLoadingStates(prev => ({ ...prev, [reportType]: true }));
        try {
            const data = await apiCall();
            onSuccess(data);
        } catch (error) {
            console.error(`Error generating ${reportType} report:`, error);
            addToast(error instanceof Error ? error.message : `Failed to generate ${reportType} report`, 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, [reportType]: false }));
        }
    };

    const handleGenerateTeamReport = () => handleApiCall('team',
        () => api.generateTeamPerformanceReport({ teamMembers }),
        setTeamReport
    );

    const handleGenerateClientReport = () => handleApiCall('client',
        () => api.generateClientHealthReport({ clients }),
        setClientReport
    );

    const handleGenerateTaskReport = () => handleApiCall('task',
        () => api.generateTaskHotspotsReport({ tasks }),
        setTaskReport
    );

    const handleGenerateCustomReport = (prompt: string) => {
        if (!prompt.trim()) return;
        setCustomReport('');
        handleApiCall('custom',
            () => api.generateReport(prompt, { clients, tasks, teamMembers, weeklySnapshots }),
            (data) => setCustomReport(data.report)
        );
    };

    const handleDownloadDashboard = async () => {
        const element = dashboardRef.current;
        if (!element) {
            addToast("Report content not found.", "error");
            return;
        }

        setIsPdfGenerating(true);
        addToast('Generating PDF of the dashboard...', 'info');

        try {
            const canvas = await html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                scrollX: -window.scrollX,
                scrollY: -window.scrollY,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight,
            });

            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const canvasPageHeight = (imgWidth / pdfWidth) * pdfHeight;
            let position = 0;

            while (position < imgHeight) {
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = imgWidth;
                pageCanvas.height = Math.min(canvasPageHeight, imgHeight - position);
                
                const pageCtx = pageCanvas.getContext('2d');
                if (pageCtx) {
                    pageCtx.fillStyle = theme === 'dark' ? '#111827' : '#FFFFFF';
                    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                    pageCtx.drawImage(canvas, 0, position, imgWidth, pageCanvas.height, 0, 0, imgWidth, pageCanvas.height);
                    
                    if (position > 0) {
                        pdf.addPage();
                    }
                    const imgData = pageCanvas.toDataURL('image/png', 1.0);
                    if (imgData.length < 100) { // Heuristic check for empty canvas slice
                        throw new Error("Canvas generated an empty image slice.");
                    }
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), undefined, 'FAST');
                }
                position += canvasPageHeight;
            }
            
            pdf.save(`SolvoCore_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("Failed to generate PDF", err);
            addToast("Sorry, there was an error generating the PDF.", "error");
        } finally {
            setIsPdfGenerating(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Reporting Hub"
                description="Generate deep insights and downloadable reports from your operational data."
                icon={<BarChartIcon className="w-6 h-6"/>}
                actions={
                    <button onClick={handleDownloadDashboard} disabled={isPdfGenerating} className="flex items-center gap-2 bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-core-accent/20 disabled:opacity-50">
                        {isPdfGenerating ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <DownloadIcon className="w-5 h-5"/>}
                        Download Dashboard
                    </button>
                }
            />
            <div ref={dashboardRef} className="space-y-6">
                <ReportWidget title="Custom AI Query" icon={<SparklesIcon className="w-6 h-6 text-core-accent"/>} className="lg:col-span-3">
                     <div className="flex flex-col gap-2 h-full">
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g., 'Generate a summary of all at-risk clients and their pending high-priority tasks.'"
                            disabled={loadingStates.custom}
                            rows={2}
                            className="w-full bg-core-bg border border-core-border rounded-lg py-2.5 px-4 text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent"
                        />
                         <button
                            onClick={() => handleGenerateCustomReport(customPrompt)}
                            disabled={loadingStates.custom || !customPrompt.trim()}
                            className="flex items-center justify-center gap-2 bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                         >
                            {loadingStates.custom ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                            <span>Generate Custom Report</span>
                        </button>
                        <div className="mt-2 p-4 bg-core-bg rounded-md border border-core-border flex-grow min-h-[150px] overflow-y-auto">
                           {loadingStates.custom ? <SkeletonReport /> :
                            customReport ? <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:text-core-text-primary" dangerouslySetInnerHTML={{ __html: marked.parse(customReport, { breaks: true, gfm: true }) as string }} /> : <p className="text-core-text-secondary text-sm text-center pt-8">Your custom report will appear here.</p>
                           }
                        </div>
                     </div>
                </ReportWidget>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ReportWidget title="Team Performance" icon={<UsersIcon className="w-6 h-6 text-purple-400"/>}>
                        {loadingStates.team ? <SkeletonReport /> : teamReport ? (
                            <div className="space-y-4">
                                <p className="text-sm text-core-text-secondary bg-core-bg p-3 rounded-md border border-core-border">{teamReport.summary}</p>
                                <div>
                                    <h4 className="text-sm font-semibold text-green-400 mb-2">Top Performers</h4>
                                    {teamReport.topPerformers.map(m => <WidgetListItem key={m.id} item={{id: m.id, name: m.name, detail: `${m.performanceScore} pts`}} onNavigate={() => navigateToTeamMember(m.id)} avatarInitials={m.name.split(' ').map(n=>n[0]).join('')}/>)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">Needs Support</h4>
                                    {teamReport.needsSupport.length > 0 ? teamReport.needsSupport.map(m => <WidgetListItem key={m.id} item={{id: m.id, name: m.name, detail: `${m.performanceScore} pts`}} onNavigate={() => navigateToTeamMember(m.id)} avatarInitials={m.name.split(' ').map(n=>n[0]).join('')} />) : <p className="text-xs italic text-core-text-secondary">No team members currently flagged.</p>}
                                </div>
                            </div>
                        ) : <EmptyState onGenerate={handleGenerateTeamReport} />}
                    </ReportWidget>

                    <ReportWidget title="Client Health" icon={<AlertTriangleIcon className="w-6 h-6 text-orange-400"/>}>
                        {loadingStates.client ? <SkeletonReport /> : clientReport ? (
                            <div className="space-y-4">
                                <p className="text-sm text-core-text-secondary bg-core-bg p-3 rounded-md border border-core-border">{clientReport.summary}</p>
                                <div className="flex justify-around items-center pt-2">
                                    <DonutChart size={140} strokeWidth={15}
                                        data={[
                                            { value: clientReport.counts.healthy, color: '#22c55e' },
                                            { value: clientReport.counts.atRisk, color: '#facc15' },
                                            { value: clientReport.counts.critical, color: '#ef4444' },
                                        ]}
                                        centerText={<div className="text-center"><p className="text-3xl font-bold text-core-text-primary">{clients.length}</p><p className="text-xs text-core-text-secondary">Total</p></div>}
                                    />
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>Healthy: <b>{clientReport.counts.healthy}</b></div>
                                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>At-Risk: <b>{clientReport.counts.atRisk}</b></div>
                                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>Critical: <b>{clientReport.counts.critical}</b></div>
                                    </div>
                                </div>
                            </div>
                        ) : <EmptyState onGenerate={handleGenerateClientReport} />}
                    </ReportWidget>

                    <ReportWidget title="Task Hotspots" icon={<ListIcon className="w-6 h-6 text-blue-400"/>}>
                        {loadingStates.task ? <SkeletonReport /> : taskReport ? (
                            <div className="space-y-4">
                                <p className="text-sm text-core-text-secondary bg-core-bg p-3 rounded-md border border-core-border">{taskReport.summary}</p>
                                <div>
                                    <h4 className="text-sm font-semibold text-red-400 mb-2">Overdue Tasks ({taskReport.overdueTasks.length})</h4>
                                    {taskReport.overdueTasks.length > 0 ? taskReport.overdueTasks.slice(0,3).map(t => <WidgetListItem key={t.id} item={{id:t.id, name: t.title, detail: teamMembers.find(tm=>tm.id === t.assignedTo)?.name || 'N/A' }} onNavigate={() => navigateToTasks({}, t.id)} />) : <p className="text-xs text-core-text-secondary italic">None</p>}
                                </div>
                                 <div>
                                    <h4 className="text-sm font-semibold text-orange-400 mb-2">High Priority ({taskReport.highPriorityTasks.length})</h4>
                                    {taskReport.highPriorityTasks.length > 0 ? taskReport.highPriorityTasks.slice(0,3).map(t => <WidgetListItem key={t.id} item={{id:t.id, name: t.title, detail: teamMembers.find(tm=>tm.id === t.assignedTo)?.name || 'N/A' }} onNavigate={() => navigateToTasks({}, t.id)} />) : <p className="text-xs text-core-text-secondary italic">None</p>}
                                </div>
                            </div>
                        ) : <EmptyState onGenerate={handleGenerateTaskReport} />}
                    </ReportWidget>
                </div>
            </div>
        </div>
    );
};
