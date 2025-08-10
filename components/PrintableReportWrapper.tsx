
import React, { useState } from 'react';
import { ClientReportPage } from './ClientReportPage';
import { Client, TeamMember, KpiGroup, KpiProgress, WeeklyPerformanceSnapshot, Task } from '../types';
import { DownloadIcon, LoaderIcon } from './Icons';

// Declare globals for TypeScript from script tags in index.html
declare const html2canvas: any;
declare const jspdf: any;

interface PrintableReportWrapperProps {
    client: Client;
    teamMembers: TeamMember[];
    kpiGroups: KpiGroup[];
    kpiProgress: KpiProgress[];
    weeklySnapshots: WeeklyPerformanceSnapshot[];
    tasks: Task[];
    onSaveClient: (client: Client) => void;
}

export const PrintableReportWrapper: React.FC<PrintableReportWrapperProps> = (props) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadPdf = async () => {
        setIsGenerating(true);
        // The element is already in the DOM but hidden. We'll capture that.
        const reportElement = document.querySelector('.printable-report-container > div');

        if (!reportElement || !reportElement.parentElement) {
            console.error("Printable report element not found");
            setIsGenerating(false);
            return;
        }
        
        // Temporarily make it visible for capture, but off-screen
        const parent = reportElement.parentElement as HTMLElement;
        const originalStyle = {
            display: parent.style.display,
            position: parent.style.position,
            left: parent.style.left,
            top: parent.style.top,
            width: parent.style.width,
        };
        parent.style.display = 'block';
        parent.style.position = 'absolute';
        parent.style.left = '-9999px';
        parent.style.top = '0px';
        parent.style.width = '800px'; // A fixed width for consistent rendering

        try {
            const canvas = await html2canvas(reportElement as HTMLElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`report_${props.client.name.replace(/ /g, '_')}.pdf`);
        } catch (err) {
            console.error('Failed to generate PDF', err);
            alert("Sorry, there was an error generating the PDF.");
        } finally {
            // Restore original styles
            parent.style.display = originalStyle.display;
            parent.style.position = originalStyle.position;
            parent.style.left = originalStyle.left;
            parent.style.top = originalStyle.top;
            parent.style.width = originalStyle.width;
            setIsGenerating(false);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleDownloadPdf}
                    disabled={isGenerating || !props.client.dashboardConfig?.kpiSummary}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isGenerating ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5" />}
                    {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                </button>
            </div>
            
            <div className="bg-slate-900 rounded-xl border border-slate-700">
                <ClientReportPage {...props}/>
            </div>

            {/* Hidden version for PDF capture */}
            <div className="printable-report-container" style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', backgroundColor: 'white' }}>
                <ClientReportPage {...props} isPrintVersion={true} />
            </div>
        </div>
    );
};
