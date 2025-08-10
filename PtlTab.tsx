
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TeamMember, Task, Client, PtlReport, PtlFactor, ClientStatus, TaskStatus } from '../types';
import { SparklesIcon, LoaderIcon, AlertTriangleIcon } from './Icons';
import { api } from './services/api';

interface PtlTabProps {
    member: TeamMember;
    tasks: Task[];
    clients: Client[];
    onSave: (updatedMember: TeamMember) => void;
}

const FactorItem: React.FC<{ factor: PtlFactor, isCalculated?: boolean }> = ({ factor, isCalculated = false }) => {
    const impactColor = factor.impact === 'Positive' ? 'text-green-400' : factor.impact === 'Negative' ? 'text-red-400' : 'text-slate-400';
    const bgColor = isCalculated ? 'bg-slate-900/50' : 'bg-slate-800/80';
    return (
        <div className={`p-3 ${bgColor} rounded-lg flex items-center justify-between`}>
            <div>
                <p className={`text-sm font-semibold ${impactColor}`}>{factor.name}</p>
                <p className="text-xs text-slate-400">{factor.description}</p>
            </div>
            <p className={`text-lg font-bold ${impactColor}`}>{String(factor.value)}</p>
        </div>
    );
};

const handleApiError = (error: unknown) => {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    alert(`An error occurred: ${errorMessage}`);
};

export const PtlTab: React.FC<PtlTabProps> = ({ member, tasks, clients, onSave }) => {
    const [baseReport, setBaseReport] = useState<PtlReport | null>(null);
    const [riskLevel, setRiskLevel] = useState<PtlReport['riskLevel']>('Low');
    const [findings, setFindings] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    
    const factors = useMemo((): PtlFactor[] => {
        const memberTasks = tasks.filter(t => t.assignedTo === member.id);
        const memberClients = clients.filter(c => c.assignedTeamMembers.includes(member.id));
        const overdueTasksCount = memberTasks.filter(t => t.status === TaskStatus.Overdue).length;
        const criticalClientsCount = memberClients.filter(c => c.status === ClientStatus.Critical).length;

        const hireDate = new Date(member.hireDate);
        const tenureInMonths = !member.hireDate || isNaN(hireDate.getTime())
            ? 0
            : (new Date().getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

        return [
            { name: 'Performance', value: member.performanceScore, impact: member.performanceScore >= 80 ? 'Positive' : member.performanceScore >= 60 ? 'Neutral' : 'Negative', description: "Current overall performance score." },
            { name: 'Trend', value: member.performanceScore >= member.previousPerformanceScore ? 'Stable/Up' : 'Down', impact: member.performanceScore >= member.previousPerformanceScore ? 'Positive' : 'Negative', description: "Recent performance score trend." },
            { name: 'Tenure', value: tenureInMonths > 0 ? `${tenureInMonths.toFixed(1)} mos` : 'N/A', impact: tenureInMonths < 6 ? 'Negative' : tenureInMonths < 18 ? 'Neutral' : 'Positive', description: "Length of time with the company." },
            { name: 'Workload', value: overdueTasksCount, impact: overdueTasksCount === 0 ? 'Positive' : overdueTasksCount <= 2 ? 'Neutral' : 'Negative', description: "Number of overdue tasks." },
            { name: 'Client Health', value: criticalClientsCount, impact: criticalClientsCount === 0 ? 'Positive' : 'Negative', description: "Assigned to critical-status clients." },
            { name: 'Status Notes', value: member.homeOffice.notes.toLowerCase().includes('resign') ? 'Resigned' : 'OK', impact: member.homeOffice.notes.toLowerCase().includes('resign') ? 'Negative' : 'Positive', description: "Keywords in administrative notes." }
        ];
    }, [member, tasks, clients]);

    const generateBaseReport = useCallback(async () => {
        if (!factors || factors.length === 0) {
            setIsLoading(false);
            return;
        }
        
        let riskScore = 10;
        factors.forEach(f => {
            if (f.impact === 'Negative') {
                if (f.name === 'Status Notes' && f.value === 'Resigned') riskScore += 50;
                else if (f.name === 'Trend') riskScore += 15;
                else if (f.name === 'Client Health' && typeof f.value === 'number' && f.value > 0) riskScore += (f.value * 10);
                else riskScore += 10;
            } else if (f.impact === 'Positive') {
                if (f.name === 'Performance' && typeof f.value === 'number' && f.value > 90) riskScore -= 10;
                else riskScore -= 5;
            }
        });
        riskScore = Math.max(0, Math.min(riskScore, 100));

        let calculatedRiskLevel: PtlReport['riskLevel'] = 'Low';
        if (riskScore >= 75) calculatedRiskLevel = 'Critical';
        else if (riskScore >= 50) calculatedRiskLevel = 'High';
        else if (riskScore >= 25) calculatedRiskLevel = 'Medium';
       
        setIsLoading(true);
        try {
            const data = await api.generatePtlSummary(calculatedRiskLevel, factors);
            
            const report: PtlReport = { riskScore, riskLevel: calculatedRiskLevel, factors, summary: data.summary };
            setBaseReport(report);
            setRiskLevel(member.ptlReport?.riskLevel || report.riskLevel);
            setFindings(member.ptlReport?.summary || data.summary);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            const displayMessage = `Could not generate AI summary: ${errorMessage}`;
            const report: PtlReport = { riskScore, riskLevel: calculatedRiskLevel, factors, summary: displayMessage };
            setBaseReport(report);
            setRiskLevel(member.ptlReport?.riskLevel || report.riskLevel);
            setFindings(member.ptlReport?.summary || displayMessage);
        } finally {
            setIsLoading(false);
        }
    }, [factors, member.ptlReport]);

    useEffect(() => {
        generateBaseReport();
    }, [generateBaseReport]);

    const handleGenerateFeedback = async () => {
        setIsGeneratingFeedback(true);
        try {
            const data = await api.suggestCoachingSummary(member, [], []);
            setFindings(data.summary);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const handleSave = () => {
        if (!baseReport) return;
        const newPtlReport: PtlReport = { ...baseReport, riskLevel, summary: findings };
        const updatedMember: TeamMember = { ...member, ptlReport: newPtlReport };
        onSave(updatedMember);
        alert('PTL Information Saved!');
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><LoaderIcon className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><AlertTriangleIcon className="w-5 h-5 text-orange-400"/>Potential Turnover Likelihood</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Form */}
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
                    <h4 className="font-semibold text-white">Conversation Log</h4>
                    <div>
                        <label htmlFor="riskLevel" className="block text-sm font-medium text-slate-300 mb-1">Risk level</label>
                        <select
                            id="riskLevel"
                            value={riskLevel}
                            onChange={(e) => setRiskLevel(e.target.value as PtlReport['riskLevel'])}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                        </select>
                         <p className="text-xs text-slate-500 mt-1">Calculated risk level: {baseReport?.riskLevel}</p>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="findings" className="block text-sm font-medium text-slate-300">
                                Which are the findings of your conversation related to the turnover risk?
                            </label>
                            <span className={`text-xs ${findings.length > 800 ? 'text-red-400' : 'text-slate-500'}`}>{findings.length}/800</span>
                        </div>
                         <textarea
                            id="findings"
                            value={findings}
                            onChange={(e) => setFindings(e.target.value)}
                            rows={8}
                            maxLength={800}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Log your conversation notes and findings here..."
                        />
                    </div>
                    <div className="flex justify-between items-center">
                         <button
                            onClick={handleGenerateFeedback}
                            disabled={isGeneratingFeedback}
                            className="flex items-center gap-2 bg-purple-600/80 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors hover:bg-purple-700/80 disabled:opacity-50"
                        >
                            {isGeneratingFeedback ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                            Generate Positive Feedback
                        </button>
                         <button
                            onClick={handleSave}
                            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors hover:bg-indigo-700"
                        >
                            Save PTL Info
                        </button>
                    </div>
                </div>
                
                {/* Right side: Factors */}
                <div className="space-y-3">
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-center">
                        <h4 className="text-sm font-bold uppercase text-slate-500 mb-1">Calculated Risk Score</h4>
                        <p className="text-5xl font-bold text-white">{baseReport?.riskScore}</p>
                    </div>
                    <h4 className="font-semibold text-white pt-2">Contributing Factors</h4>
                    {factors.map(f => <FactorItem key={f.name} factor={f} isCalculated />)}
                </div>
            </div>
        </div>
    );
};
