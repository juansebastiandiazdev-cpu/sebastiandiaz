
import {
    AIInsight, BusinessReview, Client, PtlFactor, KpiReportData, ScheduleResponse,
    Task, TeamMember, WeeklyPerformanceSnapshot, TeamPerformanceReportData, ClientHealthReportData, TaskHotspotsReportData, PtlReport, CoachingFeedForward, TaskStatus, TaskPriority, ApiScheduledTaskInfo, ScheduledTask, Article, AICommand
} from '../types';

// A global error handler for the API key
let onApiKeyError = () => {};

export const setApiKeyErrorHandler = (handler: () => void) => {
    onApiKeyError = handler;
};

// Check for the presence of an API key. If missing, trigger the handler and return false
const checkApiKey = (): boolean => {
    const hasKey = Boolean(import.meta.env.VITE_API_KEY);
    if (!hasKey) {
        onApiKeyError();
    }
    return hasKey;
};

const callApi = async <T, B = unknown>(endpoint: string, body: B): Promise<T> => {
    if (!checkApiKey()) {
        throw new Error('Missing API key');
    }
    try {
        const response = await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response', details: `Request failed with status ${response.status}` }));
            
            if (response.status === 500 && (errorBody.error?.includes("API key") || errorBody.details?.includes("API key"))) {
                onApiKeyError();
                throw new Error("Invalid or missing API Key. Please configure it in the backend.");
            }
            throw new Error(errorBody.error || errorBody.details || `Request failed with status ${response.status}`);
        }
        
        return await response.json();
    } catch (e) {
        if (e instanceof Error && e.message.includes("API Key")) {
            onApiKeyError();
        }
        throw e;
    }
};

export const api = {
    generateDashboardInsights: async (context: { currentUser: TeamMember, teamMembers: TeamMember[], clients: Client[], tasks: Task[] }) => {
        return callApi<{ insights: AIInsight[] }>('generateDashboardInsights', { context });
    },
        
    conversationalSearch: async (query: string, contextData: { clients: Client[], tasks: Task[], teamMembers: TeamMember[] }) => {
        return callApi<{ command: AICommand }>('conversationalSearch', { query, contextData });
    },
        
    aiAssistant: async (payload: { prompt: string, context: any, history: any[] }) => {
        return callApi<any>('aiAssistant', payload);
    },

    suggestTaskTitle: async (title: string): Promise<{ newTitle:string }> => {
        return callApi('suggestTaskTitle', { title });
    },

    suggestSubtasks: async (title: string, description: string): Promise<{ subtasks: { text: string }[] }> => {
        return callApi('suggestSubtasks', { title, description });
    },

    suggestReviewActions: async (summary: string, clientName: string): Promise<{ leaderActions: string[], clientActions: string[] }> => {
        return callApi('suggestReviewActions', { summary, clientName });
    },

    planProject: async (goal: string, client?: Client, teamMembers?: TeamMember[], endDate?: string): Promise<{ tasks: Partial<Task>[] }> => {
        return callApi('planProject', { goal, clientContext: client, teamContext: teamMembers, endDate });
    },
        
    generateWeeklyBriefing: async (tasks: Task[]): Promise<{ briefing: string }> => {
        return callApi('generateWeeklyBriefing', { tasks });
    },

    generateReport: async (request: string, contextData: any): Promise<{ report: string }> => {
        return callApi('generateReport', { request, context: contextData });
    },

    generateTeamPerformanceReport: async (context: { teamMembers: TeamMember[] }): Promise<TeamPerformanceReportData> => {
        return callApi('generateTeamPerformanceReport', context);
    },

    generateClientHealthReport: async (context: { clients: Client[] }): Promise<ClientHealthReportData> => {
        return callApi('generateClientHealthReport', context);
    },
    
    generateTaskHotspotsReport: async (context: { tasks: Task[] }): Promise<TaskHotspotsReportData> => {
        return callApi('generateTaskHotspotsReport', context);
    },

    askKnowledgeBase: async (question: string, articles: any[]): Promise<{ answer: string, sourceIds: string[] }> => {
        return callApi('askKnowledgeBase', { question, articles });
    },

    aiWriter: async (command: 'suggest_tags' | 'improve' | 'draft_article', text: string, title?: string): Promise<any> => {
        return callApi('aiWriter', { command, text, title });
    },
        
    generatePtlAnalysis: async (riskScore: number, riskLevel: string, factors: PtlFactor[]): Promise<{ analysis: string, mitigation: string[] }> => {
        return callApi('generatePtlAnalysis', { riskScore, riskLevel, factors });
    },
    
    generatePtlSummary: async (riskLevel: string, factors: PtlFactor[]): Promise<{ summary: string }> => {
        return callApi('generatePtlSummary', { riskLevel, factors });
    },

    generatePtlCoachingPlan: async (ptlReport: PtlReport): Promise<{ summary: string, leaderActions: string[], employeeActions: string[] }> => {
        return callApi('generatePtlCoachingPlan', { ptlReport });
    },
    
    generateCoachingPrep: async (member: TeamMember, tasks: Task[], clients: Client[]): Promise<{ praise: string[], growth: string[], questions: string[] }> => {
        return callApi('generateCoachingPrep', { member, tasks, clients });
    },

    suggestCoachingSummary: async (member: TeamMember, tasks: Task[], clients: Client[], preSessionContext?: string): Promise<{ summary: string }> => {
        return callApi('suggestCoachingSummary', { member, tasks, clients, preSessionContext });
    },

    suggestCoachingActions: async (summary: string, role: string): Promise<{ leaderActions: string[], employeeActions: string[] }> => {
        return callApi('suggestCoachingActions', { summary, role });
    },

    draftFollowUpEmail: async (review: Omit<BusinessReview, 'id' | 'followUpEmailDraft'>, clientName: string, leaderName: string): Promise<{ subject: string, body: string }> => {
        return callApi('draftFollowUpEmail', { review, clientName, leaderName });
    },

    draftCoachingFollowUpEmail: async (session: Omit<CoachingFeedForward, 'id'>, teamMemberName: string, leaderName: string): Promise<{ subject: string, body: string }> => {
        return callApi('draftCoachingFollowUpEmail', { session, teamMemberName, leaderName });
    },

    generateDashboardReport: async (kpiData: KpiReportData[], clientContext: any): Promise<{ kpiSummary: string; highlights: string[]; healthSummary: string; }> => {
        return callApi('generateDashboardReport', { kpiData, clientContext });
    },

    generateWeeklySchedule: async (tasksToSchedule: any[], existingSchedule?: ScheduledTask[]): Promise<ScheduleResponse> => {
        return callApi('generateWeeklySchedule', { tasksToSchedule, existingSchedule });
    },
        
    generatePerformanceSummary: async (member: TeamMember, snapshots: WeeklyPerformanceSnapshot[]): Promise<{ summary: string }> => {
        return callApi('generatePerformanceSummary', { member, snapshots });
    },

    generateDeleteConfirmation: async (type: 'client' | 'team member', name: string, taskCount: number): Promise<{ confirmationText: string }> => {
        return callApi('generateDeleteConfirmation', { type, name, taskCount });
    },
    
    generateReportActionItems: async (clientContext: any): Promise<{ actions: string[] }> => {
        return callApi('generateReportActionItems', { clientContext });
    },
    
    generateContextualSuggestions: async (context: { contextType: 'teamMember', contextData: TeamMember }): Promise<{ suggestions: { text: string; action: any }[] }> => {
        return callApi('generateContextualSuggestions', context);
    },

    generateTeamMemberContext: async (member: TeamMember, tasks: Task[], clients: Client[]): Promise<{ summary: string }> => {
        return callApi('generateTeamMemberContext', { member, tasks, clients });
    },

    suggestTaskPriority: async (tasks: Task[]): Promise<{ topThree: string[] }> => {
        return callApi('suggestTaskPriority', { tasks });
    },
};
