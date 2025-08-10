

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TeamMember, Task, Client, PtlReport, PtlFactor, ClientStatus, TaskStatus, ActionItem, PtlAnalysis } from '../types';
import { SparklesIcon, LoaderIcon, AlertTriangleIcon, LightbulbIcon } from './Icons';
import { api } from '../services/api';
import { Gauge } from './Gauge';

interface PtlTabProps {
    member: TeamMember;
    tasks: Task[];
    clients: Client[];
    onSave: (updatedMember: TeamMember) => void;
    onStartCoaching: (data: { summary: string; leaderActions?: ActionItem[]; employeeActions?: ActionItem[] }) => void;
}

const FactorItem: React.FC<{ factor: PtlFactor, isCalculated?: boolean }> = ({ factor, isCalculated = false }) => {
    const impactColor = factor.impact === 'Positive' ? 'text-green-400' : factor.impact === 'Negative' ? 'text-red-400' : 'text-core-text-secondary';
    const bgColor = isCalculated ? 'bg-core-bg-soft/50' : 'bg-core-bg/80';
    return (
        <div className={`p-3 ${bgColor} rounded-lg flex items-center justify-between`}>
            <div>
                <p className={`text-sm font-semibold ${impactColor}`}>{factor.name}</p>
                <p className="text-xs text-core-text-secondary">{factor.description}</p>
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

export const PtlTab: React.FC<PtlTabProps> = ({ member, tasks, clients, onSave, onStartCoaching }) => {
    const [ptlReport, setPtlReport] = useState<PtlReport | null>(member.ptlReport || null);
    const [aiAnalysis, setAiAnalysis] = useState<PtlAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    const factors = useMemo((): PtlFactor[] => {
        const memberTasks = tasks.filter(t => t.assignedTo === member.id);
        const memberClients = clients.filter(c => c.assignedTeamMembers.includes(member.id));
        const overdueTasksCount = memberTasks.filter(t => t.status === TaskStatus.Overdue).length;
        const criticalClientsCount = memberClients.filter(c => c.status === ClientStatus.Critical).length;

        const hireDate = new Date(member.hireDate);
        const tenureInMonths = !member.hireDate || isNaN(hireDate.getTime())
            ? 0
            : (new Date().getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        
        const currentYear = new Date().getFullYear();
        const ytdLeaves = (member.leaveLog || []).filter(l => new Date(l.date).getFullYear() === currentYear);
        const medicalLeavesYTD = ytdLeaves.filter(l => l.type === 'Medical').length;
        const permissionsYTD = ytdLeaves.filter(l => l.type === 'Permission').length;


        return [
            { name: 'Performance', value: member.performanceScore, impact: member.performanceScore >= 80 ? 'Positive' : member.performanceScore >= 60 ? 'Neutral' : 'Negative', description: "Current overall performance score." },
            { name: 'Trend', value: member.performanceScore >= member.previousPerformanceScore ? 'Stable/Up' : 'Down', impact: member.performanceScore >= member.previousPerformanceScore ? 'Positive' : 'Negative', description: "Recent performance score trend." },
            { name: 'Tenure', value: tenureInMonths > 0 ? `${tenureInMonths.toFixed(1)} mos` : 'N/A', impact: tenureInMonths < 6 ? 'Negative' : tenureInMonths < 18 ? 'Neutral' : 'Positive', description: "Length of time with the company." },
            { name: 'Workload', value: overdueTasksCount, impact: overdueTasksCount === 0 ? 'Positive' : overdueTasksCount <= 2 ? 'Neutral' : 'Negative', description: "Number of overdue tasks." },
            { name: 'Client Health', value: criticalClientsCount, impact: criticalClientsCount === 0 ? 'Positive' : 'Negative', description: "Assigned to critical-status clients." },
            { name: 'Medical Leaves (YTD)', value: medicalLeavesYTD, impact: medicalLeavesYTD < 3 ? 'Positive' : medicalLeavesYTD <= 5 ? 'Neutral' : 'Negative', description: 'Total medical leaves this year.' },
            { name: 'Permissions (YTD)', value: permissionsYTD, impact: permissionsYTD < 3 ? 'Positive' : permissionsYTD <= 5 ? 'Neutral' : 'Negative', description: 'Early outs, emergencies, etc.' },
            { name: 'Status Notes', value: member.homeOffice.notes.toLowerCase().includes('resign') ? 'Resigned' : 'OK', impact: member.homeOffice.notes.toLowerCase().includes('resign') ? 'Negative' : 'Positive', description: "Keywords in administrative notes." }
        ];
    }, [member, tasks, clients]);

    const generatePtlReport = useCallback(async () => {
        setIsLoading(true);
        let riskScore = 10;
        factors.forEach(f => {
            if (f.impact === 'Negative') {
                if (f.name === 'Status Notes' && f.value === 'Resigned') riskScore += 50;
                else if (f.name === 'Trend') riskScore += 15;
                else if (f.name === 'Client Health' && typeof f.value === 'number' && f.value > 0) riskScore += (f.value * 10);
                else if (f.name === 'Medical Leaves (YTD)' && typeof f.value === 'number') riskScore += f.value * 2;
                else if (f.name === 'Permissions (YTD)' && typeof f.value === 'number') riskScore += f.value;
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
       
        try {
            const data = await api.generatePtlAnalysis(riskScore, calculatedRiskLevel, factors);
            const report: PtlReport = { riskScore, riskLevel: calculatedRiskLevel, factors, summary: data.analysis };
            setPtlReport(report);
            setAiAnalysis(data);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }, [factors]);

    const handleGenerateCoachingPlan = async () => {
        if (!ptlReport) return;
        setIsGeneratingPlan(true);
        try {
            const plan = await api.generatePtlCoachingPlan(ptlReport);
            const leaderActions: ActionItem[] = plan.leaderActions.map((text, i) => ({ id: `la-gen-${i}`, text, completed: false }));
            const employeeActions: ActionItem[] = plan.employeeActions.map((text, i) => ({ id: `ea-gen-${i}`, text, completed: false }));
            onStartCoaching({
                summary: plan.summary,
                leaderActions,
                employeeActions
            });
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    useEffect(() => {
        generatePtlReport();
    }, [generatePtlReport]);
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><LoaderIcon className="w-8 h-8 animate-spin text-core-text-secondary" /></div>;
    }

    if (!ptlReport) {
        return <div className="text-center text-core-text-secondary">Could not generate PTL report.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-core-text-primary flex items-center gap-2"><AlertTriangleIcon className="w-5 h-5 text-orange-400"/>Potential Turnover Likelihood</h3>
                <button
                    onClick={generatePtlReport}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-core-accent hover:bg-core-accent-hover text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors disabled:opacity-50"
                >
                    {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                    Recalculate & Analyze
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                     <div className="p-4 bg-core-bg-soft rounded-lg border border-core-border flex flex-col items-center justify-center">
                        <Gauge value={ptlReport.riskScore} riskLevel={ptlReport.riskLevel} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-core-text-primary mb-2">Contributing Factors</h4>
                        <div className="space-y-2">
                             {factors.map(f => <FactorItem key={f.name} factor={f} isCalculated />)}
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-2 space-y-4">
                     <div className="p-4 bg-core-bg-soft rounded-lg border border-core-border">
                        <h4 className="font-semibold text-core-text-primary mb-2 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-purple-400"/> AI Analysis</h4>
                        <p className="text-sm text-core-text-secondary leading-relaxed">{aiAnalysis?.analysis || 'No analysis generated.'}</p>
                    </div>
                     <div className="p-4 bg-core-bg-soft rounded-lg border border-core-border">
                        <h4 className="font-semibold text-core-text-primary mb-2 flex items-center gap-2"><LightbulbIcon className="w-5 h-5 text-yellow-400"/> Suggested Mitigation Plan</h4>
                        {aiAnalysis && aiAnalysis.mitigation.length > 0 ? (
                            <ul className="space-y-2 list-disc list-inside text-sm text-core-text-secondary">
                                {aiAnalysis.mitigation.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        ) : <p className="text-sm text-core-text-secondary/50 italic">No mitigation strategies suggested.</p>}
                         <div className="mt-4 pt-4 border-t border-core-border flex flex-col sm:flex-row gap-2">
                            <button onClick={() => onStartCoaching({ summary: aiAnalysis?.analysis || '' })} className="flex-1 bg-core-bg hover:bg-core-border text-core-text-primary font-semibold py-2 px-3 rounded-md transition-colors">
                                Start Session from Analysis
                            </button>
                            <button onClick={handleGenerateCoachingPlan} disabled={isGeneratingPlan || isLoading} className="flex-1 flex items-center justify-center gap-2 bg-core-accent hover:bg-core-accent-hover text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50">
                                {isGeneratingPlan ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                                AI-Generate Full Coaching Plan
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
